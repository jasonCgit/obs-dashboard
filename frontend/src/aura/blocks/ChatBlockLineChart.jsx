import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fBody = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }

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

function LabeledDot({ cx, cy, index, value, maxIdx, lastIdx, color, show }) {
  if (!show || cx == null || cy == null) return null
  const isMax = index === maxIdx
  const isLast = index === lastIdx
  if (!isMax && !isLast) return <circle cx={cx} cy={cy} r={2} fill={color} />
  return (
    <g>
      <circle cx={cx} cy={cy} r={isMax ? 4 : 3} fill={color} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill={color} fontSize={9} fontWeight={700}>
        {isMax ? `max ${value}` : value}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <Box sx={{
      bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
      borderRadius: 1, p: '6px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <Typography sx={{ ...fSmall, color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
      {payload
        .filter(p => !p.dataKey.startsWith('_trend_'))
        .map(p => (
          <Typography key={p.dataKey} sx={{ ...fSmall, fontWeight: 700, color: p.color }}>
            {p.name}: {p.value ?? '—'}
          </Typography>
        ))}
    </Box>
  )
}

function TrendBadge({ trend }) {
  if (trend == null) return null
  const down = trend <= 0
  const color = down ? '#4ade80' : '#f44336'
  const Icon = down ? TrendingDownIcon : TrendingUpIcon
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Icon sx={{ fontSize: 10, color }} />
      <Typography sx={{ ...fSmall, fontWeight: 600, color, lineHeight: 1 }}>
        {down ? '' : '+'}{trend}%
      </Typography>
    </Box>
  )
}

export default function ChatBlockLineChart({ data }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  if (!data?.series || !data?.points) return null
  const { series, points, stats } = data

  const { chartData, seriesMeta } = useMemo(() => {
    const meta = {}
    let enriched = points.map(p => ({ ...p }))

    series.forEach(s => {
      const allVals = points.map(p => p[s.key])
      const numericPairs = allVals.map((v, i) => v != null ? { v, i } : null).filter(Boolean)

      if (s.showLabeledDots && numericPairs.length > 0) {
        const maxVal = Math.max(...numericPairs.map(x => x.v))
        meta[s.key] = {
          maxIdx: numericPairs.find(x => x.v === maxVal)?.i ?? -1,
          lastIdx: numericPairs[numericPairs.length - 1].i,
        }
      }

      if (s.showTrendLine && numericPairs.length >= 2) {
        const [m, b] = linReg(numericPairs.map(x => x.v))
        enriched.forEach((p, i) => {
          const pairIdx = numericPairs.findIndex(x => x.i === i)
          p[`_trend_${s.key}`] = pairIdx >= 0 ? Math.round((m * pairIdx + b) * 10) / 10 : null
        })
      }
    })

    return { chartData: enriched, seriesMeta: meta }
  }, [points, series])

  return (
    <Box sx={{
      borderRadius: 1.5,
      border: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
      p: 1.5,
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.02)',
    }}>
      {stats?.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          {stats.map(st => (
            <Box key={st.label} sx={{
              flex: 1, py: 0.5, px: 0.75, borderRadius: 1,
              bgcolor: t => t.palette.mode === 'dark' ? `${st.color}0a` : `${st.color}12`,
              border: t => `1px solid ${st.color}${t.palette.mode === 'dark' ? '22' : '30'}`,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: st.color }} />
                  <Typography color="text.secondary" sx={fSmall}>{st.label}</Typography>
                </Box>
                <TrendBadge trend={st.trend} />
              </Box>
              <Typography fontWeight={700} sx={{ color: st.color, ...fBody, lineHeight: 1 }}>
                {st.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 14, right: 4, left: -28, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(128,128,128,0.1)' : 'rgba(0,0,0,0.08)'} />
          <XAxis
            dataKey="label"
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.15)', strokeWidth: 1 }} />

          {series.map(s => s.showTrendLine && (
            <Line
              key={`trend_${s.key}`}
              type="monotone"
              dataKey={`_trend_${s.key}`}
              stroke={`${s.color}66`}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          ))}

          {series.map(s => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '6 4' : undefined}
              dot={s.showLabeledDots && seriesMeta[s.key]
                ? <LabeledDot
                    maxIdx={seriesMeta[s.key].maxIdx}
                    lastIdx={seriesMeta[s.key].lastIdx}
                    color={s.color}
                    show={true}
                  />
                : { r: 2.5, fill: s.color, strokeWidth: 0 }
              }
              activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
