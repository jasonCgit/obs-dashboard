import { Card, CardContent, Typography, Box, Stack } from '@mui/material'
import PublicIcon from '@mui/icons-material/Public'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

const fTitle   = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fBody    = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall   = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const STATUS_CFG = {
  healthy:  { Icon: CheckCircleIcon, color: '#4caf50', label: 'Healthy' },
  critical: { Icon: ErrorIcon,       color: '#f44336', label: 'Critical' },
  warning:  { Icon: WarningAmberIcon,color: '#ff9800', label: 'Warning' },
  no_data:  { Icon: CheckCircleIcon, color: '#78909c', label: 'No Health Data' },
}

export default function RegionalStatus({ data }) {
  if (!data) return null
  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <PublicIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography fontWeight={700} sx={fTitle}>Regional Health Status</Typography>
        </Box>
        <Stack spacing={1}>
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
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: (t) => t.palette.mode === 'dark' ? `${color}12` : `${color}18`,
                  border: (t) => `1px solid ${color}${t.palette.mode === 'dark' ? '35' : '40'}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon sx={{ color, fontSize: 16 }} />
                  <Typography fontWeight={600} sx={fBody}>
                    {r.region}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {r.sod_impacts > 0 && (
                    <Typography color="text.secondary" fontWeight={600} sx={fSmall}>
                      {r.sod_impacts} SOD
                    </Typography>
                  )}
                  {r.app_issues > 0 && (
                    <Typography color="text.secondary" fontWeight={600} sx={fSmall}>
                      {r.app_issues} Apps
                    </Typography>
                  )}
                  <Typography sx={{ color, fontWeight: 700, ...fSmall }}>
                    {label}
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
