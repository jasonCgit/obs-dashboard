import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Chip, CircularProgress, Alert, Stack,
  FormControl, Select, MenuItem, Tabs, Tab, Divider,
  Card, CardContent, CardHeader,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import RadarIcon from '@mui/icons-material/Radar'
import ErrorIcon from '@mui/icons-material/Error'
import WarningIcon from '@mui/icons-material/Warning'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import DependencyFlow from '../../components/DependencyFlow'

const SCENARIOS = [
  {
    label: 'Advisor Connect', seal: '90176', id: 'connect-profile-svc',
    rootCause: 'Profile service degradation driven by upstream coverage app latency spikes.',
    businessProcesses: [
      { name: 'Client Profile Lookup', status: 'warning' },
      { name: 'Coverage Plan Generation', status: 'critical' },
      { name: 'Notification Delivery', status: 'warning' },
    ],
  },
  {
    label: 'Spectrum Portfolio Mgmt (Equities)', seal: '90215', id: 'spieq-api-gateway',
    rootCause: 'API gateway experiencing intermittent trade submission failures.',
    businessProcesses: [
      { name: 'Trade Execution', status: 'critical' },
      { name: 'Real-time Pricing', status: 'critical' },
      { name: 'Risk Assessment', status: 'warning' },
    ],
  },
  {
    label: 'Connect OS', seal: '88180', id: 'connect-cloud-gw',
    rootCause: 'Cloud gateway load balancer misconfiguration causing uneven traffic distribution.',
    businessProcesses: [
      { name: 'Home App Rendering', status: 'warning' },
      { name: 'Session Management', status: 'warning' },
    ],
  },
]

const STATUS_COLORS = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }

function StatusChip({ status }) {
  const color = STATUS_COLORS[status] || '#94a3b8'
  return <Chip label={status?.toUpperCase()} size="small" sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
}

export default function GraphExplorerWidget({ viewFilters }) {
  // Auto-select scenario matching the view's SEAL filter
  const sealValues = viewFilters?.seal || []
  const matchingScenario = SCENARIOS.find(s => sealValues.includes(s.seal)) || SCENARIOS[0]

  const [activeScenario, setActiveScenario] = useState(matchingScenario)
  const [graphData, setGraphData] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    if (!activeScenario) return
    setLoading(true)
    setError(null)
    setSelectedNode(null)
    fetch(`/api/graph/dependencies/${activeScenario.id}`)
      .then(r => { if (!r.ok) throw new Error('Graph fetch failed'); return r.json() })
      .then(setGraphData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [activeScenario])

  const handleNodeSelect = useCallback((nodeData) => {
    setSelectedNode(nodeData)
    setTab(1)
  }, [])

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Compact controls */}
      <Box sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <Select
            value={activeScenario?.id || ''}
            onChange={(e) => setActiveScenario(SCENARIOS.find(s => s.id === e.target.value))}
            sx={{ fontSize: '0.78rem', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
          >
            {SCENARIOS.map(s => (
              <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.78rem' }}>
                {s.label} — SEAL {s.seal}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {graphData && (
          <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
            {[
              { label: 'Critical', count: graphData.dependencies?.filter(s => s.status === 'critical').length, color: '#f44336' },
              { label: 'Warning', count: graphData.dependencies?.filter(s => s.status === 'warning').length, color: '#ff9800' },
            ].filter(c => c.count > 0).map(c => (
              <Chip key={c.label} label={`${c.count} ${c.label}`} size="small"
                sx={{ bgcolor: `${c.color}18`, color: c.color, fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
            ))}
          </Stack>
        )}
      </Box>

      {/* Graph area */}
      <Box sx={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(10,14,26,0.75)' : 'rgba(241,245,249,0.75)' }}>
            <CircularProgress size={28} />
          </Box>
        )}
        {error && <Box sx={{ p: 1.5 }}><Alert severity="error">{error}</Alert></Box>}
        {activeScenario && !error && (
          <DependencyFlow apiData={graphData} mode="dependencies" onNodeSelect={handleNodeSelect} />
        )}
      </Box>
    </Box>
  )
}
