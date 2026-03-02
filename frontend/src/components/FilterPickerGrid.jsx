import { useCallback } from 'react'
import {
  Box, Typography, Autocomplete, TextField, Checkbox, Chip,
} from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import {
  FILTER_GROUPS, APPS, getFilterOptions, SUB_LOB_MAP, parseSealDisplay,
} from '../data/appData'

const fBody  = { fontSize: 'clamp(0.8rem, 1vw, 0.9rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny  = { fontSize: 'clamp(0.65rem, 0.82vw, 0.74rem)' }

const checkIcon   = <CheckBoxIcon sx={{ fontSize: 16 }} />
const uncheckIcon = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />

const FULL_WIDTH_KEYS = new Set(['seal', 'appOwner', 'deployments'])

/**
 * Shared filter picker grid used by SearchFilterPopover, Profile, and Admin TenantForm.
 *
 * @param {Object}   filters   - Current filter values, e.g. { lob: ['AWM'], cto: ['John'] }
 * @param {Function} onChange  - (key, values) => void
 * @param {Function} onClear   - (key) => void
 * @param {boolean}  compact   - Tighter spacing for dialogs / inline use
 */
export default function FilterPickerGrid({ filters, onChange, onClear, compact = false }) {
  const getCandidateApps = useCallback((excludeKey) => {
    return APPS.filter(app => {
      for (const [key, values] of Object.entries(filters)) {
        if (key === excludeKey) continue
        if (!values || values.length === 0) continue
        if (key === 'seal') {
          const rawValues = values.map(parseSealDisplay)
          if (!rawValues.includes(app.seal)) return false
        } else if (!values.includes(app[key])) return false
      }
      return true
    })
  }, [filters])

  const renderFilterField = ({ key, label }) => {
    const subLobDisabled = key === 'subLob' &&
      !(filters.lob || []).some(l => SUB_LOB_MAP[l])

    const selected = filters[key] || []
    const selectedCount = selected.length

    const candidateApps = getCandidateApps(key)
    const options = getFilterOptions(key, candidateApps, filters)

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
          onChange={(_, newVal) => onChange(key, newVal)}
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
                  ...fSmall, borderRadius: 1.5,
                  minHeight: compact ? 36 : 40,
                  py: compact ? '3px !important' : '5px !important',
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
                    height: compact ? 20 : 24, ...fTiny, borderRadius: 0.75,
                    maxWidth: compact ? 120 : 160,
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
        {selectedCount > 2 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, ml: 0.5 }}>
            <Typography sx={{ ...fTiny, color: 'primary.main', fontWeight: 600 }}>
              {selectedCount} selected
            </Typography>
            {onClear && (
              <Typography
                onClick={() => onClear(key)}
                sx={{ ...fTiny, color: 'text.disabled', cursor: 'pointer', '&:hover': { color: 'error.main' } }}
              >
                clear
              </Typography>
            )}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box>
      {FILTER_GROUPS.map((group) => (
        <Box key={group.label} sx={{ mb: compact ? 1.5 : 2, '&:last-child': { mb: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: compact ? 0.75 : 1 }}>
            <TuneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
            <Typography fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny }}>
              {group.label}
            </Typography>
            <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 0.5 }} />
          </Box>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: compact ? 1 : 1.25,
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
  )
}
