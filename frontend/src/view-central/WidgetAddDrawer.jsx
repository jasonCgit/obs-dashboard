import { useState } from 'react'
import {
  Drawer, Box, Typography, TextField, Button, IconButton,
  InputAdornment, Divider,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import WidgetsIcon from '@mui/icons-material/Widgets'
import { WIDGET_REGISTRY, WIDGET_CATEGORIES } from './widgetRegistry'

const fBody = { fontSize: 'clamp(0.72rem, 0.95vw, 0.82rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

export default function WidgetAddDrawer({ open, onClose, onAdd, currentWidgets }) {
  const [search, setSearch] = useState('')

  const currentTypes = new Set((currentWidgets || []).map(w => w.type))

  const filteredWidgets = Object.values(WIDGET_REGISTRY).filter(w => {
    if (!search) return true
    const q = search.toLowerCase()
    return w.label.toLowerCase().includes(q) || w.description.toLowerCase().includes(q)
  })

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 360,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WidgetsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography fontWeight={700} sx={fBody}>Add Widget</Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Search widgets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16 }} /></InputAdornment>,
            sx: { ...fSmall, borderRadius: 2 },
          }}
        />
      </Box>

      {/* Widget list */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {WIDGET_CATEGORIES.map(cat => {
          const widgets = filteredWidgets.filter(w => w.category === cat.key)
          if (widgets.length === 0) return null
          return (
            <Box key={cat.key} sx={{ mb: 2 }}>
              <Typography fontWeight={700} color="text.secondary"
                sx={{ ...fTiny, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                {cat.label}
              </Typography>
              {widgets.map(widget => {
                const isAdded = currentTypes.has(widget.id)
                return (
                  <Box key={widget.id} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.25, mb: 0.75, borderRadius: 2,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    opacity: isAdded ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                  }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} sx={fSmall}>{widget.label}</Typography>
                      <Typography color="text.secondary" sx={{ ...fTiny, lineHeight: 1.4, mt: 0.25 }}>{widget.description}</Typography>
                      <Typography color="text.disabled" sx={{ ...fTiny, mt: 0.25 }}>
                        Default: {widget.defaultLayout.w}×{widget.defaultLayout.h}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={isAdded ? 'outlined' : 'contained'}
                      startIcon={isAdded ? <CheckIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
                      onClick={() => { onAdd(widget.id); }}
                      sx={{ ...fTiny, minWidth: 0, px: 1.5, py: 0.5, flexShrink: 0 }}
                    >
                      {isAdded ? 'Added' : 'Add'}
                    </Button>
                  </Box>
                )
              })}
            </Box>
          )
        })}
        {filteredWidgets.length === 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography color="text.secondary" sx={fSmall}>No widgets match your search</Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  )
}
