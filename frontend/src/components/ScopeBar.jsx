import { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Chip, Typography, Tooltip, IconButton } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { useFilters } from '../FilterContext'
import { FILTER_FIELDS } from '../data/appData'
import SearchFilterPopover from './SearchFilterPopover'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const chipSx = (active) => ({
  ...fSmall, height: 22, borderRadius: 1.5, fontWeight: 500,
  bgcolor: (t) => active
    ? (t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.1)')
    : (t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
  border: '1px solid',
  borderColor: (t) => active
    ? (t.palette.mode === 'dark' ? 'rgba(96,165,250,0.3)' : 'rgba(21,101,192,0.25)')
    : 'divider',
  color: active ? 'primary.main' : 'text.disabled',
  '& .MuiChip-deleteIcon': { fontSize: 13 },
})

export default function ScopeBar() {
  const {
    searchText, setSearchText,
    activeFilters, setFilterValues, clearAllFilters,
    filteredApps, totalApps, activeFilterCount,
  } = useFilters()

  const [hidden, setHidden] = useState(false)   // user chose to hide
  const [revealed, setRevealed] = useState(false) // temp reveal on hover
  const hideTimerRef = useRef(null)
  const [searchAnchor, setSearchAnchor] = useState(null)

  const hasScope = activeFilterCount > 0 || searchText.length > 0

  // Auto-hide after 10s once revealed by hover
  const startAutoHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setRevealed(false), 10000)
  }, [])

  const handleMouseEnter = () => {
    if (hidden && !revealed) {
      setRevealed(true)
      startAutoHide()
    }
    // If already revealed, reset the 10s timer
    if (hidden && revealed) {
      startAutoHide()
    }
  }

  const handleMouseLeave = () => {
    // When hidden + revealed, clicking away starts the 10s countdown
    // (timer is already running from handleMouseEnter / startAutoHide)
  }

  // Listen for clicks outside to dismiss revealed bar
  useEffect(() => {
    if (!(hidden && revealed)) return
    const handler = (e) => {
      // If click is outside the scope bar, hide it
      const bar = document.getElementById('scope-bar')
      if (bar && !bar.contains(e.target)) {
        clearTimeout(hideTimerRef.current)
        setRevealed(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [hidden, revealed])

  // When filters change while bar is hidden (e.g. tenant switch), temporarily reveal
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

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(hideTimerRef.current), [])

  const showBar = !hidden || revealed

  return (
    <Box
      id="scope-bar"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        overflow: 'hidden',
        maxHeight: showBar ? 200 : 3,
        transition: 'max-height 0.25s ease-in-out',
        borderBottom: '1px solid',
        borderColor: 'divider',
        cursor: !showBar ? 'pointer' : 'default',
        // Thin colored line hint when collapsed
        ...(!showBar && {
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.2)' : 'rgba(21,101,192,0.15)',
        }),
      }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap',
        px: 2, py: 0.5,
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.06)' : 'rgba(21,101,192,0.03)',
      }}>
        <FilterListIcon
          onClick={(e) => setSearchAnchor(e.currentTarget)}
          sx={{ fontSize: 14, color: 'text.disabled', mr: 0.25, cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
        />
        <SearchFilterPopover
          anchorEl={searchAnchor}
          open={Boolean(searchAnchor)}
          onClose={() => setSearchAnchor(null)}
        />
        <Typography sx={{ ...fSmall, color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
          Scope
        </Typography>

        {/* Search chip */}
        {searchText ? (
          <Chip
            label={`Search: "${searchText}"`}
            size="small"
            onDelete={() => setSearchText('')}
            deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
            sx={chipSx(true)}
          />
        ) : null}

        {/* All filter fields in order — show value or "All" */}
        {FILTER_FIELDS.map(({ key, label }) => {
          const values = activeFilters[key] || []
          const active = values.length > 0

          if (!active) {
            return (
              <Chip
                key={key}
                label={`${label}: All`}
                size="small"
                sx={chipSx(false)}
              />
            )
          }

          return values.map((v, i) => (
            <Chip
              key={`${key}-${v}-${i}`}
              label={`${label}: ${v}`}
              size="small"
              onDelete={() => {
                const next = values.filter(x => x !== v)
                setFilterValues(key, next)
              }}
              deleteIcon={<CloseIcon sx={{ fontSize: '12px !important' }} />}
              sx={chipSx(true)}
            />
          ))
        })}

        <Box sx={{ flex: 1 }} />

        {/* App count */}
        <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{filteredApps.length}</Box>
          {' '}of {totalApps} apps
        </Typography>

        {/* Clear all */}
        {hasScope && (
          <Typography
            onClick={clearAllFilters}
            sx={{
              ...fSmall, color: 'error.main', cursor: 'pointer', fontWeight: 600, ml: 0.5,
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
                // Unhide permanently
                setHidden(false)
                setRevealed(false)
                clearTimeout(hideTimerRef.current)
              } else {
                // Hide immediately
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
  )
}
