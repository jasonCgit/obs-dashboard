import { Box, Typography } from '@mui/material'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      borderRadius: 1, p: '6px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    }}>
      <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      {payload.map(p => (
        <Typography key={p.dataKey} sx={{ ...fSmall, fontWeight: 700, color: p.color }}>
          {p.name}: {p.value ?? '—'}
        </Typography>
      ))}
    </Box>
  )
}

export default function ChatBlockLineChart({ data }) {
  if (!data?.series || !data?.points) return null
  const { series, points } = data

  return (
    <Box sx={{
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
      p: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'transparent',
    }}>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
          <XAxis
            dataKey="label"
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.15)', strokeWidth: 1 }} />
          {series.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
              activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
