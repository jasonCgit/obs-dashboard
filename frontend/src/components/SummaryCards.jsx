import { Grid, Card, CardContent, Typography, Box } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import RepeatIcon from '@mui/icons-material/Repeat'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'

const CARDS = [
  {
    key: 'critical_issues',
    label: 'Critical Issues',
    Icon: ErrorIcon,
    color: '#f44336',
    bg: 'rgba(244,67,54,0.12)',
  },
  {
    key: 'warnings',
    label: 'Warning',
    Icon: WarningAmberIcon,
    color: '#ff9800',
    bg: 'rgba(255,152,0,0.12)',
  },
  {
    key: 'recurring_30d',
    label: 'Recurring (30d)',
    Icon: RepeatIcon,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
  },
  {
    key: 'incidents_today',
    label: 'Incidents Today',
    Icon: NotificationsActiveIcon,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
  },
]

export default function SummaryCards({ data }) {
  if (!data) return null
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {CARDS.map(({ key, label, Icon, color, bg }) => (
        <Grid item xs={12} sm={6} md={3} key={key}>
          <Card>
            <CardContent sx={{ p: '20px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3" fontWeight={700} sx={{ color, lineHeight: 1, mb: 0.5 }}>
                    {data[key]}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: bg, borderRadius: '50%', p: 1.5, display: 'flex' }}>
                  <Icon sx={{ color, fontSize: 28 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
