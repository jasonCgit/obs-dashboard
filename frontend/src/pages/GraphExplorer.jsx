import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Chip, Divider, CircularProgress, Alert, Stack,
  Card, CardContent, CardHeader, Select, FormControl, MenuItem,
  Tabs, Tab, IconButton,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CloseIcon        from '@mui/icons-material/Close'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import RadarIcon       from '@mui/icons-material/Radar'
import ErrorIcon       from '@mui/icons-material/Error'
import WarningIcon     from '@mui/icons-material/Warning'
import TrendingUpIcon  from '@mui/icons-material/TrendingUp'
import DependencyFlow  from '../components/DependencyFlow'

// ── Scenario definitions ──────────────────────────────────────────────────────
const SCENARIOS = [
  {
    label:     'Advisor Connect',
    seal:      '90176',
    id:        'connect-profile-svc',
    rootCause: 'Profile service degradation driven by upstream coverage app latency spikes. Shared DB connection pool nearing exhaustion across multiple CONNECT services, causing cascading read timeouts and elevated response times.',
    businessProcesses: [
      { name: 'Client Profile Lookup',     status: 'warning',  desc: 'Profile retrieval via coverage app' },
      { name: 'Coverage Plan Generation',  status: 'critical', desc: 'Advisor coverage and assignment flows' },
      { name: 'Notification Delivery',     status: 'warning',  desc: 'Client alerts via messaging pipeline' },
      { name: 'Document Sync',             status: 'warning',  desc: 'Cross-service document replication' },
      { name: 'Audit Trail Recording',     status: 'healthy',  desc: 'Compliance event logging' },
    ],
  },
  {
    label:     'Spectrum Portfolio Mgmt (Equities)',
    seal:      '90215',
    id:        'spieq-api-gateway',
    rootCause: 'API gateway experiencing intermittent trade submission failures. Pricing engine timeouts are cascading into the risk service — 6+ incidents in 30 days with spikes correlating to market open windows.',
    businessProcesses: [
      { name: 'Trade Execution',       status: 'critical', desc: 'Order submission and fill routing' },
      { name: 'Real-time Pricing',     status: 'critical', desc: 'Market data aggregation and distribution' },
      { name: 'Risk Assessment',       status: 'warning',  desc: 'Pre-trade and post-trade risk checks' },
      { name: 'Settlement Processing', status: 'healthy',  desc: 'T+1 trade settlement workflow' },
      { name: 'Compliance Reporting',  status: 'healthy',  desc: 'Regulatory audit trail generation' },
    ],
  },
  {
    label:     'Connect OS',
    seal:      '88180',
    id:        'connect-cloud-gw',
    rootCause: 'Cloud gateway load balancer misconfiguration causing uneven traffic distribution. Multiple downstream home application instances across APAC and EMEA regions reporting degraded performance and elevated error rates.',
    businessProcesses: [
      { name: 'User Authentication & SSO', status: 'healthy',  desc: 'Centralised login and token management' },
      { name: 'Home App Rendering',        status: 'warning',  desc: 'NA/APAC/EMEA portal page assembly' },
      { name: 'Team Management',           status: 'healthy',  desc: 'Org hierarchy and role assignment' },
      { name: 'Global Search',             status: 'healthy',  desc: 'Cross-platform content discovery' },
      { name: 'Session Management',        status: 'warning',  desc: 'Distributed session state and caching' },
    ],
  },
]

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_COLORS = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }

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

// ── Executive summary banner (above graph) ────────────────────────────────────
function ExecutiveSummaryPanel({ graphData, scenario }) {
  if (!graphData?.root) return null

  const root = graphData.root
  const deps = graphData.dependencies || []
  const allServices = [root, ...deps]

  const critical = allServices.filter(s => s.status === 'critical')
  const warning  = allServices.filter(s => s.status === 'warning')
  const degraded = critical.length + warning.length
  const totalInc = allServices.reduce((sum, s) => sum + (s.incidents_30d || 0), 0)

  const allTeams = {}
  allServices.forEach(s => { if (s.team) allTeams[s.team] = (allTeams[s.team] || 0) + 1 })
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
    { label: 'Total Services',  value: allServices.length, color: '#94a3b8' },
    { label: 'Degraded',        value: degraded,           color: degraded > 0 ? '#ff9800' : '#4caf50' },
    { label: 'Incidents / 30d', value: totalInc,           color: totalInc > 10 ? '#f44336' : totalInc > 4 ? '#ff9800' : '#94a3b8' },
    { label: 'Teams',           value: teamCount,          color: '#94a3b8' },
  ]

  return (
    <Box sx={{
      bgcolor: `${levelColor}09`,
      borderBottom: `1px solid ${levelColor}28`,
      px: 3, py: 1.5,
      display: 'flex', alignItems: 'center', gap: 3,
      flexShrink: 0, flexWrap: 'wrap',
    }}>
      {/* Level badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
        <RadarIcon sx={{ fontSize: 18, color: levelColor }} />
        <Box>
          <Typography sx={{ color: levelColor, fontWeight: 800, letterSpacing: 0.9, fontSize: '0.75rem', lineHeight: 1 }}>
            {level}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2, mt: 0.2 }}>
            IMPACT LEVEL
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: '1px', height: 32, bgcolor: `${levelColor}28`, flexShrink: 0 }} />

      {/* KPIs */}
      <Stack direction="row" spacing={3} sx={{ flexShrink: 0 }}>
        {kpis.map(k => (
          <Box key={k.label} sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, lineHeight: 1, color: k.color }}>{k.value}</Typography>
            <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', mt: 0.25, whiteSpace: 'nowrap' }}>{k.label}</Typography>
          </Box>
        ))}
      </Stack>

      <Box sx={{ width: '1px', height: 32, bgcolor: 'rgba(128,128,128,0.25)', flexShrink: 0 }} />

      {/* Incident trend + root cause */}
      <Box sx={{ flexGrow: 1, minWidth: 200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
          <TrendingUpIcon sx={{ fontSize: 15, color: totalInc > 5 ? '#f44336' : '#ff9800' }} />
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: totalInc > 5 ? '#f44336' : '#ff9800', letterSpacing: 0.4 }}>
            {totalInc} incidents in 30 days
            {critical.length > 0 && ` · ${critical.length} critical service${critical.length > 1 ? 's' : ''}`}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary"
          sx={{ fontSize: '0.8rem', lineHeight: 1.55, display: 'block' }}>
          {scenario?.rootCause ?? 'Select a scenario to see the root cause analysis.'}
        </Typography>
      </Box>
    </Box>
  )
}

// ── Node detail panel (sidebar) ───────────────────────────────────────────────
function NodeDetailPanel({ node }) {
  if (!node) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <AccountTreeIcon sx={{ fontSize: 40, opacity: 0.2, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Click a node to view details
        </Typography>
      </Box>
    )
  }
  const rows = [
    ['Service ID',    node.id],
    ['Team',          node.team],
    ['SLA',           node.sla],
    ['Incidents 30d', node.incidents_30d],
  ]
  return (
    <Card sx={{ bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid rgba(128,128,128,0.2)' }}>
      <CardHeader
        title={
          <Typography variant="body1" fontWeight={700} sx={{ wordBreak: 'break-word', lineHeight: 1.3 }}>
            {node.label}
          </Typography>
        }
        subheader={<StatusChip status={node.status} />}
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {rows.map(([label, value]) => (
            <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="caption" fontWeight={600} color="text.primary" sx={{ textAlign: 'right' }}>
                {value ?? '—'}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}

// ── Dependency overview panel (sidebar) ───────────────────────────────────────
function DependencyOverview({ graphData, scenario }) {
  if (!graphData?.dependencies) return null

  const deps    = graphData.dependencies
  const critical = deps.filter(s => s.status === 'critical')
  const warning  = deps.filter(s => s.status === 'warning')
  const healthy  = deps.filter(s => s.status === 'healthy')

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

  const bpStatusColor = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }
  const businessProcesses = scenario?.businessProcesses || []

  return (
    <Box>
      <Typography variant="caption" color="text.secondary"
        sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', display: 'block', mb: 1 }}>
        Dependency Health
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
      {businessProcesses.length > 0 && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem', display: 'block', mb: 1 }}>
            Business Processes
          </Typography>
          <Stack spacing={0.75}>
            {businessProcesses.map(bp => (
              <Box key={bp.name} sx={{
                p: 1, borderRadius: 1.5,
                border: '1px solid',
                borderColor: `${bpStatusColor[bp.status]}30`,
                bgcolor: `${bpStatusColor[bp.status]}08`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.72rem', lineHeight: 1.3 }}>
                    {bp.name}
                  </Typography>
                  <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: bpStatusColor[bp.status], flexShrink: 0 }} />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                  {bp.desc}
                </Typography>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Box>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GraphExplorer() {
  const [serviceList,      setServiceList]      = useState([])
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0].id)
  const [activeScenario,   setActiveScenario]   = useState(SCENARIOS[0])
  const [graphData,        setGraphData]         = useState(null)
  const [selectedNode,     setSelectedNode]      = useState(null)
  const [loading,          setLoading]           = useState(false)
  const [error,            setError]             = useState(null)
  const [sidebarTab,       setSidebarTab]        = useState(0)
  const [sidebarOpen,      setSidebarOpen]       = useState(false)

  // Load service list once
  useEffect(() => {
    fetch('/api/graph/nodes')
      .then(r => r.json())
      .then(setServiceList)
      .catch(() => {})
  }, [])

  // Fetch dependency graph when scenario changes
  useEffect(() => {
    if (!activeScenario) { setGraphData(null); return }
    setLoading(true)
    setError(null)
    setSelectedNode(null)
    setSidebarTab(0)
    fetch(`/api/graph/dependencies/${activeScenario.id}`)
      .then(r => { if (!r.ok) throw new Error('Graph fetch failed'); return r.json() })
      .then(setGraphData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [activeScenario])

  const handleScenarioSelect = useCallback((scenarioId) => {
    setSelectedScenario(scenarioId)
    const found = SCENARIOS.find(s => s.id === scenarioId)
    setActiveScenario(found || null)
  }, [])

  const handleNodeSelect = useCallback((nodeData) => {
    setSelectedNode(nodeData)
    setSidebarTab(1)
  }, [])

  const graphTitle = activeScenario
    ? `${activeScenario.label} · SEAL ${activeScenario.seal}`
    : 'Select a dependency graph'

  const depCount = graphData?.dependencies?.length ?? null

  return (
    <Box sx={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Controls bar */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: { xs: 1.5, sm: 3 }, py: 1.5,
        display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2.5 },
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Scenario dropdown */}
        <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 300 } }}>
          <Select
            value={selectedScenario}
            onChange={(e) => handleScenarioSelect(e.target.value)}
            displayEmpty
            sx={{
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              fontSize: '0.88rem',
              color: selectedScenario ? 'text.primary' : 'text.secondary',
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.88rem', color: 'text.secondary', fontStyle: 'italic' }}>
              Select a dependency graph…
            </MenuItem>
            {SCENARIOS.map(s => (
              <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.88rem' }}>
                {s.label}
                <Typography component="span"
                  sx={{ fontSize: '0.75rem', color: 'text.secondary', fontFamily: 'monospace', ml: 1.5 }}>
                  — SEAL {s.seal}
                </Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Title area */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
            {graphTitle}
          </Typography>
          {depCount !== null && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {depCount} downstream {depCount === 1 ? 'dependency' : 'dependencies'}
            </Typography>
          )}
        </Box>

        {/* Status chips (shown when graph loaded) */}
        {graphData && (
          <Stack direction="row" spacing={1}>
            {[
              { label: 'Critical', count: graphData.dependencies?.filter(s => s.status === 'critical').length, color: '#f44336' },
              { label: 'Warning',  count: graphData.dependencies?.filter(s => s.status === 'warning').length,  color: '#ff9800' },
            ].filter(c => c.count > 0).map(c => (
              <Chip
                key={c.label}
                label={`${c.count} ${c.label}`}
                size="small"
                sx={{ bgcolor: `${c.color}18`, color: c.color, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Executive summary banner */}
      <ExecutiveSummaryPanel graphData={graphData} scenario={activeScenario} />

      {/* Graph + sidebar */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Graph canvas */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center',
              justifyContent: 'center', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(10,14,26,0.75)' : 'rgba(241,245,249,0.75)' }}>
              <CircularProgress />
            </Box>
          )}
          {error && <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>}
          {!activeScenario && !loading && !error && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', gap: 1.5 }}>
              <AccountTreeIcon sx={{ fontSize: 64, color: 'rgba(128,128,128,0.15)' }} />
              <Typography variant="body2" color="text.secondary">
                Choose a dependency graph from the dropdown above
              </Typography>
            </Box>
          )}
          {activeScenario && !error && (
            <DependencyFlow apiData={graphData} mode="dependencies" onNodeSelect={handleNodeSelect} />
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
          {graphData ? (
            <>
              <Tabs
                value={sidebarTab}
                onChange={(_, v) => setSidebarTab(v)}
                variant="fullWidth"
                sx={{
                  flexShrink: 0,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
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
                {sidebarTab === 0 && <DependencyOverview graphData={graphData} scenario={activeScenario} />}
                {sidebarTab === 1 && <NodeDetailPanel node={selectedNode} />}
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
