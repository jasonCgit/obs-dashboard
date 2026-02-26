import { Card, CardContent, Typography, Box, Stack } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

function DonutChart({ total, breakdown, label }) {
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
        <Typography sx={{ fontSize: '0.72rem', color: d.color, fontWeight: 700 }}>{d.label}: {d.count}</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Typography variant="caption" color="text.secondary"
        sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 0.5 }}>
        {label}
      </Typography>

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
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: isEmpty ? '#64748b' : '#60a5fa', lineHeight: 1 }}>
              {total}
            </Typography>
          </Box>
        </Box>

        {/* Legend */}
        <Stack spacing={0.4} sx={{ alignItems: 'flex-start' }}>
          {isEmpty ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: emptyColor, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.65rem', color: '#64748b' }}>No Incidents (0)</Typography>
            </Box>
          ) : breakdown.map((b, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: b.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{b.label} ({b.count})</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function SectionHeader({ title, tag }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Typography variant="caption"
        sx={{ fontWeight: 800, fontSize: '0.72rem', letterSpacing: 1.2, color: 'text.primary', textTransform: 'uppercase' }}>
        {title}
      </Typography>
      {tag && (
        <Box sx={{
          bgcolor: (t) => t.palette.mode === 'dark' ? '#1a3a5c' : 'rgba(21,101,192,0.1)',
          border: (t) => `1px solid ${t.palette.mode === 'dark' ? '#2a5a8c' : 'rgba(21,101,192,0.3)'}`,
          borderRadius: 1, px: 0.75, py: 0.1,
        }}>
          <Typography sx={{ fontSize: '0.62rem', color: '#60a5fa', fontWeight: 700, letterSpacing: 0.5 }}>{tag}</Typography>
        </Box>
      )}
    </Box>
  )
}

export default function ActiveIncidentsPanel({ data }) {
  if (!data) return null

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Active Incidents */}
        <SectionHeader title="Active Incidents" tag="AWM" />
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <DonutChart total={data.p1.total} breakdown={data.p1.breakdown} label="P1 Incidents" />
          <DonutChart total={data.p2.total} breakdown={data.p2.breakdown} label="P2 Incidents" />
        </Box>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mb: 2 }} />

        {/* Notifications */}
        <SectionHeader title="Notifications" tag="AWM" />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <DonutChart total={data.convey.total}   breakdown={data.convey.breakdown}   label="Convey" />
          <DonutChart total={data.spectrum.total} breakdown={data.spectrum.breakdown} label="Spectrum Banners" />
        </Box>
      </CardContent>
    </Card>
  )
}
