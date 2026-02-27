import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Autocomplete, Chip,
  Checkbox,
} from '@mui/material'
import TuneIcon from '@mui/icons-material/Tune'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import { getFilterOptions, FILTER_FIELDS, SUB_LOB_MAP } from '../data/appData'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

const checkIcon = <CheckBoxIcon sx={{ fontSize: 16 }} />
const uncheckIcon = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />

const COMPACT_KEYS = new Set(['lob', 'cpof', 'state', 'rto', 'riskRanking'])

const FILTER_GROUPS = [
  { label: 'Taxonomy',          keys: ['lob', 'subLob', 'seal', 'state', 'classification', 'investmentStrategy'] },
  { label: 'People',            keys: ['cto', 'cbt', 'appOwner'] },
  { label: 'Risk & Compliance', keys: ['cpof', 'riskRanking', 'rto'] },
]

export default function ViewCentralForm({ open, onClose, onSave, existingView }) {
  const isEdit = !!existingView
  const [name, setName] = useState(existingView?.name || '')
  const [description, setDescription] = useState(existingView?.description || '')
  const [filters, setFilters] = useState(existingView?.filters || {})

  const setFilterValue = (key, values) => {
    setFilters(prev => {
      const next = { ...prev }
      if (!values || values.length === 0) delete next[key]
      else next[key] = values
      return next
    })
  }

  const activeFilterCount = Object.values(filters).reduce((s, v) => s + (v?.length || 0), 0)

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      ...(existingView || {}),
      name: name.trim(),
      description: description.trim(),
      filters,
    })
  }

  const renderFilterField = (key) => {
    const field = FILTER_FIELDS.find(f => f.key === key)
    if (!field) return null

    const subLobDisabled = key === 'subLob' &&
      !(filters.lob || []).some(l => SUB_LOB_MAP[l])

    const selectedCount = (filters[key] || []).length

    return (
      <Autocomplete
        key={key}
        multiple
        size="small"
        disabled={subLobDisabled}
        options={getFilterOptions(key, filters)}
        value={filters[key] || []}
        onChange={(_, val) => setFilterValue(key, val)}
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
              selectedCount > 0 ? `${field.label} (${selectedCount})` : field.label
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {isEdit ? 'Edit View Central' : 'Create View Central'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g., Spectrum Equities Dashboard"
            size="small"
            inputProps={{ maxLength: 60 }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Brief description of this view's scope"
            size="small"
            multiline
            rows={2}
            inputProps={{ maxLength: 200 }}
          />

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography fontWeight={600} color="text.secondary" sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Filter Scope
              </Typography>
              {activeFilterCount > 0 && (
                <Chip
                  label={`${activeFilterCount} active`}
                  size="small"
                  sx={{ height: 20, ...fTiny, fontWeight: 700, bgcolor: 'primary.main', color: '#fff', borderRadius: 1 }}
                />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontSize: '0.72rem' }}>
              Define which applications this View Central monitors.
            </Typography>

            {FILTER_GROUPS.map((group) => (
              <Box key={group.label} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                  <TuneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography fontWeight={700} color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny }}>
                    {group.label}
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 0.5 }} />
                </Box>

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

            {activeFilterCount > 0 && (
              <Typography
                onClick={() => setFilters({})}
                sx={{ ...fTiny, color: 'error.main', cursor: 'pointer', fontWeight: 600, mt: 1, '&:hover': { textDecoration: 'underline' } }}
              >
                Clear all filters
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={!name.trim()}>
          {isEdit ? 'Save Changes' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
