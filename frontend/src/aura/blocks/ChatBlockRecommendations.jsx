import { Box, Typography, Stack } from '@mui/material'
import PriorityHighIcon from '@mui/icons-material/PriorityHigh'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import RemoveIcon from '@mui/icons-material/Remove'

const fBody = { fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

const PRIORITY = {
  high:   { color: '#f44336', icon: PriorityHighIcon, label: 'HIGH' },
  medium: { color: '#ff9800', icon: ArrowUpwardIcon,  label: 'MED' },
  low:    { color: '#60a5fa', icon: RemoveIcon,        label: 'LOW' },
}

export default function ChatBlockRecommendations({ data }) {
  if (!data || data.length === 0) return null
  return (
    <Stack spacing={0.75}>
      {data.map((rec, i) => {
        const p = PRIORITY[rec.priority] || PRIORITY.medium
        const Icon = p.icon
        return (
          <Box
            key={i}
            sx={{
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: t => t.palette.mode === 'dark' ? `${p.color}40` : `${p.color}22`,
              bgcolor: t => t.palette.mode === 'dark' ? `${p.color}14` : `${p.color}06`,
              px: 1.25, py: 0.75,
              display: 'flex', gap: 1,
            }}
          >
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%',
              bgcolor: t => t.palette.mode === 'dark' ? `${p.color}30` : `${p.color}18`,
              color: p.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, mt: 0.1,
            }}>
              <Icon sx={{ fontSize: 13 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ ...fBody, fontWeight: 600, color: 'text.primary', lineHeight: 1.4 }}>
                {rec.text}
              </Typography>
              {rec.impact && (
                <Typography sx={{ ...fSmall, color: 'text.secondary', mt: 0.25, lineHeight: 1.3 }}>
                  Impact: {rec.impact}
                </Typography>
              )}
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}
