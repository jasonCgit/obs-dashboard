import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RepeatIcon from '@mui/icons-material/Repeat'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

const CARDS = [
  {
    key: 'critical_issues',
    label: 'Critical Issues',
    Icon: ErrorIcon,
    color: '#f44336',
    bg: 'rgba(244,67,54,0.12)',
  },
  {
    key: 'warnings',
    label: 'Warning',
    Icon: WarningAmberIcon,
    color: '#ff9800',
    bg: 'rgba(255,152,0,0.12)',
  },
  {
    key: 'recurring_30d',
    label: 'Recurring (30d)',
    Icon: RepeatIcon,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
  },
  {
    key: 'incidents_today',
    label: 'Incidents Today',
    Icon: NotificationsActiveIcon,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
  },
]

/* Tiny SVG sparkline — 7 data points rendered as a polyline */
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

export default function SummaryCards({ data }) {
  if (!data) return null
  const trends = data.trends || {}

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {CARDS.map(({ key, label, Icon, color, bg }) => {
        const trend = trends[key]
        const pct = trend?.pct ?? null
        const isDown = pct !== null && pct < 0
        const isUp = pct !== null && pct > 0
        // For critical/warning/incidents, down is good (green). For recurring, up is bad (red).
        const pctColor = pct === 0
          ? 'text.disabled'
          : (key === 'recurring_30d'
              ? (isUp ? '#f44336' : '#4caf50')
              : (isDown ? '#4caf50' : '#f44336'))

        return (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card>
              <CardContent sx={{ p: { xs: '12px !important', sm: '14px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box>
                      <Typography fontWeight={700} sx={{ color, lineHeight: 1, mb: 0.3, fontSize: 'clamp(1.4rem, 2vw, 1.8rem)' }}>
                        {data[key]}
                      </Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 'clamp(0.7rem, 1vw, 0.8rem)' }}>
                        {label}
                      </Typography>
                    </Box>
                    {trend && (
                      <Box sx={{ position: 'relative' }}>
                        <Box sx={{
                          position: 'absolute', top: -8, right: -4,
                          display: 'flex', alignItems: 'center',
                        }}>
                          {isDown ? (
                            <TrendingDownIcon sx={{ fontSize: 10, color: pctColor }} />
                          ) : isUp ? (
                            <TrendingUpIcon sx={{ fontSize: 10, color: pctColor }} />
                          ) : null}
                          <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: pctColor, ml: 0.1 }}>
                            {pct > 0 ? '+' : ''}{pct}%
                          </Typography>
                        </Box>
                        <Sparkline data={trend.spark} color={color} width={56} height={22} />
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ bgcolor: bg, borderRadius: '50%', p: 1, display: 'flex' }}>
                    <Icon sx={{ color, fontSize: 'clamp(18px, 2vw, 22px)' }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}
