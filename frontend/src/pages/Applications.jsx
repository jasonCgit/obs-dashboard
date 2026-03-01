import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  Box, Typography, CircularProgress, Breadcrumbs, Link,
  TextField, InputAdornment, Button, ButtonGroup, IconButton, Tooltip,
} from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import SearchIcon from '@mui/icons-material/Search'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import ViewListIcon from '@mui/icons-material/ViewList'
import GridViewIcon from '@mui/icons-material/GridView'
import { useFilters } from '../FilterContext'
import AppTreeSidebar from '../components/AppTreeSidebar'
import AppTable from '../components/AppTable'
import AppCard from '../components/AppCard'

const SS_KEY = 'apps-page-state'
const STATUS_RANK = { critical: 0, warning: 1, healthy: 2 }

function loadSavedState() {
  try {
    const raw = sessionStorage.getItem(SS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function Applications() {
  const { filteredApps, activeFilterCount, totalApps, clearAllFilters } = useFilters()
  const saved = useRef(loadSavedState())
  const [statusFilter, setStatusFilter] = useState(() => {
    const sf = saved.current?.statusFilter
    return Array.isArray(sf) ? sf : (sf && sf !== 'all' ? [sf] : [])
  })
  const [selectedPath, setSelectedPath] = useState(saved.current?.selectedPath || 'all')
  const [treeMode, setTreeMode] = useState(saved.current?.treeMode || 'technology')
  const [selectedApps, setSelectedApps] = useState(null) // null = show all
  const [enrichedMap, setEnrichedMap] = useState({})       // slug → enriched data
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState([])
  const [appFilter, setAppFilter] = useState('')
  const tableRef = useRef(null)
  const [, forceUpdate] = useState(0)
  const [viewMode, setViewMode] = useState(() => sessionStorage.getItem('apps-view-mode') || 'cards')
  const [cardsAllExpanded, setCardsAllExpanded] = useState(() => sessionStorage.getItem('apps-cards-expanded') === 'true')

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

  // Fetch enriched data and teams
  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/applications/enriched').then(r => r.json()),
      fetch('/api/teams').then(r => r.json()),
    ])
      .then(([appData, teamData]) => {
        const map = {}
        appData.forEach(app => { map[app.name] = app })
        setEnrichedMap(map)
        setTeams(teamData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Scroll ref for content panel
  const scrollRef = useRef(null)

  // Persist state to sessionStorage for back-button restoration
  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify({ statusFilter, selectedPath, treeMode }))
  }, [statusFilter, selectedPath, treeMode])

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && scrollRef.current && saved.current?.scrollTop) {
      scrollRef.current.scrollTop = saved.current.scrollTop
      saved.current = null // only restore once
    }
  }, [loading])

  // Save scroll position on scroll
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      try {
        const prev = JSON.parse(sessionStorage.getItem(SS_KEY) || '{}')
        prev.scrollTop = el.scrollTop
        sessionStorage.setItem(SS_KEY, JSON.stringify(prev))
      } catch {}
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Merge enriched data with frontend filtered apps
  const appsWithEnrichment = useMemo(() => {
    return filteredApps.map(app => ({
      ...app,
      ...(enrichedMap[app.name] || {}),
    }))
  }, [filteredApps, enrichedMap])

  // Reconstruct selectedApps from restored selectedPath after data loads
  useEffect(() => {
    if (loading || !appsWithEnrichment.length) return
    if (selectedPath === 'all' || selectedApps !== null) return
    const colonIdx = selectedPath.indexOf(':')
    if (colonIdx < 0) return
    const level = selectedPath.slice(0, colonIdx)
    const parts = selectedPath.slice(colonIdx + 1).split('/')
    const fields = treeMode === 'business'
      ? ['lob', 'subLob', 'productLine', 'product']
      : ['lob', 'cto', 'cbt']
    const levelDepth = { lob: 1, sub: 2, l3: 3, l4: 4 }
    const depth = levelDepth[level] || 1
    const filtered = appsWithEnrichment.filter(a => {
      for (let i = 0; i < depth && i < parts.length && i < fields.length; i++) {
        if (parts[i] && a[fields[i]] !== parts[i]) return false
      }
      return true
    })
    setSelectedApps(filtered)
  }, [loading, appsWithEnrichment, selectedPath, selectedApps, treeMode])

  // Tree selection filters
  const treeFiltered = useMemo(() => {
    if (!selectedApps) return appsWithEnrichment
    const nameSet = new Set(selectedApps.map(a => a.name))
    return appsWithEnrichment.filter(a => nameSet.has(a.name))
  }, [appsWithEnrichment, selectedApps])

  // Status filter — filters at app, deployment, AND component level
  const visible = useMemo(() => {
    if (statusFilter.length === 0) return treeFiltered
    const allowed = new Set(statusFilter)
    const results = []
    for (const a of treeFiltered) {
      const deployments = a.deployments || []
      if (deployments.length === 0) {
        if (allowed.has(a.status || 'healthy')) results.push(a)
        continue
      }
      const appExcl = new Set(a.excluded_indicators || [])
      // Filter deployments and their components
      const filteredDeps = []
      for (const d of deployments) {
        const depExcl = new Set([...appExcl, ...(d.excluded_indicators || [])])
        // Filter components within this deployment
        const filteredComps = (d.components || []).filter(c => {
          if (depExcl.has(c.indicator_type)) return allowed.has('healthy')
          return allowed.has(c.status || 'healthy')
        })
        // Derive deployment status from its non-excluded components
        let depStatus = 'healthy'
        for (const c of (d.components || [])) {
          if (depExcl.has(c.indicator_type)) continue
          if ((STATUS_RANK[c.status] ?? 2) < (STATUS_RANK[depStatus] ?? 2)) depStatus = c.status
        }
        // Include deployment if its status matches OR it has matching components
        if (allowed.has(depStatus) || filteredComps.length > 0) {
          filteredDeps.push({ ...d, components: filteredComps })
        }
      }
      if (filteredDeps.length > 0) {
        results.push({ ...a, deployments: filteredDeps })
      }
    }
    return results
  }, [treeFiltered, statusFilter])

  const handleTreeSelect = (path, apps) => {
    setSelectedPath(path)
    if (path === 'all') {
      setSelectedApps(null)
    } else {
      setSelectedApps(apps)
    }
    setStatusFilter([])
  }

  // Update enrichedMap when team assignments change in the modal
  const handleAppTeamsChanged = useCallback((appName, teamIds) => {
    setEnrichedMap(prev => {
      const existing = prev[appName]
      if (!existing) return prev
      return { ...prev, [appName]: { ...existing, team_ids: teamIds } }
    })
  }, [])

  // Update enrichedMap when excluded indicators change
  const handleExcludedIndicatorsChanged = useCallback((appName, excludedIndicators, depId) => {
    setEnrichedMap(prev => {
      const existing = prev[appName]
      if (!existing) return prev
      if (depId) {
        // Deployment-level exclusion — update the deployment's excluded_indicators
        const deployments = (existing.deployments || []).map(d =>
          d.id === depId ? { ...d, excluded_indicators: excludedIndicators } : d
        )
        return { ...prev, [appName]: { ...existing, deployments } }
      }
      // App-level exclusion
      return { ...prev, [appName]: { ...existing, excluded_indicators: excludedIndicators } }
    })
  }, [])


  // Breadcrumb from selectedPath
  const breadcrumbParts = useMemo(() => {
    if (!selectedPath || selectedPath === 'all') return ['All Applications']
    const after = selectedPath.replace(/^[^:]+:/, '')
    return after.split('/')
  }, [selectedPath])

  return (
    <Box
      ref={containerRef}
      sx={{
        height: `calc(100vh - ${topOffset}px)`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Main content: tree + table */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Tree sidebar */}
        <AppTreeSidebar
          apps={appsWithEnrichment}
          selectedPath={selectedPath}
          onSelect={handleTreeSelect}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          treeMode={treeMode}
          onTreeModeChange={setTreeMode}
          width={260}
        />

        {/* Table panel */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', px: 2, py: 1.5 }}>
          {/* Unified header: breadcrumb | stats | filter */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', mb: 0.75 }}>
            {/* Left — breadcrumb */}
            <Breadcrumbs
              separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#90caf9' }} />}
              sx={{ '& .MuiBreadcrumbs-li': { fontSize: '0.78rem' }, flexShrink: 0 }}
            >
              {breadcrumbParts.map((part, i) => (
                i === breadcrumbParts.length - 1 ? (
                  <Typography key={i} variant="caption" fontWeight={700} sx={{ fontSize: '0.78rem', color: '#1565C0' }}>
                    {part}
                  </Typography>
                ) : (
                  <Link
                    key={i}
                    component="button"
                    variant="caption"
                    underline="hover"
                    sx={{ fontSize: '0.78rem', color: '#64b5f6', fontWeight: 500 }}
                    onClick={() => {
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

            {/* Center — status toggle */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <ButtonGroup size="small" variant="outlined" sx={{ height: 28 }}>
                {[
                  { key: 'all', label: 'All', active: statusFilter.length === 0, color: null },
                  { key: 'critical', label: 'Critical', active: statusFilter.includes('critical'), color: '#f44336' },
                  { key: 'warning', label: 'Warning', active: statusFilter.includes('warning'), color: '#ff9800' },
                  { key: 'healthy', label: 'Healthy', active: statusFilter.includes('healthy'), color: '#4caf50' },
                ].map(({ key, label, active, color }) => (
                  <Button
                    key={key}
                    onClick={() => {
                      if (key === 'all') { setStatusFilter([]); return }
                      setStatusFilter(prev =>
                        prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]
                      )
                    }}
                    sx={{
                      fontSize: '0.66rem', fontWeight: 600, textTransform: 'none', px: 1.5, py: 0,
                      borderColor: 'divider',
                      ...(active && {
                        bgcolor: color ? `${color}14` : 'action.selected',
                        color: color || 'text.primary',
                        borderColor: color ? `${color}66` : 'divider',
                        '&:hover': { bgcolor: color ? `${color}22` : 'action.hover' },
                      }),
                    }}
                  >{label}</Button>
                ))}
              </ButtonGroup>
            </Box>

            {/* Right — filter + count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <TextField
                size="small"
                placeholder="Filter applications..."
                value={appFilter}
                onChange={e => setAppFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.76rem', height: 30 },
                }}
                sx={{ width: 200 }}
              />
              {!loading && (
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                  {visible.length} of {appsWithEnrichment.length}
                </Typography>
              )}
              {!loading && viewMode === 'table' && (
                <Tooltip title={tableRef.current?.isAllExpanded ? 'Collapse All' : 'Expand All'} arrow>
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (tableRef.current?.isAllExpanded) tableRef.current.collapseAll()
                      else tableRef.current?.expandAll()
                      forceUpdate(n => n + 1)
                    }}
                    sx={{ p: 0.25 }}
                  >
                    {tableRef.current?.isAllExpanded
                      ? <UnfoldLessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      : <UnfoldMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    }
                  </IconButton>
                </Tooltip>
              )}
              {!loading && viewMode === 'cards' && (
                <Tooltip title={cardsAllExpanded ? 'Collapse All' : 'Expand All'} arrow>
                  <IconButton
                    size="small"
                    onClick={() => setCardsAllExpanded(v => { const next = !v; sessionStorage.setItem('apps-cards-expanded', String(next)); return next })}
                    sx={{ p: 0.25 }}
                  >
                    {cardsAllExpanded
                      ? <UnfoldLessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      : <UnfoldMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    }
                  </IconButton>
                </Tooltip>
              )}
              {!loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5, borderLeft: '1px solid', borderColor: 'divider', pl: 0.5 }}>
                  <Tooltip title="Table View" arrow>
                    <IconButton
                      size="small"
                      onClick={() => { setViewMode('table'); sessionStorage.setItem('apps-view-mode', 'table') }}
                      sx={{ p: 0.25, color: viewMode === 'table' ? '#1976d2' : 'text.disabled' }}
                    >
                      <ViewListIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cards View" arrow>
                    <IconButton
                      size="small"
                      onClick={() => { setViewMode('cards'); sessionStorage.setItem('apps-view-mode', 'cards') }}
                      sx={{ p: 0.25, color: viewMode === 'cards' ? '#1976d2' : 'text.disabled' }}
                    >
                      <GridViewIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>

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
          ) : viewMode === 'table' ? (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <AppTable ref={tableRef} apps={visible} teams={teams} onAppTeamsChanged={handleAppTeamsChanged} onAppExcludedChanged={handleExcludedIndicatorsChanged} externalFilter={appFilter} onExternalFilterChange={setAppFilter} hideFilterBar />
            </Box>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(408px, 1fr))', gap: 1.5 }}>
                {visible.filter(app => !appFilter || app.name.toLowerCase().includes(appFilter.toLowerCase())).map(app => (
                  <AppCard key={app.name} app={app} teams={teams} onAppTeamsChanged={handleAppTeamsChanged} onAppExcludedChanged={handleExcludedIndicatorsChanged} allExpanded={cardsAllExpanded} />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
