import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Box, Typography, Chip, ToggleButtonGroup, ToggleButton,
  CircularProgress, Breadcrumbs, Link,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import { useFilters } from '../FilterContext'
import AppTreeSidebar from '../components/AppTreeSidebar'
import AppCard from '../components/AppCard'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

export default function Applications() {
  const { filteredApps, activeFilterCount, totalApps, clearAllFilters } = useFilters()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPath, setSelectedPath] = useState('all')
  const [selectedApps, setSelectedApps] = useState(null) // null = show all
  const [enrichedMap, setEnrichedMap] = useState({})       // slug → enriched data
  const [loading, setLoading] = useState(true)

  // Full-viewport height calc
  const containerRef = useRef(null)
  const [topOffset, setTopOffset] = useState(0)
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setTopOffset(containerRef.current.getBoundingClientRect().top)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Fetch enriched data once
  useEffect(() => {
    setLoading(true)
    fetch('/api/applications/enriched')
      .then(r => r.json())
      .then(data => {
        const map = {}
        data.forEach(app => { map[app.name] = app })
        setEnrichedMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Merge enriched data with frontend filtered apps
  const appsWithEnrichment = useMemo(() => {
    return filteredApps.map(app => ({
      ...app,
      ...(enrichedMap[app.name] || {}),
    }))
  }, [filteredApps, enrichedMap])

  // Tree selection filters
  const treeFiltered = useMemo(() => {
    if (!selectedApps) return appsWithEnrichment
    const nameSet = new Set(selectedApps.map(a => a.name))
    return appsWithEnrichment.filter(a => nameSet.has(a.name))
  }, [appsWithEnrichment, selectedApps])

  // Status filter on top
  const visible = useMemo(() => {
    if (statusFilter === 'all') return treeFiltered
    return treeFiltered.filter(a => a.status === statusFilter)
  }, [treeFiltered, statusFilter])

  const counts = useMemo(() => ({
    critical: treeFiltered.filter(a => a.status === 'critical').length,
    warning:  treeFiltered.filter(a => a.status === 'warning').length,
    healthy:  treeFiltered.filter(a => a.status === 'healthy').length,
  }), [treeFiltered])

  const handleTreeSelect = (path, apps) => {
    setSelectedPath(path)
    if (path === 'all') {
      setSelectedApps(null)
    } else {
      setSelectedApps(apps)
    }
    setStatusFilter('all')
  }

  // Breadcrumb from selectedPath
  const breadcrumbParts = useMemo(() => {
    if (!selectedPath || selectedPath === 'all') return ['All Applications']
    const after = selectedPath.replace(/^[^:]+:/, '')
    return after.split('/')
  }, [selectedPath])

  const isFiltered = activeFilterCount > 0

  return (
    <Box
      ref={containerRef}
      sx={{
        height: `calc(100vh - ${topOffset}px)`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >

      {/* ── Main content: tree + cards ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Tree sidebar */}
        <AppTreeSidebar
          apps={appsWithEnrichment}
          selectedPath={selectedPath}
          onSelect={handleTreeSelect}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          width={260}
        />

        {/* Cards panel */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1.5 }}>
          {/* Breadcrumb */}
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
            sx={{ mb: 1.5, '& .MuiBreadcrumbs-li': { fontSize: '0.72rem' } }}
          >
            {breadcrumbParts.map((part, i) => (
              i === breadcrumbParts.length - 1 ? (
                <Typography key={i} variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
                  {part}
                </Typography>
              ) : (
                <Link
                  key={i}
                  component="button"
                  variant="caption"
                  underline="hover"
                  color="text.secondary"
                  sx={{ fontSize: '0.72rem' }}
                  onClick={() => {
                    // Navigate up: rebuild path from parts[0..i]
                    const levels = ['lob', 'sub', 'l3', 'l4']
                    const prefix = levels[i] || 'all'
                    if (i === 0 && breadcrumbParts.length === 1) {
                      handleTreeSelect('all', null)
                    } else {
                      const pathStr = breadcrumbParts.slice(0, i + 1).join('/')
                      handleTreeSelect(`${prefix}:${pathStr}`, null)
                    }
                  }}
                >
                  {part}
                </Link>
              )
            ))}
          </Breadcrumbs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : visible.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body2" color="text.secondary">
                No applications match the current filters.
              </Typography>
            </Box>
          ) : (
            visible.map(app => (
              <AppCard key={app.name} app={app} />
            ))
          )}
        </Box>
      </Box>
    </Box>
  )
}
