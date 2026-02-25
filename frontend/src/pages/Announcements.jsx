import { useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent,
  Chip, Divider, ToggleButtonGroup, ToggleButton, Avatar,
} from '@mui/material'
import CampaignIcon       from '@mui/icons-material/Campaign'
import BuildIcon          from '@mui/icons-material/Build'
import SecurityIcon       from '@mui/icons-material/Security'
import InfoIcon           from '@mui/icons-material/Info'
import WarningAmberIcon   from '@mui/icons-material/WarningAmber'

const TYPE_META = {
  maintenance: { color: '#60a5fa', Icon: BuildIcon,        label: 'Maintenance'  },
  incident:    { color: '#f87171', Icon: WarningAmberIcon, label: 'Incident'     },
  security:    { color: '#fbbf24', Icon: SecurityIcon,     label: 'Security'     },
  general:     { color: '#94a3b8', Icon: CampaignIcon,     label: 'General'      },
  info:        { color: '#34d399', Icon: InfoIcon,         label: 'Info'         },
}

const ANNOUNCEMENTS = [
  {
    id: 1, type: 'incident', pinned: true,
    title: 'Active: Payment Gateway & Email Service Degradation',
    body: 'Two critical services are currently experiencing degraded performance. Payment Gateway API (SEAL-88451) has a database connection pool issue. Email Notification Service (SEAL-86001) has SMTP connectivity loss. Both teams are actively working on resolution. ETA: 2h.',
    author: 'Platform NOC',
    date: '2026-02-25 09:45 UTC',
    tags: ['P1', 'Active'],
  },
  {
    id: 2, type: 'maintenance', pinned: true,
    title: 'Scheduled Maintenance: POSTGRES-DB-PRIMARY — 2026-02-26 02:00–04:00 UTC',
    body: 'Planned maintenance window for the primary PostgreSQL cluster. This includes connection pool reconfiguration (50→150 connections) and application of security patch PSQ-2024-119. Services PAYMENT GATEWAY API and IPBOL applications will have read-only access during this window. Write operations will be queued.',
    author: 'Database Team',
    date: '2026-02-25 08:00 UTC',
    tags: ['Planned', 'DB'],
  },
  {
    id: 3, type: 'security',
    title: 'Action Required: Rotate SMTP Credentials by 2026-03-01',
    body: 'Following the Email Notification Service incident, the Security team has identified that secondary SMTP credentials were last rotated 18 months ago, exceeding our 90-day rotation policy. All teams using external SMTP providers must rotate credentials by 2026-03-01. Runbook: https://wiki/smtp-rotation.',
    author: 'Security Team',
    date: '2026-02-25 10:30 UTC',
    tags: ['Action Required'],
  },
  {
    id: 4, type: 'general',
    title: 'Post-Incident Review: MERIDIAN SERVICE-QUERY V1 Latency — 2026-02-24',
    body: 'PIR scheduled for 2026-02-26 14:00 UTC. Root cause: missing compound index on doc_domain.account_ref column introduced in migration 2024-218. Fix deployed. Contributing factor: no automated index coverage check in CI pipeline. Action items to be discussed in PIR.',
    author: 'Trading Engineering',
    date: '2026-02-25 07:00 UTC',
    tags: ['PIR', 'Resolved'],
  },
  {
    id: 5, type: 'info',
    title: 'New Feature: Blast Radius View in Knowledge Graph',
    body: 'The Knowledge Graph explorer now supports Blast Radius mode. Select any service and toggle to "Blast Radius" to instantly visualise all upstream services that depend on it. Useful for assessing incident impact scope before initiating changes.',
    author: 'Platform Tools Team',
    date: '2026-02-24 16:00 UTC',
    tags: ['New Feature'],
  },
  {
    id: 6, type: 'maintenance',
    title: 'Completed: API-GATEWAY TLS Certificate Renewal',
    body: 'TLS certificates for API-GATEWAY (SEAL-70001) were renewed without service interruption on 2026-02-24. New certificate expiry: 2027-02-24. No action required from application teams.',
    author: 'Platform NOC',
    date: '2026-02-24 11:00 UTC',
    tags: ['Completed'],
  },
  {
    id: 7, type: 'info',
    title: 'Reminder: SLO Review Meeting — 2026-02-27 10:00 UTC',
    body: 'Quarterly SLO review for all platform services. Please review your team\'s current SLO performance in the SLO Corrector dashboard before the meeting. Agenda: Q1 2026 SLO retrospective, error budget policy updates, and new target proposals for H1 2026.',
    author: 'Platform Engineering',
    date: '2026-02-23 09:00 UTC',
    tags: ['Meeting'],
  },
]

export default function Announcements() {
  const [filter, setFilter] = useState('all')

  const visible = filter === 'all' ? ANNOUNCEMENTS : ANNOUNCEMENTS.filter(a => a.type === filter)
  const pinned   = visible.filter(a => a.pinned)
  const rest     = visible.filter(a => !a.pinned)

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Announcements</Typography>
        <Typography variant="body2" color="text.secondary">Platform updates, scheduled maintenance, and incident communications</Typography>
      </Box>

      <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small" sx={{ mb: 3 }}>
        <ToggleButton value="all" sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>All</ToggleButton>
        {Object.entries(TYPE_META).map(([key, { label }]) => (
          <ToggleButton key={key} value={key} sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>{label}</ToggleButton>
        ))}
      </ToggleButtonGroup>

      {pinned.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', color: 'text.secondary', display: 'block', mb: 1.5 }}>Pinned</Typography>
          {pinned.map(a => <AnnouncementCard key={a.id} a={a} />)}
        </Box>
      )}

      {rest.length > 0 && (
        <Box>
          {pinned.length > 0 && <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', color: 'text.secondary', display: 'block', mb: 1.5 }}>Recent</Typography>}
          {rest.map(a => <AnnouncementCard key={a.id} a={a} />)}
        </Box>
      )}
    </Container>
  )
}

function AnnouncementCard({ a }) {
  const { color, Icon, label } = TYPE_META[a.type]
  return (
    <Card sx={{ mb: 1.5, borderLeft: `3px solid ${color}` }}>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar sx={{ bgcolor: `${color}22`, width: 34, height: 34, flexShrink: 0, mt: 0.25 }}>
            <Icon sx={{ fontSize: 18, color }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5, gap: 1 }}>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>{a.title}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                {a.tags.map(t => <Chip key={t} label={t} size="small" sx={{ height: 18, fontSize: '0.6rem' }} variant="outlined" />)}
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1 }}>{a.body}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">{a.author}</Typography>
              <Typography variant="caption" color="text.secondary">·</Typography>
              <Typography variant="caption" color="text.secondary">{a.date}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
