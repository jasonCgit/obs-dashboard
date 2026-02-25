import { Container, Typography, Box, Card, CardContent, CardActionArea, Grid, Chip } from '@mui/material'
import AccountTreeIcon  from '@mui/icons-material/AccountTree'
import RadarIcon        from '@mui/icons-material/Radar'
import MapIcon          from '@mui/icons-material/Map'
import BarChartIcon     from '@mui/icons-material/BarChart'
import TimelineIcon     from '@mui/icons-material/Timeline'
import DashboardIcon    from '@mui/icons-material/Dashboard'
import { useNavigate }  from 'react-router-dom'

const VIEWS = [
  {
    title: 'Knowledge Graph',
    description: 'Explore service dependencies and blast radius across the entire platform.',
    icon: AccountTreeIcon,
    path: '/graph',
    tag: 'Interactive',
    color: '#60a5fa',
  },
  {
    title: 'Blast Radius',
    description: 'Select any service to see which upstream systems would be impacted by a failure.',
    icon: RadarIcon,
    path: '/graph',
    tag: 'Interactive',
    color: '#f87171',
  },
  {
    title: 'Regional Map',
    description: 'Live health status across US-East, US-West, EU-Central and Asia-Pacific regions.',
    icon: MapIcon,
    path: '/',
    tag: 'Live',
    color: '#34d399',
  },
  {
    title: 'Incident Trends',
    description: '90-day incident frequency chart with spike detection and pattern analysis.',
    icon: BarChartIcon,
    path: '/',
    tag: 'Analytics',
    color: '#fbbf24',
  },
  {
    title: 'SLO Tracker',
    description: 'Monitor service-level objectives, drift, and automated correction recommendations.',
    icon: TimelineIcon,
    path: '/slo-corrector',
    tag: 'Beta',
    color: '#a78bfa',
  },
  {
    title: 'Dashboard Overview',
    description: 'Unified summary of critical issues, AI analysis, and key observability metrics.',
    icon: DashboardIcon,
    path: '/',
    tag: 'Default',
    color: '#94a3b8',
  },
]

export default function Views() {
  const navigate = useNavigate()

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Views</Typography>
        <Typography variant="body2" color="text.secondary">Available dashboards and interactive visualisations</Typography>
      </Box>

      <Grid container spacing={2.5}>
        {VIEWS.map(v => {
          const Icon = v.icon
          return (
            <Grid item xs={12} sm={6} md={4} key={v.title}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={() => navigate(v.path)} sx={{ height: '100%', p: 0.5 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ bgcolor: `${v.color}18`, borderRadius: 2, p: 1.25 }}>
                        <Icon sx={{ fontSize: 28, color: v.color }} />
                      </Box>
                      <Chip label={v.tag} size="small" sx={{ fontSize: '0.65rem', height: 20, bgcolor: `${v.color}22`, color: v.color }} />
                    </Box>
                    <Typography variant="body1" fontWeight={700} gutterBottom>{v.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{v.description}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  )
}
