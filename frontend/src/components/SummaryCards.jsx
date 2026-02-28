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
    label: 'Applications in Critical Status',
    Icon: ErrorIcon,
    color: '#ef5350',
    accent: 'rgba(239,83,80,0.08)',
    border: 'rgba(239,83,80,0.25)',
  },
  {
    key: 'warnings',
    label: 'Applications in Warning Status',
    Icon: WarningAmberIcon,
    color: '#ffa726',
    accent: 'rgba(255,167,38,0.08)',
    border: 'rgba(255,167,38,0.25)',
  },
  {
    key: 'recurring_30d',
    label: 'Recurring Application Issues (30d)',
    Icon: RepeatIcon,
    color: '#78909c',
    accent: 'rgba(120,144,156,0.06)',
    border: 'rgba(120,144,156,0.18)',
  },
  {
    key: 'incidents_today',
    label: 'Incidents Today',
    Icon: NotificationsActiveIcon,
    color: '#78909c',
    accent: 'rgba(120,144,156,0.06)',
    border: 'rgba(120,144,156,0.18)',
  },
]

/* Smooth SVG sparkline with area fill */
function Sparkline({ data, color, width = 60, height = 24 }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padX = 2
  const padY = 3

  const coords = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * (width - padX * 2),
    y: padY + (1 - (v - min) / range) * (height - padY * 2),
  }))

  // Build smooth curve using cardinal spline approximation
  const linePoints = coords.map(c => `${c.x},${c.y}`).join(' ')

  // Area fill path
  const areaPath = `M${coords[0].x},${height} L${coords.map(c => `${c.x},${c.y}`).join(' L')} L${coords[coords.length - 1].x},${height} Z`

  const gradId = `spark-grad-${color.replace('#', '')}`

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      {/* Dot on last data point */}
      <circle
        cx={coords[coords.length - 1].x}
        cy={coords[coords.length - 1].y}
        r={2.2}
        fill={color}
        opacity={0.9}
      />
    </svg>
  )
}

export default function SummaryCards({ data }) {
  if (!data) return null
  const trends = data.trends || {}

  return (
    <Grid container spacing={1.5} sx={{ mb: 2 }}>
      {CARDS.map(({ key, label, Icon, color, accent, border }) => {
        const trend = trends[key]
        const pct = trend?.pct ?? null
        const isDown = pct !== null && pct < 0
        const isUp = pct !== null && pct > 0
        // For critical/warning/incidents, down is good (green). For recurring, up is bad (red).
        const pctColor = pct === 0
          ? 'text.disabled'
          : (key === 'recurring_30d'
              ? (isUp ? '#ef5350' : '#66bb6a')
              : (isDown ? '#66bb6a' : '#ef5350'))

        return (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card
              variant="outlined"
              sx={{
                borderColor: (t) => t.palette.mode === 'dark' ? border : 'divider',
                bgcolor: (t) => t.palette.mode === 'dark' ? accent : 'background.paper',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': {
                  borderColor: border,
                  boxShadow: (t) => t.palette.mode === 'dark'
                    ? `0 2px 12px ${accent}`
                    : '0 2px 8px rgba(0,0,0,0.06)',
                },
              }}
            >
              <CardContent sx={{ p: '14px 16px !important', '&:last-child': { pb: '14px !important' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* Left: number + trend % + label */}
                  <Box sx={{ minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                      <Typography
                        fontWeight={700}
                        sx={{
                          color,
                          lineHeight: 1,
                          fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {data[key]}
                      </Typography>
                      {trend && pct !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          {isDown ? (
                            <TrendingDownIcon sx={{ fontSize: 14, color: pctColor }} />
                          ) : isUp ? (
                            <TrendingUpIcon sx={{ fontSize: 14, color: pctColor }} />
                          ) : null}
                          <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: pctColor }}>
                            {pct > 0 ? '+' : ''}{pct}%
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Typography
                      color="text.secondary"
                      sx={{
                        fontSize: 'clamp(0.65rem, 0.9vw, 0.75rem)',
                        mt: 0.5,
                        lineHeight: 1.2,
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>
                  {/* Center: sparkline */}
                  {trend && (
                    <Box sx={{ mx: 1, flexShrink: 0 }}>
                      <Sparkline data={trend.spark} color={color} width={68} height={28} />
                    </Box>
                  )}
                  {/* Right: icon */}
                  <Box sx={{
                    bgcolor: accent,
                    border: '1px solid',
                    borderColor: border,
                    borderRadius: '10px',
                    p: 0.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon sx={{ color, fontSize: 18 }} />
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
