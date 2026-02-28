import {
  Card, CardContent, Typography, Box, Chip, Stack,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

/* Responsive font helpers — consistent across all dashboard panels */
const fTitle    = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fBody     = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fCaption  = { fontSize: 'clamp(0.68rem, 0.9vw, 0.78rem)' }
const fSmall    = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fMetric   = { fontSize: 'clamp(0.88rem, 1.1vw, 1rem)' }

export default function CriticalApps({ data }) {
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ mb: 1.5 }}>
          <Typography fontWeight={700} sx={fTitle}>
            Critical Applications ({data.length})
          </Typography>
          <Typography color="text.secondary" sx={fCaption}>
            Applications requiring immediate attention
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          {data.map((app) => {
            const statusColor = app.status === 'critical' ? '#f44336' : '#ff9800'
            return (
              <Box key={app.id} sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: (t) => `${statusColor}${t.palette.mode === 'dark' ? '30' : '40'}`,
                borderLeft: `3px solid ${statusColor}`,
                bgcolor: (t) => `${statusColor}${t.palette.mode === 'dark' ? '06' : '0d'}`,
                p: 1.5,
              }}>
                {/* Title + status badge */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={700} sx={{ ...fBody, lineHeight: 1.3 }}>
                        {app.name}
                      </Typography>
                      <Chip
                        label={app.status.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: `${statusColor}18`, color: statusColor,
                          fontWeight: 700, ...fSmall, height: 18,
                        }}
                      />
                    </Box>
                    <Typography color="text.secondary" sx={{ ...fSmall, mt: 0.25 }}>
                      {app.seal}
                    </Typography>
                  </Box>
                </Box>

                {/* Metrics row */}
                <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                  {[
                    { icon: <WarningAmberIcon sx={{ fontSize: 11, color: 'text.secondary' }} />, label: 'Issues', value: app.current_issues, color: 'error.main' },
                    { icon: <Box component="span" sx={{ ...fSmall, color: 'text.secondary', lineHeight: 1 }}>↗</Box>, label: 'Recurring', value: app.recurring_30d, color: 'text.primary' },
                    { icon: <Box component="span" sx={{ ...fSmall, color: 'text.secondary', lineHeight: 1 }}>⏱</Box>, label: 'Last', value: app.last_incident, color: 'warning.main' },
                  ].map(m => (
                    <Box key={m.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {m.icon}
                      <Typography color="text.secondary" sx={fSmall}>{m.label}</Typography>
                      <Typography fontWeight={700} sx={{ ...fBody, color: m.color }}>{m.value}</Typography>
                    </Box>
                  ))}
                </Box>

                {/* Recent issues */}
                {app.recent_issues?.length > 0 && (
                  <Stack spacing={0.5}>
                    {app.recent_issues.map((issue, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {issue.severity === 'critical'
                          ? <ErrorOutlineIcon   sx={{ fontSize: 13, color: 'error.main',   flexShrink: 0 }} />
                          : <WarningAmberIcon   sx={{ fontSize: 13, color: 'warning.main', flexShrink: 0 }} />
                        }
                        <Typography sx={{ ...fBody, lineHeight: 1.35, color: 'text.primary' }}>
                          {issue.description}
                        </Typography>
                        <Typography color="text.secondary" sx={{ ...fSmall, flexShrink: 0, ml: 0.5 }}>
                          {issue.time_ago}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
