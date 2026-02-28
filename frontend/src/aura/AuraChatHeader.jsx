import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MenuIcon from '@mui/icons-material/Menu'
import AddIcon from '@mui/icons-material/Add'
import { useAuraChat } from './AuraChatContext'

const fBody = { fontSize: 'clamp(0.85rem, 1.1vw, 0.95rem)' }
const fSmall = { fontSize: 'clamp(0.72rem, 0.9vw, 0.82rem)' }

export default function AuraChatHeader() {
  const { toggleOpen, toggleExpand, isExpanded, clearChat, newChat, messages, toggleMenu } = useAuraChat()
  return (
    <Box sx={{
      px: 2, py: 1.5,
      borderBottom: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'divider',
      background: t => t.palette.mode === 'dark'
        ? 'linear-gradient(135deg, rgba(21,101,192,0.22), rgba(14,165,233,0.14))'
        : 'linear-gradient(135deg, rgba(21,101,192,0.12), rgba(14,165,233,0.08))',
      display: 'flex', alignItems: 'center', gap: 1,
      flexShrink: 0,
    }}>
      <Tooltip title="Chat Menu">
        <IconButton size="small" onClick={toggleMenu} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          <MenuIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Box sx={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #1565C0, #0ea5e9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 15, color: '#fff' }} />
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography fontWeight={700} sx={{ ...fBody, color: 'text.primary', lineHeight: 1.3 }}>
          AURA Assistant
        </Typography>
        <Typography sx={{ ...fSmall, color: 'text.secondary', lineHeight: 1.2 }}>
          AI-Powered Observability Insights
        </Typography>
      </Box>

      <Tooltip title="New Chat">
        <IconButton size="small" onClick={newChat} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          <AddIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      {messages.length > 0 && (
        <Tooltip title="Clear chat">
          <IconButton size="small" onClick={clearChat} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
        <IconButton size="small" onClick={toggleExpand} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          {isExpanded
            ? <CloseFullscreenIcon sx={{ fontSize: 18 }} />
            : <OpenInFullIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Close">
        <IconButton size="small" onClick={toggleOpen} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
