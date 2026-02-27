import { Card, CardContent, Typography, Box, Chip, Stack, Divider } from '@mui/material'

const fTitle = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const STATUS_COLORS = {
  CRITICAL:   '#f44336',
  WARNING:    '#ff9800',
  UNRESOLVED: '#fbbf24',
  REASSIGNED: '#60a5fa',
  RESOLVED:   '#4ade80',
  SUCCESS:    '#4ade80',
  INFO:       '#60a5fa',
}

export default function RecentActivities({ data }) {
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography fontWeight={700} sx={{ ...fTitle, mb: 1 }}>Recent Activities</Typography>

        <Stack spacing={0} divider={<Divider />}>
          {data.map((section, si) => (
            <Box key={si} sx={{ py: 1 }}>
              {/* Category header with colored left accent */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: section.items?.length ? 0.75 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: section.color || '#94a3b8' }} />
                  <Typography sx={{ fontWeight: 800, ...fSmall, letterSpacing: 0.9, color: 'text.primary', textTransform: 'uppercase' }}>
                    {section.category}
                  </Typography>
                  {section.items?.length > 0 && (
                    <Typography sx={{ ...fSmall, color: 'text.secondary' }}>({section.items.length})</Typography>
                  )}
                </Box>
                <Typography sx={{ ...fSmall, color: 'primary.main', fontWeight: 600, cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' } }}>
                  View All
                </Typography>
              </Box>

              {/* Items */}
              {section.items?.length > 0 ? (
                <Stack spacing={0.5}>
                  {section.items.map((item, ii) => {
                    const statusColor = STATUS_COLORS[item.status] || '#94a3b8'
                    return (
                      <Box key={ii} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            bgcolor: `${statusColor}18`, color: statusColor,
                            fontWeight: 700, ...fSmall, height: 18, flexShrink: 0,
                            borderRadius: 0.5, mt: '1px',
                          }}
                        />
                        <Typography color="text.secondary" sx={{
                          ...fBody, lineHeight: 1.4, flex: 1,
                          overflow: 'hidden', display: '-webkit-box',
                          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        }}>
                          {item.description}
                        </Typography>
                        <Typography color="text.secondary" sx={{ ...fSmall, flexShrink: 0, whiteSpace: 'nowrap', mt: '2px' }}>
                          {item.time_ago}
                        </Typography>
                      </Box>
                    )
                  })}
                </Stack>
              ) : (
                <Typography color="text.secondary" sx={{ ...fSmall, fontStyle: 'italic', ml: 1.5 }}>No recent activity</Typography>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
