import {
  Card, CardContent, Typography, Box, Chip, Divider, Stack,
} from '@mui/material'

const fTitle   = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fBody    = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fCaption = { fontSize: 'clamp(0.68rem, 0.9vw, 0.78rem)' }
const fSmall   = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

function statusStyle(status) {
  switch (status) {
    case 'critical': return { bg: 'rgba(244,67,54,0.15)',  color: '#f44336' }
    case 'error':    return { bg: 'rgba(244,67,54,0.12)',  color: '#ef5350' }
    case 'warning':  return { bg: 'rgba(255,152,0,0.15)',  color: '#ff9800' }
    default:         return { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
  }
}

export default function FrequentIncidents({ data }) {
  if (!data || data.length === 0) return null

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography fontWeight={700} sx={{ ...fTitle, mb: 1 }}>↗ Frequent Incidents (30d)</Typography>
        <Stack spacing={1} divider={<Divider />}>
          {data.map((item, i) => {
            const { bg, color } = statusStyle(item.status)
            return (
              <Box key={i}>
                {/* App name + status badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.25 }}>
                  <Box>
                    <Typography fontWeight={600} sx={{ lineHeight: 1.3, ...fBody }}>
                      {item.app}
                    </Typography>
                    <Typography color="text.secondary" sx={fSmall}>
                      SEAL {item.seal}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.status.toUpperCase()}
                    size="small"
                    sx={{ bgcolor: bg, color, fontWeight: 700, ...fSmall, height: 18 }}
                  />
                </Box>

                {/* Description */}
                <Typography color="text.secondary"
                  sx={{ ...fCaption, display: 'block', mb: 0.25, lineHeight: 1.4 }}>
                  {item.description}
                </Typography>

                {/* Occurrences + last seen */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography fontWeight={700} sx={{ ...fCaption, color: 'text.primary' }}>
                    {item.occurrences} occurrences
                  </Typography>
                  <Typography color="text.secondary" sx={fSmall}>
                    {item.last_seen}
                  </Typography>
                </Box>
              </Box>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
