import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, Divider,
  LinearProgress, ToggleButtonGroup, ToggleButton, Grid,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const STATUS_ICON = { healthy: CheckCircleIcon, critical: ErrorIcon, warning: WarningIcon }
const STATUS_COLOR = { healthy: '#4caf50', critical: '#f44336', warning: '#ff9800' }

const JOURNEYS = {
  'Trade Execution': [
    { step: 'Authentication', service: 'AUTH-SERVICE-V2', status: 'healthy', latency: '42ms', errorRate: '0.0%' },
    { step: 'Market Data Fetch', service: 'MERIDIAN SERVICE-QUERY V1', status: 'critical', latency: '3200ms', errorRate: '12.4%' },
    { step: 'Portfolio Validation', service: 'IPBOL-INVESTMENTS-SERVICES', status: 'warning', latency: '280ms', errorRate: '2.1%' },
    { step: 'Order Placement', service: 'MERIDIAN SERVICE-ORDER V1', status: 'warning', latency: '490ms', errorRate: '1.8%' },
    { step: 'Payment Processing', service: 'PAYMENT GATEWAY API', status: 'critical', latency: '8100ms', errorRate: '9.7%' },
    { step: 'Confirmation Email', service: 'EMAIL-NOTIFICATION-SERVICE', status: 'critical', latency: '—', errorRate: '100%' },
  ],
  'Client Login': [
    { step: 'DNS Resolution', service: 'API-GATEWAY', status: 'healthy', latency: '8ms', errorRate: '0.0%' },
    { step: 'Authentication', service: 'AUTH-SERVICE-V2', status: 'healthy', latency: '38ms', errorRate: '0.0%' },
    { step: 'Session Cache', service: 'REDIS-CACHE-CLUSTER', status: 'healthy', latency: '5ms', errorRate: '0.1%' },
    { step: 'Account Load', service: 'IPBOL-ACCOUNT-SERVICES', status: 'warning', latency: '620ms', errorRate: '1.4%' },
    { step: 'Dashboard Render', service: 'ACTIVE-ADVISORY', status: 'healthy', latency: '190ms', errorRate: '0.2%' },
  ],
  'Document Delivery': [
    { step: 'Auth Check', service: 'AUTH-SERVICE-V2', status: 'healthy', latency: '35ms', errorRate: '0.0%' },
    { step: 'Doc Domain Lookup', service: 'IPBOL-DOC-DOMAIN', status: 'critical', latency: '4800ms', errorRate: '18.2%' },
    { step: 'Contact Sync', service: 'IPBOL-CONTACT-SYNC', status: 'healthy', latency: '95ms', errorRate: '0.3%' },
    { step: 'Delivery', service: 'IPBOL-DOC-DELIVERY#GREEN', status: 'healthy', latency: '210ms', errorRate: '0.0%' },
    { step: 'Notification', service: 'EMAIL-NOTIFICATION-SERVICE', status: 'critical', latency: '—', errorRate: '100%' },
  ],
}

export default function CustomerJourneyWidget() {
  const [activeJourney, setActiveJourney] = useState('Trade Execution')
  const steps = JOURNEYS[activeJourney]
  const overallStatus = steps.some(s => s.status === 'critical') ? 'critical' : steps.some(s => s.status === 'warning') ? 'warning' : 'healthy'

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1.5 }}>
      <ToggleButtonGroup value={activeJourney} exclusive onChange={(_, v) => v && setActiveJourney(v)} size="small" sx={{ mb: 1.5 }}>
        {Object.keys(JOURNEYS).map(j => (
          <ToggleButton key={j} value={j} sx={{ textTransform: 'none', fontSize: '0.72rem', px: 1.5, py: 0.25 }}>{j}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Status banner */}
      <Card sx={{ mb: 1.5, border: `1px solid ${STATUS_COLOR[overallStatus]}44` }}>
        <CardContent sx={{ py: '8px !important', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {(() => { const Icon = STATUS_ICON[overallStatus]; return <Icon sx={{ color: STATUS_COLOR[overallStatus], fontSize: 18 }} /> })()}
          <Box>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>{activeJourney} — {overallStatus.toUpperCase()}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              {steps.filter(s => s.status === 'critical').length} critical · {steps.filter(s => s.status === 'warning').length} warning · {steps.filter(s => s.status === 'healthy').length} healthy
            </Typography>
          </Box>
          <Chip label={`${steps.length} steps`} size="small" sx={{ ml: 'auto', color: 'text.secondary', fontSize: '0.62rem', height: 20 }} variant="outlined" />
        </CardContent>
      </Card>

      {/* Steps flow */}
      <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, flexWrap: 'wrap', rowGap: 1 }}>
        {steps.map((step, i) => {
          const Icon = STATUS_ICON[step.status]
          return (
            <Box key={step.step} sx={{ display: 'flex', alignItems: 'center', flex: '1 1 auto', minWidth: 150 }}>
              <Card sx={{ flex: 1, border: `1px solid ${STATUS_COLOR[step.status]}44`, height: '100%' }}>
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.58rem' }}>
                      Step {i + 1}
                    </Typography>
                    <Icon sx={{ fontSize: 12, color: STATUS_COLOR[step.status] }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700} sx={{ mb: 0.25, lineHeight: 1.3, fontSize: '0.72rem' }}>{step.step}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', display: 'block', mb: 0.75 }}>{step.service}</Typography>
                  <Divider sx={{ mb: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>Latency</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.62rem', color: step.latency === '—' ? '#f44336' : 'text.primary' }}>{step.latency}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>Errors</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.62rem', color: parseFloat(step.errorRate) > 5 ? '#f44336' : parseFloat(step.errorRate) > 0 ? '#ff9800' : '#4caf50' }}>
                      {step.errorRate}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
              {i < steps.length - 1 && (
                <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled', mx: 0.25, flexShrink: 0 }} />
              )}
            </Box>
          )
        })}
      </Box>

      {/* Health bars */}
      <Grid container spacing={1} sx={{ mt: 1.5 }}>
        {steps.map(step => (
          <Grid item xs={12} sm={6} md={4} key={step.step}>
            <Box sx={{ mb: 0.25, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>{step.step}</Typography>
              <Typography variant="caption" sx={{ color: STATUS_COLOR[step.status], fontWeight: 600, fontSize: '0.6rem' }}>{step.errorRate} errors</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, 100 - parseFloat(step.errorRate))}
              sx={{ height: 4, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)', '& .MuiLinearProgress-bar': { bgcolor: STATUS_COLOR[step.status], borderRadius: 2 } }}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
