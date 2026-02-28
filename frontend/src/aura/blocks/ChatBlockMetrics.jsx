import { Box, Typography } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const fMetric = { fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)' }

export default function ChatBlockMetrics({ data }) {
  if (!data || data.length === 0) return null
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
      {data.map((m, i) => {
        const down = m.trend != null && m.trend <= 0
        const trendColor = down ? '#4ade80' : '#f44336'
        return (
          <Box
            key={i}
            sx={{
              py: 1, px: 1.25, borderRadius: 1.5,
              bgcolor: t => t.palette.mode === 'dark' ? `${m.color}18` : `${m.color}0a`,
              border: '1px solid',
              borderColor: t => t.palette.mode === 'dark' ? `${m.color}40` : `${m.color}22`,
            }}
          >
            <Typography color="text.secondary" sx={{ ...fSmall, mb: 0.25 }}>
              {m.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography fontWeight={700} sx={{ ...fMetric, color: m.color, lineHeight: 1 }}>
                {m.value}
              </Typography>
              {m.trend != null && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  {down
                    ? <TrendingDownIcon sx={{ fontSize: 12, color: trendColor }} />
                    : <TrendingUpIcon sx={{ fontSize: 12, color: trendColor }} />}
                  <Typography sx={{ ...fSmall, fontWeight: 600, color: trendColor, lineHeight: 1 }}>
                    {down ? '' : '+'}{m.trend}%
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
