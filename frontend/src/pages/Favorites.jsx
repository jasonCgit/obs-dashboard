import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardActionArea,
  Grid, Chip, Stack, IconButton, Tooltip, TextField, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import WidgetsIcon from '@mui/icons-material/Widgets'
import DashboardIcon from '@mui/icons-material/Dashboard'
import { useNavigate } from 'react-router-dom'
import {
  loadAllViewCentrals, saveViewCentral, toggleViewCentralFavorite,
  DEFAULT_VIEW_CENTRALS,
} from '../view-central/viewCentralStorage'

const fBody = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const sealColor = { '90176': '#60a5fa', '90215': '#f87171', '88180': '#34d399' }
const sealLabel = { '90176': 'Advisor Connect', '90215': 'Spectrum Equities', '88180': 'Connect OS' }

export default function Favorites() {
  const navigate = useNavigate()
  const [views, setViews] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    let loaded = loadAllViewCentrals()
    if (loaded.length === 0) {
      DEFAULT_VIEW_CENTRALS.forEach(v => saveViewCentral(v))
      loaded = loadAllViewCentrals()
    }
    setViews(loaded)
  }, [])

  const refreshViews = () => setViews(loadAllViewCentrals())
  const favs = views.filter(v => v.favorite)
  const filtered = favs.filter(v => {
    if (!search) return true
    const q = search.toLowerCase()
    return v.name.toLowerCase().includes(q) || (v.description || '').toLowerCase().includes(q)
  })

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Favorites</Typography>
        <Typography variant="body2" color="text.secondary" sx={fBody}>
          Your pinned View Centrals — star any view from View Central to pin it here.
        </Typography>
      </Box>

      {favs.length > 0 && (
        <TextField
          fullWidth
          size="small"
          placeholder="Search favorites by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ mb: 2.5, maxWidth: 400 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
            sx: { ...fBody, borderRadius: 2 },
          }}
        />
      )}

      {favs.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <StarBorderIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Star a View Central to pin it here for quick access.
          </Typography>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <SearchIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No favorites match your search.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(view => {
            const seals = view.filters?.seal || []
            const widgetCount = view.widgets?.length || 0
            return (
              <Grid item xs={12} sm={6} md={4} key={view.id}>
                <Card sx={{ height: '100%', position: 'relative' }}>
                  <Tooltip title="Remove from Favorites">
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); toggleViewCentralFavorite(view.id); refreshViews() }}
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, p: 0.5, color: '#fbbf24', '&:hover': { color: '#fbbf24' } }}
                    >
                      <StarIcon sx={{ fontSize: 15 }} />
                    </IconButton>
                  </Tooltip>

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

                      {seals.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                          {seals.map(s => (
                            <Chip key={s} label={sealLabel[s] || `SEAL ${s}`} size="small"
                              sx={{ height: 20, ...fSmall, bgcolor: `${sealColor[s] || '#94a3b8'}18`, color: sealColor[s] || '#94a3b8', fontWeight: 600 }} />
                          ))}
                        </Stack>
                      )}

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
    </Container>
  )
}
