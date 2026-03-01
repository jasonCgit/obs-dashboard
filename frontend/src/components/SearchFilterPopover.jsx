import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import {
  Popper, Box, Typography, IconButton, Chip, Button,
  Autocomplete, TextField, Checkbox, Paper,
  ClickAwayListener,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import TuneIcon from '@mui/icons-material/Tune'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { useFilters } from '../FilterContext'
import { FILTER_GROUPS, FILTER_FIELDS, APPS, getFilterOptions, SUB_LOB_MAP, parseSealDisplay, SEAL_DISPLAY } from '../data/appData'

const fBody  = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const checkIcon     = <CheckBoxIcon sx={{ fontSize: 16 }} />
const uncheckIcon   = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />

// Fields that span full width (single column)
const FULL_WIDTH_KEYS = new Set(['seal', 'appOwner', 'deployments', 'product'])

export default function SearchFilterPopover({ anchorEl, open, onClose }) {
  const {
    searchText, setSearchText,
    activeFilters, setFilterValues, clearAllFilters,
    totalApps,
  } = useFilters()

  const inputRef = useRef(null)

  // ── Draft state: local copy that only commits on Apply ──
  const [draftFilters, setDraftFilters] = useState({})
  const [draftSearch, setDraftSearch] = useState('')

  // Snapshot context → draft when popover opens
  useEffect(() => {
    if (open) {
      setDraftFilters({ ...activeFilters })
      setDraftSearch(searchText)
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const draftSetFilter = useCallback((key, values) => {
    setDraftFilters(prev => {
      const next = { ...prev }
      if (!values || values.length === 0) delete next[key]
      else next[key] = values
      return next
    })
  }, [])

  const draftClearFilter = useCallback((key) => {
    setDraftFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const draftClearAll = useCallback(() => {
    setDraftFilters({})
    setDraftSearch('')
  }, [])

  // Compute candidate apps from draft state for cascading options
  const draftGetCandidateApps = useCallback((excludeKey) => {
    return APPS.filter(app => {
      if (draftSearch) {
        const q = draftSearch.toLowerCase()
        const searchable = [app.name, app.seal, app.team, app.appOwner, app.cto, app.cbt, app.productLine, app.product]
          .join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      for (const [key, values] of Object.entries(draftFilters)) {
        if (key === excludeKey) continue
        if (values.length === 0) continue
        if (key === 'seal') {
          const rawValues = values.map(parseSealDisplay)
          if (!rawValues.includes(app.seal)) return false
        } else if (!values.includes(app[key])) return false
      }
      return true
    })
  }, [draftSearch, draftFilters])

  // Draft search suggestions
  const draftSuggestions = useMemo(() => {
    if (!draftSearch || draftSearch.length < 1) return []
    const q = draftSearch.toLowerCase()
    const suggestions = []
    const seen = new Set()
    const fields = [
      ['App', 'name', 'seal', 'patools'], ['SEAL', 'seal', 'seal', 'patools'],
      ['LOB', 'lob', 'lob', 'patools'], ['Sub LOB', 'subLob', 'subLob', 'patools'],
      ['Product Line', 'productLine', 'productLine', 'patools'], ['Product', 'product', 'product', 'patools'],
      ['CTO', 'cto', 'cto', 'v12'], ['CBT', 'cbt', 'cbt', 'v12'],
      ['Owner', 'appOwner', 'appOwner', null], ['Team', 'team', null, null],
    ]
    for (const app of APPS) {
      for (const [fieldLabel, fieldKey, filterKey, source] of fields) {
        const value = app[fieldKey]
        if (value && value.toLowerCase().includes(q) && !seen.has(`${fieldKey}:${value}`)) {
          seen.add(`${fieldKey}:${value}`)
          let filterValue = value
          if (filterKey === 'seal' && fieldKey === 'name') filterValue = SEAL_DISPLAY[app.seal] || app.seal
          else if (filterKey === 'seal' && fieldKey === 'seal') filterValue = SEAL_DISPLAY[value] || value
          suggestions.push({ field: fieldLabel, value, filterKey, filterValue, source })
        }
      }
    }
    return suggestions.slice(0, 15)
  }, [draftSearch])

  // Preview count: how many apps match the draft
  const draftMatchCount = useMemo(() => {
    return APPS.filter(app => {
      if (draftSearch) {
        const q = draftSearch.toLowerCase()
        const searchable = [app.name, app.seal, app.team, app.appOwner, app.cto, app.cbt, app.productLine, app.product]
          .join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      for (const [key, values] of Object.entries(draftFilters)) {
        if (values.length === 0) continue
        if (key === 'seal') {
          const rawValues = values.map(parseSealDisplay)
          if (!rawValues.includes(app.seal)) return false
        } else if (!values.includes(app[key])) return false
      }
      return true
    }).length
  }, [draftSearch, draftFilters])

  // Check if draft differs from committed state
  const isDirty = useMemo(() => {
    if (draftSearch !== searchText) return true
    const dKeys = Object.keys(draftFilters).filter(k => (draftFilters[k] || []).length > 0)
    const aKeys = Object.keys(activeFilters).filter(k => (activeFilters[k] || []).length > 0)
    if (dKeys.length !== aKeys.length) return true
    for (const k of dKeys) {
      const dv = [...(draftFilters[k] || [])].sort()
      const av = [...(activeFilters[k] || [])].sort()
      if (dv.length !== av.length || dv.some((v, i) => v !== av[i])) return true
    }
    return false
  }, [draftFilters, draftSearch, activeFilters, searchText])

  const handleApply = () => {
    // Commit draft to real context
    clearAllFilters()
    setSearchText(draftSearch)
    for (const [key, values] of Object.entries(draftFilters)) {
      if (values && values.length > 0) setFilterValues(key, values)
    }
    onClose()
  }

  // Collect active filter chips for display (from draft)
  const activeChips = []
  for (const [key, values] of Object.entries(draftFilters)) {
    const field = FILTER_FIELDS.find(f => f.key === key)
    if (field && values.length > 0) {
      values.forEach(v => activeChips.push({ key, label: field.label, value: v }))
    }
  }

  const draftFilterCount = Object.keys(draftFilters).filter(k => (draftFilters[k] || []).length > 0).length
  const hasAnyFilter = draftFilterCount > 0 || draftSearch.length > 0

  const renderFilterField = ({ key, label }) => {
    const subLobDisabled = key === 'subLob' &&
      !(draftFilters.lob || []).some(l => SUB_LOB_MAP[l])

    const selected = draftFilters[key] || []
    const selectedCount = selected.length

    // Dependency-aware: get options from apps matching all OTHER draft filters
    const candidateApps = draftGetCandidateApps(key)
    const options = getFilterOptions(key, candidateApps, draftFilters)

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
          onChange={(_, newVal) => draftSetFilter(key, newVal)}
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
              onClick={() => draftClearFilter(key)}
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
                label={`${draftFilterCount + (draftSearch ? 1 : 0)} active`}
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
          options={draftSuggestions}
          getOptionLabel={(opt) => typeof opt === 'string' ? opt : opt.value}
          inputValue={draftSearch}
          onInputChange={(_, v, reason) => {
            if (reason !== 'reset') setDraftSearch(v)
          }}
          onChange={(_, val) => {
            if (val && typeof val === 'object' && val.value) {
              if (val.filterKey) {
                const fv = val.filterValue || val.value
                const current = draftFilters[val.filterKey] || []
                if (!current.includes(fv)) {
                  draftSetFilter(val.filterKey, [...current, fv])
                }
                setDraftSearch('')
              } else {
                setDraftSearch(val.value)
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
                <Typography sx={{ ...fTiny, color: 'text.disabled', minWidth: 55 }}>{opt.field}</Typography>
                <Typography sx={{ ...fSmall, fontWeight: 600, flex: 1 }} noWrap>{opt.value}</Typography>
                {opt.source && (
                  <Typography sx={{ ...fTiny, color: opt.source === 'v12' ? 'rgba(96,165,250,0.6)' : 'rgba(168,85,247,0.6)',
                    fontWeight: 600, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {opt.source === 'v12' ? 'V12' : 'PAT'}
                  </Typography>
                )}
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
                    {draftSearch && (
                      <IconButton size="small" onClick={() => setDraftSearch('')} sx={{ p: 0.25 }}>
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
                const current = draftFilters[chip.key] || []
                const next = current.filter(v => v !== chip.value)
                draftSetFilter(chip.key, next)
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
            onClick={draftClearAll}
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
        px: 2.5, py: 1.25,
        borderTop: '1px solid', borderColor: 'divider',
        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
      }}>
        <Typography color="text.secondary" fontWeight={600} sx={fSmall}>
          Will show <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{draftMatchCount}</Box> of {totalApps} applications
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {hasAnyFilter && (
            <Typography
              onClick={draftClearAll}
              sx={{ ...fSmall, color: 'error.main', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
            >
              Reset all
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={handleApply}
            disabled={!isDirty}
            sx={{
              textTransform: 'none', fontWeight: 700, ...fSmall,
              px: 3, py: 0.5, borderRadius: 1.5,
              minWidth: 80,
            }}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Paper>
    </ClickAwayListener>
    </Popper>
  )
}
