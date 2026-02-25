import { memo, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography } from '@mui/material'

// ── Status color map ──────────────────────────────────────────────────────────
const STATUS = {
  healthy:  { border: '#4caf50', text: '#4caf50', bg: 'rgba(76,175,80,0.12)' },
  warning:  { border: '#ff9800', text: '#ff9800', bg: 'rgba(255,152,0,0.12)' },
  critical: { border: '#f44336', text: '#f44336', bg: 'rgba(244,67,54,0.12)' },
}
const defaultStatus = { border: '#64748b', text: '#64748b', bg: 'rgba(100,116,139,0.12)' }

// ── Custom node: root (selected service) ─────────────────────────────────────
const RootNode = memo(({ data, selected }) => {
  const s = STATUS[data.status] || defaultStatus
  return (
    <Box sx={{
      bgcolor: '#1e293b',
      border: `2.5px solid ${s.border}`,
      borderRadius: 2,
      px: 2, py: 1.5,
      minWidth: 170,
      maxWidth: 230,
      boxShadow: selected ? `0 0 14px ${s.border}60` : 'none',
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: s.border }} />
      <Handle type="source" position={Position.Right} style={{ background: s.border }} />
      <Typography sx={{ fontSize: '0.6rem', color: s.text, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.25 }}>
        ROOT · {data.status}
      </Typography>
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'white',
        wordBreak: 'break-word', lineHeight: 1.3 }}>
        {data.label}
      </Typography>
    </Box>
  )
})

// ── Custom node: service (dependency or impacted node) ───────────────────────
const ServiceNode = memo(({ data, selected }) => {
  const s = STATUS[data.status] || defaultStatus
  return (
    <Box sx={{
      bgcolor: s.bg,
      border: `1.5px solid ${s.border}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 155,
      maxWidth: 240,
      opacity: selected ? 1 : 0.9,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      '&:hover': { boxShadow: `0 0 8px ${s.border}50` },
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: s.border }} />
      <Handle type="source" position={Position.Right} style={{ background: s.border }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.border, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.62rem', color: s.text, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {data.status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.76rem', color: 'white', wordBreak: 'break-word', lineHeight: 1.3 }}>
        {data.label}
      </Typography>
    </Box>
  )
})

// MUST be at module scope — never inside a React component
const nodeTypes = { root: RootNode, service: ServiceNode }

// ── Fan layout algorithm ──────────────────────────────────────────────────────
function buildGraphElements(apiData, mode) {
  if (!apiData) return { nodes: [], edges: [] }

  const { root, dependencies, impacted, edges: apiEdges } = apiData
  const serviceList = mode === 'dependencies' ? (dependencies || []) : (impacted || [])
  const count = serviceList.length

  const totalHeight = Math.max(count * 70, 200)
  const startY      = 400 - totalHeight / 2
  const nodeStep    = count > 1 ? totalHeight / (count - 1) : 0

  const rootX    = mode === 'dependencies' ? 80  : 620
  const serviceX = mode === 'dependencies' ? 620 : 80

  const rfNodes = [
    {
      id:   root.id,
      type: 'root',
      position: { x: rootX, y: 400 - 32 },
      data: { ...root },
    },
    ...serviceList.map((svc, i) => ({
      id:   svc.id,
      type: 'service',
      position: {
        x: serviceX,
        y: count === 1 ? 400 - 25 : startY + i * nodeStep,
      },
      data: { ...svc },
    })),
  ]

  const rfEdges = (apiEdges || []).map((e) => ({
    id:     `e-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    type:   'smoothstep',
    style:  { stroke: '#334155', strokeWidth: 1.5 },
  }))

  return { nodes: rfNodes, edges: rfEdges }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DependencyFlow({ apiData, mode, onNodeSelect }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    const { nodes: rfNodes, edges: rfEdges } = buildGraphElements(apiData, mode)
    setNodes(rfNodes)
    setEdges(rfEdges)
  }, [apiData, mode, setNodes, setEdges])

  const onNodeClick = useCallback((_evt, node) => {
    onNodeSelect?.(node.data)
  }, [onNodeSelect])

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={22} size={1.2} />
        <Controls
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const s = n.data?.status
            return s === 'critical' ? '#f44336' : s === 'warning' ? '#ff9800' : '#4caf50'
          }}
          style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
          }}
          maskColor="rgba(0,0,0,0.5)"
        />
      </ReactFlow>
    </Box>
  )
}
