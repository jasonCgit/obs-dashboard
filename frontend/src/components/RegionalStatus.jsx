import { Card, CardContent, CardHeader, Typography, Box, Stack } from '@mui/material'
import PublicIcon from '@mui/icons-material/Public'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

const STATUS_CFG = {
  healthy:  { Icon: CheckCircleIcon, color: '#4caf50', label: 'Healthy' },
  critical: { Icon: ErrorIcon,       color: '#f44336', label: 'Critical' },
  warning:  { Icon: WarningAmberIcon,color: '#ff9800', label: 'Warning' },
}

export default function RegionalStatus({ data }) {
  if (!data) return null
  return (
    <Card sx={{ mb: 2 }}>
      <CardHeader
        avatar={<PublicIcon sx={{ color: 'text.secondary', fontSize: 20 }} />}
        title={<Typography variant="h6">Regional Health Status</Typography>}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5}>
          {data.map((r) => {
            const cfg = STATUS_CFG[r.status] || STATUS_CFG.healthy
            const { Icon, color, label } = cfg
            return (
              <Box
                key={r.region}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: `${color}12`,
                  border: `1px solid ${color}35`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ color, fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={600}>
                    {r.region}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color, fontWeight: 700, display: 'block' }}>
                    {label}
                  </Typography>
                  {r.issues > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {r.issues} issue{r.issues !== 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>
              </Box>
            )
          })}
        </Stack>
      </CardContent>
    </Card>
  )
}
