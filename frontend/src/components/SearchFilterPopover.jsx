import { useRef, useEffect } from 'react'
import {
  Popper, Box, Typography, IconButton, Chip,
  Autocomplete, TextField, Checkbox, Paper,
  ClickAwayListener,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import TuneIcon from '@mui/icons-material/Tune'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { useFilters } from '../FilterContext'
import { FILTER_GROUPS, FILTER_FIELDS, APPS, getFilterOptions, SUB_LOB_MAP } from '../data/appData'

const fBody  = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const checkIcon     = <CheckBoxIcon sx={{ fontSize: 16 }} />
const uncheckIcon   = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />

// Fields that span full width (single column)
const FULL_WIDTH_KEYS = new Set(['seal', 'appOwner', 'deploymentTypes'])

export default function SearchFilterPopover({ anchorEl, open, onClose }) {
  const {
    searchText, setSearchText,
    activeFilters, setFilterValues, clearFilter, clearAllFilters,
    filteredApps, totalApps, activeFilterCount,
    getCandidateApps, searchSuggestions,
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

  const renderFilterField = ({ key, label }) => {
    const subLobDisabled = key === 'subLob' &&
      !(activeFilters.lob || []).some(l => SUB_LOB_MAP[l])

    const selected = activeFilters[key] || []
    const selectedCount = selected.length

    // Dependency-aware: get options from apps matching all OTHER filters
    const candidateApps = getCandidateApps(key)
    const options = getFilterOptions(key, candidateApps, activeFilters)

    // Show narrowing indicator
    const fullOptions = getFilterOptions(key, APPS, {})
    const isNarrowed = options.length < fullOptions.length
    const displayLabel = subLobDisabled
      ? 'Sub LOB (select AWM / CIB)'
      : isNarrowed
        ? `${label} (${options.length} of ${fullOptions.length})`
        : label

    return (
      <Box key={key}>
        <Autocomplete
          multiple
          size="small"
          disabled={subLobDisabled}
          options={options}
          value={selected}
          onChange={(_, newVal) => setFilterValues(key, newVal)}
          disableCloseOnSelect
          renderOption={(props, option, { selected: sel }) => {
            const { key: liKey, ...rest } = props
            return (
              <li key={liKey} {...rest} style={{ ...rest.style, padding: '2px 10px', minHeight: 28 }}>
                <Checkbox
                  icon={uncheckIcon}
                  checkedIcon={checkIcon}
                  checked={sel}
                  sx={{ p: 0, mr: 0.75 }}
                  size="small"
                />
                <Typography noWrap sx={{ ...fSmall, lineHeight: 1.3 }}>{option}</Typography>
              </li>
            )
          }}
          ListboxProps={{
            sx: {
              maxHeight: 200,
              '& .MuiAutocomplete-option': { py: 0.25, minHeight: 28 },
            },
          }}
          renderInput={(params) => (
            <TextField {...params}
              label={displayLabel}
              variant="outlined" size="small"
              InputLabelProps={{ ...params.InputLabelProps, shrink: true }}
              sx={{
                '& .MuiInputLabel-root': {
                  ...fSmall,
                  transform: 'translate(14px, -6px) scale(0.85)',
                },
                '& .MuiInputBase-root': {
                  ...fSmall, borderRadius: 1.5, minHeight: 40, py: '5px !important',
                },
                '& .MuiOutlinedInput-notchedOutline': { borderRadius: 1.5 },
              }}
            />
          )}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => {
              const { key: tagKey, ...tagRest } = getTagProps({ index })
              return (
                <Chip
                  key={tagKey}
                  {...tagRest}
                  label={option}
                  size="small"
                  sx={{
                    height: 24, ...fTiny, borderRadius: 0.75, maxWidth: 160,
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.08)',
                    border: '1px solid',
                    borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.25)' : 'rgba(21,101,192,0.2)',
                    '& .MuiChip-deleteIcon': { fontSize: 12 },
                  }}
                />
              )
            })
          }
          sx={{
            '& .MuiAutocomplete-inputRoot': { flexWrap: 'wrap', gap: '3px' },
          }}
        />
        {/* Selected count badge below field when many are selected */}
        {selectedCount > 2 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, ml: 0.5 }}>
            <Typography sx={{ ...fTiny, color: 'primary.main', fontWeight: 600 }}>
              {selectedCount} selected
            </Typography>
            <Typography
              onClick={() => clearFilter(key)}
              sx={{ ...fTiny, color: 'text.disabled', cursor: 'pointer', '&:hover': { color: 'error.main' } }}
            >
              clear
            </Typography>
          </Box>
        )}
      </Box>
    )
  }

  if (!open || !anchorEl) return null

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-end"
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener onClickAway={onClose}>
      <Paper elevation={8} sx={{
        width: 1008,
        minWidth: 1008,
        minHeight: 600,
        maxHeight: '85vh',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        mt: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
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

        {/* Type-ahead search */}
        <Autocomplete
          freeSolo
          options={searchSuggestions}
          getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.value}
          inputValue={searchText}
          onInputChange={(_, v, reason) => {
            if (reason !== 'reset') setSearchText(v)
          }}
          onChange={(_, val) => {
            if (val && typeof val === 'object' && val.value) {
              if (val.filterKey) {
                // Add as a filter value (use filterValue which may differ from display value)
                const fv = val.filterValue || val.value
                const current = activeFilters[val.filterKey] || []
                if (!current.includes(fv)) {
                  setFilterValues(val.filterKey, [...current, fv])
                }
                setSearchText('')
              } else {
                // No filter key (e.g. Team) — use as search text
                setSearchText(val.value)
              }
            }
          }}
          filterOptions={(x) => x}
          PaperComponent={(props) => (
            <Paper {...props} sx={{ ...props.sx, mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />
          )}
          renderOption={(props, opt) => {
            const { key: liKey, ...rest } = props
            return (
              <li key={liKey} {...rest} style={{ ...rest.style, padding: '4px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Typography sx={{ ...fTiny, color: 'text.disabled', minWidth: 40 }}>{opt.field}</Typography>
                <Typography sx={{ ...fSmall, fontWeight: 600 }} noWrap>{opt.value}</Typography>
              </li>
            )
          }}
          ListboxProps={{ sx: { maxHeight: 200, '& .MuiAutocomplete-option': { minHeight: 28 } } }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              placeholder="Search by name, SEAL, team, owner, CTO, CBT, product..."
              variant="outlined"
              size="small"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <SearchIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
                endAdornment: (
                  <>
                    {searchText && (
                      <IconButton size="small" onClick={() => setSearchText('')} sx={{ p: 0.25 }}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    )}
                  </>
                ),
              }}
              sx={{
                '& .MuiInputBase-root': {
                  ...fBody, borderRadius: 2, bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  '&:focus-within': {
                    borderColor: 'primary.main',
                    boxShadow: (t) => `0 0 0 2px ${t.palette.mode === 'dark' ? 'rgba(96,165,250,0.2)' : 'rgba(21,101,192,0.15)'}`,
                  },
                },
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              }}
            />
          )}
          sx={{ width: '100%' }}
        />
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
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 1.5 }}>
        {FILTER_GROUPS.map((group) => (
          <Box key={group.label} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
            {/* Group label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <TuneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
              <Typography fontWeight={700} color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny }}>
                {group.label}
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 0.5 }} />
            </Box>

            {/* Filters — 2 columns, full-width for certain fields */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 1.25,
            }}>
              {group.keys.map((fieldDef) => {
                const isFullWidth = FULL_WIDTH_KEYS.has(fieldDef.key)
                return (
                  <Box key={fieldDef.key} sx={{ gridColumn: isFullWidth ? 'span 2' : 'span 1' }}>
                    {renderFilterField(fieldDef)}
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
    </Paper>
    </ClickAwayListener>
    </Popper>
  )
}
