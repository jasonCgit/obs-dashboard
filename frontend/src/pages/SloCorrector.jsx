import {
  Container, Typography, Box, Card, CardContent, CardHeader,
  Chip, Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Grid, Divider,
} from '@mui/material'
import TrendingUpIcon   from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import RemoveIcon       from '@mui/icons-material/Remove'

const SLOS = [
  { service: 'API-GATEWAY',                  target: 99.99, current: 99.98, window: '30d', budget_remaining: 88, trend: 'up',   correction: null },
  { service: 'AUTH-SERVICE-V2',              target: 99.99, current: 99.99, window: '30d', budget_remaining: 95, trend: 'flat', correction: null },
  { service: 'PAYMENT GATEWAY API',          target: 99.99, current: 97.21, window: '30d', budget_remaining: 0,  trend: 'down', correction: 'Scale DB connection pool to 150. Patch v2.4.2 targeting connection leak.' },
  { service: 'EMAIL-NOTIFICATION-SERVICE',   target: 99.50, current: 94.30, window: '30d', budget_remaining: 0,  trend: 'down', correction: 'Activate secondary SMTP failover. Update credential rotation policy.' },
  { service: 'MERIDIAN SERVICE-QUERY V1',    target: 99.50, current: 98.10, window: '30d', budget_remaining: 12, trend: 'down', correction: 'Add missing index on doc_domain.account_ref. Review cache TTL settings.' },
  { service: 'MERIDIAN SERVICE-ORDER V1',    target: 99.50, current: 99.10, window: '30d', budget_remaining: 34, trend: 'down', correction: 'Monitor payment gateway dependency. Pre-warm order queue on reconnect.' },
  { service: 'POSTGRES-DB-PRIMARY',          target: 99.99, current: 98.80, window: '30d', budget_remaining: 0,  trend: 'down', correction: 'Increase max_connections. Add read replica for reporting queries.' },
  { service: 'REDIS-CACHE-CLUSTER',          target: 99.90, current: 99.85, window: '30d', budget_remaining: 67, trend: 'flat', correction: null },
  { service: 'KAFKA-MESSAGE-QUEUE',          target: 99.90, current: 99.92, window: '30d', budget_remaining: 100,trend: 'up',   correction: null },
  { service: 'IPBOL-ACCOUNT-SERVICES',       target: 99.00, current: 98.60, window: '30d', budget_remaining: 22, trend: 'down', correction: 'Investigate auth token refresh latency spike during peak hours.' },
  { service: 'IPBOL-DOC-DOMAIN',             target: 99.00, current: 95.40, window: '30d', budget_remaining: 0,  trend: 'down', correction: 'Emergency: add compound index. Escalate to DBA team for query plan review.' },
  { service: 'DATA-PIPELINE-SERVICE',        target: 99.00, current: 98.80, window: '30d', budget_remaining: 45, trend: 'flat', correction: null },
]

const TrendIcon = ({ trend }) => {
  if (trend === 'up')   return <TrendingUpIcon   sx={{ fontSize: 16, color: '#4caf50' }} />
  if (trend === 'down') return <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />
  return <RemoveIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
}

function sloColor(current, target) {
  const headroom = current - (target - (100 - target) * 0.1)
  if (current < target - 1)  return '#f44336'
  if (current < target)      return '#ff9800'
  return '#4caf50'
}

export default function SloCorrector() {
  const breached   = SLOS.filter(s => s.current < s.target)
  const atRisk     = SLOS.filter(s => s.current >= s.target && s.budget_remaining < 30)
  const healthy    = SLOS.filter(s => s.current >= s.target && s.budget_remaining >= 30)

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h5" fontWeight={700}>SLO Corrector</Typography>
          <Chip label="Beta" size="small" sx={{ bgcolor: '#7c3aed', color: 'white', fontSize: '0.65rem', height: 18 }} />
        </Box>
        <Typography variant="body2" color="text.secondary">Service-level objective tracking with AI-generated correction actions</Typography>
      </Box>

      {/* Summary row */}
      <Grid container spacing={2} sx={{ my: 2 }}>
        {[
          { label: 'SLO Breached',   count: breached.length,  color: '#f44336' },
          { label: 'Error Budget Low', count: atRisk.length,  color: '#ff9800' },
          { label: 'On Track',       count: healthy.length,   color: '#4caf50' },
        ].map(s => (
          <Grid item xs={4} key={s.label}>
            <Card>
              <CardContent sx={{ py: '12px !important' }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.count}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Correction actions */}
      {SLOS.filter(s => s.correction).length > 0 && (
        <Card sx={{ mb: 3, border: '1px solid rgba(248,113,113,0.3)' }}>
          <CardHeader title={<Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem', color: '#f87171' }}>Recommended Corrections</Typography>} sx={{ pb: 0 }} />
          <CardContent sx={{ pt: 1 }}>
            {SLOS.filter(s => s.correction).map((s, i) => (
              <Box key={s.service}>
                {i > 0 && <Divider sx={{ my: 1.25 }} />}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Chip label={s.service.split(' ')[0]} size="small" sx={{ fontSize: '0.65rem', height: 20, flexShrink: 0 }} variant="outlined" />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{s.correction}</Typography>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SLO table */}
      <Card>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.8, borderColor: 'rgba(255,255,255,0.08)' } }}>
              <TableCell>Service</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Current (30d)</TableCell>
              <TableCell>Error Budget</TableCell>
              <TableCell>Trend</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SLOS.map(s => {
              const color = sloColor(s.current, s.target)
              return (
                <TableRow key={s.service} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)', fontSize: '0.82rem' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{s.service}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{s.target}%</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', color, fontWeight: 700 }}>{s.current}%</TableCell>
                  <TableCell sx={{ width: 160 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={s.budget_remaining}
                        sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.07)', '& .MuiLinearProgress-bar': { bgcolor: s.budget_remaining === 0 ? '#f44336' : s.budget_remaining < 30 ? '#ff9800' : '#4caf50', borderRadius: 3 } }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 30 }}>{s.budget_remaining}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><TrendIcon trend={s.trend} /></TableCell>
                  <TableCell>
                    <Chip
                      label={s.current >= s.target ? 'MET' : 'BREACHED'}
                      size="small"
                      sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </Container>
  )
}
