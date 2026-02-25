import { Card, CardContent, CardHeader, Typography } from '@mui/material'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: 6,
      padding: '6px 12px',
    }}>
      <p style={{ color: '#94a3b8', fontSize: 11, margin: '0 0 2px' }}>Day {payload[0]?.payload?.day}</p>
      <p style={{ color: '#ff9800', fontWeight: 700, fontSize: 13, margin: 0 }}>
        {payload[0].value} incident{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  )
}

export default function IncidentTrends({ data }) {
  if (!data || data.length === 0) return null
  return (
    <Card>
      <CardHeader
        title={<Typography variant="h6">Incident trends (90 days)</Typography>}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barSize={4} barGap={1}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v % 15 === 0 ? `D${v}` : '')}
            />
            <YAxis
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="incidents" radius={[2, 2, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.incidents >= 6 ? '#ff9800'
                    : entry.incidents >= 3 ? '#ffd54f'
                    : '#334155'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
