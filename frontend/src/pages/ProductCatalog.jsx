import {
  Container, Typography, Box, Card, CardContent,
  Grid, Chip, Stack, Divider,
} from '@mui/material'

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

const healthColor = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

export default function ProductCatalog() {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Product Catalog</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          Observability views organised by business product and domain.
        </Typography>
      </Box>
      <Grid container spacing={2}>
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
    </Container>
  )
}
