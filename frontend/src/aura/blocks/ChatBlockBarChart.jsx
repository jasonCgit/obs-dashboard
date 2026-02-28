import { Box, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <Box sx={{
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      borderRadius: 1, p: '4px 10px', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      <Typography sx={{ ...fSmall, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ ...fSmall, fontWeight: 700, color: d.color || '#60a5fa' }}>
        {d.value}{d.payload?.unit || ''}
      </Typography>
    </Box>
  )
}

export default function ChatBlockBarChart({ data }) {
  if (!data?.bars) return null
  const { bars, xKey = 'name', yKey = 'value' } = data

  return (
    <Box sx={{
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
      p: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'transparent',
    }}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={bars} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey={xKey}
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.1)' }} />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]} maxBarSize={36}>
            {bars.map((entry, i) => (
              <Cell key={i} fill={entry.color || '#60a5fa'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
