import { Box, Typography, IconButton, Collapse, Tooltip, Divider } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import HistoryIcon from '@mui/icons-material/History'
import TuneIcon from '@mui/icons-material/Tune'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ToggleOnIcon from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'
import CloseIcon from '@mui/icons-material/Close'
import { useState } from 'react'
import { useAuraChat } from './AuraChatContext'

const fBody = { fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fTiny = { fontSize: 'clamp(0.63rem, 0.8vw, 0.72rem)' }

function formatSessionDate(ts) {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch { return '' }
}

function SectionHeader({ icon: Icon, title, expanded, onToggle }) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 1,
        cursor: 'pointer',
        '&:hover': { bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' },
      }}
    >
      <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
      <Typography fontWeight={600} sx={{ ...fSmall, color: 'text.primary', flex: 1 }}>
        {title}
      </Typography>
      {expanded ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.secondary' }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
    </Box>
  )
}

const CUSTOMIZATIONS = [
  { key: 'streaming', label: 'Streaming Responses', description: 'Enable real-time streaming of AI responses', defaultOn: true },
  { key: 'charts', label: 'Rich Visualizations', description: 'Show charts and graphs in responses', defaultOn: true },
  { key: 'followups', label: 'Suggested Follow-ups', description: 'Display suggested prompts after responses', defaultOn: true },
  { key: 'timestamps', label: 'Message Timestamps', description: 'Show time on each message', defaultOn: true },
  { key: 'sounds', label: 'Notification Sounds', description: 'Play sounds on new responses', defaultOn: false },
]

export default function AuraChatMenu({ onClose }) {
  const { chatSessions, activateSession, messages } = useAuraChat()
  const [historyOpen, setHistoryOpen] = useState(true)
  const [customOpen, setCustomOpen] = useState(true)
  const [toggles, setToggles] = useState(() =>
    Object.fromEntries(CUSTOMIZATIONS.map(c => [c.key, c.defaultOn]))
  )

  const handleToggle = (key) => {
    setToggles(p => ({ ...p, [key]: !p[key] }))
  }

  const sessions = chatSessions || []

  return (
    <Box sx={{
      width: '100%',
      display: 'flex', flexDirection: 'column',
      flex: 1,
      overflowY: 'auto',
    }}>
      {/* Menu header */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 1.5, py: 1.25,
        borderBottom: '1px solid',
        borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'divider',
      }}>
        <Typography fontWeight={700} sx={{ ...fBody, color: 'text.primary' }}>
          Chat Menu
        </Typography>
        <Tooltip title="Close menu">
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Chat History */}
      <SectionHeader
        icon={HistoryIcon}
        title="Chat History"
        expanded={historyOpen}
        onToggle={() => setHistoryOpen(p => !p)}
      />
      <Collapse in={historyOpen}>
        <Box sx={{ px: 1, pb: 1 }}>
          {sessions.length === 0 ? (
            <Typography sx={{ ...fTiny, color: 'text.disabled', px: 0.75, py: 0.5 }}>
              No previous chats
            </Typography>
          ) : (
            sessions.map((session) => (
              <Box
                key={session.id}
                onClick={() => activateSession(session.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1, py: 0.6,
                  borderRadius: 1,
                  cursor: 'pointer',
                  bgcolor: session.active
                    ? (t => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.12)' : 'rgba(21,101,192,0.08)')
                    : 'transparent',
                  '&:hover': {
                    bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  },
                  mb: 0.25,
                }}
              >
                <ChatBubbleOutlineIcon sx={{ fontSize: 13, color: 'text.secondary', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap fontWeight={session.active ? 600 : 400} sx={{ ...fTiny, color: 'text.primary', lineHeight: 1.3 }}>
                    {session.title}
                  </Typography>
                  <Typography sx={{ ...fTiny, color: 'text.disabled', lineHeight: 1.2 }}>
                    {formatSessionDate(session.timestamp)} · {session.messageCount} msgs
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Collapse>

      <Divider sx={{ borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'divider' }} />

      {/* Customizations */}
      <SectionHeader
        icon={TuneIcon}
        title="Customizations"
        expanded={customOpen}
        onToggle={() => setCustomOpen(p => !p)}
      />
      <Collapse in={customOpen}>
        <Box sx={{ px: 1, pb: 1.5 }}>
          {CUSTOMIZATIONS.map((c) => (
            <Box
              key={c.key}
              onClick={() => handleToggle(c.key)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.75,
                px: 1, py: 0.5,
                borderRadius: 1,
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                },
                mb: 0.25,
              }}
            >
              {toggles[c.key]
                ? <ToggleOnIcon sx={{ fontSize: 20, color: t => t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0', flexShrink: 0 }} />
                : <ToggleOffIcon sx={{ fontSize: 20, color: 'text.disabled', flexShrink: 0 }} />}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={500} sx={{ ...fTiny, color: 'text.primary', lineHeight: 1.3 }}>
                  {c.label}
                </Typography>
                <Typography sx={{ ...fTiny, color: 'text.disabled', lineHeight: 1.2, fontSize: 'clamp(0.52rem, 0.65vw, 0.6rem)' }}>
                  {c.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
