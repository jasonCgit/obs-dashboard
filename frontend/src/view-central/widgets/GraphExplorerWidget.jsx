import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Typography, Chip, CircularProgress, Alert, Stack,
  Autocomplete, TextField, Tabs, Tab, Divider,
  Card, CardContent, CardHeader, IconButton, Tooltip,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CloseIcon from '@mui/icons-material/Close'
import LayersIcon from '@mui/icons-material/Layers'
import RadarIcon from '@mui/icons-material/Radar'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import LayeredDependencyFlow from '../../components/LayeredDependencyFlow'

// ── All SEALs ────────────────────────────────────────────────────────────────
const ALL_SEALS = [
  { seal: '90176', label: 'Advisor Connect' },
  { seal: '88180', label: 'Connect OS' },
  { seal: '90215', label: 'Spectrum Portfolio Mgmt' },
].sort((a, b) => a.label.localeCompare(b.label))

// ── Layer definitions ────────────────────────────────────────────────────────
const LAYER_DEFS = [
  { key: 'indicator',  label: 'Health Indicators',  color: '#94a3b8' },
  { key: 'component',  label: 'Components',        color: '#1565C0', always: true },
  { key: 'crossapp',   label: 'Upstream / Downstream',  color: '#78716c' },
  { key: 'platform',   label: 'Platform',          color: '#C27BA0' },
  { key: 'datacenter', label: 'Data Centers',       color: '#5DA5A0', requires: 'platform' },
]

// ── Status helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }

function StatusChip({ status }) {
  const color = STATUS_COLORS[status] || '#94a3b8'
  return (
    <Chip
      label={status?.toUpperCase() || 'UNKNOWN'}
      size="small"
      sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: '0.6rem', height: 18 }}
    />
  )
}

// ── SEAL-specific executive narratives ───────────────────────────────────────
const SEAL_NARRATIVES = {
  '88180': 'Intermittent gateway timeouts on Connect Cloud GW impacting downstream portal and home-app services. DNS resolution delays from regional load balancers contributing to elevated P99 latency across APAC data centers.',
  '90176': 'Coverage app and IPBOL account services in critical state, driving cascading degradation across profile and notification pipelines. Shared DB connection pool nearing exhaustion, causing read timeouts and elevated response times across dependent services.',
  '90215': 'Settlement processing backlog due to payment gateway throttling under peak load. API gateway circuit breakers tripping intermittently, causing notification delivery delays and partial trade reconciliation failures across Spectrum services.',
}

// ── SEAL-specific business processes ─────────────────────────────────────────
const SEAL_BUSINESS_PROCESSES = {
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
  '90215': [
    { name: 'Trade Execution',       status: 'critical', desc: 'Order submission and fill routing' },
    { name: 'Real-time Pricing',     status: 'critical', desc: 'Market data aggregation and distribution' },
    { name: 'Risk Assessment',       status: 'critical', desc: 'Pre-trade and post-trade risk checks' },
    { name: 'Settlement Processing', status: 'warning',  desc: 'T+1 trade settlement workflow' },
    { name: 'Compliance Reporting',  status: 'healthy',  desc: 'Regulatory audit trail generation' },
  ],
}

// ── Compact executive summary (inline in controls bar) ───────────────────────
function InlineExecutiveSummary({ apiData, seal }) {
  const compNodes = apiData.components?.nodes || []
  const critical = compNodes.filter(s => s.status === 'critical')
  const warning  = compNodes.filter(s => s.status === 'warning')
  const degraded = critical.length + warning.length
  const totalInc = compNodes.reduce((sum, s) => sum + (s.incidents_30d || 0), 0)

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

  return (
    <>
      <Box sx={{ width: '1px', height: 20, bgcolor: `${levelColor}28`, flexShrink: 0 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
        <RadarIcon sx={{ fontSize: 17, color: levelColor }} />
        <Box>
          <Typography sx={{ color: levelColor, fontWeight: 800, letterSpacing: 0.9, fontSize: '0.82rem', lineHeight: 1 }}>
            {level}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2, mt: 0.15 }}>
            IMPACT
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" spacing={1.2} sx={{ flexShrink: 0 }}>
        {[
          { label: 'Services', value: compNodes.length, color: '#94a3b8' },
          { label: 'Degraded', value: degraded, color: degraded > 0 ? '#ff9800' : '#4caf50' },
        ].map(k => (
          <Box key={k.label} sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, lineHeight: 1, color: k.color }}>{k.value}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.15, whiteSpace: 'nowrap' }}>{k.label}</Typography>
          </Box>
        ))}
      </Stack>
      {totalInc > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, flexShrink: 0 }}>
          <TrendingUpIcon sx={{ fontSize: 14, color: totalInc > 5 ? '#f44336' : '#ff9800' }} />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: totalInc > 5 ? '#f44336' : '#ff9800', whiteSpace: 'nowrap' }}>
            {totalInc} inc/30d
          </Typography>
        </Box>
      )}
      <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
        <Typography sx={{
          fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.35,
          color: (t) => t.palette.mode === 'dark' ? '#ffffff' : '#000000',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {SEAL_NARRATIVES[seal] || 'All services operating within normal parameters.'}
        </Typography>
      </Box>
    </>
  )
}

// ── Dependency overview panel (sidebar) ──────────────────────────────────────
function DependencyOverview({ apiData, seal }) {
  if (!apiData?.components?.nodes) return null

  const deps     = apiData.components.nodes
  const critical = deps.filter(s => s.status === 'critical')
  const warning  = deps.filter(s => s.status === 'warning')
  const healthy  = deps.filter(s => s.status === 'healthy')

  const hotspots = [...deps]
    .filter(s => (s.incidents_30d || 0) > 0)
    .sort((a, b) => (b.incidents_30d || 0) - (a.incidents_30d || 0))
    .slice(0, 5)
  const maxInc = Math.max(...hotspots.map(s => s.incidents_30d || 0), 1)

  const rows = [
    { label: 'Critical', count: critical.length, color: '#f44336' },
    { label: 'Warning',  count: warning.length,  color: '#ff9800' },
    { label: 'Healthy',  count: healthy.length,   color: '#4caf50' },
  ]

  return (
    <Box>
      <Typography variant="caption" color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem', display: 'block', mb: 0.75 }}>
        Component Health
      </Typography>
      <Stack spacing={0.4} sx={{ mb: 1.5 }}>
        {rows.map(({ label, count, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" sx={{ color, fontSize: '0.68rem', fontWeight: 600 }}>{label}</Typography>
            </Box>
            <Typography variant="caption" sx={{ color, fontWeight: 700, fontSize: '0.68rem' }}>{count}</Typography>
          </Box>
        ))}
      </Stack>

      {hotspots.length > 0 && (
        <>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem', display: 'block', mb: 0.75 }}>
            Incident Hotspots (30d)
          </Typography>
          <Stack spacing={0.6}>
            {hotspots.map(s => (
              <Box key={s.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                    {s.label.split('~~')[0]}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700,
                    color: STATUS_COLORS[s.status] || '#94a3b8' }}>
                    {s.incidents_30d}
                  </Typography>
                </Box>
                <Box sx={{ height: 2.5, borderRadius: 2, bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
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

      {seal && SEAL_BUSINESS_PROCESSES[seal] && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.62rem', display: 'block', mb: 0.75 }}>
            Business Processes
          </Typography>
          <Stack spacing={0.5}>
            {SEAL_BUSINESS_PROCESSES[seal].map(bp => {
              const bpColor = STATUS_COLORS[bp.status] || '#94a3b8'
              return (
                <Box key={bp.name} sx={{
                  p: 0.75, borderRadius: 1,
                  border: '1px solid', borderColor: `${bpColor}30`,
                  bgcolor: `${bpColor}08`,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.15 }}>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                      {bp.name}
                    </Typography>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: bpColor, flexShrink: 0 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.58rem', lineHeight: 1.3 }}>
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

// ── Node detail panel (sidebar) ──────────────────────────────────────────────
function NodeDetailPanel({ node, onNavigateToSeal }) {
  if (!node) {
    return (
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <LayersIcon sx={{ fontSize: 32, opacity: 0.2, mb: 0.75 }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
          Click a node to view details
        </Typography>
      </Box>
    )
  }

  const nodeType = node.nodeType || 'service'

  let rows = []
  let statusValue = null

  if (nodeType === 'service' || nodeType === 'external') {
    rows = [['Team', node.team], ['SLO Status', node.sla], ['Incidents 30d', node.incidents_30d]]
    statusValue = node.status
    if (nodeType === 'external') {
      const dirLabel = node.cross_direction === 'upstream' ? 'Upstream' : node.cross_direction === 'both' ? 'Up/Downstream' : 'Downstream'
      rows.push(['Application', node.external_seal_label], ['Direction', dirLabel])
    }
  } else if (nodeType === 'platform') {
    const subtypeLabels = { pool: 'Pool', cluster: 'Cluster', service: 'Service' }
    rows = [['Type', node.type?.toUpperCase()], ['Subtype', subtypeLabels[node.subtype] || node.subtype], ['Data Center', node.datacenter]]
    statusValue = node.status
  } else if (nodeType === 'datacenter') {
    rows = [['Region', node.region], ['Identifier', node.label]]
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
    statusValue = redCount > 0 ? 'critical' : amberCount > 0 ? 'warning' : 'healthy'
  } else if (nodeType === 'indicator') {
    const typeLabels = { process_group: 'Process Group', service: 'Service', synthetic: 'Synthetic', 'Process Group': 'Process Group', 'Service': 'Service', 'Synthetic': 'Synthetic' }
    rows = [['Type', typeLabels[node.indicator_type] || node.indicator_type], ['Health', node.health?.toUpperCase()], ['Component', node.component]]
    statusValue = node.health === 'red' ? 'critical' : node.health === 'amber' ? 'warning' : 'healthy'
  }

  const title = nodeType === 'indicatorGroup' ? `Indicators (${(node.indicators || []).length})` : node.label
  const layerLabel = { service: 'COMPONENT', platform: 'PLATFORM', datacenter: 'DATA CENTER', indicator: 'INDICATOR', indicatorGroup: 'HEALTH INDICATORS', external: 'UPSTREAM / DOWNSTREAM' }[nodeType] || 'NODE'
  const layerColor = { service: '#1565C0', platform: '#C27BA0', datacenter: '#5DA5A0', indicator: '#B8976B', indicatorGroup: '#B8976B', external: '#78716c' }[nodeType] || '#94a3b8'

  const HEALTH_COLORS = { red: '#f44336', amber: '#ff9800', green: '#4caf50' }
  const HEALTH_LABELS = { red: 'RED', amber: 'AMBER', green: 'GREEN' }

  return (
    <Card sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid rgba(128,128,128,0.2)' }}>
      <CardHeader
        title={
          <Box>
            <Typography sx={{ fontSize: '0.55rem', color: layerColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.15 }}>
              {layerLabel}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ wordBreak: 'break-word', lineHeight: 1.3, fontSize: '0.78rem' }}>
              {title}
            </Typography>
          </Box>
        }
        subheader={statusValue && <StatusChip status={statusValue} />}
        sx={{ pb: 0.5, pt: 1, px: 1.5 }}
      />
      <CardContent sx={{ pt: 0, px: 1.5, pb: '8px !important' }}>
        <Divider sx={{ mb: 1 }} />
        <Stack spacing={0.6}>
          {rows.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{label}</Typography>
              <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ textAlign: 'right', fontSize: '0.65rem' }}>
                {value ?? '\u2014'}
              </Typography>
            </Box>
          ))}
        </Stack>
        {nodeType === 'indicatorGroup' && (node.indicators || []).length > 0 && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: 0.5, color: 'text.secondary', mb: 0.75 }}>
              Indicators
            </Typography>
            <Stack spacing={0.4}>
              {(node.indicators || []).map((ind, i) => {
                const hColor = HEALTH_COLORS[ind.health] || '#94a3b8'
                const typeLabels = { process_group: 'Process Group', service: 'Service', synthetic: 'Synthetic', 'Process Group': 'Process Group', 'Service': 'Service', 'Synthetic': 'Synthetic' }
                return (
                  <Box key={ind.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: hColor, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, display: 'block',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ind.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: '0.52rem', color: 'text.secondary' }}>
                        {typeLabels[ind.indicator_type] || ind.indicator_type}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.48rem', fontWeight: 700, color: hColor, textTransform: 'uppercase', flexShrink: 0 }}>
                      {HEALTH_LABELS[ind.health] || 'UNKNOWN'}
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
                py: 0.75, px: 1, borderRadius: 1,
                cursor: 'pointer',
                bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.18)' : 'rgba(21,101,192,0.10)',
                border: '1.5px solid', borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.5)' : 'rgba(21,101,192,0.35)',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.30)' : 'rgba(21,101,192,0.18)',
                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(21,101,192,0.7)' : 'rgba(21,101,192,0.5)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 6px rgba(21,101,192,0.2)',
                },
              }}
            >
              <RadarIcon sx={{ fontSize: 14, color: '#1565C0' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#1565C0' }}>
                View {node.external_seal_label}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#1565C0', lineHeight: 1, fontWeight: 700 }}>{'\u2192'}</Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main widget ──────────────────────────────────────────────────────────────
export default function GraphExplorerWidget({ viewFilters }) {
  const sealValues = viewFilters?.seal || []
  const matchingSeal = ALL_SEALS.find(s => sealValues.includes(s.seal))?.seal || ALL_SEALS[0].seal

  const [selectedSeal, setSelectedSeal] = useState(matchingSeal)
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Controls bar */}
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
        px: 1.5, py: 0.5,
        display: 'flex', alignItems: 'center', gap: 1,
        flexShrink: 0, flexWrap: 'nowrap', overflow: 'hidden',
      }}>
        <Autocomplete
          size="small"
          options={ALL_SEALS}
          getOptionLabel={(opt) => `${opt.label} — ${opt.seal}`}
          value={ALL_SEALS.find(s => s.seal === selectedSeal) || null}
          onChange={(_e, val) => val && setSelectedSeal(val.seal)}
          disableClearable
          sx={{ minWidth: 220, flexShrink: 0 }}
          renderOption={(props, opt) => (
            <li {...props} key={opt.seal}>
              <Typography sx={{ fontSize: '0.75rem' }}>
                {opt.label}
                <Typography component="span" sx={{ fontSize: '0.65rem', color: 'text.secondary', fontFamily: 'monospace', ml: 1 }}>
                  &mdash; {opt.seal}
                </Typography>
              </Typography>
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search application…"
              sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem' },
                    '& .MuiOutlinedInput-root': { bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' } }}
            />
          )}
        />

        {apiData && <InlineExecutiveSummary apiData={apiData} seal={selectedSeal} />}
      </Box>

      {/* Graph + sidebar */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Graph canvas */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {/* Layer toggles — floating top-left */}
          <Stack direction="column" spacing={0.4} sx={{
            position: 'absolute', top: 8, left: 8, zIndex: 20,
            pointerEvents: 'auto',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(6px)',
            borderRadius: 1.5, px: 0.6, py: 0.5,
            border: '1px solid', borderColor: 'divider',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            alignItems: 'flex-start',
          }}>
            <Typography sx={{
              fontSize: '0.52rem', fontWeight: 700, letterSpacing: 0.8,
              textTransform: 'uppercase', color: 'text.secondary', px: 0.4,
            }}>
              Layers
            </Typography>
            {LAYER_DEFS.map(d => {
              const isActive = d.always || layers[d.key]
              const isDisabled = d.requires && !layers[d.requires]
              return (
                <Chip
                  key={d.key}
                  label={d.label}
                  size="small"
                  icon={isActive ? <CheckIcon sx={{ fontSize: '12px !important' }} /> : undefined}
                  clickable={!d.always}
                  disabled={isDisabled}
                  onClick={d.always ? undefined : () => toggleLayer(d.key)}
                  variant={isActive ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600, fontSize: '0.6rem', height: 22,
                    bgcolor: isActive ? `${d.color}18` : 'transparent',
                    color: isDisabled ? 'text.disabled' : d.color,
                    borderColor: isDisabled ? 'divider' : `${d.color}40`,
                    '& .MuiChip-icon': { color: d.color },
                    ...(!d.always && {
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: isActive ? `${d.color}28` : `${d.color}12`,
                        borderColor: `${d.color}70`,
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
              <CircularProgress size={24} />
            </Box>
          )}
          {error && <Box sx={{ p: 1.5 }}><Alert severity="error" sx={{ fontSize: '0.72rem' }}>{error}</Alert></Box>}
          {selectedSeal && !error && (
            <LayeredDependencyFlow
              apiData={apiData}
              activeLayers={layers}
              onNodeSelect={handleNodeSelect}
            />
          )}
        </Box>

        {/* Sidebar toggle (mobile) */}
        <IconButton
          onClick={() => setSidebarOpen(o => !o)}
          size="small"
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'absolute', bottom: 8, right: 8, zIndex: 20,
            bgcolor: 'primary.main', color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            boxShadow: 2, width: 28, height: 28,
          }}
        >
          {sidebarOpen ? <CloseIcon sx={{ fontSize: 14 }} /> : <InfoOutlinedIcon sx={{ fontSize: 14 }} />}
        </IconButton>

        {/* Right sidebar */}
        <Box sx={{
          width: { xs: '100%', md: 220 }, flexShrink: 0,
          borderLeft: { md: '1px solid' }, borderColor: 'divider',
          bgcolor: 'background.paper',
          display: { xs: sidebarOpen ? 'flex' : 'none', md: 'flex' },
          flexDirection: 'column', overflow: 'hidden',
          position: { xs: 'absolute', md: 'static' },
          right: 0, top: 0, bottom: 0, zIndex: 15,
          maxWidth: { xs: 260, md: 220 },
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
                  minHeight: 32,
                  '& .MuiTab-root': { minHeight: 32, fontSize: '0.65rem', textTransform: 'none', color: 'text.secondary', py: 0.5 },
                  '& .Mui-selected': { color: 'primary.main' },
                  '& .MuiTabs-indicator': { height: 2 },
                }}
              >
                <Tab label="Overview" />
                <Tab label="Node Details" />
              </Tabs>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
                {sidebarTab === 0 && <DependencyOverview apiData={apiData} seal={selectedSeal} />}
                {sidebarTab === 1 && <NodeDetailPanel node={selectedNode} onNavigateToSeal={setSelectedSeal} />}
              </Box>
            </>
          ) : (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.5 }}>
              <NodeDetailPanel node={null} />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
