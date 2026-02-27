import { useRef, useEffect } from 'react'
import {
  Popover, Box, Typography, InputBase, IconButton, Chip,
  Autocomplete, TextField, Checkbox,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import TuneIcon from '@mui/icons-material/Tune'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { useFilters } from '../FilterContext'
import { FILTER_FIELDS, getFilterOptions, SUB_LOB_MAP } from '../data/appData'

const fBody  = { fontSize: 'clamp(0.72rem, 0.95vw, 0.82rem)' }
const fSmall = { fontSize: 'clamp(0.58rem, 0.78vw, 0.68rem)' }
const fTiny  = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

const checkIcon     = <CheckBoxIcon sx={{ fontSize: 16 }} />
const uncheckIcon   = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />

// Filters that have short values — fit 3 per row
const COMPACT_KEYS = new Set(['lob', 'cpof', 'state', 'rto', 'riskRanking'])

// Organize filters into labeled groups for visual clarity
const FILTER_GROUPS = [
  { label: 'Taxonomy',          keys: ['lob', 'subLob', 'seal', 'state', 'classification', 'investmentStrategy'] },
  { label: 'People',            keys: ['cto', 'cbt', 'appOwner'] },
  { label: 'Risk & Compliance', keys: ['cpof', 'riskRanking', 'rto'] },
]

export default function SearchFilterPopover({ anchorEl, open, onClose }) {
  const {
    searchText, setSearchText,
    activeFilters, setFilterValues, clearFilter, clearAllFilters,
    filteredApps, totalApps, activeFilterCount,
  } = useFilters()

  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120)
  }, [open])

  // Collect active filter chips for display
  const activeChips = []
  for (const [key, values] of Object.entries(activeFilters)) {
    const field = FILTER_FIELDS.find(f => f.key === key)
    if (field && values.length > 0) {
      values.forEach(v => activeChips.push({ key, label: field.label, value: v }))
    }
  }

  const hasAnyFilter = activeFilterCount > 0 || searchText.length > 0

  const renderFilterField = (key) => {
    const field = FILTER_FIELDS.find(f => f.key === key)
    if (!field) return null
    const { label } = field

    const subLobDisabled = key === 'subLob' &&
      !(activeFilters.lob || []).some(l => SUB_LOB_MAP[l])

    const selectedCount = (activeFilters[key] || []).length

    return (
      <Autocomplete
        key={key}
        multiple
        size="small"
        disabled={subLobDisabled}
        options={getFilterOptions(key, activeFilters)}
        value={activeFilters[key] || []}
        onChange={(_, newVal) => setFilterValues(key, newVal)}
        disableCloseOnSelect
        limitTags={1}
        renderOption={(props, option, { selected }) => {
          const { key: liKey, ...rest } = props
          return (
            <li key={liKey} {...rest} style={{ ...rest.style, padding: '1px 8px', minHeight: 26 }}>
              <Checkbox
                icon={uncheckIcon}
                checkedIcon={checkIcon}
                checked={selected}
                sx={{ p: 0, mr: 0.75 }}
                size="small"
              />
              <Typography noWrap sx={{ ...fTiny, lineHeight: 1.2 }}>{option}</Typography>
            </li>
          )
        }}
        ListboxProps={{
          sx: {
            maxHeight: 180,
            '& .MuiAutocomplete-option': { py: 0.15, minHeight: 26 },
          },
        }}
        renderInput={(params) => (
          <TextField {...params}
            label={subLobDisabled ? 'Sub LOB (select AWM / CIB)' : (
              selectedCount > 0 ? `${label} (${selectedCount})` : label
            )}
            variant="outlined" size="small"
            sx={{
              '& .MuiInputLabel-root': { ...fSmall, transform: 'translate(10px, 6px) scale(1)' },
              '& .MuiInputLabel-shrunk': { transform: 'translate(14px, -6px) scale(0.85)' },
              '& .MuiInputBase-root': {
                ...fSmall, borderRadius: 1.5, minHeight: 32, py: '2px !important',
              },
              '& .MuiOutlinedInput-notchedOutline': { borderRadius: 1.5 },
            }}
          />
        )}
        sx={{
          '& .MuiChip-root': { height: 18, ...fTiny, borderRadius: 0.75, maxWidth: 90 },
          '& .MuiAutocomplete-tag': { maxWidth: 90, my: 0 },
          '& .MuiAutocomplete-inputRoot': { flexWrap: 'nowrap', overflow: 'hidden' },
        }}
      />
    )
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{ paper: { elevation: 8 } }}
      PaperProps={{
        sx: {
          width: 640,
          maxHeight: 620,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          mt: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        px: 2.5, pt: 2, pb: 1.5,
        background: (t) => t.palette.mode === 'dark'
          ? 'linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(124,58,237,0.08) 100%)'
          : 'linear-gradient(135deg, rgba(21,101,192,0.06) 0%, rgba(124,58,237,0.04) 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.1)',
            }}>
              <SearchIcon sx={{ fontSize: 16, color: 'primary.main' }} />
            </Box>
            <Typography fontWeight={700} sx={fBody}>Search & Filter</Typography>
            {hasAnyFilter && (
              <Chip
                label={`${activeFilterCount + (searchText ? 1 : 0)} active`}
                size="small"
                sx={{
                  height: 20, ...fTiny, fontWeight: 700,
                  bgcolor: 'primary.main', color: '#fff',
                  borderRadius: 1,
                }}
              />
            )}
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Search input */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 1.5, py: 0.5,
          borderRadius: 2,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          '&:focus-within': {
            borderColor: 'primary.main',
            boxShadow: (t) => `0 0 0 2px ${t.palette.mode === 'dark' ? 'rgba(96,165,250,0.2)' : 'rgba(21,101,192,0.15)'}`,
          },
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <InputBase
            inputRef={inputRef}
            placeholder="Search by name, SEAL, team, owner, CTO..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ flex: 1, ...fBody }}
          />
          {searchText && (
            <IconButton size="small" onClick={() => setSearchText('')} sx={{ p: 0.25 }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap',
          px: 2.5, py: 0.75,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          {activeChips.map((chip, i) => (
            <Chip
              key={`${chip.key}-${chip.value}-${i}`}
              label={`${chip.label}: ${chip.value}`}
              size="small"
              onDelete={() => {
                const current = activeFilters[chip.key] || []
                const next = current.filter(v => v !== chip.value)
                setFilterValues(chip.key, next)
              }}
              sx={{
                ...fTiny, height: 22, borderRadius: 1.5,
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.12)' : 'rgba(21,101,192,0.08)',
                border: '1px solid',
                borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.25)' : 'rgba(21,101,192,0.2)',
                '& .MuiChip-deleteIcon': { fontSize: 13 },
              }}
            />
          ))}
          <Typography
            onClick={clearAllFilters}
            sx={{
              ml: 'auto', ...fTiny, color: 'primary.main', cursor: 'pointer', fontWeight: 600,
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            Clear all
          </Typography>
        </Box>
      )}

      {/* Filter groups */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 1.25 }}>
        {FILTER_GROUPS.map((group) => (
          <Box key={group.label} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
            {/* Group label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              <TuneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny }}>
                {group.label}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 0.5 }} />
            </Box>

            {/* Filters in this group — 3 cols for compact, 2 cols for wide */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 1,
            }}>
              {group.keys.map((key) => {
                const isWide = !COMPACT_KEYS.has(key)
                return (
                  <Box key={key} sx={{ gridColumn: isWide ? 'span 2' : 'span 1' }}>
                    {renderFilterField(key)}
                  </Box>
                )
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, py: 1,
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      }}>
        <Typography color="text.secondary" fontWeight={600} sx={fSmall}>
          Showing <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{filteredApps.length}</Box> of {totalApps} applications
        </Typography>
        {hasAnyFilter && (
          <Typography
            onClick={() => { clearAllFilters(); setSearchText('') }}
            sx={{ ...fSmall, color: 'error.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
          >
            Reset all
          </Typography>
        )}
      </Box>
    </Popover>
  )
}
