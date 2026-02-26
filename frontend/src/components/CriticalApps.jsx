import {
  Card, CardContent, CardHeader, Typography, Box, Chip,
  Divider, Stack,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

export default function CriticalApps({ data }) {
  if (!data || data.length === 0) return null

  return (
    <Card>
      <CardHeader
        title={
          <Box>
            <Typography variant="h6">
              Critical applications ({data.length})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Applications requiring immediate attention
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={2} divider={<Divider />}>
          {data.map((app) => (
            <Box key={app.id}>
              {/* Title + status badge */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ width: 14, height: 14, bgcolor: '#f44336', borderRadius: 0.5, mt: 0.3, flexShrink: 0 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                      {app.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {app.seal}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={app.status.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: app.status === 'critical' ? 'rgba(244,67,54,0.15)' : 'rgba(255,152,0,0.15)',
                    color: app.status === 'critical' ? '#f44336' : '#ff9800',
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    height: 20,
                  }}
                />
              </Box>

              {/* Metrics row */}
              <Box sx={{ display: 'flex', gap: 4, mb: 1.5 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
                    <WarningAmberIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">Current Issues</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="error.main" lineHeight={1.3}>
                    {app.current_issues}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
                    <Box component="span" sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1 }}>↗</Box>
                    <Typography variant="caption" color="text.secondary">Recurring (30d)</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
                    {app.recurring_30d}
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mb: 0.2 }}>
                    <Box component="span" sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1 }}>🕐</Box>
                    <Typography variant="caption" color="text.secondary">Last Incident</Typography>
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="warning.main" lineHeight={1.3}>
                    {app.last_incident}
                  </Typography>
                </Box>
              </Box>

              {/* Recent issues */}
              {app.recent_issues?.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary"
                    sx={{ display: 'block', mb: 0.75, fontWeight: 500 }}>
                    Recent Issues:
                  </Typography>
                  <Stack spacing={0.75}>
                    {app.recent_issues.map((issue, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                        {issue.severity === 'critical'
                          ? <ErrorOutlineIcon   sx={{ fontSize: 14, color: 'error.main',   mt: 0.15, flexShrink: 0 }} />
                          : <WarningAmberIcon   sx={{ fontSize: 14, color: 'warning.main', mt: 0.15, flexShrink: 0 }} />
                        }
                        <Box>
                          <Typography variant="caption"
                            sx={{ fontSize: '0.73rem', display: 'block', lineHeight: 1.35, color: 'text.primary' }}>
                            {issue.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {issue.time_ago}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
