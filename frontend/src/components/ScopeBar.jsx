import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Chip, Typography, Tooltip, IconButton, Badge } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useFilters } from '../FilterContext'
import { FILTER_FIELDS } from '../data/appData'
import SearchFilterPopover from './SearchFilterPopover'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const chipSx = {
  ...fSmall, height: 22, borderRadius: 1.5, fontWeight: 500,
  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.1)',
  border: '1px solid',
  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.3)' : 'rgba(21,101,192,0.25)',
  color: 'primary.main',
  '& .MuiChip-deleteIcon': { fontSize: 13 },
}

// Build a label lookup from FILTER_FIELDS
const FIELD_LABELS = Object.fromEntries(FILTER_FIELDS.map(f => [f.key, f.label]))

export default function ScopeBar() {
  const {
    searchText, setSearchText,
    activeFilters, setFilterValues, clearAllFilters,
    filteredApps, totalApps, activeFilterCount,
  } = useFilters()

  const [hidden, setHidden] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const hideTimerRef = useRef(null)
  const [searchAnchor, setSearchAnchor] = useState(null)

  const hasScope = activeFilterCount > 0 || searchText.length > 0

  const startAutoHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setRevealed(false), 10000)
  }, [])

  const handleMouseEnter = () => {
    if (hidden && !revealed) {
      setRevealed(true)
      startAutoHide()
    }
    if (hidden && revealed) {
      startAutoHide()
    }
  }

  const handleMouseLeave = () => {}

  useEffect(() => {
    if (!(hidden && revealed)) return
    const handler = (e) => {
      const bar = document.getElementById('scope-bar')
      if (bar && !bar.contains(e.target)) {
        clearTimeout(hideTimerRef.current)
        setRevealed(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [hidden, revealed])

  const prevFilterCountRef = useRef(activeFilterCount)
  useEffect(() => {
    if (activeFilterCount !== prevFilterCountRef.current) {
      prevFilterCountRef.current = activeFilterCount
      if (hidden && activeFilterCount > 0) {
        setRevealed(true)
        startAutoHide()
      }
    }
  }, [activeFilterCount, hidden, startAutoHide])

  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  const showBar = !hidden || revealed

  // Flat list of active filter chips
  const activeChips = []
  for (const { key } of FILTER_FIELDS) {
    const values = activeFilters[key] || []
    if (values.length > 0) {
      const label = FIELD_LABELS[key] || key
      values.forEach((v, i) => {
        activeChips.push({ key, label, value: v, idx: i })
      })
    }
  }

  // Drag-to-scroll for the chips area
  const chipsRef = useRef(null)
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 })

  const handleDragStart = (e) => {
    const el = chipsRef.current
    if (!el) return
    dragState.current = { isDragging: true, startX: e.clientX, scrollLeft: el.scrollLeft }
    el.style.cursor = 'grabbing'
    el.style.userSelect = 'none'
  }

  const handleDragMove = useCallback((e) => {
    const ds = dragState.current
    if (!ds.isDragging) return
    const el = chipsRef.current
    if (!el) return
    el.scrollLeft = ds.scrollLeft - (e.clientX - ds.startX)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragState.current.isDragging = false
    const el = chipsRef.current
    if (el) {
      el.style.cursor = 'grab'
      el.style.userSelect = ''
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [handleDragMove, handleDragEnd])

  return (
    <Box
      id="scope-bar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        overflow: 'hidden',
        maxHeight: showBar ? 40 : 3,
        transition: 'max-height 0.25s ease-in-out',
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: !showBar ? 'pointer' : 'default',
        ...(!showBar && {
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.2)' : 'rgba(21,101,192,0.15)',
        }),
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center',
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.06)' : 'rgba(21,101,192,0.03)',
      }}>
        {/* Left pinned: filter icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2, py: 0.5, flexShrink: 0 }}>
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            max={99}
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 9, height: 14, minWidth: 14, p: '0 3px',
                display: activeFilterCount > 0 ? 'flex' : 'none',
              },
            }}
          >
            <FilterListIcon
              onClick={(e) => setSearchAnchor(e.currentTarget)}
              sx={{ fontSize: 16, color: hasScope ? 'primary.main' : 'text.disabled', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
            />
          </Badge>
          <SearchFilterPopover
            anchorEl={searchAnchor}
            open={Boolean(searchAnchor)}
            onClose={() => setSearchAnchor(null)}
          />
        </Box>

        {/* Middle: scrollable / draggable chips area */}
        <Box
          ref={chipsRef}
          onMouseDown={handleDragStart}
          sx={{
            flex: 1, minWidth: 0,
            display: 'flex', alignItems: 'center', gap: 0.5,
            px: 1, py: 0.5,
            overflowX: 'auto',
            cursor: activeChips.length > 0 || searchText ? 'grab' : 'default',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          {/* Search chip */}
          {searchText ? (
            <Chip
              label={`Search: "${searchText}"`}
              size="small"
              onDelete={() => setSearchText('')}
              deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
              sx={{ ...chipSx, flexShrink: 0 }}
            />
          ) : null}

          {/* Active filter chips only */}
          {activeChips.map((chip) => (
            <Chip
              key={`${chip.key}-${chip.value}-${chip.idx}`}
              label={`${chip.label}: ${chip.value}`}
              size="small"
              onDelete={() => {
                const values = activeFilters[chip.key] || []
                const next = values.filter(x => x !== chip.value)
                setFilterValues(chip.key, next)
              }}
              deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
              sx={{ ...chipSx, flexShrink: 0 }}
            />
          ))}

          {/* Empty state */}
          {!hasScope && (
            <Typography sx={{ ...fSmall, color: 'text.disabled', fontStyle: 'italic', flexShrink: 0 }}>
              No filters applied
            </Typography>
          )}
        </Box>

        {/* Right pinned: app count, clear, hide toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 2, py: 0.5, flexShrink: 0 }}>
          {/* App count */}
          <Typography sx={{ ...fSmall, color: 'text.secondary', whiteSpace: 'nowrap' }}>
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{filteredApps.length}</Box>
            {' '}of {totalApps} apps
          </Typography>

          {/* Clear all */}
          {hasScope && (
            <Typography
              onClick={clearAllFilters}
              sx={{
                ...fSmall, color: 'error.main', cursor: 'pointer', fontWeight: 600, ml: 0.5, whiteSpace: 'nowrap',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Clear
            </Typography>
          )}

          {/* Hide / Show toggle */}
          <Tooltip title={hidden ? 'Keep bar visible' : 'Hide bar'} placement="bottom">
            <IconButton
              size="small"
              onClick={() => {
                if (hidden) {
                  setHidden(false)
                  setRevealed(false)
                  clearTimeout(hideTimerRef.current)
                } else {
                  setHidden(true)
                }
              }}
              sx={{
                p: 0.25, ml: 0.5,
                color: 'text.disabled',
                '&:hover': { color: 'text.secondary' },
              }}
            >
              {hidden
                ? <VisibilityIcon sx={{ fontSize: 14 }} />
                : <VisibilityOffIcon sx={{ fontSize: 14 }} />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
}
