import { Box, Typography, Stack } from '@mui/material'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
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
  const total = data.slices.reduce((s, d) => s + d.value, 0)

  return (
    <Box sx={{
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
      p: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'transparent',
      display: 'flex', alignItems: 'center', gap: 2,
    }}>
      <Box sx={{ width: 120, height: 120, flexShrink: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.slices}
              cx="50%" cy="50%"
              innerRadius={32} outerRadius={50}
              dataKey="value"
              startAngle={90} endAngle={-270}
              paddingAngle={2}
            >
              {data.slices.map((entry, i) => (
                <Cell key={i} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: 'clamp(0.88rem, 1.1vw, 1rem)', fontWeight: 800, color: '#60a5fa', lineHeight: 1 }}>
            {total}
          </Typography>
        </Box>
      </Box>

      <Stack spacing={0.5}>
        {data.slices.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
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
