import { Card, CardContent, CardHeader, Typography, Box, Chip, Stack, Divider } from '@mui/material'

const STATUS_STYLES = {
  REASSIGNED: { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa'  },
  UNRESOLVED: { bg: 'rgba(251,191,36,0.15)',  color: '#fbbf24'  },
  RESOLVED:   { bg: 'rgba(74,222,128,0.15)',  color: '#4ade80'  },
  INFO:       { bg: 'rgba(96,165,250,0.15)',  color: '#60a5fa'  },
  HIGH:       { bg: 'rgba(244,67,54,0.15)',   color: '#f44336'  },
  CRITICAL:   { bg: 'rgba(244,67,54,0.15)',   color: '#f44336'  },
  WARNING:    { bg: 'rgba(255,152,0,0.15)',   color: '#ff9800'  },
}

function statusStyle(status) {
  return STATUS_STYLES[status?.toUpperCase()] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
}

export default function RecentActivities({ data }) {
  if (!data || data.length === 0) return null

  return (
    <Card sx={{ mt: 2 }}>
      <CardHeader
        title={<Typography variant="h6">Recent Activities</Typography>}
        sx={{ pb: 0.5 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={0} divider={<Divider />}>
          {data.map((section, si) => (
            <Box key={si} sx={{ py: 1.25 }}>
              {/* Section header */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: section.items.length ? 1 : 0 }}>
                <Typography variant="caption"
                  sx={{ fontWeight: 800, fontSize: '0.68rem', letterSpacing: 0.9, color: 'text.primary', textTransform: 'uppercase' }}>
                  {section.category}
                </Typography>
                <Typography variant="caption"
                  sx={{ fontSize: '0.65rem', color: 'primary.main', fontWeight: 600, cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' } }}>
                  View All
                </Typography>
              </Box>

              {/* Items */}
              <Stack spacing={0.75}>
                {section.items.map((item, ii) => {
                  const { bg, color } = statusStyle(item.status)
                  return (
                    <Box key={ii} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {/* Status badge */}
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          bgcolor: bg, color, fontWeight: 700,
                          fontSize: '0.62rem', height: 18, flexShrink: 0,
                          borderRadius: 0.5,
                        }}
                      />
                      {/* Description */}
                      <Typography variant="caption" color="text.secondary"
                        sx={{
                          fontSize: '0.7rem', lineHeight: 1.4, flexGrow: 1,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                        {item.description}
                      </Typography>
                      {/* Time + View */}
                      <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', whiteSpace: 'nowrap' }}>
                          ({item.time_ago})
                        </Typography>
                        <Typography variant="caption"
                          sx={{ display: 'block', fontSize: '0.62rem', color: 'primary.main', cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' } }}>
                          View
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
