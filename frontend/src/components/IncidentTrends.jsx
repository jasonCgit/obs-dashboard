import { Card, CardContent, CardHeader, Typography, Box } from '@mui/material'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      p: '6px 12px',
    }}>
      <Typography sx={{ color: 'text.secondary', fontSize: 11, mb: 0.5 }}>Day {label}</Typography>
      {payload.map(p => (
        <Typography key={p.dataKey} sx={{ color: p.color, fontWeight: 700, fontSize: 13 }}>
          {p.dataKey.toUpperCase()}: {p.value}
        </Typography>
      ))}
    </Box>
  )
}

function CustomLegend() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 0.5, pr: 1 }}>
      {[{ label: 'P1', color: '#f44336' }, { label: 'P2', color: '#ff9800' }].map(({ label, color }) => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 20, height: 2, bgcolor: color, borderRadius: 1 }} />
          <Typography variant="caption" sx={{ color, fontSize: '0.7rem', fontWeight: 600 }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  )
}

export default function IncidentTrends({ data }) {
  if (!data || data.length === 0) return null
  return (
    <Card>
      <CardHeader
        title={<Typography variant="h6">⚡ Incident trends (90 days)</Typography>}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 0.5 }}>
        <CustomLegend />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(128,128,128,0.15)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v % 15 === 0 ? `D${v}` : '')}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.2)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="p1"
              stroke="#f44336"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#f44336' }}
            />
            <Line
              type="monotone"
              dataKey="p2"
              stroke="#ff9800"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: '#ff9800' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
