import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, Grid, Chip, TextField,
  InputAdornment, IconButton, Button, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import GroupsIcon from '@mui/icons-material/Groups'
import EmailIcon from '@mui/icons-material/Email'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'

const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny  = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

/* ── Team Form Dialog ── */

const EMPTY_FORM = { name: '', emails: [''], teams_channels: [''] }

function TeamForm({ open, onClose, onSave, existing }) {
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        emails: existing.emails?.length > 0 ? [...existing.emails] : [''],
        teams_channels: existing.teams_channels?.length > 0 ? [...existing.teams_channels] : [''],
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [existing, open])

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const updateListItem = (key, idx, val) => {
    setForm(prev => {
      const list = [...prev[key]]
      list[idx] = val
      return { ...prev, [key]: list }
    })
  }

  const addListItem = (key) => {
    setForm(prev => ({ ...prev, [key]: [...prev[key], ''] }))
  }

  const removeListItem = (key, idx) => {
    setForm(prev => {
      const list = prev[key].filter((_, i) => i !== idx)
      return { ...prev, [key]: list.length > 0 ? list : [''] }
    })
  }

  const valid = form.name.trim()

  const handleSave = () => {
    const cleaned = {
      name: form.name.trim(),
      emails: form.emails.map(e => e.trim()).filter(Boolean),
      teams_channels: form.teams_channels.map(c => c.trim()).filter(Boolean),
    }
    if (existing) cleaned.id = existing.id
    onSave(cleaned)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={fBody}>
        {existing ? 'Edit Team' : 'Create Team'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Team Name" size="small" required fullWidth
            value={form.name} onChange={e => set('name', e.target.value)}
            inputProps={{ maxLength: 80 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />

          {/* Emails */}
          <Box>
            <Typography fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny, mb: 1 }}>
              Email Addresses
            </Typography>
            <Stack spacing={0.75}>
              {form.emails.map((email, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    size="small" fullWidth placeholder="email@example.com"
                    value={email} onChange={e => updateListItem('emails', i, e.target.value)}
                    InputProps={{ sx: { ...fSmall, borderRadius: 1.5 } }}
                  />
                  <IconButton size="small" onClick={() => removeListItem('emails', i)}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => addListItem('emails')}
              sx={{ ...fTiny, textTransform: 'none', mt: 0.5 }}>
              Add Email
            </Button>
          </Box>

          {/* Teams Channels */}
          <Box>
            <Typography fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.8, ...fTiny, mb: 1 }}>
              Teams Channels
            </Typography>
            <Stack spacing={0.75}>
              {form.teams_channels.map((ch, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <TextField
                    size="small" fullWidth placeholder="#channel-name"
                    value={ch} onChange={e => updateListItem('teams_channels', i, e.target.value)}
                    InputProps={{ sx: { ...fSmall, borderRadius: 1.5 } }}
                  />
                  <IconButton size="small" onClick={() => removeListItem('teams_channels', i)}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                    <RemoveCircleOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />}
              onClick={() => addListItem('teams_channels')}
              sx={{ ...fTiny, textTransform: 'none', mt: 0.5 }}>
              Add Channel
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small" disabled={!valid}>
          {existing ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/* ── Teams Page ── */

export default function Teams() {
  const [teams, setTeams] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchTeams = () => {
    fetch('/api/teams').then(r => r.json()).then(setTeams).catch(() => {})
  }

  useEffect(() => { fetchTeams() }, [])

  const handleCreate = (form) => {
    fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(() => { fetchTeams(); setFormOpen(false) })
      .catch(() => {})
  }

  const handleEdit = (form) => {
    fetch(`/api/teams/${form.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
      .then(r => r.json())
      .then(() => { fetchTeams(); setEditing(null) })
      .catch(() => {})
  }

  const handleDelete = (id) => {
    fetch(`/api/teams/${id}`, { method: 'DELETE' })
      .then(() => { fetchTeams(); setDeleteConfirm(null) })
      .catch(() => {})
  }

  const filtered = teams.filter(t => {
    if (!search) return true
    return t.name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <GroupsIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700}>Teams</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={fBody}>
            Manage team contact information. Teams can be assigned to applications for quick access to emails and channels.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
          sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
          Create Team
        </Button>
      </Box>

      {/* Search */}
      {teams.length > 0 && (
        <TextField fullWidth size="small"
          placeholder="Search teams by name..."
          value={search} onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2.5, maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            sx: { ...fBody, borderRadius: 2 },
          }}
        />
      )}

      {/* Empty state */}
      {teams.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <GroupsIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No teams yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first team to manage contact information for your applications.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
            sx={{ textTransform: 'none' }}>
            Create your first team
          </Button>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No teams match your search.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(t => (
            <Grid item xs={12} sm={6} md={4} key={t.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  {/* Team name + counts */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <GroupsIcon sx={{ fontSize: 22, color: 'primary.main', flexShrink: 0 }} />
                    <Typography fontWeight={700} sx={{ ...fBody, flex: 1, minWidth: 0 }} noWrap>
                      {t.name}
                    </Typography>
                  </Box>

                  {/* Count chips */}
                  <Stack direction="row" spacing={0.5} sx={{ mb: 1.25 }}>
                    <Chip
                      icon={<EmailIcon sx={{ fontSize: '12px !important' }} />}
                      label={`${t.emails?.length || 0} emails`}
                      size="small"
                      sx={{ height: 20, ...fTiny, bgcolor: 'rgba(96,165,250,0.12)', color: '#60a5fa', fontWeight: 600 }}
                    />
                    <Chip
                      icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                      label={`${t.teams_channels?.length || 0} channels`}
                      size="small"
                      sx={{ height: 20, ...fTiny, bgcolor: 'rgba(139,92,246,0.12)', color: '#8b5cf6', fontWeight: 600 }}
                    />
                  </Stack>

                  {/* Emails */}
                  {t.emails?.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {t.emails.slice(0, 3).map(e => (
                        <Typography key={e} sx={{ ...fTiny, color: 'text.secondary', lineHeight: 1.6 }} noWrap>
                          {e}
                        </Typography>
                      ))}
                      {t.emails.length > 3 && (
                        <Typography sx={{ ...fTiny, color: 'text.disabled' }}>
                          +{t.emails.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Channels */}
                  {t.teams_channels?.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {t.teams_channels.slice(0, 3).map(ch => (
                        <Typography key={ch} sx={{ ...fTiny, color: 'text.secondary', lineHeight: 1.6 }} noWrap>
                          {ch}
                        </Typography>
                      ))}
                      {t.teams_channels.length > 3 && (
                        <Typography sx={{ ...fTiny, color: 'text.disabled' }}>
                          +{t.teams_channels.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  {/* Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create dialog */}
      {formOpen && (
        <TeamForm open onClose={() => setFormOpen(false)} onSave={handleCreate} />
      )}

      {/* Edit dialog */}
      {editing && (
        <TeamForm open onClose={() => setEditing(null)} onSave={handleEdit} existing={editing} />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={fBody}>Delete Team</DialogTitle>
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
