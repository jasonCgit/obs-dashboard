import { useState } from 'react'
import {
  Card, CardContent, Box, Typography, Chip, Collapse,
  Table, TableBody, TableRow, TableCell,
  IconButton, Stack, Divider,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import CrossLinkChips from './CrossLinkChips'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

/* ── Collapsible Section ── */

function Section({ title, defaultOpen = false, children, count }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Box>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          py: 0.5, cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 0.5,
        }}
      >
        <IconButton size="small" sx={{ p: 0, width: 20, height: 20 }}>
          {open ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
        </IconButton>
        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Typography>
        {count != null && (
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled', ml: 0.5 }}>
            ({count})
          </Typography>
        )}
      </Box>
      <Collapse in={open} timeout={150}>
        <Box sx={{ pl: 2.5, pb: 1 }}>{children}</Box>
      </Collapse>
    </Box>
  )
}

/* ── Deployment accordion row ── */

function DeploymentRow({ deployment, failing, healthyCount }) {
  const [open, setOpen] = useState(failing > 0)
  const d = deployment
  const depComps = d.components || []

  return (
    <Box>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          py: 0.5, cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          borderRadius: 0.5,
        }}
      >
        <IconButton size="small" sx={{ p: 0, width: 18, height: 18 }}>
          {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
        </IconButton>
        <FiberManualRecordIcon sx={{ fontSize: 7, color: STATUS_COLOR[d.status] || '#999' }} />
        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.68rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.label}
        </Typography>
        {d.deployment_id && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.58rem', flexShrink: 0 }}>
            {d.deployment_id}
          </Typography>
        )}
        {d.cpof && (
          <Chip label="CPOF" size="small" sx={{ height: 14, fontSize: '0.52rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0', flexShrink: 0 }} />
        )}
        {d.rto != null && (
          <Typography variant="caption" sx={{ fontSize: '0.56rem', color: 'text.disabled', flexShrink: 0 }}>
            RTO {d.rto}h
          </Typography>
        )}
        {failing > 0 ? (
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#f44336', fontWeight: 600, flexShrink: 0 }}>
            {failing} failing
          </Typography>
        ) : depComps.length > 0 ? (
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled', flexShrink: 0 }}>
            {healthyCount}/{depComps.length}
          </Typography>
        ) : null}
      </Box>
      {depComps.length > 0 && (
        <Collapse in={open} timeout={150}>
          <Stack spacing={0.25} sx={{ pl: 3.5, pb: 0.75 }}>
            {depComps.map(c => (
              <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <FiberManualRecordIcon sx={{ fontSize: 6, color: STATUS_COLOR[c.status] || '#999' }} />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.68rem', flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: c.status !== 'healthy' ? 600 : 400,
                    color: c.status !== 'healthy' ? 'text.primary' : 'text.secondary',
                  }}
                >
                  {c.label}
                </Typography>
                {c.incidents_30d > 0 && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: STATUS_COLOR[c.status] || '#ff9800', fontWeight: 600 }}>
                    {c.incidents_30d} inc
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  )
}

/* ── Main Card ── */

export default function AppCard({ app }) {
  const {
    name, team, status, sla, incidents_30d, last,
    seal, lob, subLob, cto, cbt, appOwner, cpof,
    riskRanking, classification, state, investmentStrategy, rto,
    productLine, product,
    deployments = [],
  } = app

  // Derive CPOF from deployments: app has CPOF if any deployment is CPOF
  const hasCpof = cpof === 'Yes' || deployments.some(d => d.cpof)
  // Derive strictest RTO from deployments (smallest non-null value)
  const deployRtos = deployments.filter(d => d.rto != null).map(d => d.rto)
  const strictestRto = deployRtos.length > 0 ? Math.min(...deployRtos) : null
  const displayRto = strictestRto ?? rto

  // Derive app status from deployments/components (worst status wins)
  const statusRank = { critical: 0, warning: 1, healthy: 2 }
  let derivedStatus = status
  if (deployments.length > 0) {
    for (const d of deployments) {
      if (statusRank[d.status] < statusRank[derivedStatus]) derivedStatus = d.status
      for (const c of (d.components || [])) {
        if (statusRank[c.status] < statusRank[derivedStatus]) derivedStatus = c.status
      }
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ py: '10px !important', px: 1.5 }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.25 }}>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, fontSize: '0.82rem' }}>
                {name} — {seal}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
              SLO: {app.slo?.current ?? '—'}% · Incidents 30d: {incidents_30d} · Team: {team}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, ml: 1, flexShrink: 0 }}>
            <Chip
              label={derivedStatus.toUpperCase()}
              size="small"
              sx={{
                bgcolor: `${STATUS_COLOR[derivedStatus]}22`,
                color: STATUS_COLOR[derivedStatus],
                fontWeight: 700, fontSize: '0.6rem', height: 18,
              }}
            />
            <CrossLinkChips seal={seal} only={['blast-radius']} />
          </Box>
        </Box>

        <Divider sx={{ mb: 0.5 }} />

        {/* ── Expandable sections ── */}

        <Section title="Deployments" count={deployments.length} defaultOpen={deployments.some(d => d.status !== 'healthy')}>
          {deployments.length === 0 ? (
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>No deployment data</Typography>
          ) : (
            <Stack spacing={0}>
              {deployments.map(d => {
                const depComps = d.components || []
                const healthyCount = depComps.filter(c => c.status === 'healthy').length
                const failing = depComps.length - healthyCount
                return (
                  <DeploymentRow key={d.id} deployment={d} failing={failing} healthyCount={healthyCount} />
                )
              })}
            </Stack>
          )}
        </Section>

        <Section title="Metadata">
          <Table size="small" sx={{ '& td': { py: 0.2, px: 0.5, border: 0, fontSize: '0.66rem' }, '& td:first-of-type': { color: 'text.secondary', width: 110 } }}>
            <TableBody>
              {[
                ['LOB', lob],
                ['Sub LOB', subLob || '—'],
                ['Product Line', productLine || '—'],
                ['Product', product || '—'],
                ['CTO', cto],
                ['CBT', cbt],
                ['App Owner', appOwner],
                ['CPOF', hasCpof ? 'Yes' : 'No'],
                ['Risk Ranking', riskRanking],
                ['Classification', classification],
                ['State', state],
                ['Investment', investmentStrategy],
                ['Strictest RTO', displayRto ? `${displayRto}h` : '—'],
              ].map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell>{k}</TableCell>
                  <TableCell>{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Section>
      </CardContent>
    </Card>
  )
}
