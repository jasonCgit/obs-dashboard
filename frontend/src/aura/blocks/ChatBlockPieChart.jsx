import { Box, Typography, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fMetric = { fontSize: 'clamp(1rem, 1.4vw, 1.25rem)' }

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

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d._empty) return null
  return (
    <Box sx={{
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      borderRadius: 1, p: '4px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      <Typography sx={{ ...fSmall, fontWeight: 700, color: d.color }}>
        {d.label}: {d.value}
      </Typography>
    </Box>
  )
}

export default function ChatBlockPieChart({ data }) {
  if (!data?.slices) return null
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const total = data.slices.reduce((s, d) => s + d.value, 0)
  const isEmpty = total === 0 || data.slices.length === 0
  const emptyColor = isDark ? '#1e3a5f' : '#cbd5e1'
  const chartData = isEmpty
    ? [{ label: 'None', value: 1, color: emptyColor, _empty: true }]
    : data.slices

  return (
    <Box sx={{
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
      p: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'transparent',
      display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <Box>
        {data.trend != null && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
            <TrendBadge trend={data.trend} />
          </Box>
        )}
        <Box sx={{ width: 90, height: 90, flexShrink: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={28} outerRadius={40}
                dataKey="value"
                startAngle={90} endAngle={-270}
                paddingAngle={isEmpty ? 0 : 2}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ ...fMetric, fontWeight: 800, color: isEmpty ? '#64748b' : '#60a5fa', lineHeight: 1 }}>
              {total}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={0.4} sx={{ alignItems: 'flex-start' }}>
        {isEmpty ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: emptyColor, flexShrink: 0 }} />
            <Typography sx={{ ...fSmall, color: '#64748b' }}>No data (0)</Typography>
          </Box>
        ) : data.slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: s.color, flexShrink: 0 }} />
            <Typography sx={{ ...fSmall, color: 'text.secondary' }}>
              {s.label} ({s.value})
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  )
}
