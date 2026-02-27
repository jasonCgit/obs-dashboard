import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardActionArea,
  Grid, Chip, TextField, InputAdornment, IconButton, Button, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Stack,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import WidgetsIcon from '@mui/icons-material/Widgets'
import DashboardIcon from '@mui/icons-material/Dashboard'
import { useNavigate } from 'react-router-dom'
import {
  loadAllViewCentrals, saveViewCentral, deleteViewCentral,
  toggleViewCentralFavorite, generateId, DEFAULT_VIEW_CENTRALS,
} from './viewCentralStorage'
import ViewCentralForm from './ViewCentralForm'

const fBody = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

export default function ViewCentralListing() {
  const navigate = useNavigate()
  const [views, setViews] = useState([])
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingView, setEditingView] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Load or seed View Centrals
  useEffect(() => {
    let loaded = loadAllViewCentrals()
    if (loaded.length === 0) {
      DEFAULT_VIEW_CENTRALS.forEach(v => saveViewCentral(v))
      loaded = loadAllViewCentrals()
    }
    setViews(loaded)
  }, [])

  const refreshViews = () => setViews(loadAllViewCentrals())

  const filtered = views.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.name.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
  })

  const handleCreate = (formData) => {
    const newView = {
      id: generateId(),
      ...formData,
      widgets: [],
    }
    saveViewCentral(newView)
    refreshViews()
    setFormOpen(false)
    navigate(`/view-central/${newView.id}`)
  }

  const handleEdit = (formData) => {
    saveViewCentral(formData)
    refreshViews()
    setEditingView(null)
  }

  const handleDelete = (id) => {
    deleteViewCentral(id)
    refreshViews()
    setDeleteConfirm(null)
  }

  const sealColor = { '90176': '#60a5fa', '90215': '#f87171', '88180': '#34d399' }
  const sealLabel = { '90176': 'Advisor Connect', '90215': 'Spectrum Equities', '88180': 'Connect OS' }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>View Central</Typography>
          <Typography variant="body2" color="text.secondary" sx={fBody}>
            Custom dashboards scoped to product areas. Create, configure, and monitor.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
          sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          Create View
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        size="small"
        placeholder="Search views by name or description..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2.5, maxWidth: 400 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
          sx: { ...fBody, borderRadius: 2 },
        }}
      />

      {/* View cards */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <DashboardIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {search ? 'No views match your search' : 'No View Centrals yet'}
          </Typography>
          {!search && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}
              sx={{ mt: 1, textTransform: 'none' }}>
              Create your first View Central
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(view => {
            const seals = view.filters?.seal || []
            const widgetCount = view.widgets?.length || 0
            return (
              <Grid item xs={12} sm={6} md={4} key={view.id}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  {/* Action icons */}
                  <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'flex', gap: 0.25 }}>
                    <Tooltip title={view.favorite ? 'Remove from Favorites' : 'Add to Favorites'}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleViewCentralFavorite(view.id); refreshViews() }}
                        sx={{ p: 0.5, color: view.favorite ? '#fbbf24' : 'text.disabled', '&:hover': { color: '#fbbf24' } }}>
                        {view.favorite ? <StarIcon sx={{ fontSize: 15 }} /> : <StarBorderIcon sx={{ fontSize: 15 }} />}
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingView(view) }}
                      sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                      <EditIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(view) }}
                      sx={{ p: 0.5, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                      <DeleteIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Box>

                  <CardActionArea onClick={() => navigate(`/view-central/${view.id}`)} sx={{ height: '100%', p: 0.5 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ bgcolor: 'rgba(96,165,250,0.12)', borderRadius: 2, p: 1.25 }}>
                          <DashboardIcon sx={{ fontSize: 26, color: '#60a5fa' }} />
                        </Box>
                      </Box>

                      <Typography variant="body1" fontWeight={700} sx={{ ...fBody, mb: 0.5, pr: 5 }}>{view.name}</Typography>

                      {view.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ ...fSmall, lineHeight: 1.5, mb: 1.25,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {view.description}
                        </Typography>
                      )}

                      {/* SEAL chips */}
                      {seals.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                          {seals.map(s => (
                            <Chip key={s} label={sealLabel[s] || `SEAL ${s}`} size="small"
                              sx={{ height: 20, ...fSmall, bgcolor: `${sealColor[s] || '#94a3b8'}18`, color: sealColor[s] || '#94a3b8', fontWeight: 600 }} />
                          ))}
                        </Stack>
                      )}

                      {/* Footer info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <WidgetsIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary" sx={fSmall}>
                            {widgetCount} widget{widgetCount !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        {view.updatedAt && (
                          <Typography variant="caption" color="text.disabled" sx={fSmall}>
                            · Updated {new Date(view.updatedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* Create dialog */}
      {formOpen && (
        <ViewCentralForm open onClose={() => setFormOpen(false)} onSave={handleCreate} />
      )}

      {/* Edit dialog */}
      {editingView && (
        <ViewCentralForm open onClose={() => setEditingView(null)} onSave={handleEdit} existingView={editingView} />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete View Central</DialogTitle>
        <DialogContent>
          <DialogContentText sx={fBody}>
            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} size="small">Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained" size="small">Delete</Button>
        </DialogActions>
      </Dialog>

    </Container>
  )
}
