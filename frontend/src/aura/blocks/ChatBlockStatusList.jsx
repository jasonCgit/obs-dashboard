import { Box, Typography, Chip, Stack } from '@mui/material'

const fBody = { fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

const STATUS_COLORS = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

export default function ChatBlockStatusList({ data }) {
  if (!data || data.length === 0) return null
  return (
    <Stack spacing={0.75}>
      {data.map((item, i) => {
        const color = STATUS_COLORS[item.status] || '#60a5fa'
        return (
          <Box
            key={i}
            sx={{
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: t => t.palette.mode === 'dark' ? `${color}50` : `${color}30`,
              borderLeft: `3px solid ${color}`,
              bgcolor: t => t.palette.mode === 'dark' ? `${color}14` : `${color}06`,
              px: 1.25, py: 0.75,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
              <Typography fontWeight={600} sx={{ ...fBody, lineHeight: 1.3, flex: 1 }}>
                {item.name}
              </Typography>
              <Chip
                label={item.status.toUpperCase()}
                size="small"
                sx={{
                  bgcolor: t => t.palette.mode === 'dark' ? `${color}30` : `${color}18`,
                  color,
                  fontWeight: 700, ...fSmall, height: 18,
                }}
              />
            </Box>
            <Typography color="text.secondary" sx={{ ...fSmall, lineHeight: 1.4 }}>
              {item.detail}
            </Typography>
            {item.seal && (
              <Typography sx={{ ...fSmall, color: 'text.disabled', mt: 0.25 }}>
                {item.seal}
              </Typography>
            )}
          </Box>
        )
      })}
    </Stack>
  )
}
