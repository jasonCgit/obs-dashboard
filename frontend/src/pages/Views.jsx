import { useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardActionArea,
  Grid, Chip, Tabs, Tab, Stack, IconButton, Tooltip, Divider,
} from '@mui/material'
import AccountTreeIcon     from '@mui/icons-material/AccountTree'
import MonitorHeartIcon    from '@mui/icons-material/MonitorHeart'
import MapIcon             from '@mui/icons-material/Map'
import BarChartIcon        from '@mui/icons-material/BarChart'
import TimelineIcon        from '@mui/icons-material/Timeline'
import DashboardIcon       from '@mui/icons-material/Dashboard'
import RouteIcon           from '@mui/icons-material/Route'
import StarIcon            from '@mui/icons-material/Star'
import StarBorderIcon      from '@mui/icons-material/StarBorder'
import ShieldIcon          from '@mui/icons-material/Shield'
import SpeedIcon           from '@mui/icons-material/Speed'
import StorageIcon         from '@mui/icons-material/Storage'
import SecurityIcon        from '@mui/icons-material/Security'
import CloudIcon           from '@mui/icons-material/Cloud'
import NotificationsIcon   from '@mui/icons-material/Notifications'
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome'
import { useNavigate }     from 'react-router-dom'

const ALL_VIEWS = [
  {
    id: 'advisor-connect-deps',
    title: 'Advisor Connect — Dependencies',
    description: 'Full dependency graph for the Advisor Connect platform. Profile service, coverage apps, and notification pipelines mapped with 10+ downstream services.',
    icon: AccountTreeIcon,
    path: '/graph',
    tag: 'Interactive',
    color: '#60a5fa',
    domain: 'CRM & Client Engagement',
    favorite: true,
  },
  {
    id: 'spectrum-deps',
    title: 'Spectrum Equities — Dependencies',
    description: 'SPIEQ API gateway through trade service, pricing engine, risk service, and settlement. 14 downstream services with cross-team visibility.',
    icon: AccountTreeIcon,
    path: '/graph',
    tag: 'Interactive',
    color: '#f87171',
    domain: 'Equities & Trading',
    favorite: true,
  },
  {
    id: 'connect-os-deps',
    title: 'Connect OS — Dependencies',
    description: 'Cloud gateway dependency tree spanning home apps (NA/APAC/EMEA), team manager, search, and 20+ downstream services across 8 teams.',
    icon: AccountTreeIcon,
    path: '/graph',
    tag: 'Interactive',
    color: '#34d399',
    domain: 'Platform Infrastructure',
    favorite: false,
  },
  {
    id: 'regional-health',
    title: 'Regional Health Status',
    description: 'Live health monitoring across US-East, US-West, EU-Central, and Asia-Pacific regions with real-time issue counts.',
    icon: MapIcon,
    path: '/',
    tag: 'Live',
    color: '#4ade80',
    domain: 'Infrastructure',
    favorite: false,
  },
  {
    id: 'incident-trends',
    title: 'Incident Trends (P1/P2)',
    description: '90-day incident frequency line chart with P1/P2 breakdown, spike detection, and trend analysis.',
    icon: BarChartIcon,
    path: '/',
    tag: 'Analytics',
    color: '#fbbf24',
    domain: 'Incidents & Analytics',
    favorite: true,
  },
  {
    id: 'slo-agent',
    title: 'SLO Agent',
    description: 'Autonomous SLO monitoring agent with error budget tracking, AI-powered breach prediction, and auto-remediation actions.',
    icon: TimelineIcon,
    path: '/slo-agent',
    tag: 'AI Agent',
    color: '#a78bfa',
    domain: 'SLO Management',
    favorite: true,
  },
  {
    id: 'incident-zero',
    title: 'Incident Zero',
    description: 'Proactive pre-incident management — burn rate alerts, error budget dashboards, and prevention timelines before issues become P1s.',
    icon: ShieldIcon,
    path: '/incident-zero',
    tag: 'Proactive',
    color: '#fb923c',
    domain: 'Risk & Prevention',
    favorite: false,
  },
  {
    id: 'dashboard',
    title: 'Unified Dashboard',
    description: 'Single pane of glass — critical apps, AI health analysis, active incidents, regional status, and recent activities.',
    icon: DashboardIcon,
    path: '/',
    tag: 'Default',
    color: '#94a3b8',
    domain: 'Platform Overview',
    favorite: false,
  },
  {
    id: 'customer-journey',
    title: 'Customer Journeys',
    description: 'End-to-end path health for Trade Execution, Client Login, and Document Delivery with step-by-step latency and error rates.',
    icon: RouteIcon,
    path: '/customer-journey',
    tag: 'Live',
    color: '#38bdf8',
    domain: 'Customer Experience',
    favorite: false,
  },
  {
    id: 'ai-health',
    title: 'AI Health Analysis',
    description: 'AI-powered critical alerts, trend analysis, and recommended actions — reducing mean time to detect and respond.',
    icon: AutoAwesomeIcon,
    path: '/',
    tag: 'AI',
    color: '#c084fc',
    domain: 'Intelligence',
    favorite: false,
  },
  {
    id: 'active-incidents',
    title: 'Active Incidents & Notifications',
    description: 'P1/P2 incident donuts, Convey notifications, and Spectrum banner alerts in a unified activity feed.',
    icon: NotificationsIcon,
    path: '/',
    tag: 'Live',
    color: '#f87171',
    domain: 'Incidents & Alerts',
    favorite: false,
  },
  {
    id: 'applications-registry',
    title: 'Applications Registry',
    description: 'Full inventory of 20+ registered applications with status, SLA, team ownership, and 30-day incident history.',
    icon: StorageIcon,
    path: '/applications',
    tag: 'Registry',
    color: '#60a5fa',
    domain: 'Governance',
    favorite: false,
  },
]

const PRODUCT_CATALOG = [
  {
    product: 'Advisor Connect',
    seal: '90176',
    domain: 'CRM & Client Engagement',
    color: '#60a5fa',
    services: 12,
    health: 'warning',
    views: ['Dependency Graph', 'Customer Journeys', 'SLO Agent'],
    description: 'Client-facing advisor tools including profile service, coverage apps, and notification pipelines.',
  },
  {
    product: 'Spectrum Portfolio Mgmt (Equities)',
    seal: '90215',
    domain: 'Equities & Trading',
    color: '#f87171',
    services: 14,
    health: 'critical',
    views: ['Dependency Graph', 'SLO Agent', 'Incident Zero'],
    description: 'SPIEQ API gateway, trade service, pricing engine, risk service, and settlement for equities portfolio management.',
  },
  {
    product: 'Connect OS',
    seal: '88180',
    domain: 'Platform Infrastructure',
    color: '#34d399',
    services: 20,
    health: 'healthy',
    views: ['Dependency Graph', 'Regional Health', 'Customer Journeys'],
    description: 'Connect cloud gateway, home applications (NA/APAC/EMEA), team manager, and search services.',
  },
  {
    product: 'GWM Collateral Management',
    seal: '90083',
    domain: 'Collateral & Margin',
    color: '#fbbf24',
    services: 6,
    health: 'critical',
    views: ['Dashboard', 'Incident Zero', 'SLO Agent'],
    description: 'Global collateral management workflows with database-dependent calculation services.',
  },
  {
    product: 'Client Case Management',
    seal: '88652',
    domain: 'Case & Workflow',
    color: '#a78bfa',
    services: 5,
    health: 'critical',
    views: ['Dashboard', 'Incident Trends', 'SLO Agent'],
    description: 'Case management, assignment workflows, and queue management for client service teams.',
  },
  {
    product: 'IPBOL Platform',
    seal: '83001',
    domain: 'Investment & Portfolio',
    color: '#fb923c',
    services: 7,
    health: 'warning',
    views: ['Dependency Graph', 'SLO Agent', 'Incident Zero'],
    description: 'IPBOL account services, document domain, investments, and contact sync across green/blue deployments.',
  },
]

function ViewCard({ view, navigate }) {
  const [fav, setFav] = useState(view.favorite)
  const Icon = view.icon
  return (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <Tooltip title={fav ? 'Remove from Favorites' : 'Add to Favorites'}>
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setFav(f => !f) }}
          sx={{
            position: 'absolute', top: 8, right: 8, zIndex: 1,
            color: fav ? '#fbbf24' : 'text.disabled',
            '&:hover': { color: '#fbbf24' },
          }}
        >
          {fav ? <StarIcon sx={{ fontSize: 16 }} /> : <StarBorderIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Tooltip>
      <CardActionArea onClick={() => navigate(view.path)} sx={{ height: '100%', p: 0.5 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
            <Box sx={{ bgcolor: `${view.color}18`, borderRadius: 2, p: 1.25 }}>
              <Icon sx={{ fontSize: 26, color: view.color }} />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography variant="body1" fontWeight={700} sx={{ fontSize: '0.88rem' }}>{view.title}</Typography>
            <Chip label={view.tag} size="small"
              sx={{ fontSize: '0.62rem', height: 18, bgcolor: `${view.color}22`, color: view.color }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block', mb: 0.75 }}>
            {view.domain}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.8rem' }}>
            {view.description}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function FavoritesTab({ navigate }) {
  const favs = ALL_VIEWS.filter(v => v.favorite)
  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Favorites</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          Your pinned views — click the star on any card to pin or unpin.
        </Typography>
      </Box>
      {favs.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <StarBorderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No favorites yet — star a view from View Central.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {favs.map(v => (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <ViewCard view={v} navigate={navigate} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

function ViewCentralTab({ navigate }) {
  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>View Central</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          All available dashboards, dependency graphs, and interactive visualisations.
        </Typography>
      </Box>
      <Grid container spacing={2.5}>
        {ALL_VIEWS.map(v => (
          <Grid item xs={12} sm={6} md={4} key={v.id}>
            <ViewCard view={v} navigate={navigate} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

function ProductCatalogTab() {
  const healthColor = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }
  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Product Catalog</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          Observability views organised by business product and domain.
        </Typography>
      </Box>
      <Grid container spacing={2.5}>
        {PRODUCT_CATALOG.map(p => (
          <Grid item xs={12} sm={6} key={p.product}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.25 }}>
                  <Box>
                    <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.25, fontSize: '0.92rem' }}>
                      {p.product}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                      SEAL {p.seal} · {p.domain}
                    </Typography>
                  </Box>
                  <Chip
                    label={p.health.toUpperCase()}
                    size="small"
                    sx={{ bgcolor: `${healthColor[p.health]}18`, color: healthColor[p.health],
                      fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary"
                  sx={{ lineHeight: 1.55, fontSize: '0.8rem', mb: 1.5 }}>
                  {p.description}
                </Typography>

                <Divider sx={{ mb: 1.25 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.75 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {p.services} services monitored
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {p.views.map(v => (
                      <Chip key={v} label={v} size="small" variant="outlined"
                        sx={{ fontSize: '0.62rem', height: 18, color: 'text.secondary' }} />
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default function Views() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '& .MuiTab-root': { textTransform: 'none', fontSize: '0.9rem', fontWeight: 500 },
          '& .Mui-selected': { fontWeight: 700 },
        }}
      >
        <Tab label="Favorites" />
        <Tab label="View Central" />
        <Tab label="Product Catalog" />
      </Tabs>

      {tab === 0 && <FavoritesTab navigate={navigate} />}
      {tab === 1 && <ViewCentralTab navigate={navigate} />}
      {tab === 2 && <ProductCatalogTab />}
    </Container>
  )
}
