import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, Grid, Chip, TextField,
  InputAdornment, IconButton, Button, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Divider, Autocomplete, Checkbox,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import {
  loadAllTenants, saveTenant, deleteTenant, generateTenantId, DEFAULT_TENANT,
} from '../tenant/tenantStorage'
import { useTenant } from '../tenant/TenantContext'
import { getFilterOptions, FILTER_FIELDS, SUB_LOB_MAP } from '../data/appData'
import TuneIcon from '@mui/icons-material/Tune'

const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny  = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

const checkIcon   = <CheckBoxIcon sx={{ fontSize: 16 }} />
const uncheckIcon = <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />

const COMPACT_KEYS = new Set(['lob', 'cpof', 'state', 'rto', 'riskRanking'])
const FILTER_GROUPS = [
  { label: 'Taxonomy',          keys: ['lob', 'subLob', 'seal', 'state', 'classification', 'investmentStrategy'] },
  { label: 'People',            keys: ['cto', 'cbt', 'appOwner'] },
  { label: 'Risk & Compliance', keys: ['cpof', 'riskRanking', 'rto'] },
]

function LogoPreview({ letter, gradient, image, size = 34 }) {
  if (image) {
    return (
      <Box
        component="img"
        src={image}
        sx={{
          width: size, height: size, borderRadius: 1.5,
          objectFit: 'cover', flexShrink: 0,
        }}
      />
    )
  }
  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      borderRadius: 1.5, width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 2px 8px ${gradient[0]}58`,
      flexShrink: 0,
    }}>
      <Typography sx={{
        fontWeight: 900, color: 'white',
        fontSize: size * 0.32, lineHeight: 1,
        fontFamily: '"Inter", sans-serif',
      }}>
        {letter || 'U'}
      </Typography>
    </Box>
  )
}

// ── Tenant Form Dialog ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '', title: '', subtitle: '', logoLetter: 'U',
  logoGradient: ['#1565C0', '#1e88e5'],
  logoImage: null,
  description: '', poweredBy: '', version: '',
  defaultFilters: {},
}

function TenantForm({ open, onClose, onSave, existing }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (existing) {
      setForm({
        ...EMPTY_FORM,
        ...existing,
        logoGradient: existing.logoGradient || ['#1565C0', '#1e88e5'],
        defaultFilters: existing.defaultFilters || {},
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [existing, open])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const setGradient = (idx, val) => setForm(prev => {
    const g = [...prev.logoGradient]
    g[idx] = val
    return { ...prev, logoGradient: g }
  })

  const valid = form.name.trim() && form.title.trim()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={fBody}>
        {existing ? 'Edit Instance' : 'Create Instance'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Logo preview + upload / letter+colors */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <LogoPreview letter={form.logoLetter} gradient={form.logoGradient} image={form.logoImage} size={52} />
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              {/* File upload */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined" size="small" component="label"
                  sx={{ ...fTiny, textTransform: 'none', py: 0.25 }}
                >
                  Upload Image
                  <input
                    type="file" hidden accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const reader = new FileReader()
                      reader.onload = () => set('logoImage', reader.result)
                      reader.readAsDataURL(file)
                      e.target.value = ''
                    }}
                  />
                </Button>
                {form.logoImage && (
                  <Typography
                    onClick={() => set('logoImage', null)}
                    sx={{ ...fTiny, color: 'error.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Remove
                  </Typography>
                )}
              </Box>

              {/* Letter + gradient fallback */}
              {!form.logoImage && (
                <>
                  <TextField
                    label="Logo Letter" size="small" value={form.logoLetter}
                    onChange={e => set('logoLetter', e.target.value.slice(0, 2))}
                    inputProps={{ maxLength: 2 }}
                    sx={{ width: 100, '& .MuiInputBase-root': fSmall }}
                  />
                  <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography sx={fTiny} color="text.secondary">Start</Typography>
                      <input type="color" value={form.logoGradient[0]}
                        onChange={e => setGradient(0, e.target.value)}
                        style={{ width: 32, height: 24, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography sx={fTiny} color="text.secondary">End</Typography>
                      <input type="color" value={form.logoGradient[1]}
                        onChange={e => setGradient(1, e.target.value)}
                        style={{ width: 32, height: 24, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                      />
                    </Box>
                  </Box>
                </>
              )}
            </Stack>
          </Box>

          <TextField label="Instance Name" size="small" required fullWidth
            value={form.name} onChange={e => set('name', e.target.value)}
            inputProps={{ maxLength: 60 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Portal Title (shown in nav bar)" size="small" required fullWidth
            value={form.title} onChange={e => set('title', e.target.value)}
            inputProps={{ maxLength: 60 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Subtitle (shown under title)" size="small" fullWidth
            value={form.subtitle} onChange={e => set('subtitle', e.target.value)}
            placeholder="e.g., Asset Management"
            inputProps={{ maxLength: 40 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Description" size="small" fullWidth multiline rows={2}
            value={form.description} onChange={e => set('description', e.target.value)}
            inputProps={{ maxLength: 200 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Powered By" size="small" fullWidth
            value={form.poweredBy} onChange={e => set('poweredBy', e.target.value)}
            placeholder="e.g., Powered by Spectrum Engineering"
            inputProps={{ maxLength: 100 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Version" size="small" fullWidth
            value={form.version} onChange={e => set('version', e.target.value)}
            placeholder="e.g., v1.0.0"
            inputProps={{ maxLength: 20 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />

          {/* Default scope filters */}
          <Divider sx={{ mt: 0.5 }} />
          <Typography fontWeight={700} color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny }}>
            Default Scope
          </Typography>

          {FILTER_GROUPS.map(group => {
            const subLobDisabled = (key) =>
              key === 'subLob' && !(form.defaultFilters.lob || []).some(l => SUB_LOB_MAP[l])

            return (
              <Box key={group.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
                  <TuneIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography fontWeight={700} color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny }}>
                    {group.label}
                  </Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider', ml: 0.5 }} />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  {group.keys.map(key => {
                    const field = FILTER_FIELDS.find(f => f.key === key)
                    if (!field) return null
                    const isWide = !COMPACT_KEYS.has(key)
                    const disabled = subLobDisabled(key)
                    const selectedCount = (form.defaultFilters[key] || []).length
                    return (
                      <Box key={key} sx={{ gridColumn: isWide ? 'span 2' : 'span 1' }}>
                        <Autocomplete
                          multiple size="small"
                          disabled={disabled}
                          options={getFilterOptions(key, form.defaultFilters)}
                          value={form.defaultFilters[key] || []}
                          onChange={(_, newVal) => set('defaultFilters', { ...form.defaultFilters, [key]: newVal })}
                          disableCloseOnSelect
                          limitTags={1}
                          renderOption={(props, option, { selected }) => {
                            const { key: liKey, ...rest } = props
                            return (
                              <li key={liKey} {...rest} style={{ ...rest.style, padding: '1px 8px', minHeight: 26 }}>
                                <Checkbox icon={uncheckIcon} checkedIcon={checkIcon} checked={selected}
                                  sx={{ p: 0, mr: 0.75 }} size="small" />
                                <Typography noWrap sx={fTiny}>{option}</Typography>
                              </li>
                            )
                          }}
                          ListboxProps={{ sx: { maxHeight: 180, '& .MuiAutocomplete-option': { py: 0.15, minHeight: 26 } } }}
                          renderInput={(params) => (
                            <TextField {...params}
                              label={disabled ? 'Sub LOB (select AWM / CIB)' : (selectedCount > 0 ? `${field.label} (${selectedCount})` : field.label)}
                              variant="outlined" size="small"
                              InputLabelProps={{ sx: fSmall }}
                              sx={{ '& .MuiInputBase-root': { ...fSmall, borderRadius: 1.5, minHeight: 32, py: '2px !important' } }}
                            />
                          )}
                          sx={{
                            '& .MuiChip-root': { height: 18, ...fTiny, borderRadius: 0.75, maxWidth: 90 },
                            '& .MuiAutocomplete-tag': { maxWidth: 90, my: 0 },
                            '& .MuiAutocomplete-inputRoot': { flexWrap: 'nowrap', overflow: 'hidden' },
                          }}
                        />
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )
          })}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={() => onSave(form)} variant="contained" size="small" disabled={!valid}>
          {existing ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Admin Page ───────────────────────────────────────────────────────────────

export default function Admin() {
  const { tenant: activeTenant, switchTenant, refreshTenant } = useTenant()
  const [tenants, setTenants] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => { setTenants(loadAllTenants()) }, [])
  const refresh = () => setTenants(loadAllTenants())

  // Strip empty filter arrays before saving
  const cleanFilters = (filters) =>
    Object.fromEntries(Object.entries(filters || {}).filter(([, v]) => v && v.length > 0))

  const handleCreate = (form) => {
    const tenant = { id: generateTenantId(), ...form, defaultFilters: cleanFilters(form.defaultFilters) }
    saveTenant(tenant)
    refresh()
    setFormOpen(false)
  }

  const handleEdit = (form) => {
    saveTenant({ ...form, defaultFilters: cleanFilters(form.defaultFilters) })
    refresh()
    setEditing(null)
    // If editing the active tenant, refresh it in context
    if (activeTenant.id === form.id) refreshTenant()
  }

  const handleDelete = (id) => {
    deleteTenant(id)
    refresh()
    setDeleteConfirm(null)
    if (activeTenant.id === id) switchTenant(null)
  }

  const handleActivate = (tenant) => {
    if (activeTenant.id === tenant.id) {
      switchTenant(null) // deactivate
    } else {
      switchTenant(tenant)
    }
  }

  const filtered = tenants.filter(t => {
    if (!search) return true
    const q = search.toLowerCase()
    return t.name.toLowerCase().includes(q) || (t.title || '').toLowerCase().includes(q)
  })

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700}>Portal Instances</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={fBody}>
            Create and manage branded portal instances for different teams. Each instance can have its own logo, title, and default application scope.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
          sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
          Create Instance
        </Button>
      </Box>

      {/* Active tenant indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography sx={{ ...fSmall, color: 'text.secondary', fontWeight: 600 }}>Active:</Typography>
        <Chip
          icon={<LogoPreview letter={activeTenant.logoLetter} gradient={activeTenant.logoGradient} image={activeTenant.logoImage} size={18} />}
          label={activeTenant.name}
          size="small"
          sx={{ ...fSmall, fontWeight: 600, pl: 0.5 }}
        />
        {activeTenant.id && (
          <Typography
            onClick={() => switchTenant(null)}
            sx={{ ...fTiny, color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            Switch to Default
          </Typography>
        )}
      </Box>

      {/* Search */}
      {tenants.length > 0 && (
        <TextField fullWidth size="small"
          placeholder="Search instances by name or title..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2.5, maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            sx: { ...fBody, borderRadius: 2 },
          }}
        />
      )}

      {/* Empty state */}
      {tenants.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No portal instances yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first instance to give a team their own branded portal.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
            sx={{ textTransform: 'none' }}>
            Create your first instance
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No instances match your search.</Typography>
        </Box>
      ) : (
        /* Tenant cards */
        <Grid container spacing={2}>
          {filtered.map(t => {
            const isActive = activeTenant.id === t.id
            const filterChips = Object.entries(t.defaultFilters || {})
              .flatMap(([key, vals]) => {
                const field = FILTER_FIELDS.find(f => f.key === key)
                return (vals || []).map(v => ({ key, label: field?.label || key, value: v }))
              })
            return (
              <Grid item xs={12} sm={6} md={4} key={t.id}>
                <Card sx={{
                  height: '100%', position: 'relative',
                  border: '2px solid',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Active badge */}
                  {isActive && (
                    <Chip label="Active" size="small"
                      sx={{
                        position: 'absolute', top: 8, right: 8, zIndex: 1,
                        ...fTiny, height: 20, fontWeight: 700,
                        bgcolor: 'primary.main', color: '#fff',
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Logo + Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <LogoPreview letter={t.logoLetter} gradient={t.logoGradient || ['#1565C0', '#1e88e5']} image={t.logoImage} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ ...fBody, pr: isActive ? 6 : 0 }} noWrap>
                          {t.name}
                        </Typography>
                        <Typography color="text.secondary" sx={fTiny} noWrap>
                          {t.title}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Description */}
                    {t.description && (
                      <Typography color="text.secondary" sx={{
                        ...fSmall, lineHeight: 1.5, mb: 1.25,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {t.description}
                      </Typography>
                    )}

                    {/* Default filter chips */}
                    {filterChips.length > 0 && (
                      <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                        {filterChips.slice(0, 6).map((c, i) => (
                          <Chip key={`${c.key}-${c.value}-${i}`} label={`${c.label}: ${c.value}`} size="small"
                            sx={{ height: 20, ...fTiny, bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontWeight: 600 }}
                          />
                        ))}
                        {filterChips.length > 6 && (
                          <Chip label={`+${filterChips.length - 6} more`} size="small"
                            sx={{ height: 20, ...fTiny, bgcolor: 'rgba(148,163,184,0.12)', color: '#94a3b8', fontWeight: 600 }}
                          />
                        )}
                      </Stack>
                    )}

                    {/* Version + dates */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {t.version && (
                        <Chip label={t.version} size="small"
                          sx={{ height: 18, ...fTiny, bgcolor: 'rgba(52,211,153,0.12)', color: '#34d399', fontWeight: 600 }}
                        />
                      )}
                      {t.updatedAt && (
                        <Typography color="text.disabled" sx={fTiny}>
                          Updated {new Date(t.updatedAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Tooltip title={isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton size="small" onClick={() => handleActivate(t)}
                          sx={{ color: isActive ? 'primary.main' : 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                          {isActive
                            ? <CheckCircleIcon sx={{ fontSize: 18 }} />
                            : <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />
                          }
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setEditing(t)}
                          sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteConfirm(t)}
                          sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Box sx={{ flex: 1 }} />
                      <Typography sx={fTiny} color="text.disabled">
                        {t.id?.replace('tenant-', '').slice(0, 8)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Create dialog */}
      {formOpen && (
        <TenantForm open onClose={() => setFormOpen(false)} onSave={handleCreate} />
      )}

      {/* Edit dialog */}
      {editing && (
        <TenantForm open onClose={() => setEditing(null)} onSave={handleEdit} existing={editing} />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={fBody}>Delete Instance</DialogTitle>
        <DialogContent>
          <Typography sx={fBody}>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} size="small">Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained" size="small">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
