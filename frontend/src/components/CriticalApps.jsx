import { Card, CardContent, CardHeader, Typography, Box, Chip, Button, Divider, Stack } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'

export default function CriticalApps({ data }) {
  const navigate = useNavigate()
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

              {/* Metrics */}
              <Box sx={{ display: 'flex', gap: 4, mb: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Current Issues
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main" lineHeight={1.3}>
                    {app.current_issues}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Recurring (30d)
                  </Typography>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
                    {app.recurring_30d}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last Incident
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="warning.main" lineHeight={1.3}>
                    {app.last_incident}
                  </Typography>
                </Box>
              </Box>

              {/* Search button → Graph Explorer */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<SearchIcon sx={{ fontSize: '14px !important' }} />}
                onClick={() => navigate(`/graph?service=${app.id}`)}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  borderColor: 'rgba(255,255,255,0.2)',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.light' },
                }}
              >
                Search
              </Button>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
