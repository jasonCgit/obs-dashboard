import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box, Typography, Autocomplete, TextField, ToggleButtonGroup, ToggleButton,
  Card, CardContent, CardHeader, Chip, Divider, CircularProgress, Alert, Stack,
} from '@mui/material'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import RadarIcon from '@mui/icons-material/Radar'
import DependencyFlow from '../components/DependencyFlow'

// ── Status chip ───────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  healthy:  '#4caf50',
  warning:  '#ff9800',
  critical: '#f44336',
}

function StatusChip({ status }) {
  const color = STATUS_COLORS[status] || '#94a3b8'
  return (
    <Chip
      label={status?.toUpperCase() || 'UNKNOWN'}
      size="small"
      sx={{ bgcolor: `${color}22`, color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
    />
  )
}

// ── Node detail sidebar ───────────────────────────────────────────────────────
function NodeDetailPanel({ node }) {
  if (!node) {
    return (
      <Box sx={{ color: 'text.secondary', fontSize: '0.8rem', textAlign: 'center', mt: 4 }}>
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
    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GraphExplorer() {
  const [searchParams]     = useSearchParams()
  const [serviceList,      setServiceList]      = useState([])
  const [selectedService,  setSelectedService]  = useState(null)
  const [mode,             setMode]             = useState('dependencies')
  const [graphData,        setGraphData]        = useState(null)
  const [selectedNode,     setSelectedNode]     = useState(null)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState(null)

  // Load service list on mount; auto-select from ?service= param
  useEffect(() => {
    fetch('/api/graph/nodes')
      .then(r => r.json())
      .then(nodes => {
        setServiceList(nodes)
        const paramId = searchParams.get('service')
        if (paramId) {
          const found = nodes.find(n => n.id === paramId)
          if (found) setSelectedService(found)
        }
      })
      .catch(() => setError('Failed to load service list'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch graph data when service or mode changes
  useEffect(() => {
    if (!selectedService) { setGraphData(null); return }

    setLoading(true)
    setError(null)
    setSelectedNode(null)

    const url = mode === 'dependencies'
      ? `/api/graph/dependencies/${selectedService.id}`
      : `/api/graph/blast-radius/${selectedService.id}`

    fetch(url)
      .then(r => { if (!r.ok) throw new Error('Graph fetch failed'); return r.json() })
      .then(setGraphData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedService, mode])

  const handleModeChange = (_, newMode) => {
    if (newMode) setMode(newMode)
  }

  const handleNodeSelect = useCallback((nodeData) => {
    setSelectedNode(nodeData)
  }, [])

  const graphTitle = selectedService
    ? (mode === 'dependencies'
        ? `Dependency Graph — ${selectedService.label?.toUpperCase()}`
        : `Blast Radius — ${selectedService.label?.toUpperCase()}`)
    : 'Select a service to explore'

  // Count shown in subtitle
  const nodeCount = graphData
    ? (mode === 'dependencies'
        ? graphData.dependencies?.length ?? 0
        : graphData.impacted?.length ?? 0)
    : null

  return (
    <Box sx={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Controls bar */}
      <Box sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        px: 3, py: 1.5,
        display: 'flex', alignItems: 'center', gap: 2,
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        {/* Service selector */}
        <Autocomplete
          options={serviceList}
          getOptionLabel={(opt) => opt.label || opt.id}
          value={selectedService}
          onChange={(_, val) => { setSelectedService(val); setSelectedNode(null) }}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Select service..."
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255,255,255,0.05)',
                  fontSize: '0.85rem',
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ fontSize: '0.82rem' }}>
              <Box
                sx={{
                  width: 8, height: 8, borderRadius: '50%', mr: 1, flexShrink: 0,
                  bgcolor: STATUS_COLORS[option.status] || '#64748b',
                }}
              />
              {option.label}
            </Box>
          )}
          sx={{ width: 320 }}
          noOptionsText="No services found"
        />

        {/* Mode toggle */}
        <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small">
          <ToggleButton
            value="dependencies"
            sx={{
              textTransform: 'none', px: 2, fontSize: '0.82rem',
              color: 'text.secondary',
              '&.Mui-selected': { color: '#60a5fa', bgcolor: 'rgba(37,99,235,0.15)', borderColor: 'rgba(37,99,235,0.4)' },
            }}
          >
            <AccountTreeIcon sx={{ fontSize: 16, mr: 0.75 }} />
            Dependencies
          </ToggleButton>
          <ToggleButton
            value="blast"
            sx={{
              textTransform: 'none', px: 2, fontSize: '0.82rem',
              color: 'text.secondary',
              '&.Mui-selected': { color: '#f87171', bgcolor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.4)' },
            }}
          >
            <RadarIcon sx={{ fontSize: 16, mr: 0.75 }} />
            Blast Radius
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Graph title */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
            {graphTitle}
          </Typography>
          {nodeCount !== null && (
            <Typography variant="caption" color="text.secondary">
              {nodeCount} {mode === 'dependencies' ? 'dependencies' : 'impacted services'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Graph + sidebar */}
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Graph canvas */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          {loading && (
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(10,14,26,0.75)',
            }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 3 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          {!selectedService && !loading && !error && (
            <Box sx={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 1,
            }}>
              <AccountTreeIcon sx={{ fontSize: 64, color: 'rgba(255,255,255,0.08)' }} />
              <Typography variant="body2" color="text.secondary">
                Select a service above to explore its dependency graph
              </Typography>
            </Box>
          )}

          {selectedService && !error && (
            <DependencyFlow
              apiData={graphData}
              mode={mode}
              onNodeSelect={handleNodeSelect}
            />
          )}
        </Box>

        {/* Right sidebar */}
        <Box sx={{
          width: 280, flexShrink: 0,
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          bgcolor: 'background.paper',
          p: 2, overflowY: 'auto',
        }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.68rem', display: 'block', mb: 1.5 }}
          >
            Node Details
          </Typography>
          <NodeDetailPanel node={selectedNode} />
        </Box>
      </Box>
    </Box>
  )
}
