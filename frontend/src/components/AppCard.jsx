import { useState } from 'react'
import {
  Card, CardContent, Box, Typography, Chip, Collapse,
  LinearProgress, Table, TableBody, TableRow, TableCell,
  IconButton, Stack, Divider,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import CrossLinkChips from './CrossLinkChips'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

const TREND_ICON = {
  down: TrendingDownIcon,
  up: TrendingUpIcon,
  stable: TrendingFlatIcon,
}

function budgetColor(pct) {
  if (pct > 40) return '#4caf50'
  if (pct > 15) return '#ff9800'
  return '#f44336'
}

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
        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem' }}>
          {d.label}
        </Typography>
        <Chip label={d.type.toUpperCase()} size="small" sx={{ fontSize: '0.55rem', height: 15, fontWeight: 700, '& .MuiChip-label': { px: 0.5 } }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.62rem' }}>
          {d.datacenter}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {failing > 0 ? (
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: '#f44336', fontWeight: 600 }}>
            {failing} failing
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
            {healthyCount}/{depComps.length}
          </Typography>
        )}
      </Box>
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
    components = [], deployments = [], slo = {}, completeness = {},
  } = app

  const TrendIcon = TREND_ICON[slo.trend] || TrendingFlatIcon
  const totalComponents = deployments.reduce((sum, d) => sum + (d.components?.length || 0), 0)

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ py: '12px !important', px: 2 }}>
        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.75 }}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, mb: 0.25 }}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {team} · SLA {sla} · {incidents_30d} incidents 30d · {last}
            </Typography>
          </Box>
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              bgcolor: `${STATUS_COLOR[status]}22`,
              color: STATUS_COLOR[status],
              fontWeight: 700, fontSize: '0.65rem', height: 20, ml: 1, flexShrink: 0,
            }}
          />
        </Box>

        {/* ── SLO + Completeness summary row ── */}
        <Box sx={{ display: 'flex', gap: 2, mb: 1, alignItems: 'center' }}>
          {/* SLO mini */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>SLO</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.75rem', color: STATUS_COLOR[slo.status] || 'text.primary' }}>
              {slo.current ?? '—'}%
            </Typography>
            <TrendIcon sx={{ fontSize: 14, color: STATUS_COLOR[slo.status] || 'text.disabled' }} />
            <Box sx={{ width: 60, mx: 0.5 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(slo.error_budget ?? 0, 100)}
                sx={{
                  height: 4, borderRadius: 2,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: budgetColor(slo.error_budget ?? 0), borderRadius: 2 },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
              {slo.error_budget ?? '—'}%
            </Typography>
          </Box>

          <Box sx={{ width: 1, height: 14, bgcolor: 'divider' }} />

          {/* Completeness mini */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>Complete</Typography>
            <Box sx={{ width: 40 }}>
              <LinearProgress
                variant="determinate"
                value={completeness.score ?? 0}
                sx={{
                  height: 4, borderRadius: 2,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: (completeness.score ?? 0) >= 80 ? '#4caf50' : (completeness.score ?? 0) >= 50 ? '#ff9800' : '#f44336', borderRadius: 2 },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
              {completeness.score ?? '—'}%
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 0.75 }} />

        {/* ── Expandable sections ── */}

        <Section title="SLO & Error Budget">
          <Box sx={{ display: 'flex', gap: 3, mb: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Target</Typography>
              <Typography variant="body2" fontWeight={600}>{slo.target ?? '—'}%</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Current</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: STATUS_COLOR[slo.status] }}>{slo.current ?? '—'}%</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Burn Rate</Typography>
              <Typography variant="body2" fontWeight={600}>{slo.burn_rate ?? '—'}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>Breach ETA</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: slo.breach_eta ? '#f44336' : 'text.secondary' }}>
                {slo.breach_eta ?? 'N/A'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 0.25, display: 'block' }}>
              Error Budget Remaining
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(slo.error_budget ?? 0, 100)}
              sx={{
                height: 8, borderRadius: 4,
                bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { bgcolor: budgetColor(slo.error_budget ?? 0), borderRadius: 4 },
              }}
            />
            <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled', mt: 0.25, display: 'block' }}>
              {slo.error_budget ?? 0}% remaining
            </Typography>
          </Box>
          <CrossLinkChips seal={seal} service={name} only={['slo-agent', 'incident-zero']} />
        </Section>

        <Section title="Deployments" count={totalComponents} defaultOpen={deployments.some(d => d.status !== 'healthy')}>
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
              <Box sx={{ mt: 0.75 }}>
                <CrossLinkChips seal={seal} only={['blast-radius']} />
              </Box>
            </Stack>
          )}
        </Section>

        <Section title="Metadata & Completeness">
          <Table size="small" sx={{ '& td': { py: 0.25, px: 0.5, border: 0, fontSize: '0.7rem' }, '& td:first-of-type': { color: 'text.secondary', width: 130 } }}>
            <TableBody>
              {[
                ['LOB', lob],
                ['Sub LOB', subLob || '—'],
                ['Product Line', productLine || '—'],
                ['Product', product || '—'],
                ['CTO', cto],
                ['CBT', cbt],
                ['App Owner', appOwner],
                ['CPOF', cpof],
                ['Risk Ranking', riskRanking],
                ['Classification', classification],
                ['State', state],
                ['Investment', investmentStrategy],
                ['RTO', rto ? `${rto}h` : '—'],
              ].map(([k, v]) => (
                <TableRow key={k}>
                  <TableCell>{k}</TableCell>
                  <TableCell>{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ my: 0.75 }} />

          <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.68rem', mb: 0.5, display: 'block' }}>
            Completeness ({completeness.score ?? 0}%)
          </Typography>
          <Stack spacing={0.25}>
            {[
              ['Owner', completeness.has_owner],
              ['SLA Target', completeness.has_sla],
              ['SLO Configured', completeness.has_slo],
              ['RTO Defined', completeness.has_rto],
              ['CPOF Registered', completeness.has_cpof],
              ['Blast Radius Mapped', completeness.has_blast_radius],
            ].map(([label, ok]) => (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {ok
                  ? <CheckCircleIcon sx={{ fontSize: 14, color: '#4caf50' }} />
                  : <CancelIcon sx={{ fontSize: 14, color: '#f44336' }} />
                }
                <Typography variant="caption" sx={{ fontSize: '0.68rem', color: ok ? 'text.primary' : 'text.secondary' }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Section>
      </CardContent>
    </Card>
  )
}
