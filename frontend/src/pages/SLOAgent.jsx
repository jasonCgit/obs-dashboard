import { useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardHeader,
  Chip, Grid, Divider, Stack, LinearProgress, IconButton,
  Tooltip, Button, Avatar,
} from '@mui/material'
import AutoAwesomeIcon   from '@mui/icons-material/AutoAwesome'
import CheckCircleIcon   from '@mui/icons-material/CheckCircle'
import WarningIcon       from '@mui/icons-material/Warning'
import ErrorIcon         from '@mui/icons-material/Error'
import PlayArrowIcon     from '@mui/icons-material/PlayArrow'
import PauseIcon         from '@mui/icons-material/Pause'
import ThumbUpIcon       from '@mui/icons-material/ThumbUp'
import ThumbDownIcon     from '@mui/icons-material/ThumbDown'
import TrendingUpIcon    from '@mui/icons-material/TrendingUp'
import TrendingDownIcon  from '@mui/icons-material/TrendingDown'
import RemoveIcon        from '@mui/icons-material/Remove'
import SmartToyIcon      from '@mui/icons-material/SmartToy'

const SERVICES = [
  { id: 'api-gateway',       label: 'API-GATEWAY',              target: 99.99, current: 99.97, budget: 72, trend: 'stable',   status: 'healthy' },
  { id: 'payment-gateway',   label: 'PAYMENT-GATEWAY-API',      target: 99.99, current: 99.84, budget: 12, trend: 'down',     status: 'critical' },
  { id: 'spieq-api-gateway', label: 'SPIEQ-API-GATEWAY',        target: 99.99, current: 99.91, budget: 38, trend: 'down',     status: 'warning' },
  { id: 'db-primary',        label: 'POSTGRES-DB-PRIMARY',       target: 99.99, current: 99.82, budget: 8,  trend: 'down',     status: 'critical' },
  { id: 'auth-service',      label: 'AUTH-SERVICE-V2',           target: 99.99, current: 99.99, budget: 95, trend: 'up',       status: 'healthy' },
  { id: 'spieq-risk-service',label: 'SPIEQ-RISK-SERVICE',       target: 99.99, current: 99.88, budget: 22, trend: 'down',     status: 'warning' },
  { id: 'meridian-query',    label: 'MERIDIAN-SERVICE-QUERY-V1', target: 99.5,  current: 99.12, budget: 24, trend: 'down',     status: 'warning' },
  { id: 'cache-layer',       label: 'REDIS-CACHE-CLUSTER',       target: 99.9,  current: 99.88, budget: 80, trend: 'stable',   status: 'healthy' },
  { id: 'email-notification',label: 'EMAIL-NOTIFICATION-SVC',    target: 99.5,  current: 99.01, budget: 2,  trend: 'down',     status: 'critical' },
  { id: 'connect-cloud-gw',  label: 'CONNECT-CLOUD-GATEWAY',     target: 99.99, current: 99.98, budget: 88, trend: 'up',       status: 'healthy' },
]

const AGENT_ACTIONS = [
  {
    id: 1,
    service: 'PAYMENT-GATEWAY-API',
    action: 'Scale database connection pool from 50 → 100 connections',
    reason: 'Error budget at 12% with accelerating burn rate. Connection pool exhaustion detected in last 3 incidents.',
    risk: 'low',
    status: 'pending_approval',
    time: '2m ago',
  },
  {
    id: 2,
    service: 'POSTGRES-DB-PRIMARY',
    action: 'Enable read-replica failover routing for SELECT queries',
    reason: 'Primary DB at 8% error budget. Offloading reads can reduce P99 latency by ~40%.',
    risk: 'medium',
    status: 'pending_approval',
    time: '5m ago',
  },
  {
    id: 3,
    service: 'EMAIL-NOTIFICATION-SVC',
    action: 'Switch to secondary SMTP provider (Mailgun → SendGrid)',
    reason: 'Error budget nearly exhausted (2%). SMTP failures recurring every 6h for 3 days.',
    risk: 'low',
    status: 'pending_approval',
    time: '8m ago',
  },
]

const AGENT_LOG = [
  { time: '12:34 PM', event: 'Approved auto-scaling for REDIS-CACHE-CLUSTER (3 → 5 replicas)', type: 'auto' },
  { time: '12:28 PM', event: 'Detected SLO burn rate spike on PAYMENT-GATEWAY-API — proposed connection pool scale-up', type: 'detect' },
  { time: '12:15 PM', event: 'Completed canary rollback on SPIEQ-TRADE-SERVICE (error rate normalised)', type: 'auto' },
  { time: '11:52 AM', event: 'Predicted SLO breach for EMAIL-NOTIFICATION-SVC within 4h — queued SMTP failover', type: 'predict' },
  { time: '11:30 AM', event: 'Hourly SLO health scan completed — 4 services below threshold', type: 'scan' },
  { time: '11:02 AM', event: 'Auto-approved latency alert suppression for AUTH-SERVICE-V2 (planned deploy)', type: 'auto' },
]

const statusColor = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }
const budgetColor = (b) => b <= 15 ? '#f44336' : b <= 40 ? '#ff9800' : '#4caf50'
const TrendIcon = ({ trend }) =>
  trend === 'up' ? <TrendingUpIcon sx={{ fontSize: 14, color: '#4caf50' }} />
  : trend === 'down' ? <TrendingDownIcon sx={{ fontSize: 14, color: '#f44336' }} />
  : <RemoveIcon sx={{ fontSize: 14, color: '#94a3b8' }} />

export default function SloAgent() {
  const [agentRunning, setAgentRunning] = useState(true)
  const [actions, setActions] = useState(AGENT_ACTIONS)

  const approve = (id) => setActions(a => a.filter(x => x.id !== id))
  const dismiss = (id) => setActions(a => a.filter(x => x.id !== id))

  const critCount = SERVICES.filter(s => s.status === 'critical').length
  const warnCount = SERVICES.filter(s => s.status === 'warning').length

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Agent status banner */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
        border: '1px solid rgba(99,102,241,0.25)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '16px !important' }}>
          <Avatar sx={{ bgcolor: agentRunning ? '#6366f1' : '#64748b', width: 40, height: 40 }}>
            <SmartToyIcon sx={{ fontSize: 22 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography variant="h6" fontWeight={700}>SLO Agent</Typography>
              <Chip
                label={agentRunning ? 'RUNNING' : 'PAUSED'}
                size="small"
                sx={{ bgcolor: agentRunning ? 'rgba(74,222,128,0.15)' : 'rgba(148,163,184,0.15)',
                  color: agentRunning ? '#4ade80' : '#94a3b8',
                  fontWeight: 700, fontSize: '0.62rem', height: 20 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Monitoring {SERVICES.length} services · {critCount} critical · {warnCount} warning · {actions.length} pending action{actions.length !== 1 ? 's' : ''} · Last scan 4m ago
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title={agentRunning ? 'Pause agent' : 'Resume agent'}>
              <IconButton onClick={() => setAgentRunning(r => !r)}
                sx={{ bgcolor: 'rgba(99,102,241,0.15)', '&:hover': { bgcolor: 'rgba(99,102,241,0.25)' } }}>
                {agentRunning ? <PauseIcon sx={{ color: '#a78bfa' }} /> : <PlayArrowIcon sx={{ color: '#a78bfa' }} />}
              </IconButton>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left — SLO table + actions */}
        <Grid item xs={12} lg={8}>
          {/* Pending agent actions */}
          {actions.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 18, color: '#a78bfa' }} />
                    <Typography variant="h6">Pending Agent Actions</Typography>
                    <Chip label={`${actions.length}`} size="small"
                      sx={{ bgcolor: 'rgba(167,139,250,0.15)', color: '#a78bfa', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                  </Box>
                }
                subheader="Review and approve AI-recommended remediation actions"
                sx={{ pb: 0 }}
              />
              <CardContent sx={{ pt: 1 }}>
                <Stack spacing={1.5}>
                  {actions.map(a => (
                    <Box key={a.id} sx={{
                      border: '1px solid', borderColor: 'divider',
                      borderRadius: 2, p: 1.5,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.75 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{a.service}</Typography>
                          <Typography variant="body2" color="text.primary" sx={{ mt: 0.3 }}>{a.action}</Typography>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Approve">
                            <IconButton size="small" onClick={() => approve(a.id)}
                              sx={{ bgcolor: 'rgba(74,222,128,0.1)', '&:hover': { bgcolor: 'rgba(74,222,128,0.25)' } }}>
                              <ThumbUpIcon sx={{ fontSize: 14, color: '#4ade80' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Dismiss">
                            <IconButton size="small" onClick={() => dismiss(a.id)}
                              sx={{ bgcolor: 'rgba(248,113,113,0.1)', '&:hover': { bgcolor: 'rgba(248,113,113,0.25)' } }}>
                              <ThumbDownIcon sx={{ fontSize: 14, color: '#f87171' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, lineHeight: 1.5 }}>
                        {a.reason}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={`Risk: ${a.risk}`} size="small"
                          sx={{ fontSize: '0.62rem', height: 18,
                            bgcolor: a.risk === 'low' ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.12)',
                            color: a.risk === 'low' ? '#4ade80' : '#fbbf24' }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>{a.time}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* SLO health table */}
          <Card>
            <CardHeader
              title={<Typography variant="h6">Service SLO Health</Typography>}
              subheader={`${SERVICES.length} services tracked`}
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              {/* Header row */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 0.8fr 1.5fr 0.5fr 0.6fr',
                gap: 1, px: 1, py: 0.75, mb: 0.5 }}>
                {['Service', 'Target', 'Current', 'Error Budget', '', 'Status'].map(h => (
                  <Typography key={h} variant="caption" color="text.secondary"
                    sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {h}
                  </Typography>
                ))}
              </Box>
              <Divider sx={{ mb: 0.5 }} />

              <Stack spacing={0}>
                {SERVICES.map(s => (
                  <Box key={s.id} sx={{
                    display: 'grid', gridTemplateColumns: '2.5fr 0.8fr 0.8fr 1.5fr 0.5fr 0.6fr',
                    gap: 1, px: 1, py: 0.85, alignItems: 'center',
                    '&:hover': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    borderRadius: 1,
                  }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>
                      {s.target}%
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem',
                      color: s.current < s.target ? '#f44336' : 'text.primary', fontWeight: s.current < s.target ? 700 : 400 }}>
                      {s.current}%
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <LinearProgress variant="determinate" value={s.budget}
                        sx={{ flexGrow: 1, height: 5, borderRadius: 3,
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
                          '& .MuiLinearProgress-bar': { bgcolor: budgetColor(s.budget), borderRadius: 3 } }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700,
                        color: budgetColor(s.budget), minWidth: 28, textAlign: 'right' }}>
                        {s.budget}%
                      </Typography>
                    </Box>
                    <TrendIcon trend={s.trend} />
                    <Chip
                      label={s.status === 'healthy' ? 'OK' : s.status === 'warning' ? 'WARN' : 'CRIT'}
                      size="small"
                      sx={{ bgcolor: `${statusColor[s.status]}18`, color: statusColor[s.status],
                        fontWeight: 700, fontSize: '0.6rem', height: 18 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — agent activity log */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <SmartToyIcon sx={{ fontSize: 16, color: '#a78bfa' }} />
                  <Typography variant="h6">Agent Activity Log</Typography>
                </Box>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 1 }}>
              <Stack spacing={1.25}>
                {AGENT_LOG.map((log, i) => {
                  const typeColor = { auto: '#4ade80', detect: '#fbbf24', predict: '#a78bfa', scan: '#60a5fa' }
                  return (
                    <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                      <Box sx={{ width: 4, borderRadius: 2, bgcolor: typeColor[log.type] || '#64748b', flexShrink: 0 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem', display: 'block' }}>
                          {log.time}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.72rem', lineHeight: 1.5, display: 'block' }}>
                          {log.event}
                        </Typography>
                      </Box>
                    </Box>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>

          {/* Agent summary card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.65rem', display: 'block', mb: 1.5 }}>
                Agent Performance (24h)
              </Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Actions Taken', value: '14', color: '#a78bfa' },
                  { label: 'Auto-Approved', value: '9',  color: '#4ade80' },
                  { label: 'Predictions',   value: '6',  color: '#60a5fa' },
                  { label: 'Breaches Prevented', value: '3', color: '#fbbf24' },
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
