import { useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent, CardHeader,
  Chip, Grid, Divider, List, ListItem, ListItemText,
  ToggleButtonGroup, ToggleButton, Avatar,
} from '@mui/material'
import ErrorIcon          from '@mui/icons-material/Error'
import WarningIcon        from '@mui/icons-material/Warning'
import AccessTimeIcon     from '@mui/icons-material/AccessTime'
import PersonIcon         from '@mui/icons-material/Person'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', resolved: '#4caf50', investigating: '#60a5fa' }

const INCIDENTS = [
  {
    id: 'INC-20240225-001',
    title: 'Payment Gateway API — Database Connection Pool Exhaustion',
    severity: 'critical',
    status: 'investigating',
    service: 'PAYMENT GATEWAY API',
    team: 'Payments Engineering',
    opened: '2026-02-25 08:14 UTC',
    duration: '2h 11m',
    affected_users: 3820,
    assignee: 'S. Patel',
    timeline: [
      { time: '08:14', event: 'Alert triggered — connection pool at 98% capacity', actor: 'PagerDuty' },
      { time: '08:17', event: 'On-call engineer S. Patel acknowledged', actor: 'S. Patel' },
      { time: '08:31', event: 'Root cause identified — connection leak in v2.4.1 payment processor', actor: 'S. Patel' },
      { time: '08:55', event: 'Rollback to v2.4.0 initiated', actor: 'S. Patel' },
      { time: '09:02', event: 'Rollback complete, pool utilisation down to 61%', actor: 'System' },
      { time: '09:45', event: 'Pool utilisation spiking again — secondary leak identified', actor: 'System' },
      { time: '10:05', event: 'Pool size increased from 50 → 150 connections as temporary mitigation', actor: 'S. Patel' },
    ],
    affected_services: ['PAYMENT GATEWAY API', 'MERIDIAN SERVICE-ORDER V1', 'POSTGRES-DB-PRIMARY'],
    notes: 'Permanent fix requires patch to connection cleanup logic in payment-processor module. Scheduled for 2026-02-26 maintenance window.',
  },
  {
    id: 'INC-20240225-002',
    title: 'Email Notification Service — SMTP Server Unreachable',
    severity: 'critical',
    status: 'investigating',
    service: 'EMAIL-NOTIFICATION-SERVICE',
    team: 'Communications Platform',
    opened: '2026-02-25 07:45 UTC',
    duration: '2h 40m',
    affected_users: 2400,
    assignee: 'M. Chen',
    timeline: [
      { time: '07:45', event: 'SMTP timeout alerts fired across all regions', actor: 'Prometheus' },
      { time: '07:49', event: 'M. Chen paged and acknowledged', actor: 'M. Chen' },
      { time: '08:10', event: 'Primary SMTP provider confirmed outage on their status page', actor: 'M. Chen' },
      { time: '08:22', event: 'Failover to secondary SMTP provider attempted — misconfigured credentials', actor: 'M. Chen' },
      { time: '08:50', event: 'Credentials corrected, failover in progress', actor: 'M. Chen' },
      { time: '09:15', event: 'Partial restoration — 40% of emails flowing via secondary', actor: 'System' },
    ],
    affected_services: ['EMAIL-NOTIFICATION-SERVICE', 'PAYMENT GATEWAY API', 'MERIDIAN SERVICE-ORDER V1'],
    notes: 'Secondary SMTP credentials were stale — last rotated 18 months ago. Credential rotation policy review required.',
  },
  {
    id: 'INC-20240224-007',
    title: 'Meridian Query V1 — Elevated Latency p99 > 5s',
    severity: 'warning',
    status: 'resolved',
    service: 'MERIDIAN SERVICE-QUERY V1',
    team: 'Trading',
    opened: '2026-02-24 14:30 UTC',
    duration: '1h 20m',
    affected_users: 1100,
    assignee: 'A. Williams',
    timeline: [
      { time: '14:30', event: 'p99 latency exceeded 5s threshold', actor: 'Datadog' },
      { time: '14:35', event: 'A. Williams acknowledged', actor: 'A. Williams' },
      { time: '14:50', event: 'Traced to slow query on IPBOL-DOC-DOMAIN joining without index', actor: 'A. Williams' },
      { time: '15:20', event: 'Index added, query plan improved', actor: 'A. Williams' },
      { time: '15:50', event: 'p99 back below 500ms — incident resolved', actor: 'System' },
    ],
    affected_services: ['MERIDIAN SERVICE-QUERY V1', 'IPBOL-DOC-DOMAIN'],
    notes: 'Post-incident review scheduled for 2026-02-26. Missing index on doc_domain.account_ref column.',
  },
]

export default function IncidentItem() {
  const [selected, setSelected] = useState(INCIDENTS[0].id)
  const inc = INCIDENTS.find(i => i.id === selected)

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Incident Items</Typography>
        <Typography variant="body2" color="text.secondary">Active and recent incidents with timeline and resolution notes</Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Incident list */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title={<Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem', color: 'text.secondary' }}>Incidents</Typography>} sx={{ pb: 0 }} />
            <List dense disablePadding>
              {INCIDENTS.map((inc, i) => {
                const Icon = inc.severity === 'critical' ? ErrorIcon : WarningIcon
                return (
                  <ListItem
                    key={inc.id}
                    button
                    selected={selected === inc.id}
                    onClick={() => setSelected(inc.id)}
                    sx={{ px: 2, py: 1.5, borderLeft: selected === inc.id ? `3px solid ${STATUS_COLOR[inc.severity]}` : '3px solid transparent', '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                  >
                    <Icon sx={{ fontSize: 16, color: STATUS_COLOR[inc.severity], mr: 1.5, flexShrink: 0 }} />
                    <ListItemText
                      primary={<Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.3 }}>{inc.title.split('—')[0].trim()}</Typography>}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 0.75, mt: 0.25 }}>
                          <Chip label={inc.status} size="small" sx={{ height: 14, fontSize: '0.58rem', bgcolor: `${STATUS_COLOR[inc.status]}22`, color: STATUS_COLOR[inc.status] }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{inc.duration}</Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                )
              })}
            </List>
          </Card>
        </Grid>

        {/* Incident detail */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', mb: 0.5 }}>{inc.id}</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>{inc.title}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, ml: 2 }}>
                  <Chip label={inc.severity.toUpperCase()} size="small" sx={{ bgcolor: `${STATUS_COLOR[inc.severity]}22`, color: STATUS_COLOR[inc.severity], fontWeight: 700 }} />
                  <Chip label={inc.status.toUpperCase()} size="small" sx={{ bgcolor: `${STATUS_COLOR[inc.status]}22`, color: STATUS_COLOR[inc.status], fontWeight: 700 }} />
                </Box>
              </Box>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={2}>
                {[
                  ['Service', inc.service],
                  ['Team', inc.team],
                  ['Assignee', inc.assignee],
                  ['Duration', inc.duration],
                  ['Opened', inc.opened],
                  ['Affected Users', inc.affected_users.toLocaleString()],
                ].map(([label, value]) => (
                  <Grid item xs={6} sm={4} key={label}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.65rem' }}>{label}</Typography>
                    <Typography variant="body2" fontWeight={600}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Affected services */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 0.75 }}>Affected Services</Typography>
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                  {inc.affected_services.map(s => <Chip key={s} label={s} size="small" sx={{ fontSize: '0.68rem', height: 20 }} variant="outlined" />)}
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card sx={{ mb: 2 }}>
            <CardHeader title={<Typography variant="body2" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.72rem', color: 'text.secondary' }}>Timeline</Typography>} sx={{ pb: 0 }} />
            <CardContent sx={{ pt: 1 }}>
              {inc.timeline.map((t, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, '&:last-child': { mb: 0 } }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === inc.timeline.length - 1 ? STATUS_COLOR[inc.status] : 'rgba(255,255,255,0.2)', mt: 0.5, flexShrink: 0 }} />
                    {i < inc.timeline.length - 1 && <Box sx={{ width: 1, flexGrow: 1, bgcolor: 'rgba(255,255,255,0.08)', mt: 0.5 }} />}
                  </Box>
                  <Box sx={{ pb: i < inc.timeline.length - 1 ? 1 : 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#60a5fa', fontWeight: 600 }}>{t.time} UTC</Typography>
                      <Typography variant="caption" color="text.secondary">· {t.actor}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.5 }}>{t.event}</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.65rem', display: 'block', mb: 1 }}>Resolution Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{inc.notes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
