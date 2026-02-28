import { Box, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import SpeedIcon from '@mui/icons-material/Speed'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import TimerIcon from '@mui/icons-material/Timer'
import AssessmentIcon from '@mui/icons-material/Assessment'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import GroupsIcon from '@mui/icons-material/Groups'
import PublicIcon from '@mui/icons-material/Public'
import NotificationsIcon from '@mui/icons-material/Notifications'
import StorageIcon from '@mui/icons-material/Storage'
import { useLocation } from 'react-router-dom'
import { useAuraChat } from './AuraChatContext'
import { getPromptsForPage } from './mockPrompts'

const fBody = { fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

const ICON_MAP = {
  ErrorOutline: ErrorOutlineIcon,
  Speed: SpeedIcon,
  AccountTree: AccountTreeIcon,
  Timer: TimerIcon,
  Assessment: AssessmentIcon,
  TrendingUp: TrendingUpIcon,
  Groups: GroupsIcon,
  Public: PublicIcon,
  Notifications: NotificationsIcon,
  Storage: StorageIcon,
}

export default function AuraChatWelcome() {
  const { sendMessage } = useAuraChat()
  const { pathname } = useLocation()
  const categories = getPromptsForPage(pathname)

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      flex: 1, px: 2, py: 2.5, overflowY: 'auto',
    }}>
      {/* Branding */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1565C0, #0ea5e9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mb: 1.5,
          boxShadow: '0 0 24px rgba(21,101,192,0.35)',
        }}>
          <AutoAwesomeIcon sx={{ fontSize: 24, color: '#fff' }} />
        </Box>
        <Typography fontWeight={700} sx={{ ...fBody, color: 'text.primary', mb: 0.5, textAlign: 'center' }}>
          AURA Assistant
        </Typography>
        <Typography sx={{ ...fSmall, color: 'text.secondary', textAlign: 'center', maxWidth: 340 }}>
          AI-Powered Observability Insights. Select a prompt below or type your own question.
        </Typography>
      </Box>

      {/* Categorized prompt rows */}
      {categories.map((cat, ci) => (
        <Box key={ci} sx={{ mb: 2 }}>
          <Typography sx={{
            ...fSmall, fontWeight: 700, color: 'text.secondary',
            textTransform: 'uppercase', letterSpacing: 0.8,
            mb: 0.75, px: 0.5,
          }}>
            {cat.category}
          </Typography>

          {cat.prompts.map((sp, pi) => {
            const Icon = ICON_MAP[sp.icon] || ErrorOutlineIcon
            return (
              <Box
                key={pi}
                onClick={() => sendMessage(sp.prompt)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25,
                  px: 1.25, py: 0.85,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
                  bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  mb: 0.5,
                  '&:hover': {
                    borderColor: t => t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0',
                    bgcolor: t => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.08)' : 'rgba(21,101,192,0.05)',
                  },
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  bgcolor: t => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon sx={{ fontSize: 15, color: t => t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0' }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography fontWeight={600} sx={{ ...fSmall, color: 'text.primary', lineHeight: 1.3 }}>
                    {sp.title}
                  </Typography>
                  <Typography noWrap sx={{ ...fSmall, color: 'text.secondary', lineHeight: 1.3, fontSize: 'clamp(0.65rem, 0.85vw, 0.75rem)' }}>
                    {sp.description}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Box>
      ))}
    </Box>
  )
}
