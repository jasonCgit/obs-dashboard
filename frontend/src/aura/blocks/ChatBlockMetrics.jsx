import { Box, Typography } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import TimerIcon from '@mui/icons-material/Timer'
import PeopleIcon from '@mui/icons-material/People'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CheckIcon from '@mui/icons-material/Check'
import DataUsageIcon from '@mui/icons-material/DataUsage'
import PublicIcon from '@mui/icons-material/Public'
import ShieldIcon from '@mui/icons-material/Shield'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CloudIcon from '@mui/icons-material/Cloud'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fMetric = { fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)' }

const ICON_MAP = {
  error: ErrorIcon,
  warning: WarningAmberIcon,
  timer: TimerIcon,
  people: PeopleIcon,
  check: CheckIcon,
  check_circle: CheckCircleIcon,
  data_usage: DataUsageIcon,
  public: PublicIcon,
  shield: ShieldIcon,
  analytics: AnalyticsIcon,
  notifications: NotificationsIcon,
  cloud: CloudIcon,
  money: MonetizationOnIcon,
  health: CheckCircleIcon,
  volume_off: VolumeOffIcon,
  trending_down: TrendingDownIcon,
}

function Sparkline({ data, color, width = 48, height = 18 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 1
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  )
}

export default function ChatBlockMetrics({ data }) {
  if (!data || data.length === 0) return null
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
      {data.map((m, i) => {
        const down = m.trend != null && m.trend <= 0
        const trendColor = down ? '#4ade80' : '#f44336'
        const Icon = ICON_MAP[m.icon]
        return (
          <Box
            key={i}
            sx={{
              py: 1, px: 1.25, borderRadius: 1.5,
              bgcolor: t => t.palette.mode === 'dark' ? `${m.color}18` : `${m.color}14`,
              border: '1px solid',
              borderColor: t => t.palette.mode === 'dark' ? `${m.color}40` : `${m.color}35`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box>
                  <Typography fontWeight={700} sx={{ ...fMetric, color: m.color, lineHeight: 1, mb: 0.3 }}>
                    {m.value}
                  </Typography>
                  <Typography color="text.secondary" sx={{ ...fSmall }}>{m.label}</Typography>
                </Box>
                {m.sparkline?.length > 1 ? (
                  <Box sx={{ position: 'relative' }}>
                    {m.trend != null && (
                      <Box sx={{ position: 'absolute', top: -8, right: -4, display: 'flex', alignItems: 'center' }}>
                        {down
                          ? <TrendingDownIcon sx={{ fontSize: 10, color: trendColor }} />
                          : <TrendingUpIcon sx={{ fontSize: 10, color: trendColor }} />}
                        <Typography sx={{ ...fSmall, fontWeight: 700, color: trendColor, ml: 0.1, fontSize: '0.55rem' }}>
                          {m.trend > 0 ? '+' : ''}{m.trend}%
                        </Typography>
                      </Box>
                    )}
                    <Sparkline data={m.sparkline} color={m.color} width={48} height={18} />
                  </Box>
                ) : m.trend != null ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {down
                      ? <TrendingDownIcon sx={{ fontSize: 12, color: trendColor }} />
                      : <TrendingUpIcon sx={{ fontSize: 12, color: trendColor }} />}
                    <Typography sx={{ ...fSmall, fontWeight: 600, color: trendColor, lineHeight: 1 }}>
                      {down ? '' : '+'}{m.trend}%
                    </Typography>
                  </Box>
                ) : null}
              </Box>
              {Icon && (
                <Box sx={{
                  bgcolor: t => t.palette.mode === 'dark' ? `${m.color}22` : `${m.color}1a`,
                  borderRadius: '50%', p: 0.75, display: 'flex', flexShrink: 0,
                }}>
                  <Icon sx={{ color: m.color, fontSize: 16 }} />
                </Box>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
