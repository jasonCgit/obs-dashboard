import {
  Card, CardContent, CardHeader, Typography, Box, Chip, Divider, Stack,
} from '@mui/material'

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
      <CardHeader
        title={<Typography variant="h6">↗ Frequent incidents (30d)</Typography>}
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <Stack spacing={1.5} divider={<Divider />}>
          {data.map((item, i) => {
            const { bg, color } = statusStyle(item.status)
            return (
              <Box key={i}>
                {/* App name + status badge */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                      {item.app}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      SEAL {item.seal}
                    </Typography>
                  </Box>
                  <Chip
                    label={item.status.toUpperCase()}
                    size="small"
                    sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.6rem', height: 18 }}
                  />
                </Box>

                {/* Description */}
                <Typography variant="caption" color="text.secondary"
                  sx={{ fontSize: '0.72rem', display: 'block', mb: 0.5 }}>
                  {item.description}
                </Typography>

                {/* Occurrences + last seen */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" fontWeight={700}
                    sx={{ fontSize: '0.72rem', color: 'text.primary' }}>
                    {item.occurrences} occurrences
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
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
