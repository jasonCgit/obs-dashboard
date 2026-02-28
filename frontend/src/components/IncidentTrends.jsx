import { useState, useMemo } from 'react'
import { Card, CardContent, Typography, Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Label, ReferenceDot,
} from 'recharts'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

const fTitle = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const COLORS = { p1: '#f44336', p2: '#ffab00' }
const TREND_COLORS = { p1: '#8a5050', p2: '#8a7a50' }

/* Simple linear regression → [slope, intercept] */
function linReg(vals) {
  const n = vals.length
  if (n < 2) return [0, vals[0] || 0]
  let sx = 0, sy = 0, sxy = 0, sx2 = 0
  for (let i = 0; i < n; i++) {
    sx += i; sy += vals[i]; sxy += i * vals[i]; sx2 += i * i
  }
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx)
  const intercept = (sy - slope * sx) / n
  return [slope, intercept]
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      p: '6px 12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <Typography sx={{ color: 'text.secondary', ...fSmall, mb: 0.5 }}>{label}</Typography>
      {payload
        .filter(p => !p.dataKey.startsWith('trend_'))
        .map(p => (
          <Typography key={p.dataKey} sx={{ color: p.color, fontWeight: 700, ...fSmall }}>
            {p.dataKey.toUpperCase()}: {p.value}
          </Typography>
        ))}
    </Box>
  )
}

/* Custom dot that renders a label on max and last data points */
function LabeledDot({ cx, cy, index, value, dataKey, maxIdx, lastIdx, color, show }) {
  if (!show || cx == null || cy == null) return null
  const isMax = index === maxIdx
  const isLast = index === lastIdx
  if (!isMax && !isLast) return <circle cx={cx} cy={cy} r={2} fill={color} />
  return (
    <g>
      <circle cx={cx} cy={cy} r={isMax ? 4 : 3} fill={color} />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill={color}
        fontSize={9}
        fontWeight={700}
      >
        {isMax ? `max ${value}` : value}
      </text>
    </g>
  )
}

export default function IncidentTrends({ data }) {
  const [filter, setFilter] = useState('all') // 'all' | 'p1' | 'p2'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  if (!data) return null
  const raw = data.data || data
  const summary = data.summary || {}
  if (!raw || raw.length === 0) return null

  const showP1 = filter === 'all' || filter === 'p1'
  const showP2 = filter === 'all' || filter === 'p2'

  // Compute trend lines via linear regression
  const chartData = useMemo(() => {
    const p1Vals = raw.map(d => d.p1)
    const p2Vals = raw.map(d => d.p2)
    const [m1, b1] = linReg(p1Vals)
    const [m2, b2] = linReg(p2Vals)
    return raw.map((d, i) => ({
      ...d,
      trend_p1: Math.round((m1 * i + b1) * 10) / 10,
      trend_p2: Math.round((m2 * i + b2) * 10) / 10,
    }))
  }, [raw])

  // Stats
  const n = raw.length
  const totalP1 = raw.reduce((s, d) => s + d.p1, 0)
  const totalP2 = raw.reduce((s, d) => s + d.p2, 0)
  const maxP1   = Math.max(...raw.map(d => d.p1))
  const maxP2   = Math.max(...raw.map(d => d.p2))
  const avgP1   = (totalP1 / n).toFixed(1)
  const avgP2   = (totalP2 / n).toFixed(1)
  const resolvedPct = summary.resolution_rate || 94.2

  // Max / last indices for labeled dots
  const maxP1Idx  = raw.findIndex(d => d.p1 === maxP1)
  const maxP2Idx  = raw.findIndex(d => d.p2 === maxP2)
  const lastIdx   = n - 1

  // Trend % (last half vs first half)
  const mid = Math.floor(n / 2)
  const trendFor = (fn) => {
    const first = raw.slice(0, mid).reduce((s, d) => s + fn(d), 0)
    const last  = raw.slice(mid).reduce((s, d) => s + fn(d), 0)
    return first > 0 ? Math.round(((last - first) / first) * 100) : 0
  }
  const trendP1  = trendFor(d => d.p1)
  const trendP2  = trendFor(d => d.p2)

  // Deduplicate x-axis labels when needed
  const seenLabels = new Set()
  const tickFormatter = n > 20
    ? (val) => { if (seenLabels.has(val)) return ''; seenLabels.add(val); return val }
    : undefined

  const toggleFilter = (key) => {
    setFilter(prev => prev === key ? 'all' : key)
  }

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography fontWeight={700} sx={fTitle}>Incident Trends</Typography>
          <Typography color="text.secondary" sx={fSmall}>Weekly · 90 days</Typography>
        </Box>

        {/* Stats row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          {[
            { key: 'p1', label: 'P1', value: totalP1, max: maxP1, avg: avgP1, trend: trendP1, color: COLORS.p1 },
            { key: 'p2', label: 'P2', value: totalP2, max: maxP2, avg: avgP2, trend: trendP2, color: COLORS.p2 },
            { key: null, label: 'Resolved', value: `${resolvedPct}%`, color: '#4ade80' },
          ].map(({ key, label, value, max, avg, trend, color }) => {
            const down = trend <= 0
            const tc = down ? '#4ade80' : '#f44336'
            const isActive = key && filter === key
            const isDimmed = key && filter !== 'all' && filter !== key
            return (
              <Box
                key={label}
                onClick={key ? () => toggleFilter(key) : undefined}
                sx={{
                  flex: 1, py: 0.5, px: 0.75, borderRadius: 1,
                  bgcolor: (t) => t.palette.mode === 'dark' ? `${color}0a` : `${color}12`,
                  border: isActive ? `2px solid ${color}` : (t) => `1px solid ${color}${t.palette.mode === 'dark' ? '22' : '30'}`,
                  opacity: isDimmed ? 0.45 : 1,
                  cursor: key ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                  '&:hover': key ? { border: `2px solid ${color}66` } : {},
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
                    <Typography color="text.secondary" sx={fSmall}>{label}</Typography>
                  </Box>
                  {trend != null && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      {down
                        ? <TrendingDownIcon sx={{ fontSize: 10, color: tc }} />
                        : <TrendingUpIcon sx={{ fontSize: 10, color: tc }} />
                      }
                      <Typography sx={{ ...fSmall, fontWeight: 600, color: tc, lineHeight: 1 }}>
                        {down ? '' : '+'}{trend}%
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography fontWeight={700} sx={{ color, ...fBody, lineHeight: 1 }}>
                    {value}
                  </Typography>
                  {max !== undefined && (
                    <Typography color="text.secondary" sx={fSmall}>max {max}</Typography>
                  )}
                  {avg !== undefined && (
                    <Typography color="text.secondary" sx={fSmall}>avg {avg}</Typography>
                  )}
                </Box>
              </Box>
            )
          })}
        </Box>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 14, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? 'rgba(128,128,128,0.1)' : 'rgba(0,0,0,0.08)'}
              vertical
            />
            <XAxis
              dataKey="label"
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              {...(tickFormatter ? { tickFormatter, interval: 0 } : {})}
            />
            <YAxis
              tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.15)', strokeWidth: 1 }} />

            {/* Trend lines (dashed) */}
            {showP1 && (
              <Line
                type="monotone"
                dataKey="trend_p1"
                stroke={TREND_COLORS.p1}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}
            {showP2 && (
              <Line
                type="monotone"
                dataKey="trend_p2"
                stroke={TREND_COLORS.p2}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            )}

            {/* Data lines with labeled dots */}
            {showP2 && (
              <Line
                type="monotone"
                dataKey="p2"
                stroke={COLORS.p2}
                strokeWidth={1.5}
                dot={<LabeledDot maxIdx={maxP2Idx} lastIdx={lastIdx} color={COLORS.p2} show={showP2} />}
                activeDot={{ r: 4, fill: COLORS.p2, strokeWidth: 0 }}
              />
            )}
            {showP1 && (
              <Line
                type="monotone"
                dataKey="p1"
                stroke={COLORS.p1}
                strokeWidth={1.5}
                dot={<LabeledDot maxIdx={maxP1Idx} lastIdx={lastIdx} color={COLORS.p1} show={showP1} />}
                activeDot={{ r: 4, fill: COLORS.p1, strokeWidth: 0 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
