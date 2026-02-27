import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import {
  Container, Typography, Box, Card, CardContent, Chip, Divider,
  ToggleButtonGroup, ToggleButton, TextField, InputAdornment,
  Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel, Stack,
  Switch, FormControlLabel, Snackbar, Alert, Autocomplete, Grid,
  Radio, RadioGroup, FormLabel, Checkbox, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material'
import SearchIcon         from '@mui/icons-material/Search'
import AddIcon            from '@mui/icons-material/Add'
import EditIcon           from '@mui/icons-material/Edit'
import DeleteIcon         from '@mui/icons-material/Delete'
import CheckCircleIcon    from '@mui/icons-material/CheckCircle'
import RefreshIcon        from '@mui/icons-material/Refresh'
import PushPinIcon        from '@mui/icons-material/PushPin'
import GroupsIcon         from '@mui/icons-material/Groups'
import SyncAltIcon        from '@mui/icons-material/SyncAlt'
import EmailIcon          from '@mui/icons-material/Email'
import CampaignIcon       from '@mui/icons-material/Campaign'
import WarningAmberIcon   from '@mui/icons-material/WarningAmber'
import InfoOutlinedIcon   from '@mui/icons-material/InfoOutlined'
const ReactQuill = lazy(() => import('react-quill'))
import 'react-quill/dist/quill.snow.css'

const API = 'http://localhost:8080'

/* ─── Channel meta (order matters for toggle rendering) ─── */
const CHANNEL_META = {
  teams:   { color: '#6264A7', Icon: GroupsIcon,   label: 'Teams' },
  email:   { color: '#EA4335', Icon: EmailIcon,     label: 'Email' },
  connect: { color: '#00BCD4', Icon: SyncAltIcon,  label: 'Connect' },
  banner:  { color: '#FF9800', Icon: CampaignIcon,  label: 'Announcement in UOP' },
}

const STATUS_OPTIONS = [
  { value: 'ongoing',  label: 'Ongoing',  color: '#f44336' },
  { value: 'resolved', label: 'Resolved', color: '#4caf50' },
  { value: 'closed',   label: 'Closed',   color: '#94a3b8' },
]

const SEVERITY_OPTIONS = ['none', 'standard', 'major']
const SOURCE_OPTIONS = ['COB', 'NOC', 'Engineering', 'Security', 'DBA', 'Platform']
const CATEGORY_OPTIONS = ['Infrastructure', 'Application', 'Security', 'Database', 'Network', 'Platform']
const REGION_OPTIONS = ['Global', 'US-East', 'US-West', 'EU-West', 'EU-Central', 'APAC']
const IMPACT_TYPE_OPTIONS = [
  'Service Degradation', 'Full Outage', 'Performance Degradation',
  'Planned Maintenance', 'Security Compliance', 'Feature Release', 'Informational',
]

const IMPACTED_APP_OPTIONS = [
  'Advisor Connect (SEAL-90176)',
  'Spectrum Portfolio Mgmt (Equities) (SEAL-90215)',
  'Connect OS (SEAL-88180)',
]

const TEAMS_CHANNEL_OPTIONS = [
  'Custom channel Advisor Connect Updates USPB - Advisor Connect Updates – U.S. Private Bank',
  'General - Brokerage and TSD Team',
  'General - Client Service Manager Chat',
  'General - Connect Help - US Private Bank',
  'General - IPB Connect Alerts',
  'General - TSD - Technology Service Delivery',
  'General - US Ops and GTSS Connect Rollout',
]

const CONNECT_ENTITY_OPTIONS = [
  'CDG-PB', 'FRA-PB', 'JIB-PB', 'LON-PB', 'MIL-PB',
  'USA-PB', 'USA-JPMS', 'USA-CWM', 'BAH-ITS',
]

const CONNECT_REGION_OPTIONS = ['NA', 'EMEA', 'APAC']

const EMPTY_FORM = {
  title: '',
  status: 'ongoing',
  severity: 'none',
  impacted_apps: [],
  start_time: '',
  end_time: '',
  description: '',
  latest_updates: '',
  incident_number: '',
  impact_type: '',
  impact_description: '',
  header_message: '',
  email_recipients: [],
  category: '',
  region: '',
  next_steps: '',
  help_info: '',
  email_body: '',
  channels: { teams: false, email: false, connect: false, banner: false },
  pinned: false,
  teams_channels: [],
  email_source: '',
  email_hide_status: false,
  connect_dont_send_notification: false,
  connect_banner_position: 'in_ui',
  connect_target_entities: [],
  connect_target_regions: [],
  connect_weave_interfaces: [],
}

const QUILL_MODULES = {
  toolbar: [
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ],
}

const fieldSx = { fontSize: '0.82rem' }
const labelSx = { fontSize: '0.82rem' }

/* ─── Draggable + resizable dialog paper ─── */
function DraggablePaper(props) {
  const paperRef = useRef(null)
  const offset = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)

  const onMouseDown = useCallback((e) => {
    // only drag from the title bar area (first child with [data-drag-handle])
    if (!e.target.closest('[data-drag-handle]')) return
    e.preventDefault()
    dragging.current = true
    const rect = paperRef.current.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    const onMouseMove = (ev) => {
      if (!dragging.current) return
      const x = Math.max(0, Math.min(ev.clientX - offset.current.x, window.innerWidth - 200))
      const y = Math.max(0, Math.min(ev.clientY - offset.current.y, window.innerHeight - 100))
      paperRef.current.style.position = 'fixed'
      paperRef.current.style.left = `${x}px`
      paperRef.current.style.top = `${y}px`
      paperRef.current.style.margin = '0'
      paperRef.current.style.transform = 'none'
    }
    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <Paper
      {...props}
      ref={paperRef}
      onMouseDown={onMouseDown}
      sx={{
        ...props.sx,
        resize: 'both',
        overflow: 'auto',
        minWidth: 480,
        minHeight: 400,
        maxWidth: 'none',
      }}
    />
  )
}

function SectionHeader({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem',
        color: 'text.secondary', fontWeight: 700, display: 'block', mt: 2, mb: 1,
      }}
    >
      {children}
    </Typography>
  )
}

export default function Announcements() {
  const [data, setData]             = useState([])
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [showClosed, setShowClosed] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [snack, setSnack]           = useState({ open: false, msg: '', severity: 'success' })
  const [weaveInterfaces, setWeaveInterfaces] = useState([])
  const [connectValidation, setConnectValidation] = useState(null)
  const [validating, setValidating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/announcements`)
      const json = await res.json()
      setData(json.map(a => ({
        ...a,
        ann_status: a.ann_status || (a.status === 'open' || a.status === 'closed' ? a.status : 'open'),
      })))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    fetch(`${API}/api/announcements/connect/weave-interfaces`)
      .then(res => { if (!res.ok) throw new Error(res.status); return res.json() })
      .then(json => setWeaveInterfaces(Array.isArray(json) ? json : []))
      .catch(() => {})
  }, [])

  const notify = (msg, severity = 'success') => setSnack({ open: true, msg, severity })
  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const fCh = (ch, val) => setForm(prev => ({ ...prev, channels: { ...prev.channels, [ch]: val } }))

  const handleValidateConnect = async () => {
    setValidating(true)
    try {
      const entities = form.connect_target_entities.join(',')
      const regions = form.connect_target_regions.join(',')
      const res = await fetch(`${API}/api/announcements/connect/validate?entities=${encodeURIComponent(entities)}&regions=${encodeURIComponent(regions)}`)
      const json = await res.json()
      setConnectValidation(json.message)
    } catch {
      setConnectValidation('Validation failed')
    }
    setValidating(false)
  }

  /* ── Filters ── */
  const visible = useMemo(() => data
    .filter(a => showClosed ? true : a.ann_status === 'open')
    .filter(a => {
      if (filter === 'all') return true
      return a.channels?.[filter]
    })
    .filter(a => {
      if (!search) return true
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q)
        || (a.description || '').toLowerCase().includes(q)
        || (a.author || '').toLowerCase().includes(q)
    }), [data, showClosed, filter, search])

  const pinned = visible.filter(a => a.pinned)
  const rest   = visible.filter(a => !a.pinned)

  /* ── CRUD ── */
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setConnectValidation(null)
    setDialogOpen(true)
  }

  const openEdit = (a) => {
    setEditingId(a.id)
    setConnectValidation(null)
    setForm({
      title: a.title || '',
      status: a.status || 'ongoing',
      severity: a.severity || 'none',
      impacted_apps: a.impacted_apps || [],
      start_time: a.start_time || '',
      end_time: a.end_time || '',
      description: a.description || '',
      latest_updates: a.latest_updates || '',
      incident_number: a.incident_number || '',
      impact_type: a.impact_type || '',
      impact_description: a.impact_description || '',
      header_message: a.header_message || '',
      email_recipients: a.email_recipients || [],
      category: a.category || '',
      region: a.region || '',
      next_steps: a.next_steps || '',
      help_info: a.help_info || '',
      email_body: a.email_body || '',
      channels: a.channels || { teams: false, email: false, connect: false, banner: false },
      pinned: a.pinned || false,
      teams_channels: a.teams_channels || [],
      email_source: a.email_source || '',
      email_hide_status: a.email_hide_status || false,
      connect_dont_send_notification: a.connect_dont_send_notification || false,
      connect_banner_position: a.connect_banner_position || 'in_ui',
      connect_target_entities: a.connect_target_entities || [],
      connect_target_regions: a.connect_target_regions || [],
      connect_weave_interfaces: a.connect_weave_interfaces || [],
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const payload = { ...form }
    try {
      if (editingId) {
        await fetch(`${API}/api/announcements/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        notify('Announcement updated')
      } else {
        await fetch(`${API}/api/announcements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        notify('Announcement created')
      }
      setDialogOpen(false)
      fetchData()
    } catch {
      notify('Failed to save', 'error')
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await fetch(`${API}/api/announcements/${id}/status`, { method: 'PATCH' })
      fetchData()
    } catch {
      notify('Failed to toggle status', 'error')
    }
  }

  const handleDelete = async (id) => {
    try {
      await fetch(`${API}/api/announcements/${id}`, { method: 'DELETE' })
      notify('Announcement deleted')
      fetchData()
    } catch {
      notify('Failed to delete', 'error')
    }
  }

  const openCount  = data.filter(a => a.ann_status === 'open').length
  const closedCount = data.filter(a => a.ann_status === 'closed').length
  const activeChannels = Object.values(form.channels).filter(Boolean).length

  /* ── Semicolon handler for email chip input ── */
  const handleEmailKeyDown = (e) => {
    if (e.key === ';') {
      e.preventDefault()
      const val = e.target.value.trim()
      if (val && !form.email_recipients.includes(val)) {
        f('email_recipients', [...form.email_recipients, val])
      }
      setTimeout(() => { e.target.value = '' }, 0)
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Announcements</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage incident communications across Teams, Email, Connect, and Unified Observability Portal
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} size="small" sx={{ color: 'text.secondary' }}>
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ textTransform: 'none', fontSize: '0.82rem' }}>
            New
          </Button>
        </Stack>
      </Box>

      {/* Search + Channel filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search announcements..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: '100%', sm: 260 }, '& .MuiInputBase-input': { fontSize: '0.82rem' } }}
        />
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
          <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>All</ToggleButton>
          {Object.entries(CHANNEL_META).map(([key, { label, Icon, color }]) => (
            <ToggleButton key={key} value={key} sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5, gap: 0.5 }}>
              <Icon sx={{ fontSize: 14, color }} />{label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <FormControlLabel
          control={<Switch size="small" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />}
          label={<Typography variant="caption" sx={{ fontSize: '0.78rem' }}>Show closed ({closedCount})</Typography>}
          sx={{ ml: 'auto' }}
        />
      </Box>

      {/* Count */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontSize: '0.72rem' }}>
        Showing {visible.length} of {data.length} announcements · {openCount} open · {closedCount} closed
        {loading && ' · Refreshing...'}
      </Typography>

      {/* Pinned */}
      {pinned.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', color: 'text.secondary', display: 'block', mb: 1.5 }}>Pinned</Typography>
          {pinned.map(a => <AnnouncementCard key={a.id} a={a} onEdit={openEdit} onToggle={handleToggleStatus} onDelete={handleDelete} />)}
        </Box>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <Box>
          {pinned.length > 0 && (
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', color: 'text.secondary', display: 'block', mb: 1.5 }}>Recent</Typography>
          )}
          {rest.map(a => <AnnouncementCard key={a.id} a={a} onEdit={openEdit} onToggle={handleToggleStatus} onDelete={handleDelete} />)}
        </Box>
      )}

      {visible.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
          <CampaignIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography variant="body2">No announcements match your filters.</Typography>
        </Box>
      )}

      {/* ═══════════ Create / Edit Dialog ═══════════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth={false}
        PaperComponent={DraggablePaper}
        PaperProps={{ sx: { maxHeight: '90vh', width: '900px' } }}>
        <DialogTitle data-drag-handle sx={{ fontSize: '1rem', fontWeight: 700, pb: 0, cursor: 'grab', userSelect: 'none', '&:active': { cursor: 'grabbing' } }}>
          {editingId ? 'Edit Announcement' : 'Create Announcement'}
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>

          {/* ── Basic Info ── */}
          <SectionHeader>Basic Information</SectionHeader>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField label="Title" size="small" fullWidth required
                value={form.title} onChange={e => f('title', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={labelSx}>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={e => f('status', e.target.value)} sx={fieldSx}>
                  {STATUS_OPTIONS.map(s => (
                    <MenuItem key={s.value} value={s.value} sx={{ fontSize: '0.82rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
                        {s.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={labelSx}>Severity</InputLabel>
                <Select value={form.severity} label="Severity" onChange={e => f('severity', e.target.value)} sx={fieldSx}>
                  {SEVERITY_OPTIONS.map(s => (
                    <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem', textTransform: 'uppercase' }}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple size="small" disableCloseOnSelect
                options={IMPACTED_APP_OPTIONS}
                value={form.impacted_apps}
                onChange={(_, v) => f('impacted_apps', v)}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                    <Typography sx={{ fontSize: '0.82rem' }}>{option}</Typography></li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} size="small" sx={{ height: 20, fontSize: '0.65rem' }} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="Impacted Applications" placeholder="Type full SEAL or application name..."
                    InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="Start Time" type="datetime-local" size="small" fullWidth
                value={form.start_time} onChange={e => f('start_time', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ shrink: true, sx: labelSx }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField label="End Time" type="datetime-local" size="small" fullWidth
                value={form.end_time} onChange={e => f('end_time', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ shrink: true, sx: labelSx }} />
            </Grid>
          </Grid>

          {/* ── Details ── */}
          <SectionHeader>Details</SectionHeader>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField label="Description" size="small" fullWidth multiline rows={3} required
                value={form.description} onChange={e => f('description', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Latest Updates" size="small" fullWidth multiline rows={3}
                value={form.latest_updates} onChange={e => f('latest_updates', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }} />
            </Grid>
          </Grid>

          {/* ── Incident Info ── */}
          <SectionHeader>Incident Information</SectionHeader>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <TextField label="Incident Number" size="small" fullWidth
                value={form.incident_number} onChange={e => f('incident_number', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={labelSx}>Impact Type</InputLabel>
                <Select value={form.impact_type} label="Impact Type" onChange={e => f('impact_type', e.target.value)} sx={fieldSx}>
                  <MenuItem value="" sx={{ fontSize: '0.82rem' }}><em>None</em></MenuItem>
                  {IMPACT_TYPE_OPTIONS.map(t => <MenuItem key={t} value={t} sx={{ fontSize: '0.82rem' }}>{t}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Impact Description" size="small" fullWidth
                value={form.impact_description} onChange={e => f('impact_description', e.target.value)}
                InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }} />
            </Grid>
          </Grid>

          {/* ── Channels ── */}
          <SectionHeader>Channels</SectionHeader>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
            {Object.entries(CHANNEL_META).map(([key, { label, Icon, color }]) => (
              <FormControlLabel key={key}
                control={
                  <Switch size="small" checked={form.channels[key] || false}
                    onChange={e => fCh(key, e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: color } }} />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Icon sx={{ fontSize: 16, color }} />
                    <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>{label}</Typography>
                  </Box>
                }
              />
            ))}
          </Box>
          {activeChannels === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 1 }}>
              Select at least one channel to publish
            </Typography>
          )}

          {/* Active channel label */}
          {activeChannels > 0 && (
            <Divider sx={{ my: 1 }} />
          )}

          {/* ── Teams Config ── */}
          {form.channels.teams && (
            <>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 1.5, mb: 1, color: CHANNEL_META.teams.color }}>Teams</Typography>
              <Autocomplete
                multiple size="small" disableCloseOnSelect
                options={TEAMS_CHANNEL_OPTIONS}
                value={form.teams_channels}
                onChange={(_, v) => f('teams_channels', v)}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                    <Typography sx={{ fontSize: '0.78rem' }}>{option}</Typography></li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.length > 40 ? option.slice(0, 40) + '...' : option} size="small"
                      sx={{ height: 20, fontSize: '0.65rem' }} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="Select Teams Channels" placeholder="Select Teams Channels.."
                    InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                )}
              />
            </>
          )}

          {/* ── Email Config ── */}
          {form.channels.email && (
            <>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 2, mb: 1, color: CHANNEL_META.email.color }}>Email</Typography>
              <Stack spacing={1.5}>
                {/* Rich text editor */}
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                    Add Visuals &amp; Tables
                  </Typography>
                  <Box sx={{
                    '& .quill': { borderRadius: 1 },
                    '& .ql-toolbar': {
                      borderColor: 'rgba(255,255,255,0.15)', borderRadius: '4px 4px 0 0',
                      '& .ql-stroke': { stroke: 'rgba(255,255,255,0.55)' },
                      '& .ql-fill': { fill: 'rgba(255,255,255,0.55)' },
                      '& .ql-picker-label': { color: 'rgba(255,255,255,0.55)' },
                      '& .ql-picker-options': { bgcolor: '#1e1e1e', border: '1px solid rgba(255,255,255,0.15)' },
                    },
                    '& .ql-container': {
                      borderColor: 'rgba(255,255,255,0.15)', borderRadius: '0 0 4px 4px',
                      minHeight: 180, fontSize: '0.85rem', color: 'rgba(255,255,255,0.87)',
                    },
                    '& .ql-editor': { minHeight: 180 },
                    '& .ql-editor.ql-blank::before': { color: 'rgba(255,255,255,0.35)' },
                  }}>
                    <Suspense fallback={<Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.82rem' }}>Loading editor...</Box>}>
                      <ReactQuill theme="snow" value={form.email_body} onChange={v => f('email_body', v)}
                        modules={QUILL_MODULES} placeholder="Compose email body..." />
                    </Suspense>
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'primary.main', cursor: 'pointer', mt: 0.5, display: 'block' }}>
                    Add images like jpegs, pngs, etc.
                  </Typography>
                </Box>

                {/* Source + Hide Status */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel sx={labelSx}>Source</InputLabel>
                    <Select value={form.email_source} label="Source" onChange={e => f('email_source', e.target.value)} sx={fieldSx}>
                      <MenuItem value="" sx={{ fontSize: '0.82rem' }}><em>Select source for email</em></MenuItem>
                      {SOURCE_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem' }}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={<Checkbox size="small" checked={form.email_hide_status} onChange={e => f('email_hide_status', e.target.checked)} />}
                    label={<Typography variant="body2" sx={{ fontSize: '0.78rem' }}>Hide Status</Typography>}
                  />
                </Box>

                {/* Header Message */}
                <TextField label="Header Message" size="small" fullWidth
                  value={form.header_message} onChange={e => f('header_message', e.target.value)}
                  InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }} />

                {/* Email recipients */}
                <Autocomplete
                  multiple size="small" freeSolo options={[]}
                  value={form.email_recipients}
                  onChange={(_, v) => f('email_recipients', v)}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} size="small" sx={{ height: 20, fontSize: '0.7rem' }} {...getTagProps({ index })} key={option} />
                    ))
                  }
                  renderInput={params => (
                    <TextField {...params} label="Enter emails" placeholder="example@jpmchase.com"
                      helperText="Enter valid email and press ; or Enter"
                      onKeyDown={handleEmailKeyDown}
                      InputLabelProps={{ sx: labelSx }}
                      InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                  )}
                />
              </Stack>
            </>
          )}

          {/* ── Connect Config ── */}
          {form.channels.connect && (
            <>
              <Typography variant="body2" fontWeight={700} sx={{ mt: 2, mb: 1, color: CHANNEL_META.connect.color }}>Connect</Typography>
              <Stack spacing={1.5}>
                {/* Don't send notification */}
                <FormControlLabel
                  control={<Checkbox size="small" checked={form.connect_dont_send_notification}
                    onChange={e => f('connect_dont_send_notification', e.target.checked)} />}
                  label={<Typography variant="body2" sx={{ fontSize: '0.78rem' }}>Don&apos;t send connect notification</Typography>}
                />

                {/* Banner Position */}
                <FormControl>
                  <FormLabel sx={{ fontSize: '0.78rem', fontWeight: 600 }}>Banner Position</FormLabel>
                  <RadioGroup row value={form.connect_banner_position} onChange={e => f('connect_banner_position', e.target.value)}>
                    <FormControlLabel value="in_ui" control={<Radio size="small" />}
                      label={<Typography sx={{ fontSize: '0.78rem' }}>In User Interface</Typography>} />
                    <FormControlLabel value="across_connect" control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: '0.78rem' }}>
                          Post a banner across Connect {' '}
                          <Typography component="span" sx={{ fontSize: '0.72rem', color: 'warning.main', fontStyle: 'italic' }}>
                            (Please ensure you have Connect Product teams agreement before posting a banner across Connect)
                          </Typography>
                        </Typography>
                      } />
                  </RadioGroup>
                </FormControl>

                {/* Target User Entities */}
                <Autocomplete
                  multiple size="small" disableCloseOnSelect
                  options={CONNECT_ENTITY_OPTIONS}
                  value={form.connect_target_entities}
                  onChange={(_, v) => f('connect_target_entities', v)}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                      <Typography sx={{ fontSize: '0.82rem' }}>{option}</Typography></li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} size="small" sx={{ height: 20, fontSize: '0.7rem' }} {...getTagProps({ index })} key={option} />
                    ))
                  }
                  renderInput={params => (
                    <TextField {...params} label="Target User Entities" placeholder="Select..."
                      InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                  )}
                />

                {/* WEAVE Interfaces table */}
                <Box>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, display: 'block', fontWeight: 600 }}>
                    Please select user interface(s) with WEAVE function
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 240 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell padding="checkbox" />
                          <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700 }}>User Interface Title</TableCell>
                          <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700 }}>User Interface Name</TableCell>
                          <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700 }}>WEAVE Function</TableCell>
                          <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700 }}>SEAL ID</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {weaveInterfaces.map((row) => {
                          const isSelected = form.connect_weave_interfaces.includes(row.id)
                          return (
                            <TableRow key={row.id} hover selected={isSelected}
                              onClick={() => {
                                const next = isSelected
                                  ? form.connect_weave_interfaces.filter(id => id !== row.id)
                                  : [...form.connect_weave_interfaces, row.id]
                                f('connect_weave_interfaces', next)
                              }}
                              sx={{ cursor: 'pointer' }}>
                              <TableCell padding="checkbox"><Checkbox size="small" checked={isSelected} /></TableCell>
                              <TableCell sx={{ fontSize: '0.78rem' }}>{row.ui_title}</TableCell>
                              <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'primary.main' }}>{row.ui_name}</TableCell>
                              <TableCell sx={{ fontSize: '0.72rem', fontFamily: 'monospace' }}>{row.weave_function}</TableCell>
                              <TableCell sx={{ fontSize: '0.78rem' }}>{row.seal_id}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Target Notification Regions */}
                <Autocomplete
                  multiple size="small" disableCloseOnSelect
                  options={CONNECT_REGION_OPTIONS}
                  value={form.connect_target_regions}
                  onChange={(_, v) => f('connect_target_regions', v)}
                  renderOption={(props, option, { selected }) => (
                    <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                      <Typography sx={{ fontSize: '0.82rem' }}>{option}</Typography></li>
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip label={option} size="small" sx={{ height: 20, fontSize: '0.7rem' }} {...getTagProps({ index })} key={option} />
                    ))
                  }
                  renderInput={params => (
                    <TextField {...params} label="Target Notification Regions" placeholder="Select..."
                      InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                  )}
                />

                {/* Validate Selection */}
                <Box>
                  <Button variant="outlined" size="small" onClick={handleValidateConnect}
                    disabled={validating || form.connect_target_entities.length === 0}
                    sx={{ textTransform: 'none', fontSize: '0.82rem' }}>
                    {validating ? 'Validating...' : 'Validate Selection'}
                  </Button>
                  {connectValidation && (
                    <Alert severity="info" icon={<InfoOutlinedIcon sx={{ fontSize: 18 }} />}
                      sx={{ mt: 1, fontSize: '0.78rem', py: 0 }}>
                      {connectValidation}
                    </Alert>
                  )}
                </Box>
              </Stack>
            </>
          )}

          {/* ── Display Options ── */}
          <SectionHeader>Display Options</SectionHeader>
          <Grid container spacing={1.5} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={labelSx}>Category</InputLabel>
                <Select value={form.category} label="Category" onChange={e => f('category', e.target.value)} sx={fieldSx}>
                  <MenuItem value="" sx={{ fontSize: '0.82rem' }}><em>None</em></MenuItem>
                  {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.82rem' }}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="small" fullWidth>
                <InputLabel sx={labelSx}>Region</InputLabel>
                <Select value={form.region} label="Region" onChange={e => f('region', e.target.value)} sx={fieldSx}>
                  <MenuItem value="" sx={{ fontSize: '0.82rem' }}><em>None</em></MenuItem>
                  {REGION_OPTIONS.map(r => <MenuItem key={r} value={r} sx={{ fontSize: '0.82rem' }}>{r}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={<Switch size="small" checked={form.pinned} onChange={e => f('pinned', e.target.checked)} />}
                label={<Typography variant="body2" sx={{ fontSize: '0.78rem' }}>Pin to top</Typography>}
              />
            </Grid>
          </Grid>

        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} size="small" sx={{ textTransform: 'none', fontSize: '0.82rem' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" size="small" disabled={!form.title.trim()}
            sx={{ textTransform: 'none', fontSize: '0.82rem' }}>
            {editingId ? 'Done' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} variant="filled" sx={{ fontSize: '0.82rem' }}>{snack.msg}</Alert>
      </Snackbar>
    </Container>
  )
}


/* ═══════════════════════════════════════════════════════════════════════════
   Announcement Card
   ═══════════════════════════════════════════════════════════════════════════ */

function AnnouncementCard({ a, onEdit, onToggle, onDelete }) {
  const isClosed = a.ann_status === 'closed'
  const statusMeta = STATUS_OPTIONS.find(s => s.value === a.status) || STATUS_OPTIONS[0]
  const sevColor = a.severity === 'major' ? '#f44336' : a.severity === 'standard' ? '#42a5f5' : '#94a3b8'
  const activeChannels = Object.entries(a.channels || {}).filter(([, v]) => v)

  return (
    <Card sx={{ mb: 1.5, borderLeft: `3px solid ${sevColor}`, opacity: isClosed ? 0.6 : 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {/* Top row: channels + status + severity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          {activeChannels.map(([ch]) => {
            const meta = CHANNEL_META[ch]
            if (!meta) return null
            const { Icon, color, label } = meta
            return (
              <Chip key={ch}
                icon={<Icon sx={{ fontSize: '14px !important', color: `${color} !important` }} />}
                label={label} size="small" variant="outlined"
                sx={{ height: 20, fontSize: '0.62rem', borderColor: `${color}44`, color }} />
            )
          })}
          <Box sx={{ flex: 1 }} />
          {!a.email_hide_status && (
            <Chip label={statusMeta.label} size="small"
              sx={{ height: 18, fontSize: '0.6rem', bgcolor: `${statusMeta.color}22`, color: statusMeta.color, fontWeight: 700 }} />
          )}
          {a.severity && a.severity !== 'none' && (
            <Chip label={a.severity.toUpperCase()} size="small"
              sx={{ height: 18, fontSize: '0.6rem', bgcolor: `${sevColor}22`, color: sevColor, fontWeight: 700 }} />
          )}
          {a.pinned && <PushPinIcon sx={{ fontSize: 13, color: 'text.secondary' }} />}
          {isClosed && (
            <Chip label="CLOSED" size="small"
              sx={{ height: 16, fontSize: '0.58rem', bgcolor: 'rgba(148,163,184,0.2)', color: '#94a3b8', fontWeight: 700 }} />
          )}
        </Box>

        {/* Title + header message */}
        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.25 }}>{a.title}</Typography>
        {a.header_message && (
          <Typography variant="caption" sx={{ color: '#ff9800', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5, fontSize: '0.72rem' }}>
            <WarningAmberIcon sx={{ fontSize: 12 }} />{a.header_message}
          </Typography>
        )}

        {/* Description */}
        {a.description && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 0.75, fontSize: '0.8rem' }}>
            {a.description}
          </Typography>
        )}

        {/* Impacted apps */}
        {a.impacted_apps?.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
            {a.impacted_apps.map(app => (
              <Chip key={app} label={app} size="small" variant="outlined"
                sx={{ height: 18, fontSize: '0.62rem', borderColor: 'rgba(255,255,255,0.15)' }} />
            ))}
          </Box>
        )}

        {/* Meta row */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {a.author && <Typography variant="caption" color="text.secondary">{a.author}</Typography>}
            {a.date && <><Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" color="text.secondary">{a.date}</Typography></>}
            {a.incident_number && (
              <><Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: '0.7rem' }}>{a.incident_number}</Typography></>
            )}
            {a.category && <Chip label={a.category} size="small" sx={{ height: 16, fontSize: '0.58rem' }} variant="outlined" />}
            {a.region && <Chip label={a.region} size="small" sx={{ height: 16, fontSize: '0.58rem' }} variant="outlined" />}
          </Box>
          <Stack direction="row" spacing={0}>
            <Tooltip title={isClosed ? 'Reopen' : 'Close'}>
              <IconButton size="small" onClick={() => onToggle(a.id)} sx={{ color: 'text.secondary' }}>
                <CheckCircleIcon sx={{ fontSize: 16, color: isClosed ? '#4caf50' : 'text.disabled' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(a)} sx={{ color: 'text.secondary' }}>
                <EditIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(a.id)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                <DeleteIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
