import { useState, useEffect, Suspense } from 'react'
import { Box, IconButton, CircularProgress, Alert, Card, Tooltip } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import { useRefresh } from '../RefreshContext'
import { WIDGET_REGISTRY } from './widgetRegistry'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

export default function WidgetWrapper({ widgetInstance, viewFilters, onRemove, onExpand, isEditing, isExpanded }) {
  const { refreshTick } = useRefresh()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reg = WIDGET_REGISTRY[widgetInstance.type]

  useEffect(() => {
    if (!reg || reg.selfContained || !reg.apiEndpoint) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    fetch(reg.apiEndpoint)
      .then(r => { if (!r.ok) throw new Error('Failed to load'); return r.json() })
      .then(json => {
        const result = reg.dataKey ? json[reg.dataKey] : json
        setData(result)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [refreshTick, reg])

  if (!reg) return null

  const Component = reg.component

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: isEditing ? '1px dashed' : undefined,
      borderColor: isEditing ? 'primary.main' : undefined,
    }}>
      {/* Floating controls — only visible on hover or in edit mode */}
      <Box
        className="drag-handle"
        sx={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          opacity: isEditing ? 1 : 0,
          transition: 'opacity 0.15s',
          '.MuiCard-root:hover &': { opacity: 1 },
          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)',
          borderRadius: 1,
          px: 0.5,
          py: 0.25,
          cursor: isEditing ? 'grab' : 'default',
        }}
      >
        {isEditing && (
          <DragIndicatorIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
        )}
        <Tooltip title={isExpanded ? 'Collapse' : 'Expand to full width'} placement="top">
          <IconButton size="small" onClick={() => onExpand(widgetInstance.i)}
            sx={{ p: 0.25, color: isExpanded ? 'primary.main' : 'text.disabled', '&:hover': { color: 'primary.main' } }}>
            {isExpanded
              ? <CloseFullscreenIcon sx={{ fontSize: 14 }} />
              : <OpenInFullIcon sx={{ fontSize: 14 }} />}
          </IconButton>
        </Tooltip>
        {isEditing && (
          <Tooltip title="Remove widget" placement="top">
            <IconButton size="small" onClick={() => onRemove(widgetInstance.i)}
              sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Content area — fills entire card */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 1.5 }}>
            <Alert severity="error" sx={{ ...fSmall }}>{error}</Alert>
          </Box>
        ) : (
          <Suspense fallback={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 80 }}>
              <CircularProgress size={24} />
            </Box>
          }>
            {reg.selfContained
              ? <Component viewFilters={viewFilters} />
              : <Component data={data} />
            }
          </Suspense>
        )}
      </Box>
    </Card>
  )
}
