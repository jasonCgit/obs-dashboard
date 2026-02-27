import { Card, CardContent, Typography, Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

const fCaption = { fontSize: 'clamp(0.68rem, 0.9vw, 0.78rem)' }
const fSmall   = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fMetric  = { fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }

function TrendBadge({ trend }) {
  if (trend == null) return null
  const down = trend <= 0
  const color = down ? '#4ade80' : '#f44336'
  const Icon = down ? TrendingDownIcon : TrendingUpIcon
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Icon sx={{ fontSize: 11, color }} />
      <Typography sx={{ ...fSmall, fontWeight: 600, color, lineHeight: 1 }}>
        {down ? '' : '+'}{trend}%
      </Typography>
    </Box>
  )
}

function DonutChart({ total, breakdown, label, trend, numberColor }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const emptyColor = isDark ? '#1e3a5f' : '#cbd5e1'

  const isEmpty = total === 0 || breakdown.length === 0
  const data = isEmpty
    ? [{ label: 'No Incidents', count: 1, color: emptyColor }]
    : breakdown

  const tooltipContent = ({ active, payload }) => {
    if (!active || !payload?.length || isEmpty) return null
    const d = payload[0].payload
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: '4px 10px' }}>
        <Typography sx={{ ...fSmall, color: d.color, fontWeight: 700 }}>{d.label}: {d.count}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 0.5 }}>
        <Typography color="text.secondary"
          sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </Typography>
        <TrendBadge trend={trend} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Donut */}
        <Box sx={{ width: 90, height: 90, flexShrink: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={40}
                dataKey="count" startAngle={90} endAngle={-270} paddingAngle={isEmpty ? 0 : 2}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <RechartsTooltip content={tooltipContent} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center number */}
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ ...fMetric, fontWeight: 800, color: isEmpty ? '#64748b' : (numberColor || '#60a5fa'), lineHeight: 1 }}>
              {total}
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Stack spacing={0.4} sx={{ alignItems: 'flex-start' }}>
          {isEmpty ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: emptyColor, flexShrink: 0 }} />
              <Typography sx={{ ...fSmall, color: '#64748b' }}>No Incidents (0)</Typography>
            </Box>
          ) : breakdown.map((b, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: b.color, flexShrink: 0 }} />
              <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{b.label} ({b.count})</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography
        sx={{ fontWeight: 800, ...fCaption, letterSpacing: 1.2, color: 'text.primary', textTransform: 'uppercase' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={fSmall}>{subtitle}</Typography>
      )}
    </Box>
  )
}

export default function ActiveIncidentsPanel({ data }) {
  if (!data) return null

  const weekLabel = data.week_label || 'Last 7 Days'

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Active Incidents */}
        <SectionHeader title="Active Incidents" subtitle={weekLabel} />
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <DonutChart total={data.p1.total} breakdown={data.p1.breakdown} label="P1 Incidents" trend={data.p1.trend} numberColor={data.p1.total > 0 ? '#f44336' : '#4ade80'} />
          <DonutChart total={data.p2.total} breakdown={data.p2.breakdown} label="P2 Incidents" trend={data.p2.trend} numberColor={data.p2.total > 0 ? '#ffab00' : '#4ade80'} />
        </Box>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }} />

        {/* Notifications */}
        <SectionHeader title="Notifications" subtitle="Last 24 Hours" />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DonutChart total={data.convey.total}   breakdown={data.convey.breakdown}   label="Convey" />
          <DonutChart total={data.spectrum.total} breakdown={data.spectrum.breakdown} label="Spectrum Banners" />
        </Box>
      </CardContent>
    </Card>
  )
}
