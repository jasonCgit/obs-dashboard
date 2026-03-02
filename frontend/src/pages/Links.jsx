import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardActionArea,
  Grid, Chip, Button, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Stack, Divider,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RestoreIcon from '@mui/icons-material/Restore'
import LinkIcon from '@mui/icons-material/Link'
import LockIcon from '@mui/icons-material/Lock'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import BugReportIcon from '@mui/icons-material/BugReport'
import DescriptionIcon from '@mui/icons-material/Description'
import BuildIcon from '@mui/icons-material/Build'
import StorageIcon from '@mui/icons-material/Storage'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import GroupsIcon from '@mui/icons-material/Groups'
import CloudIcon from '@mui/icons-material/Cloud'
import CodeIcon from '@mui/icons-material/Code'
import ScienceIcon from '@mui/icons-material/Science'
import DataObjectIcon from '@mui/icons-material/DataObject'
import DnsIcon from '@mui/icons-material/Dns'
import HubIcon from '@mui/icons-material/Hub'
import TerminalIcon from '@mui/icons-material/Terminal'
import WebhookIcon from '@mui/icons-material/Webhook'
import {
  loadCategories, saveCategories, generateId, resetToDefaults,
  ICON_KEYS, COLOR_PRESETS,
} from '../utils/linksStorage'
import { useAuth } from '../AuthContext'

const ICON_MAP = {
  MonitorHeart: MonitorHeartIcon, BugReport: BugReportIcon, Description: DescriptionIcon,
  Build: BuildIcon, Storage: StorageIcon, Security: SecurityIcon, Speed: SpeedIcon,
  Groups: GroupsIcon, Cloud: CloudIcon, Code: CodeIcon, Science: ScienceIcon,
  DataObject: DataObjectIcon, Dns: DnsIcon, Hub: HubIcon, Terminal: TerminalIcon,
  Webhook: WebhookIcon,
}

const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

// ── Category Form Dialog ─────────────────────────────────────────────────────

function CategoryForm({ open, onClose, onSave, existing }) {
  const [form, setForm] = useState({ category: '', color: COLOR_PRESETS[0], icon: 'MonitorHeart' })

  useEffect(() => {
    if (existing) {
      setForm({ category: existing.category, color: existing.color, icon: existing.icon })
    } else {
      setForm({ category: '', color: COLOR_PRESETS[0], icon: 'MonitorHeart' })
    }
  }, [existing, open])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.category.trim()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={fBody}>{existing ? 'Edit Category' : 'Add Category'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Category Name" size="small" required fullWidth
            value={form.category} onChange={e => set('category', e.target.value)}
            inputProps={{ maxLength: 60 }}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          {/* Icon picker */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Icon</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {ICON_KEYS.map(key => {
                const Icon = ICON_MAP[key]
                if (!Icon) return null
                return (
                  <IconButton key={key} size="small"
                    onClick={() => set('icon', key)}
                    sx={{
                      border: '2px solid',
                      borderColor: form.icon === key ? form.color : 'transparent',
                      borderRadius: 1.5, p: 0.5,
                    }}
                  >
                    <Icon sx={{ fontSize: 18, color: form.icon === key ? form.color : 'text.secondary' }} />
                  </IconButton>
                )
              })}
            </Box>
          </Box>
          {/* Color picker */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Color</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COLOR_PRESETS.map(c => (
                <Box key={c}
                  onClick={() => set('color', c)}
                  sx={{
                    width: 26, height: 26, borderRadius: 1, bgcolor: c, cursor: 'pointer',
                    border: '2px solid', borderColor: form.color === c ? 'white' : 'transparent',
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={() => onSave(form)} variant="contained" size="small" disabled={!valid}>
          {existing ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Link Form Dialog ─────────────────────────────────────────────────────────

function LinkForm({ open, onClose, onSave, existing }) {
  const [form, setForm] = useState({ label: '', desc: '', url: '', tag: '' })

  useEffect(() => {
    if (existing) {
      setForm({ label: existing.label, desc: existing.desc || '', url: existing.url || '', tag: existing.tag || '' })
    } else {
      setForm({ label: '', desc: '', url: '', tag: '' })
    }
  }, [existing, open])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const valid = form.label.trim()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={fBody}>{existing ? 'Edit Link' : 'Add Link'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Label" size="small" required fullWidth
            value={form.label} onChange={e => set('label', e.target.value)}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Description" size="small" fullWidth
            value={form.desc} onChange={e => set('desc', e.target.value)}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="URL" size="small" fullWidth placeholder="https://..."
            value={form.url} onChange={e => set('url', e.target.value)}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
          <TextField label="Tag (e.g. Primary)" size="small" fullWidth
            value={form.tag} onChange={e => set('tag', e.target.value)}
            InputProps={{ sx: fSmall }} InputLabelProps={{ sx: fSmall }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={() => onSave(form)} variant="contained" size="small" disabled={!valid}>
          {existing ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Links Page ───────────────────────────────────────────────────────────────

export default function Links() {
  const { isAdmin } = useAuth()
  const [categories, setCategories] = useState([])
  const [catFormOpen, setCatFormOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null)
  const [linkForm, setLinkForm] = useState(null) // { catId, existing? }
  const [deleteLinkConfirm, setDeleteLinkConfirm] = useState(null) // { catId, linkId }
  const [resetConfirm, setResetConfirm] = useState(false)

  useEffect(() => { setCategories(loadCategories()) }, [])

  const persist = (cats) => { setCategories(cats); saveCategories(cats) }

  // Category CRUD
  const handleCreateCat = (form) => {
    const cat = { id: generateId('cat'), category: form.category, color: form.color, icon: form.icon, links: [] }
    persist([...categories, cat])
    setCatFormOpen(false)
  }

  const handleEditCat = (form) => {
    persist(categories.map(c => c.id === editingCat.id
      ? { ...c, category: form.category, color: form.color, icon: form.icon }
      : c
    ))
    setEditingCat(null)
  }

  const handleDeleteCat = (id) => {
    persist(categories.filter(c => c.id !== id))
    setDeleteCatConfirm(null)
  }

  // Link CRUD
  const handleCreateLink = (form) => {
    const link = { id: generateId('lnk'), label: form.label, desc: form.desc, url: form.url, tag: form.tag || null }
    persist(categories.map(c => c.id === linkForm.catId
      ? { ...c, links: [...c.links, link] }
      : c
    ))
    setLinkForm(null)
  }

  const handleEditLink = (form) => {
    persist(categories.map(c => c.id === linkForm.catId
      ? { ...c, links: c.links.map(l => l.id === linkForm.existing.id
          ? { ...l, label: form.label, desc: form.desc, url: form.url, tag: form.tag || null }
          : l
        )}
      : c
    ))
    setLinkForm(null)
  }

  const handleDeleteLink = () => {
    const { catId, linkId } = deleteLinkConfirm
    persist(categories.map(c => c.id === catId
      ? { ...c, links: c.links.filter(l => l.id !== linkId) }
      : c
    ))
    setDeleteLinkConfirm(null)
  }

  const handleReset = () => {
    setCategories(resetToDefaults())
    setResetConfirm(false)
  }

  const handleLinkClick = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <LinkIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="h5" fontWeight={700}>Links</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={fBody}>
            Quick access to platform tools, documentation, and team resources.
          </Typography>
        </Box>
        {isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<RestoreIcon />} onClick={() => setResetConfirm(true)}
              sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
              Reset
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCatFormOpen(true)}
              sx={{ ...fSmall, textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
              Add Category
            </Button>
          </Stack>
        )}
      </Box>

      {/* Categories grid */}
      <Grid container spacing={2}>
        {categories.map(cat => {
          const CatIcon = ICON_MAP[cat.icon] || LinkIcon
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ pb: '8px !important' }}>
                  {/* Category header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CatIcon sx={{ fontSize: 18, color: cat.color }} />
                    <Typography variant="body2" fontWeight={700} sx={{
                      color: cat.color, textTransform: 'uppercase',
                      letterSpacing: 0.6, fontSize: '0.72rem', flex: 1,
                    }}>
                      {cat.category}
                    </Typography>
                    {isAdmin && (
                      <Box sx={{ display: 'flex', gap: 0.25 }}>
                        <Tooltip title="Add link">
                          <IconButton size="small" onClick={() => setLinkForm({ catId: cat.id })}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                            <AddIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit category">
                          <IconButton size="small" onClick={() => setEditingCat(cat)}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete category">
                          <IconButton size="small" onClick={() => setDeleteCatConfirm(cat)}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </Box>

                  {/* Links */}
                  {cat.links.map((link, i) => (
                    <Box key={link.id}>
                      {i > 0 && <Box sx={{ height: 1, bgcolor: 'divider', my: 0.75 }} />}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CardActionArea
                          onClick={() => handleLinkClick(link.url)}
                          sx={{
                            borderRadius: 1, px: 0.75, py: 0.5, flex: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{link.label}</Typography>
                              {link.tag && (
                                <Chip label={link.tag} size="small"
                                  sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${cat.color}22`, color: cat.color }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
                              {link.desc}
                            </Typography>
                          </Box>
                          <OpenInNewIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                        </CardActionArea>
                        {isAdmin && (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            <IconButton size="small"
                              onClick={() => setLinkForm({ catId: cat.id, existing: link })}
                              sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' }, p: 0.25 }}>
                              <EditIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                            <IconButton size="small"
                              onClick={() => setDeleteLinkConfirm({ catId: cat.id, linkId: link.id })}
                              sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' }, p: 0.25 }}>
                              <DeleteIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}

                  {cat.links.length === 0 && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center', py: 2 }}>
                      No links yet
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {categories.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <LinkIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No link categories yet</Typography>
          {isAdmin && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setCatFormOpen(true)}
              sx={{ textTransform: 'none', mt: 1 }}>
              Add your first category
            </Button>
          )}
        </Box>
      )}

      {/* Category form dialogs */}
      {catFormOpen && (
        <CategoryForm open onClose={() => setCatFormOpen(false)} onSave={handleCreateCat} />
      )}
      {editingCat && (
        <CategoryForm open onClose={() => setEditingCat(null)} onSave={handleEditCat} existing={editingCat} />
      )}

      {/* Link form dialog */}
      {linkForm && (
        <LinkForm
          open
          onClose={() => setLinkForm(null)}
          onSave={linkForm.existing ? handleEditLink : handleCreateLink}
          existing={linkForm.existing}
        />
      )}

      {/* Delete category confirmation */}
      <Dialog open={!!deleteCatConfirm} onClose={() => setDeleteCatConfirm(null)}>
        <DialogTitle sx={fBody}>Delete Category</DialogTitle>
        <DialogContent>
          <Typography sx={fBody}>
            Delete "{deleteCatConfirm?.category}" and all its links? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCatConfirm(null)} size="small">Cancel</Button>
          <Button onClick={() => handleDeleteCat(deleteCatConfirm.id)} color="error" variant="contained" size="small">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Delete link confirmation */}
      <Dialog open={!!deleteLinkConfirm} onClose={() => setDeleteLinkConfirm(null)}>
        <DialogTitle sx={fBody}>Delete Link</DialogTitle>
        <DialogContent>
          <Typography sx={fBody}>Are you sure you want to delete this link?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteLinkConfirm(null)} size="small">Cancel</Button>
          <Button onClick={handleDeleteLink} color="error" variant="contained" size="small">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Reset confirmation */}
      <Dialog open={resetConfirm} onClose={() => setResetConfirm(false)}>
        <DialogTitle sx={fBody}>Reset to Defaults</DialogTitle>
        <DialogContent>
          <Typography sx={fBody}>
            This will replace all categories and links with the default set. Any custom changes will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetConfirm(false)} size="small">Cancel</Button>
          <Button onClick={handleReset} color="warning" variant="contained" size="small">Reset</Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
