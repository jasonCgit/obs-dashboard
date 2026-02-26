import { useState, useEffect, useCallback } from 'react'
import {
  Container, Typography, Box, Card, CardContent, Chip, Divider,
  ToggleButtonGroup, ToggleButton, Avatar, TextField, InputAdornment,
  Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Select, FormControl, InputLabel, Stack,
  Switch, FormControlLabel, Snackbar, Alert,
} from '@mui/material'
import CampaignIcon       from '@mui/icons-material/Campaign'
import BuildIcon          from '@mui/icons-material/Build'
import SecurityIcon       from '@mui/icons-material/Security'
import InfoIcon           from '@mui/icons-material/Info'
import WarningAmberIcon   from '@mui/icons-material/WarningAmber'
import SearchIcon         from '@mui/icons-material/Search'
import AddIcon            from '@mui/icons-material/Add'
import EditIcon           from '@mui/icons-material/Edit'
import DeleteIcon         from '@mui/icons-material/Delete'
import CheckCircleIcon    from '@mui/icons-material/CheckCircle'
import RefreshIcon        from '@mui/icons-material/Refresh'
import PushPinIcon        from '@mui/icons-material/PushPin'

const API = 'http://localhost:8080'

const TYPE_META = {
  maintenance: { color: '#60a5fa', Icon: BuildIcon,        label: 'Maintenance'  },
  incident:    { color: '#f87171', Icon: WarningAmberIcon, label: 'Incident'     },
  security:    { color: '#fbbf24', Icon: SecurityIcon,     label: 'Security'     },
  general:     { color: '#94a3b8', Icon: CampaignIcon,     label: 'General'      },
  info:        { color: '#34d399', Icon: InfoIcon,         label: 'Info'         },
}

const EMPTY_FORM = {
  type: 'general',
  title: '',
  body: '',
  author: '',
  tags: '',
  pinned: false,
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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/announcements`)
      const json = await res.json()
      setData(json)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const notify = (msg, severity = 'success') => setSnack({ open: true, msg, severity })

  // ── Filters ──
  const visible = data
    .filter(a => showClosed ? true : a.status === 'open')
    .filter(a => filter === 'all' || a.type === filter)
    .filter(a => {
      if (!search) return true
      const q = search.toLowerCase()
      return a.title.toLowerCase().includes(q)
        || a.body.toLowerCase().includes(q)
        || a.author.toLowerCase().includes(q)
    })

  const pinned = visible.filter(a => a.pinned)
  const rest   = visible.filter(a => !a.pinned)

  // ── CRUD handlers ──
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (a) => {
    setEditingId(a.id)
    setForm({
      type: a.type,
      title: a.title,
      body: a.body,
      author: a.author,
      tags: a.tags.join(', '),
      pinned: a.pinned,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const payload = { ...form, tags }

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

  const openCount  = data.filter(a => a.status === 'open').length
  const closedCount = data.filter(a => a.status === 'closed').length

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Announcements</Typography>
          <Typography variant="body2" color="text.secondary">
            Platform updates, scheduled maintenance, and incident communications
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} size="small" sx={{ color: 'text.secondary' }}>
              <RefreshIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ textTransform: 'none', fontSize: '0.82rem' }}
          >
            New
          </Button>
        </Stack>
      </Box>

      {/* Search + Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
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
          sx={{ minWidth: 260, '& .MuiInputBase-input': { fontSize: '0.82rem' } }}
        />

        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
          <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>All</ToggleButton>
          {Object.entries(TYPE_META).map(([key, { label }]) => (
            <ToggleButton key={key} value={key} sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>{label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <FormControlLabel
          control={<Switch size="small" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />}
          label={
            <Typography variant="caption" sx={{ fontSize: '0.78rem' }}>
              Show closed ({closedCount})
            </Typography>
          }
          sx={{ ml: 'auto' }}
        />
      </Box>

      {/* Count */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontSize: '0.72rem' }}>
        Showing {visible.length} of {data.length} announcements · {openCount} open · {closedCount} closed
        {loading && ' · Refreshing...'}
      </Typography>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', color: 'text.secondary', display: 'block', mb: 1.5 }}>
            Pinned
          </Typography>
          {pinned.map(a => (
            <AnnouncementCard key={a.id} a={a} onEdit={openEdit} onToggle={handleToggleStatus} onDelete={handleDelete} />
          ))}
        </Box>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <Box>
          {pinned.length > 0 && (
            <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', color: 'text.secondary', display: 'block', mb: 1.5 }}>
              Recent
            </Typography>
          )}
          {rest.map(a => (
            <AnnouncementCard key={a.id} a={a} onEdit={openEdit} onToggle={handleToggleStatus} onDelete={handleDelete} />
          ))}
        </Box>
      )}

      {visible.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8, color: 'text.secondary' }}>
          <CampaignIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <Typography variant="body2">No announcements match your filters.</Typography>
        </Box>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 700 }}>
          {editingId ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          <FormControl size="small" fullWidth>
            <InputLabel sx={{ fontSize: '0.82rem' }}>Type</InputLabel>
            <Select
              value={form.type}
              label="Type"
              onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
              sx={{ fontSize: '0.82rem' }}
            >
              {Object.entries(TYPE_META).map(([key, { label }]) => (
                <MenuItem key={key} value={key} sx={{ fontSize: '0.82rem' }}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Title"
            size="small"
            fullWidth
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
            InputProps={{ sx: { fontSize: '0.82rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.82rem' } }}
          />
          <TextField
            label="Body"
            size="small"
            fullWidth
            multiline
            rows={4}
            value={form.body}
            onChange={(e) => setForm(f => ({ ...f, body: e.target.value }))}
            InputProps={{ sx: { fontSize: '0.82rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.82rem' } }}
          />
          <TextField
            label="Author"
            size="small"
            fullWidth
            value={form.author}
            onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))}
            InputProps={{ sx: { fontSize: '0.82rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.82rem' } }}
          />
          <TextField
            label="Tags (comma-separated)"
            size="small"
            fullWidth
            value={form.tags}
            onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
            InputProps={{ sx: { fontSize: '0.82rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.82rem' } }}
          />
          <FormControlLabel
            control={<Switch size="small" checked={form.pinned} onChange={(e) => setForm(f => ({ ...f, pinned: e.target.checked }))} />}
            label={<Typography variant="body2" sx={{ fontSize: '0.82rem' }}>Pin to top</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} size="small" sx={{ textTransform: 'none', fontSize: '0.82rem' }}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            disabled={!form.title.trim() || !form.body.trim()}
            sx={{ textTransform: 'none', fontSize: '0.82rem' }}
          >
            {editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ fontSize: '0.82rem' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Container>
  )
}


function AnnouncementCard({ a, onEdit, onToggle, onDelete }) {
  const meta = TYPE_META[a.type] || TYPE_META.general
  const { color, Icon } = meta
  const isClosed = a.status === 'closed'

  return (
    <Card sx={{ mb: 1.5, borderLeft: `3px solid ${color}`, opacity: isClosed ? 0.6 : 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar sx={{ bgcolor: `${color}22`, width: 34, height: 34, flexShrink: 0, mt: 0.25 }}>
            <Icon sx={{ fontSize: 18, color }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                  {a.title}
                </Typography>
                {a.pinned && <PushPinIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />}
                {isClosed && (
                  <Chip label="CLOSED" size="small"
                    sx={{ height: 16, fontSize: '0.58rem', bgcolor: 'rgba(148,163,184,0.2)', color: '#94a3b8', fontWeight: 700 }} />
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, alignItems: 'center' }}>
                {a.tags.map(t => <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.62rem' }} variant="outlined" />)}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1 }}>{a.body}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">{a.author}</Typography>
                <Typography variant="caption" color="text.secondary">·</Typography>
                <Typography variant="caption" color="text.secondary">{a.date}</Typography>
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
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
