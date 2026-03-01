import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Chip, Divider, CircularProgress, Alert, Stack,
  Card, CardContent, CardHeader, Autocomplete, TextField, Link,
  Tabs, Tab, IconButton, Tooltip,
} from '@mui/material'
import CheckIcon          from '@mui/icons-material/Check'
import InfoOutlinedIcon   from '@mui/icons-material/InfoOutlined'
import CloseIcon          from '@mui/icons-material/Close'
import LayersIcon         from '@mui/icons-material/Layers'
import RadarIcon          from '@mui/icons-material/Radar'
import ErrorIcon          from '@mui/icons-material/Error'
import WarningIcon        from '@mui/icons-material/Warning'
import TrendingUpIcon     from '@mui/icons-material/TrendingUp'
import LayeredDependencyFlow from '../components/LayeredDependencyFlow'
import { useFilters }     from '../FilterContext'
import { parseSealDisplay } from '../data/appData'

// ── All SEALs (matches backend SEAL_COMPONENTS) ────────────────────────────
const ALL_SEALS = [
  { seal: '90176', label: 'Advisor Connect' },
  { seal: '102987', label: 'AWM Entitlements (WEAVE)' },
  { seal: '88180', label: 'Connect OS' },
  { seal: '45440', label: 'Credit Card Processing Engine' },
  { seal: '16649', label: 'Morgan Money' },
  { seal: '81884', label: 'Order Decision Engine' },
  { seal: '35115', label: 'PANDA' },
  { seal: '91001', label: 'Quantum' },
  { seal: '62100', label: 'Real-Time Payments Gateway' },
  { seal: '90215', label: 'Spectrum Portfolio Mgmt' },
]

// ── Layer definitions ───────────────────────────────────────────────────────
const LAYER_DEFS = [
  { key: 'indicator',  label: 'Health Indicators',   color: '#94a3b8' },
  { key: 'component',  label: 'Components',   color: '#1565C0', always: true },
  { key: 'crossapp',   label: 'Upstream / Downstream',  color: '#78716c' },
  { key: 'platform',   label: 'Platform',     color: '#C27BA0' },
  { key: 'datacenter', label: 'Data Centers',  color: '#5DA5A0', requires: 'platform' },
]

// ── Status helpers ──────────────────────────────────────────────────────────
const STATUS_COLORS = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }
const HEALTH_COLORS = { green: '#4caf50', amber: '#ff9800', red: '#f44336' }

function StatusChip({ status }) {
  const color = STATUS_COLORS[status] || '#94a3b8'
  return (
    <Chip
      label={status?.toUpperCase() || 'UNKNOWN'}
      size="small"
      sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
    />
  )
}

// ── SEAL-specific executive narratives ────────────────────────────────────────
const SEAL_NARRATIVES = {
  '16649': 'Morgan Money data service experiencing elevated error rates with database connection pool saturation. API layer reporting intermittent 503 responses during peak client data retrieval windows.',
  '35115': 'PANDA cache layer showing elevated eviction rates causing increased backend load. Data distribution latency within acceptable thresholds but cache miss ratio trending upward over past 24 hours.',
  '88180': 'Intermittent gateway timeouts on Connect Cloud GW impacting downstream portal and home-app services. DNS resolution delays from regional load balancers contributing to elevated P99 latency across APAC data centers.',
  '90176': 'Coverage app and IPBOL account services in critical state, driving cascading degradation across profile and notification pipelines. Shared DB connection pool nearing exhaustion, causing read timeouts and elevated response times across dependent services.',
  '81884': 'Order execution service experiencing critical latency due to risk validation bottleneck. Market data feed degradation causing stale pricing in rule engine evaluations, impacting order routing accuracy.',
  '91001': 'Quantum data lake connector experiencing connection pool exhaustion and elevated query timeouts. Portfolio service unable to sync latest NAV calculations, causing stale position data in downstream analytics.',
  '45440': 'Fraud detection engine operating at reduced throughput due to model scoring latency. Ledger posting backlog growing as authorization pipeline slows, impacting settlement cycle times and customer notification delivery.',
  '102987': 'WEAVE policy engine degraded due to user directory synchronization failures. Event bus message backlog causing delayed entitlement propagation across downstream consuming applications. Multiple identity sync retries observed.',
  '90215': 'Settlement processing backlog due to payment gateway throttling under peak load. API gateway circuit breakers tripping intermittently, causing notification delivery delays and partial trade reconciliation failures across Spectrum services.',
  '62100': 'Routing engine experiencing critical failures during cross-border payment classification. Clearing and settlement engines backlogged as sanctions screening latency impacts downstream processing. FX conversion service intermittently timing out on rate lookups.',
}

// ── SEAL-specific business processes (matches original Blast Radius) ──────────
const SEAL_BUSINESS_PROCESSES = {
  '16649': [
    { name: 'Client Data Retrieval',     status: 'critical', desc: 'Core data lookup and aggregation' },
    { name: 'API Request Handling',      status: 'warning',  desc: 'REST API gateway processing' },
    { name: 'UI Rendering',             status: 'healthy',  desc: 'Client-facing dashboard assembly' },
  ],
  '35115': [
    { name: 'Data Distribution',        status: 'healthy',  desc: 'Client data fan-out to consumers' },
    { name: 'Cache Management',         status: 'warning',  desc: 'Distributed cache population and eviction' },
    { name: 'Data Export',              status: 'healthy',  desc: 'Batch and on-demand data extraction' },
    { name: 'Gateway Routing',          status: 'healthy',  desc: 'Request routing and load balancing' },
  ],
  '88180': [
    { name: 'User Authentication & SSO', status: 'healthy',  desc: 'Centralised login and token management' },
    { name: 'Home App Rendering',        status: 'warning',  desc: 'NA/APAC/EMEA portal page assembly' },
    { name: 'Team Management',           status: 'healthy',  desc: 'Org hierarchy and role assignment' },
    { name: 'Global Search',             status: 'healthy',  desc: 'Cross-platform content discovery' },
    { name: 'Session Management',        status: 'warning',  desc: 'Distributed session state and caching' },
  ],
  '90176': [
    { name: 'Client Profile Lookup',     status: 'warning',  desc: 'Profile retrieval via coverage app' },
    { name: 'Coverage Plan Generation',  status: 'critical', desc: 'Advisor coverage and assignment flows' },
    { name: 'Notification Delivery',     status: 'warning',  desc: 'Client alerts via messaging pipeline' },
    { name: 'Document Sync',             status: 'warning',  desc: 'Cross-service document replication' },
    { name: 'Audit Trail Recording',     status: 'healthy',  desc: 'Compliance event logging' },
  ],
  '81884': [
    { name: 'Order Routing',            status: 'warning',  desc: 'Inbound order classification and routing' },
    { name: 'Risk Validation',          status: 'critical', desc: 'Pre-trade risk and compliance checks' },
    { name: 'Trade Execution',          status: 'critical', desc: 'Order matching and fill generation' },
    { name: 'Market Data Feed',         status: 'warning',  desc: 'Real-time pricing and reference data' },
    { name: 'Reconciliation',           status: 'warning',  desc: 'Post-trade position reconciliation' },
  ],
  '91001': [
    { name: 'Portfolio Management',     status: 'critical', desc: 'NAV calculation and position tracking' },
    { name: 'Analytics Pipeline',       status: 'warning',  desc: 'Performance attribution and risk metrics' },
    { name: 'Data Lake Ingestion',      status: 'critical', desc: 'Batch and streaming data integration' },
    { name: 'Report Generation',        status: 'healthy',  desc: 'Regulatory and client reporting' },
    { name: 'Authentication',           status: 'healthy',  desc: 'User identity and access control' },
  ],
  '45440': [
    { name: 'Transaction Authorization', status: 'warning',  desc: 'Real-time card authorization flow' },
    { name: 'Fraud Detection',          status: 'critical', desc: 'ML-based transaction scoring' },
    { name: 'Ledger Posting',           status: 'critical', desc: 'Double-entry transaction recording' },
    { name: 'Settlement Processing',    status: 'warning',  desc: 'End-of-day batch settlement' },
    { name: 'Dispute Resolution',       status: 'healthy',  desc: 'Chargeback and dispute workflows' },
    { name: 'Rewards Processing',       status: 'healthy',  desc: 'Points accrual and redemption' },
  ],
  '102987': [
    { name: 'Policy Evaluation',        status: 'critical', desc: 'Real-time entitlement policy checks' },
    { name: 'Identity Synchronization', status: 'warning',  desc: 'Cross-directory user sync pipeline' },
    { name: 'Role Management',          status: 'warning',  desc: 'RBAC role assignment and hierarchy' },
    { name: 'Token Issuance',           status: 'healthy',  desc: 'OAuth/JWT token generation and refresh' },
    { name: 'Event Processing',         status: 'critical', desc: 'Entitlement change event propagation' },
    { name: 'Compliance Reporting',     status: 'warning',  desc: 'Access audit and SOX reporting' },
  ],
  '90215': [
    { name: 'Trade Execution',       status: 'critical', desc: 'Order submission and fill routing' },
    { name: 'Real-time Pricing',     status: 'critical', desc: 'Market data aggregation and distribution' },
    { name: 'Risk Assessment',       status: 'critical', desc: 'Pre-trade and post-trade risk checks' },
    { name: 'Settlement Processing', status: 'warning',  desc: 'T+1 trade settlement workflow' },
    { name: 'Compliance Reporting',  status: 'healthy',  desc: 'Regulatory audit trail generation' },
  ],
  '62100': [
    { name: 'Payment Routing',          status: 'critical', desc: 'Cross-border payment classification and routing' },
    { name: 'Sanctions Screening',      status: 'warning',  desc: 'OFAC and EU sanctions list screening' },
    { name: 'AML Compliance',           status: 'healthy',  desc: 'Anti-money laundering transaction checks' },
    { name: 'Clearing & Settlement',    status: 'critical', desc: 'Real-time gross settlement processing' },
    { name: 'FX Conversion',            status: 'warning',  desc: 'Multi-currency conversion and rate lookup' },
    { name: 'Reconciliation',           status: 'healthy',  desc: 'End-of-day position reconciliation' },
    { name: 'Health Monitoring',        status: 'warning',  desc: 'Platform-wide health and SLA tracking' },
  ],
}

// ── Inline executive summary (compact, sits inside controls bar) ─────────────
function InlineExecutiveSummary({ apiData, seal }) {
  const compNodes  = apiData.components?.nodes || []
  const critical = compNodes.filter(s => s.status === 'critical')
  const warning  = compNodes.filter(s => s.status === 'warning')
  const degraded = critical.length + warning.length
  const totalInc = compNodes.reduce((sum, s) => sum + (s.incidents_30d || 0), 0)

  const allTeams = {}
  compNodes.forEach(s => { if (s.team) allTeams[s.team] = (allTeams[s.team] || 0) + 1 })
  const teamCount = Object.keys(allTeams).length

  const level =
    critical.length >= 2 ? 'CRITICAL'
    : critical.length === 1 ? 'HIGH'
    : warning.length >= 2  ? 'ELEVATED'
    : warning.length === 1 ? 'MODERATE'
    : 'HEALTHY'

  const levelColor =
    level === 'CRITICAL' ? '#f44336'
    : level === 'HIGH'     ? '#ff6b6b'
    : level === 'ELEVATED' ? '#ff9800'
    : level === 'MODERATE' ? '#ffd54f'
    : '#4caf50'

  const kpis = [
    { label: 'Total Services',  value: compNodes.length, color: '#94a3b8' },
    { label: 'Degraded',        value: degraded,         color: degraded > 0 ? '#ff9800' : '#4caf50' },
    { label: 'Teams',           value: teamCount,        color: '#94a3b8' },
  ]

  const narrative = SEAL_NARRATIVES[seal] || 'All services operating within normal parameters.'

  return (
    <>
      {/* Separator */}
      <Box sx={{ width: '1px', height: 24, bgcolor: `${levelColor}28`, flexShrink: 0 }} />

      {/* Impact badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <RadarIcon sx={{ fontSize: 18, color: levelColor }} />
        <Box>
          <Typography sx={{ color: levelColor, fontWeight: 800, letterSpacing: 0.9, fontSize: '0.82rem', lineHeight: 1 }}>
            {level}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2, mt: 0.15 }}>
            IMPACT LEVEL
          </Typography>
        </Box>
      </Box>

      {/* KPIs */}
      <Stack direction="row" spacing={2} sx={{ flexShrink: 0 }}>
        {kpis.map(k => (
          <Box key={k.label} sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, lineHeight: 1, color: k.color }}>{k.value}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.15, whiteSpace: 'nowrap' }}>{k.label}</Typography>
          </Box>
        ))}
      </Stack>

      {/* Incident sparkline (stacked: count + critical below) */}
      <Box sx={{ flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <TrendingUpIcon sx={{ fontSize: 15, color: totalInc > 5 ? '#f44336' : '#ff9800', flexShrink: 0 }} />
          <Typography sx={{
            fontSize: '0.82rem', fontWeight: 600, color: totalInc > 5 ? '#f44336' : '#ff9800',
            whiteSpace: 'nowrap',
          }}>
            {totalInc} incidents in 30d
          </Typography>
        </Box>
        {critical.length > 0 && (
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 600, color: '#f44336',
            whiteSpace: 'nowrap', mt: 0.15, pl: 2.5,
          }}>
            {critical.length} critical
          </Typography>
        )}
      </Box>

      {/* Executive narrative (two lines available) */}
      <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
        <Typography sx={{
          fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.35,
          color: (t) => t.palette.mode === 'dark' ? '#ffffff' : '#000000',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {narrative}
        </Typography>
      </Box>
    </>
  )
}

// ── Dependency overview panel (sidebar, matches original Blast Radius) ──────
function DependencyOverview({ apiData, activeLayers, seal }) {
  if (!apiData?.components?.nodes) return null

  const deps      = apiData.components.nodes
  const critical  = deps.filter(s => s.status === 'critical')
  const warning   = deps.filter(s => s.status === 'warning')
  const healthy   = deps.filter(s => s.status === 'healthy')

  const hotspots = [...deps]
    .filter(s => (s.incidents_30d || 0) > 0)
    .sort((a, b) => (b.incidents_30d || 0) - (a.incidents_30d || 0))
    .slice(0, 6)
  const maxInc = Math.max(...hotspots.map(s => s.incidents_30d || 0), 1)

  const rows = [
    { label: 'Critical', count: critical.length, color: '#f44336', Icon: ErrorIcon },
    { label: 'Warning',  count: warning.length,  color: '#ff9800', Icon: WarningIcon },
    { label: 'Healthy',  count: healthy.length,  color: '#4caf50' },
  ]

  return (
    <Box>
      <Typography variant="caption" color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', display: 'block', mb: 1 }}>
        Component Health
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        {rows.map(({ label, count, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" sx={{ color, fontSize: '0.75rem', fontWeight: 600 }}>{label}</Typography>
            </Box>
            <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.75rem' }}>{count}</Typography>
          </Box>
        ))}
      </Stack>

      {hotspots.length > 0 && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Incident Hotspots (30d)
          </Typography>
          <Stack spacing={0.8}>
            {hotspots.map(s => (
              <Box key={s.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    {s.label.split('~~')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.72rem', fontWeight: 700,
                    color: STATUS_COLORS[s.status] || '#94a3b8' }}>
                    {s.incidents_30d}
                  </Typography>
                </Box>
                <Box sx={{ height: 3, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
                  <Box sx={{
                    height: '100%', borderRadius: 2,
                    width: `${(s.incidents_30d / maxInc) * 100}%`,
                    bgcolor: STATUS_COLORS[s.status] || '#64748b',
                  }} />
                </Box>
              </Box>
            ))}
          </Stack>
        </>
      )}

      {/* Business Processes */}
      {seal && SEAL_BUSINESS_PROCESSES[seal] && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Business Processes
          </Typography>
          <Stack spacing={0.75}>
            {SEAL_BUSINESS_PROCESSES[seal].map(bp => {
              const bpColor = STATUS_COLORS[bp.status] || '#94a3b8'
              return (
                <Box key={bp.name} sx={{
                  p: 1, borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: `${bpColor}30`,
                  bgcolor: `${bpColor}08`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                      {bp.name}
                    </Typography>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: bpColor, flexShrink: 0 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                    {bp.desc}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        </>
      )}
    </Box>
  )
}

// ── Node detail panel (sidebar) ─────────────────────────────────────────────
function NodeDetailPanel({ node, onNavigateToSeal }) {
  if (!node) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <LayersIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Click a node to view details
        </Typography>
      </Box>
    )
  }

  const nodeType = node.nodeType || 'service'

  let rows = []
  let statusValue = null
  let title = node.label

  if (nodeType === 'service' || nodeType === 'external') {
    rows = [
      ['Team', node.team],
      ['SLO Status', node.sla],
      ['Incidents 30d', node.incidents_30d],
    ]
    statusValue = node.status
    if (nodeType === 'external') {
      const dirLabel = node.cross_direction === 'upstream' ? 'Upstream' : node.cross_direction === 'both' ? 'Up/Downstream' : 'Downstream'
      rows.push(['Application', node.external_seal_label], ['Direction', dirLabel])
    }
  } else if (nodeType === 'platform') {
    const subtypeLabels = { pool: 'Pool', cluster: 'Cluster', service: 'Service' }
    rows = [
      ['Type', node.type?.toUpperCase()],
      ['Subtype', subtypeLabels[node.subtype] || node.subtype],
      ['Data Center', node.datacenter],
    ]
    statusValue = node.status
  } else if (nodeType === 'datacenter') {
    rows = [
      ['Region', node.region],
      ['Identifier', node.label],
    ]
    statusValue = node.status
  } else if (nodeType === 'indicatorGroup') {
    const indicators = node.indicators || []
    const redCount = indicators.filter(i => i.health === 'red').length
    const amberCount = indicators.filter(i => i.health === 'amber').length
    const greenCount = indicators.filter(i => i.health === 'green').length
    rows = [
      ['Component', node.componentId],
      ['Total Indicators', indicators.length],
    ]
    if (redCount > 0) rows.push(['Red', redCount])
    if (amberCount > 0) rows.push(['Amber', amberCount])
    if (greenCount > 0) rows.push(['Green', greenCount])
    title = `Indicators (${indicators.length})`
    statusValue = redCount > 0 ? 'critical' : amberCount > 0 ? 'warning' : 'healthy'
  } else if (nodeType === 'indicator') {
    const typeLabels = { process_group: 'Process Group', service: 'Service', synthetic: 'Synthetic', 'Process Group': 'Process Group', 'Service': 'Service', 'Synthetic': 'Synthetic' }
    rows = [
      ['Type', typeLabels[node.indicator_type] || node.indicator_type],
      ['Health', node.health?.toUpperCase()],
      ['Component', node.component],
    ]
    statusValue = node.health === 'red' ? 'critical' : node.health === 'amber' ? 'warning' : 'healthy'
  }

  const layerLabel = {
    service: 'COMPONENT', platform: 'PLATFORM',
    datacenter: 'DATA CENTER', indicator: 'INDICATOR',
    indicatorGroup: 'HEALTH INDICATORS',
    external: 'UPSTREAM / DOWNSTREAM',
  }[nodeType] || 'NODE'

  const layerColor = {
    service: '#1565C0',
    platform: '#C27BA0',
    datacenter: '#5DA5A0',
    indicator: '#94a3b8',
    indicatorGroup: '#94a3b8',
    external: '#78716c',
  }[nodeType] || '#94a3b8'

  const HEALTH_COLORS = { red: '#f44336', amber: '#ff9800', green: '#4caf50' }
  const HEALTH_LABELS = { red: 'RED', amber: 'AMBER', green: 'GREEN' }

  return (
    <Card sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid rgba(128,128,128,0.2)' }}>
      <CardHeader
        title={
          <Box>
            <Typography sx={{ fontSize: '0.62rem', color: layerColor, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.25 }}>
              {layerLabel}
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
              {title}
            </Typography>
          </Box>
        }
        subheader={statusValue && <StatusChip status={statusValue} />}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {rows.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ textAlign: 'right' }}>
                {value ?? '\u2014'}
              </Typography>
            </Box>
          ))}
        </Stack>
        {nodeType === 'indicatorGroup' && (node.indicators || []).length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 0.5, color: 'text.secondary', mb: 1 }}>
              Health Indicators
            </Typography>
            <Stack spacing={1}>
              {(node.indicators || []).map((ind, i) => {
                const hColor = HEALTH_COLORS[ind.health] || '#94a3b8'
                const typeLabels = { process_group: 'Process Group', service: 'Service', synthetic: 'Synthetic', 'Process Group': 'Process Group', 'Service': 'Service', 'Synthetic': 'Synthetic' }
                const typeLabel = typeLabels[ind.indicator_type] || ind.indicator_type
                return (
                  <Box
                    key={ind.id || i}
                    component="button"
                    onClick={() => {/* future: navigate to external source */}}
                    sx={{
                      border: '1px solid',
                      borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                      borderLeft: `3px solid ${hColor}`,
                      borderRadius: 1,
                      px: 1.25, py: 0.75,
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Chip
                        label={typeLabel}
                        size="small"
                        sx={{
                          height: 16, fontSize: '0.52rem', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: 0.3,
                          bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.12)',
                          color: 'text.secondary',
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: hColor }} />
                        <Typography sx={{ fontSize: '0.52rem', fontWeight: 700, color: hColor, textTransform: 'uppercase' }}>
                          {HEALTH_LABELS[ind.health] || 'UNKNOWN'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem', fontWeight: 600, display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        color: 'text.primary',
                      }}
                    >
                      {ind.label}
                    </Typography>
                  </Box>
                )
              })}
            </Stack>
          </>
        )}
        {nodeType === 'external' && node.external_seal && (
          <>
            <Divider sx={{ my: 1 }} />
            <Box
              onClick={() => onNavigateToSeal?.(node.external_seal)}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                py: 0.6, px: 1, borderRadius: 1,
                cursor: 'pointer',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.18)' : 'rgba(21,101,192,0.10)',
                border: '1.5px solid', borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.5)' : 'rgba(21,101,192,0.35)',
                transition: 'all 0.18s',
                '&:hover': {
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.30)' : 'rgba(21,101,192,0.18)',
                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.7)' : 'rgba(21,101,192,0.5)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(21,101,192,0.2)',
                },
              }}
            >
              <RadarIcon sx={{ fontSize: 13, color: '#1565C0' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#1565C0' }}>
                View {node.external_seal_label} Blast Radius
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#1565C0', lineHeight: 1 }}>{'\u2192'}</Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}


// ── Main page ───────────────────────────────────────────────────────────────
export default function GraphLayers() {
  const { activeFilters } = useFilters()
  const [searchParams] = useSearchParams()
  const urlSeal = searchParams.get('seal') || ''

  const availableSeals = useMemo(() => {
    const sealFilter = activeFilters.seal || []
    if (sealFilter.length === 0) return ALL_SEALS
    const rawSeals = sealFilter.map(parseSealDisplay)
    const filtered = ALL_SEALS.filter(s => rawSeals.includes(s.seal))
    // Always include the URL seal so navigating from another page works
    if (urlSeal && !filtered.find(s => s.seal === urlSeal)) {
      const urlEntry = ALL_SEALS.find(s => s.seal === urlSeal)
      if (urlEntry) filtered.unshift(urlEntry)
    }
    return filtered
  }, [activeFilters, urlSeal])
  const [selectedSeal, setSelectedSeal] = useState(urlSeal)
  const [apiData, setApiData]           = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [sidebarTab, setSidebarTab]     = useState(0)
  const [sidebarOpen, setSidebarOpen]   = useState(false)

  const [layers, setLayers] = useState({
    component:  true,
    crossapp:   true,
    platform:   false,
    datacenter: false,
    indicator:  false,
  })

  // If navigated here with a ?seal= param, always honour it
  useEffect(() => {
    if (urlSeal && urlSeal !== selectedSeal) {
      setSelectedSeal(urlSeal)
    }
  }, [urlSeal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first available seal only when no seal is selected
  useEffect(() => {
    if (!selectedSeal && availableSeals.length > 0) {
      setSelectedSeal(availableSeals[0].seal)
    }
  }, [availableSeals, selectedSeal])

  useEffect(() => {
    if (!selectedSeal) { setApiData(null); return }
    setLoading(true)
    setError(null)
    setSelectedNode(null)
    setSidebarTab(0)
    fetch(`/api/graph/layers/${selectedSeal}`)
      .then(r => { if (!r.ok) throw new Error('Graph fetch failed'); return r.json() })
      .then(setApiData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedSeal])

  const toggleLayer = useCallback((key) => {
    setLayers(prev => {
      const next = { ...prev, [key]: !prev[key] }
      if (key === 'platform' && !next.platform) next.datacenter = false
      return next
    })
  }, [])

  const handleNodeSelect = useCallback((nodeData) => {
    setSelectedNode(nodeData)
    setSidebarTab(1)
  }, [])

  // Dynamically measure top offset — tracks ScopeBar collapse/expand transitions
  const containerRef = useRef(null)
  const [topOffset, setTopOffset] = useState(0)
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setTopOffset(containerRef.current.getBoundingClientRect().top)
    }
    measure()
    window.addEventListener('resize', measure)
    const observer = new ResizeObserver(measure)
    // Watch the scope bar directly so we catch its max-height transition
    const scopeBar = document.getElementById('scope-bar')
    if (scopeBar) observer.observe(scopeBar)
    // Also watch our own container in case anything else shifts layout
    if (containerRef.current) observer.observe(containerRef.current)
    return () => { window.removeEventListener('resize', measure); observer.disconnect() }
  }, [])

  return (
    <Box ref={containerRef} sx={{ height: `calc(100vh - ${topOffset}px)`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Controls bar — dropdown + title + executive summary + layer toggles */}
      <Box sx={{
        bgcolor: (t) => {
          if (!apiData) return t.palette.background.paper
          const nodes = apiData.components?.nodes || []
          const crit = nodes.filter(n => n.status === 'critical').length
          const warn = nodes.filter(n => n.status === 'warning').length
          const lc = crit >= 2 ? '#f44336' : crit === 1 ? '#ff6b6b' : warn >= 2 ? '#ff9800' : warn === 1 ? '#ffd54f' : '#4caf50'
          return t.palette.mode === 'dark' ? `${lc}08` : `${lc}06`
        },
        borderBottom: '1px solid', borderColor: 'divider',
        px: { xs: 1.5, sm: 2 }, py: 0.75,
        display: 'flex', alignItems: 'center', gap: 1.25,
        flexShrink: 0, flexWrap: 'nowrap', overflow: 'hidden',
      }}>
        {/* SEAL dropdown (typeable) */}
        <Autocomplete
          size="small"
          options={availableSeals}
          getOptionLabel={(opt) => `${opt.label} — ${opt.seal}`}
          value={availableSeals.find(s => s.seal === selectedSeal) || null}
          onChange={(_e, val) => setSelectedSeal(val ? val.seal : '')}
          disableClearable={!!selectedSeal}
          sx={{ minWidth: 260, flexShrink: 0 }}
          renderOption={(props, opt) => (
            <li {...props} key={opt.seal}>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {opt.label}
                <Typography component="span"
                  sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace', ml: 1.5 }}>
                  &mdash; {opt.seal}
                </Typography>
              </Typography>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search application…"
              sx={{ '& .MuiInputBase-input': { fontSize: '0.85rem' },
                    '& .MuiOutlinedInput-root': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } }}
            />
          )}
        />

        {/* Inline executive summary (impact + KPIs + narrative) */}
        {apiData && <InlineExecutiveSummary apiData={apiData} seal={selectedSeal} />}
      </Box>

      {/* Graph + sidebar */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Graph canvas */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {/* Layer toggles — floating top-left over graph */}
          <Stack direction="column" spacing={0.5} sx={{
            position: 'absolute', top: 10, left: 10, zIndex: 20,
            pointerEvents: 'auto',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(6px)',
            borderRadius: 2, px: 0.75, py: 0.75,
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            alignItems: 'flex-start',
          }}>
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase', color: 'text.secondary', px: 0.5,
            }}>
              Layers Toggle (on/off)
            </Typography>
            {LAYER_DEFS.map(d => {
              const isActive = d.always || layers[d.key]
              const isDisabled = d.requires && !layers[d.requires]
              return (
                <Chip
                  key={d.key}
                  label={d.label}
                  size="small"
                  icon={isActive ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                  clickable={!d.always}
                  disabled={isDisabled}
                  onClick={d.always ? undefined : () => toggleLayer(d.key)}
                  variant={isActive ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600, fontSize: '0.68rem', height: 26,
                    bgcolor: isActive ? `${d.color}18` : 'transparent',
                    color: isDisabled ? 'text.disabled' : d.color,
                    borderColor: isDisabled ? 'divider' : `${d.color}40`,
                    '& .MuiChip-icon': { color: d.color },
                    ...(!d.always && {
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isActive ? `${d.color}28` : `${d.color}12`,
                        borderColor: `${d.color}70`,
                        boxShadow: `0 0 0 1px ${d.color}30`,
                      },
                    }),
                  }}
                />
              )
            })}
          </Stack>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(10,14,26,0.75)' : 'rgba(241,245,249,0.75)' }}>
              <CircularProgress />
            </Box>
          )}
          {error && <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>}
          {!selectedSeal && !loading && !error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 1.5 }}>
              <LayersIcon sx={{ fontSize: 64, color: 'rgba(128,128,128,0.15)' }} />
              <Typography variant="body2" color="text.secondary">
                Choose an application from the dropdown above
              </Typography>
            </Box>
          )}
          {selectedSeal && !error && (
            <>
              <LayeredDependencyFlow
                apiData={apiData}
                activeLayers={layers}
                onNodeSelect={handleNodeSelect}
              />
            </>
          )}
        </Box>

        {/* Mobile sidebar toggle */}
        <IconButton
          onClick={() => setSidebarOpen(o => !o)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'absolute', bottom: 16, right: 16, zIndex: 20,
            bgcolor: 'primary.main', color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            boxShadow: 3,
          }}
        >
          {sidebarOpen ? <CloseIcon /> : <InfoOutlinedIcon />}
        </IconButton>

        {/* Right sidebar */}
        <Box sx={{
          width: { xs: '100%', md: 280 }, flexShrink: 0,
          borderLeft: { md: '1px solid' },
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: { xs: sidebarOpen ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column', overflow: 'hidden',
          position: { xs: 'absolute', md: 'static' },
          right: 0, top: 0, bottom: 0, zIndex: 15,
          maxWidth: { xs: 320, md: 280 },
          boxShadow: { xs: sidebarOpen ? 8 : 0, md: 'none' },
        }}>
          {apiData ? (
            <>
              <Tabs
                value={sidebarTab}
                onChange={(_, v) => setSidebarTab(v)}
                variant="fullWidth"
                sx={{
                  flexShrink: 0,
                  borderBottom: '1px solid', borderColor: 'divider',
                  minHeight: 40,
                  '& .MuiTab-root': { minHeight: 40, fontSize: '0.75rem', textTransform: 'none', color: 'text.secondary' },
                  '& .Mui-selected': { color: 'primary.main' },
                  '& .MuiTabs-indicator': { height: 2 },
                }}
              >
                <Tab label="Overview" />
                <Tab label="Node Details" />
              </Tabs>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                {sidebarTab === 0 && <DependencyOverview apiData={apiData} activeLayers={layers} seal={selectedSeal} />}
                {sidebarTab === 1 && <NodeDetailPanel node={selectedNode} onNavigateToSeal={setSelectedSeal} />}
              </Box>
            </>
          ) : (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              <NodeDetailPanel node={null} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
