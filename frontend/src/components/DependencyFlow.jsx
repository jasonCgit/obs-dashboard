import { memo, useState, useEffect, useCallback } from 'react'
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
  getSmoothStepPath,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dagre from '@dagrejs/dagre'

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
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  return (
    <Box sx={{
      bgcolor: isDark ? '#1e293b' : '#e2e8f0',
      border: `2.5px solid ${s.border}`,
      borderRadius: 2,
      px: 2, py: 1.5,
      minWidth: 180,
      maxWidth: 240,
      boxShadow: selected ? `0 0 14px ${s.border}60` : `0 2px 8px rgba(0,0,0,0.15)`,
      cursor: 'pointer',
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: s.border, width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: s.border, width: 6, height: 6 }} />
      <Typography sx={{ fontSize: '0.62rem', color: s.text, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: 0.8, mb: 0.25 }}>
        ROOT · {data.status}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: isDark ? 'white' : '#0f172a',
        wordBreak: 'break-word', lineHeight: 1.3 }}>
        {data.label}
      </Typography>
    </Box>
  )
})

// ── Custom node: service (dependency or impacted node) ───────────────────────
const ServiceNode = memo(({ data, selected }) => {
  const s = STATUS[data.status] || defaultStatus
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  return (
    <Box sx={{
      bgcolor: s.bg,
      border: `1.5px solid ${s.border}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 160,
      maxWidth: 240,
      opacity: selected ? 1 : 0.92,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: `0 0 8px ${s.border}50` },
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: s.border, width: 5, height: 5 }} />
      <Handle type="source" position={Position.Right} style={{ background: s.border, width: 5, height: 5 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.border, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.62rem', color: s.text, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {data.status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.76rem', color: isDark ? 'white' : '#0f172a',
        wordBreak: 'break-word', lineHeight: 1.3 }}>
        {data.label}
      </Typography>
    </Box>
  )
})

// MUST be at module scope — never inside a React component
const nodeTypes = { root: RootNode, service: ServiceNode }

// ── Custom interactive edge ─────────────────────────────────────────────
const InteractiveEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {}, data, selected,
}) => {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 16,
  })

  const isHighlighted = data?.highlighted
  const edgeColor = data?.color || '#64748b'
  const activeColor = isHighlighted ? edgeColor : '#64748b'
  const strokeWidth = isHighlighted ? 2.5 : 1.4
  const opacity = data?.dimmed ? 0.2 : 1

  return (
    <g style={{ cursor: 'pointer', opacity }}>
      {/* Invisible wider path for easier click targeting */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
      />
      {/* Glow effect when highlighted */}
      {isHighlighted && (
        <path
          d={edgePath}
          fill="none"
          stroke={activeColor}
          strokeWidth={6}
          strokeOpacity={0.2}
          style={{ filter: `drop-shadow(0 0 4px ${activeColor})` }}
        />
      )}
      {/* Main edge path */}
      <path
        d={edgePath}
        fill="none"
        stroke={activeColor}
        strokeWidth={strokeWidth}
        className={isHighlighted ? 'react-flow__edge-path animated' : 'react-flow__edge-path'}
        style={{
          strokeDasharray: isHighlighted ? '6 3' : 'none',
          animation: isHighlighted ? 'dashdraw 0.5s linear infinite' : 'none',
        }}
      />
      {/* Arrow at target end */}
      {isHighlighted && (
        <circle
          cx={targetX}
          cy={targetY}
          r={4}
          fill={activeColor}
          stroke={activeColor}
          strokeWidth={1}
        />
      )}
    </g>
  )
})

const edgeTypes = { interactive: InteractiveEdge }

// ── Dagre-based hierarchical layout ─────────────────────────────────────────
function buildGraphElements(apiData, mode) {
  if (!apiData) return { nodes: [], edges: [] }

  const { root, dependencies, impacted, edges: apiEdges } = apiData
  const serviceList = mode === 'dependencies' ? (dependencies || []) : (impacted || [])

  // Build node map for quick lookup
  const allNodeMap = {}
  allNodeMap[root.id] = root
  serviceList.forEach(s => { allNodeMap[s.id] = s })

  // Filter edges to only include nodes in our set
  const validEdges = (apiEdges || []).filter(
    e => e.source in allNodeMap && e.target in allNodeMap
  )

  // Create dagre graph
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 55,
    ranksep: 220,
    marginx: 60,
    marginy: 40,
    ranker: 'network-simplex',
  })

  // Add root node (slightly larger)
  g.setNode(root.id, { width: 210, height: 62 })

  // Add service nodes
  serviceList.forEach(svc => {
    g.setNode(svc.id, { width: 190, height: 50 })
  })

  // Add edges
  validEdges.forEach(e => {
    g.setEdge(e.source, e.target)
  })

  // Run dagre layout
  dagre.layout(g)

  // Build ReactFlow nodes from dagre positions
  const rfNodes = [
    {
      id: root.id,
      type: 'root',
      position: {
        x: g.node(root.id).x - 105,
        y: g.node(root.id).y - 31,
      },
      data: { ...root },
    },
    ...serviceList.map(svc => {
      const pos = g.node(svc.id)
      return {
        id: svc.id,
        type: 'service',
        position: {
          x: pos.x - 95,
          y: pos.y - 25,
        },
        data: { ...svc },
      }
    }),
  ]

  // Build edges with status-based coloring
  const rfEdges = validEdges.map((e) => {
    const sourceNode = allNodeMap[e.source]
    const targetNode = allNodeMap[e.target]
    // Edge color = worst status of source or target
    const worstStatus =
      sourceNode?.status === 'critical' || targetNode?.status === 'critical' ? 'critical'
      : sourceNode?.status === 'warning' || targetNode?.status === 'warning' ? 'warning'
      : 'healthy'
    const edgeColor = (STATUS[worstStatus] || defaultStatus).border
    return {
      id:     `e-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      type:   'interactive',
      data:   { color: edgeColor, highlighted: false, dimmed: false },
    }
  })

  return { nodes: rfNodes, edges: rfEdges }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DependencyFlow({ apiData, mode, onNodeSelect }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedEdgeId, setSelectedEdgeId] = useState(null)
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  useEffect(() => {
    const { nodes: rfNodes, edges: rfEdges } = buildGraphElements(apiData, mode)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setSelectedEdgeId(null)
  }, [apiData, mode, setNodes, setEdges])

  // Highlight connected edges when a node is clicked
  const highlightConnectedEdges = useCallback((nodeId) => {
    setSelectedEdgeId(null)
    setEdges(prev => prev.map(e => ({
      ...e,
      data: {
        ...e.data,
        highlighted: e.source === nodeId || e.target === nodeId,
        dimmed: nodeId ? (e.source !== nodeId && e.target !== nodeId) : false,
      },
    })))
  }, [setEdges])

  const onNodeClick = useCallback((_evt, node) => {
    onNodeSelect?.(node.data)
    highlightConnectedEdges(node.id)
  }, [onNodeSelect, highlightConnectedEdges])

  // Highlight a single edge when clicked
  const onEdgeClick = useCallback((_evt, edge) => {
    setSelectedEdgeId(edge.id)
    setEdges(prev => prev.map(e => ({
      ...e,
      data: {
        ...e.data,
        highlighted: e.id === edge.id,
        dimmed: e.id !== edge.id,
      },
    })))
    // Also select the target node to show details
    const targetNode = nodes.find(n => n.id === edge.target)
    if (targetNode) onNodeSelect?.(targetNode.data)
  }, [setEdges, nodes, onNodeSelect])

  // Click on background to clear selection
  const onPaneClick = useCallback(() => {
    setSelectedEdgeId(null)
    setEdges(prev => prev.map(e => ({
      ...e,
      data: { ...e.data, highlighted: false, dimmed: false },
    })))
  }, [setEdges])

  const bgColor     = isDark ? '#0a0e1a' : '#f1f5f9'
  const dotColor    = isDark ? '#1e293b' : '#cbd5e1'
  const ctrlBg      = isDark ? '#111827' : '#ffffff'
  const ctrlBorder  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  const miniMapBg   = isDark ? '#111827' : '#ffffff'
  const miniMapMask = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'

  return (
    <Box sx={{
      width: '100%', height: '100%', bgcolor: bgColor,
      '@keyframes dashdraw': { to: { strokeDashoffset: -9 } },
    }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color={dotColor} gap={22} size={1.2} />
        <Controls
          style={{
            background: ctrlBg,
            border: `1px solid ${ctrlBorder}`,
            borderRadius: 6,
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const s = n.data?.status
            return s === 'critical' ? '#f44336' : s === 'warning' ? '#ff9800' : '#4caf50'
          }}
          style={{
            background: miniMapBg,
            border: `1px solid ${ctrlBorder}`,
            borderRadius: 6,
          }}
          maskColor={miniMapMask}
        />
      </ReactFlow>
    </Box>
  )
}
