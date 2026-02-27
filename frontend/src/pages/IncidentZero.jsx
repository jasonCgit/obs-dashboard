import {
  Container, Typography, Box, Card, CardContent, CardHeader,
  Chip, Grid, Divider, Stack, LinearProgress, Button,
} from '@mui/material'
import ShieldIcon        from '@mui/icons-material/Shield'
import SpeedIcon         from '@mui/icons-material/Speed'
import TrendingDownIcon  from '@mui/icons-material/TrendingDown'
import WarningAmberIcon  from '@mui/icons-material/WarningAmber'
import ErrorOutlineIcon  from '@mui/icons-material/ErrorOutline'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import TimerIcon         from '@mui/icons-material/Timer'

const ERROR_BUDGET_SERVICES = [
  { label: 'PAYMENT-GATEWAY-API',      budget: 12, burnRate: '4.2x', breachEta: '6h',  status: 'critical', sla: '99.99%', incidents30d: 8 },
  { label: 'POSTGRES-DB-PRIMARY',       budget: 8,  burnRate: '5.8x', breachEta: '3h',  status: 'critical', sla: '99.99%', incidents30d: 9 },
  { label: 'EMAIL-NOTIFICATION-SVC',    budget: 2,  burnRate: '8.1x', breachEta: '45m', status: 'critical', sla: '99.5%',  incidents30d: 5 },
  { label: 'SPIEQ-RISK-SERVICE',        budget: 22, burnRate: '2.1x', breachEta: '18h', status: 'warning',  sla: '99.99%', incidents30d: 5 },
  { label: 'SPIEQ-API-GATEWAY',         budget: 38, burnRate: '1.6x', breachEta: '2d',  status: 'warning',  sla: '99.99%', incidents30d: 4 },
  { label: 'MERIDIAN-SERVICE-QUERY-V1', budget: 24, burnRate: '1.9x', breachEta: '22h', status: 'warning',  sla: '99.5%',  incidents30d: 7 },
  { label: 'IPBOL-DOC-DOMAIN',          budget: 44, burnRate: '1.1x', breachEta: '5d',  status: 'moderate', sla: '99.0%',  incidents30d: 4 },
  { label: 'DATA-PIPELINE-SERVICE',     budget: 55, burnRate: '0.8x', breachEta: '—',   status: 'safe',     sla: '99.0%',  incidents30d: 3 },
]

const BURN_RATE_ALERTS = [
  { service: 'EMAIL-NOTIFICATION-SVC', rate: '8.1x', window: '1h', eta: '45 minutes to SLO breach',
    detail: 'SMTP connection failures recurring every 6 hours. Current error rate 0.99% against 0.5% budget. Third consecutive day of elevated failures.',
    action: 'Failover to secondary SMTP provider (SendGrid) and increase connection timeout to 30s.' },
  { service: 'POSTGRES-DB-PRIMARY', rate: '5.8x', window: '1h', eta: '3 hours to SLO breach',
    detail: 'Connection pool exhaustion causing intermittent query timeouts. 9 incidents in 30 days with 4 P1 escalations.',
    action: 'Scale connection pool from 50 → 100 and enable read-replica routing for analytical queries.' },
  { service: 'PAYMENT-GATEWAY-API', rate: '4.2x', window: '1h', eta: '6 hours to SLO breach',
    detail: 'Database connection timeouts cascading from DB-PRIMARY. 12% error budget remaining with accelerating consumption.',
    action: 'Enable circuit breaker on DB calls and activate fallback cache for idempotent payment lookups.' },
]

const TIMELINE = [
  { time: '12:34 PM', event: 'Burn rate alert: EMAIL-NOTIFICATION-SVC reached 8.1x (threshold: 3x)',  severity: 'critical' },
  { time: '12:28 PM', event: 'Error budget dropped below 15% on PAYMENT-GATEWAY-API',                  severity: 'warning'  },
  { time: '12:15 PM', event: 'Proactive scale-up applied to REDIS-CACHE-CLUSTER (3 → 5 replicas)',    severity: 'resolved' },
  { time: '11:52 AM', event: 'Predicted SLO breach for EMAIL-NOTIFICATION-SVC within 4 hours',         severity: 'warning'  },
  { time: '11:30 AM', event: 'Hourly error budget scan completed — 3 services in critical zone',       severity: 'info'     },
  { time: '10:45 AM', event: 'Circuit breaker activated on SPIEQ-TRADE-SERVICE (error rate > 2%)',     severity: 'warning'  },
  { time: '10:02 AM', event: 'POSTGRES-DB-PRIMARY error budget fell below 10% — escalation triggered', severity: 'critical' },
]

const statusColor = { critical: '#f44336', warning: '#ff9800', moderate: '#fbbf24', safe: '#4caf50' }
const budgetColor = (b) => b <= 15 ? '#f44336' : b <= 30 ? '#ff9800' : b <= 50 ? '#fbbf24' : '#4caf50'
const sevColor = { critical: '#f44336', warning: '#ff9800', resolved: '#4caf50', info: '#60a5fa' }

export default function IncidentZero() {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      {/* Hero banner */}
      <Card sx={{ mb: 2,
        background: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(244,67,54,0.06))',
        border: '1px solid rgba(251,146,60,0.25)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
          <Box sx={{ bgcolor: 'rgba(251,146,60,0.18)', borderRadius: 2, p: 1.25 }}>
            <ShieldIcon sx={{ fontSize: 28, color: '#fb923c' }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700}>Incident Zero</Typography>
            <Typography variant="body2" color="text.secondary">
              Proactive pre-incident management — preventing P1s by monitoring error budget burn rates and SLO thresholds before they cause incidents.
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {[
              { label: 'Critical Zone', value: ERROR_BUDGET_SERVICES.filter(s => s.status === 'critical').length, color: '#f44336' },
              { label: 'Watch Zone',    value: ERROR_BUDGET_SERVICES.filter(s => s.status === 'warning').length,  color: '#ff9800' },
              { label: 'Active Alerts', value: BURN_RATE_ALERTS.length,                                          color: '#fb923c' },
            ].map(m => (
              <Box key={m.label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: m.color }}>{m.value}</Typography>
                <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.2 }}>{m.label}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Left — Error budget grid + burn rate alerts */}
        <Grid item xs={12} lg={8}>
          {/* Error budget status */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <SpeedIcon sx={{ fontSize: 18, color: '#fb923c' }} />
                  <Typography variant="h6">Error Budget Status</Typography>
                </Box>
              }
              subheader="Services ranked by remaining error budget — lower is higher risk"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1, overflowX: 'auto' }}>
              {/* Header */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2.5fr 0.7fr 1.5fr 0.7fr 0.7fr 0.7fr', minWidth: 700,
                gap: 1, px: 1, py: 0.75, mb: 0.5 }}>
                {['Service', 'SLA', 'Error Budget', 'Burn Rate', 'Breach ETA', 'Zone'].map(h => (
                  <Typography key={h} variant="caption" color="text.secondary"
                    sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>
              <Divider sx={{ mb: 0.5 }} />

              <Stack spacing={0} sx={{ minWidth: 700 }}>
                {ERROR_BUDGET_SERVICES.map(s => (
                  <Box key={s.label} sx={{
                    display: 'grid', gridTemplateColumns: '2.5fr 0.7fr 1.5fr 0.7fr 0.7fr 0.7fr',
                    gap: 1, px: 1, py: 0.85, alignItems: 'center',
                    '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    borderRadius: 1,
                  }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.68rem', color: 'text.secondary' }}>
                      {s.sla}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <LinearProgress variant="determinate" value={s.budget}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3,
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': { bgcolor: budgetColor(s.budget), borderRadius: 3 } }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700,
                        color: budgetColor(s.budget), minWidth: 28, textAlign: 'right' }}>
                        {s.budget}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.68rem',
                      color: parseFloat(s.burnRate) >= 3 ? '#f44336' : parseFloat(s.burnRate) >= 1.5 ? '#ff9800' : '#94a3b8',
                      fontWeight: 700 }}>
                      {s.burnRate}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <TimerIcon sx={{ fontSize: 11, color: s.breachEta === '—' ? '#64748b' : '#f87171' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 600,
                        color: s.breachEta === '—' ? '#64748b' : 'text.primary' }}>
                        {s.breachEta}
                      </Typography>
                    </Box>
                    <Chip
                      label={s.status.toUpperCase()}
                      size="small"
                      sx={{ bgcolor: `${statusColor[s.status]}18`, color: statusColor[s.status],
                        fontWeight: 700, fontSize: '0.6rem', height: 18, maxWidth: 72 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Burn rate alerts */}
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <TrendingDownIcon sx={{ fontSize: 18, color: '#f44336' }} />
                  <Typography variant="h6">Burn Rate Alerts</Typography>
                  <Chip label={`${BURN_RATE_ALERTS.length} active`} size="small"
                    sx={{ bgcolor: 'rgba(244,67,54,0.12)', color: '#f44336', fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
                </Box>
              }
              subheader="Services consuming error budget faster than sustainable — action needed before SLO breach"
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Stack spacing={2}>
                {BURN_RATE_ALERTS.map((a, i) => (
                  <Box key={i} sx={{
                    border: '1px solid rgba(244,67,54,0.2)', borderRadius: 2, p: 2,
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(244,67,54,0.04)' : 'rgba(244,67,54,0.02)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorOutlineIcon sx={{ fontSize: 16, color: '#f44336' }} />
                        <Typography variant="body2" fontWeight={700}>{a.service}</Typography>
                        <Chip label={`${a.rate} burn rate`} size="small"
                          sx={{ bgcolor: 'rgba(244,67,54,0.12)', color: '#f44336', fontWeight: 700, fontSize: '0.62rem', height: 18 }} />
                      </Box>
                      <Chip label={a.eta} size="small"
                        sx={{ bgcolor: 'rgba(251,146,60,0.12)', color: '#fb923c', fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, mb: 1.25, fontSize: '0.82rem' }}>
                      {a.detail}
                    </Typography>

                    <Box sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.04)',
                      border: '1px solid rgba(74,222,128,0.2)', borderRadius: 1.5, p: 1.25,
                      display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <CheckCircleIcon sx={{ fontSize: 14, color: '#4ade80', mt: 0.2 }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: '#4ade80', display: 'block', mb: 0.25 }}>
                          RECOMMENDED ACTION
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
                          {a.action}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — timeline */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <WarningAmberIcon sx={{ fontSize: 16, color: '#fb923c' }} />
                  <Typography variant="h6">Prevention Timeline</Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Stack spacing={1.25}>
                {TIMELINE.map((t, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                    <Box sx={{ width: 4, borderRadius: 2, bgcolor: sevColor[t.severity], flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', display: 'block' }}>
                        {t.time}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem', lineHeight: 1.5, display: 'block' }}>
                        {t.event}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Prevention scorecard */}
          <Card sx={{ mt: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem', display: 'block', mb: 1.5 }}>
                Prevention Scorecard (30d)
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: 'P1s Prevented', value: '7',  color: '#4ade80' },
                  { label: 'Avg Lead Time',  value: '4h', color: '#60a5fa' },
                  { label: 'Auto-Mitigated', value: '12', color: '#a78bfa' },
                  { label: 'Budget Saved',   value: '34%',color: '#fbbf24' },
                ].map(m => (
                  <Grid item xs={6} key={m.label}>
                    <Box sx={{ textAlign: 'center', p: 1, borderRadius: 1.5,
                      border: '1px solid', borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: m.color }}>{m.value}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.3 }}>{m.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
