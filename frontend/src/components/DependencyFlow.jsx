import { memo, useState, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
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
  healthy:  { border: '#4caf50', text: '#4caf50', bgDark: 'rgba(76,175,80,0.12)',  bgLight: 'rgba(76,175,80,0.16)' },
  warning:  { border: '#ff9800', text: '#ff9800', bgDark: 'rgba(255,152,0,0.12)',  bgLight: 'rgba(255,152,0,0.16)' },
  critical: { border: '#f44336', text: '#f44336', bgDark: 'rgba(244,67,54,0.12)',  bgLight: 'rgba(244,67,54,0.16)' },
}
const defaultStatus = { border: '#64748b', text: '#64748b', bgDark: 'rgba(100,116,139,0.12)', bgLight: 'rgba(100,116,139,0.16)' }

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
      bgcolor: isDark ? s.bgDark : s.bgLight,
      border: `1.5px solid ${s.border}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 160,
      maxWidth: 240,
      opacity: selected ? 1 : 0.92,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.15)',
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
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 16,
  })

  const isHighlighted = data?.highlighted
  const edgeColor = data?.color || '#64748b'
  const activeColor = isHighlighted ? edgeColor : '#64748b'
  const strokeWidth = isHighlighted ? 2.5 : (isDark ? 1.4 : 1.8)
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

// Padding added to each node's dimensions so dagre routes edges around them
const NODE_PAD_X = 16
const NODE_PAD_Y = 10
const ROOT_W = 210
const ROOT_H = 62
const SVC_W  = 190
const SVC_H  = 50

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

  // Compute per-node edge counts to assign weights
  const edgeCount = {}
  validEdges.forEach(e => {
    edgeCount[e.source] = (edgeCount[e.source] || 0) + 1
    edgeCount[e.target] = (edgeCount[e.target] || 0) + 1
  })

  // Create dagre graph
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 60,       // vertical gap between nodes in same rank
    edgesep: 20,       // minimum gap between adjacent edges
    ranksep: 220,      // horizontal gap between ranks
    marginx: 60,
    marginy: 40,
    ranker: 'tight-tree',  // produces tighter tree layouts with fewer crossings
  })

  // Add root node with padding so edges route around the full visual area
  g.setNode(root.id, { width: ROOT_W + NODE_PAD_X, height: ROOT_H + NODE_PAD_Y })

  // Add service nodes with padding
  serviceList.forEach(svc => {
    g.setNode(svc.id, { width: SVC_W + NODE_PAD_X, height: SVC_H + NODE_PAD_Y })
  })

  // Add edges with weight hints — higher-connectivity nodes get heavier edges
  // to keep them closer to center, reducing crossings
  validEdges.forEach(e => {
    const srcDeg = edgeCount[e.source] || 1
    const tgtDeg = edgeCount[e.target] || 1
    const weight = Math.max(1, Math.round((srcDeg + tgtDeg) / 3))
    g.setEdge(e.source, e.target, { weight, minlen: 1 })
  })

  // Run dagre layout
  dagre.layout(g)

  // Build ReactFlow nodes from dagre positions
  const rfNodes = [
    {
      id: root.id,
      type: 'root',
      position: {
        x: g.node(root.id).x - ROOT_W / 2,
        y: g.node(root.id).y - ROOT_H / 2,
      },
      data: { ...root },
    },
    ...serviceList.map(svc => {
      const pos = g.node(svc.id)
      return {
        id: svc.id,
        type: 'service',
        position: {
          x: pos.x - SVC_W / 2,
          y: pos.y - SVC_H / 2,
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
  const [highlightedEdges, setHighlightedEdges] = useState(new Set())
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  useEffect(() => {
    const { nodes: rfNodes, edges: rfEdges } = buildGraphElements(apiData, mode)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setHighlightedEdges(new Set())
  }, [apiData, mode, setNodes, setEdges])

  // Apply highlight/dim styling based on highlightedEdges set
  const applyHighlights = useCallback((highlighted) => {
    const hasAny = highlighted.size > 0
    setEdges(prev => prev.map(e => ({
      ...e,
      data: {
        ...e.data,
        highlighted: highlighted.has(e.id),
        dimmed: hasAny && !highlighted.has(e.id),
      },
    })))
  }, [setEdges])

  const onNodeClick = useCallback((_evt, node) => {
    const isCtrl = _evt.ctrlKey || _evt.metaKey
    onNodeSelect?.(node.data)

    // Find edges connected to this node
    setHighlightedEdges(prev => {
      const connectedIds = new Set()
      edges.forEach(e => {
        if (e.source === node.id || e.target === node.id) connectedIds.add(e.id)
      })

      let next
      if (isCtrl) {
        // Add connected edges to existing selection
        next = new Set(prev)
        connectedIds.forEach(id => next.add(id))
      } else {
        next = connectedIds
      }
      applyHighlights(next)
      return next
    })
  }, [onNodeSelect, edges, applyHighlights])

  // Highlight edge(s) when clicked — Ctrl+click adds to selection
  const onEdgeClick = useCallback((_evt, edge) => {
    const isCtrl = _evt.ctrlKey || _evt.metaKey

    // Show target node details
    const targetNode = nodes.find(n => n.id === edge.target)
    if (targetNode) onNodeSelect?.(targetNode.data)

    setHighlightedEdges(prev => {
      let next
      if (isCtrl) {
        next = new Set(prev)
        if (next.has(edge.id)) {
          next.delete(edge.id)  // Toggle off if already selected
        } else {
          next.add(edge.id)
        }
      } else {
        next = new Set([edge.id])
      }
      applyHighlights(next)
      return next
    })
  }, [nodes, onNodeSelect, applyHighlights])

  // Click on background to clear selection
  const onPaneClick = useCallback(() => {
    setHighlightedEdges(new Set())
    setEdges(prev => prev.map(e => ({
      ...e,
      data: { ...e.data, highlighted: false, dimmed: false },
    })))
  }, [setEdges])

  const bgColor     = isDark ? '#0a0e1a' : '#ffffff'
  const ctrlBg      = isDark ? '#111827' : '#ffffff'
  const ctrlBorder  = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  const miniMapBg   = isDark ? '#111827' : '#ffffff'
  const miniMapMask = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'

  return (
    <Box sx={{
      width: '100%', height: '100%', bgcolor: bgColor,
      '@keyframes dashdraw': { to: { strokeDashoffset: -9 } },
      // Controls button styling for both modes
      ...(isDark ? {
        '& .react-flow__controls button': {
          bgcolor: '#1e293b',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          '& svg': { fill: '#e2e8f0' },
          '&:hover': { bgcolor: '#334155' },
        },
      } : {
        '& .react-flow__controls button': {
          bgcolor: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          '& svg': { fill: '#334155' },
          '&:hover': { bgcolor: '#f1f5f9' },
        },
      }),
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
        <Background color="transparent" />
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
