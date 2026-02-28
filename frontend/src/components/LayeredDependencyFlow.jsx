import { memo, useState, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dagre from '@dagrejs/dagre'
import { layerNodeTypes, layerEdgeTypes } from './layerNodeTypes'

// ── Color helpers ────────────────────────────────────────────────────────────
const STATUS_EDGE_COLOR = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }
const HEALTH_EDGE_COLOR = { green: '#4caf50', amber: '#ff9800', red: '#f44336' }

// Fallback layer colors (used when node has no status)
const LAYER_EDGE_COLORS = {
  component:  '#5C8CC2',
  platform:   '#C27BA0',
  datacenter: '#5DA5A0',
  indicator:  '#B8976B',
}

// ── Node dimensions per type ────────────────────────────────────────────────
const NODE_DIMS = {
  service:    { w: 190, h: 50 },
  platform:   { w: 160, h: 45 },
  datacenter: { w: 150, h: 55 },
  indicator:  { w: 170, h: 48 },
}
const PAD_X = 40
const PAD_Y = 24

// ── Overlap resolution ────────────────────────────────────────────────────────
// Sorts positioned items by x and pushes apart any that overlap.
function resolveOverlaps(items, nodeWidth, minGap = 50) {
  if (items.length <= 1) return
  items.sort((a, b) => a.x - b.x)
  for (let i = 1; i < items.length; i++) {
    const minX = items[i - 1].x + nodeWidth + minGap
    if (items[i].x < minX) items[i].x = minX
  }
}

// ── Build layered graph (two-phase layout) ──────────────────────────────────
// Phase 1: Dagre for component-to-component layout (LR flow)
// Phase 2: Manual positioning of platform/datacenter/indicator rows below
function buildLayeredGraph(apiData, activeLayers) {
  if (!apiData) return { nodes: [], edges: [] }

  const VERTICAL_GAP = 130

  // ── Phase 1: Dagre for component nodes only ──
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 70,
    edgesep: 25,
    ranksep: 220,
    marginx: 50,
    marginy: 30,
    ranker: 'tight-tree',
  })

  const { nodes: compNodes, edges: compEdges } = apiData.components
  compNodes.forEach(n => {
    const dims = NODE_DIMS.service
    g.setNode(n.id, { width: dims.w + PAD_X, height: dims.h + PAD_Y })
  })
  compEdges.forEach(e => {
    g.setEdge(e.source, e.target, { weight: 1, minlen: 1 })
  })

  dagre.layout(g)

  // Collect component center positions
  const compPos = {}
  compNodes.forEach(n => {
    const p = g.node(n.id)
    compPos[n.id] = { x: p.x, y: p.y }
  })

  const rfNodes = []
  const rfEdges = []

  // Build a lookup: node ID → status color (for edge coloring by target node health)
  const nodeStatusColor = {}
  compNodes.forEach(n => {
    nodeStatusColor[n.id] = STATUS_EDGE_COLOR[n.status] || LAYER_EDGE_COLORS.component
  })
  if (activeLayers.platform) {
    apiData.platform.nodes.forEach(n => {
      nodeStatusColor[n.id] = STATUS_EDGE_COLOR[n.status] || LAYER_EDGE_COLORS.platform
    })
  }
  if (activeLayers.datacenter && activeLayers.platform) {
    apiData.datacenter.nodes.forEach(n => {
      nodeStatusColor[n.id] = STATUS_EDGE_COLOR[n.status] || LAYER_EDGE_COLORS.datacenter
    })
  }
  if (activeLayers.indicator) {
    apiData.indicators.nodes.forEach(n => {
      nodeStatusColor[n.id] = HEALTH_EDGE_COLOR[n.health] || LAYER_EDGE_COLORS.indicator
    })
  }

  // ── Phase 2: Position non-component rows ──
  // Compute the top and bottom edges of the component layer
  const minCompTop = Math.min(
    ...compNodes.map(n => compPos[n.id].y - NODE_DIMS.service.h / 2)
  )
  const maxCompBottom = Math.max(
    ...compNodes.map(n => compPos[n.id].y + NODE_DIMS.service.h / 2)
  )

  // ── Indicator row (ABOVE components) ──
  if (activeLayers.indicator) {
    // Group indicators by parent component
    const compIndicators = {}
    apiData.indicators.nodes.forEach(n => {
      if (!compIndicators[n.component]) compIndicators[n.component] = []
      compIndicators[n.component].push(n)
    })

    const indItems = []
    Object.entries(compIndicators).forEach(([compId, indicators]) => {
      const parentX = compPos[compId]?.x || 0
      const dims = NODE_DIMS.indicator
      const gap = 40
      const totalW = indicators.length * dims.w + (indicators.length - 1) * gap
      const startX = parentX - totalW / 2 + dims.w / 2
      indicators.forEach((n, i) => {
        const x = indicators.length === 1 ? parentX : startX + i * (dims.w + gap)
        indItems.push({ node: n, x })
      })
    })

    resolveOverlaps(indItems, NODE_DIMS.indicator.w, 40)

    const indY = minCompTop - VERTICAL_GAP - NODE_DIMS.indicator.h / 2
    indItems.forEach(({ node: n, x }) => {
      const dims = NODE_DIMS.indicator
      rfNodes.push({
        id: n.id,
        type: 'indicator',
        position: { x: x - dims.w / 2, y: indY - dims.h / 2 },
        zIndex: 10,
        data: { ...n, nodeType: 'indicator' },
      })
    })

    apiData.indicators.edges.forEach(e => {
      rfEdges.push({
        id: `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        sourceHandle: 'top',
        targetHandle: 'bottom',
        type: 'interactive',
        data: { color: nodeStatusColor[e.target] || LAYER_EDGE_COLORS.indicator, highlighted: false, dimmed: false, layerType: 'indicator' },
      })
    })
  }

  // Add component nodes
  compNodes.forEach(n => {
    const pos = compPos[n.id]
    const dims = NODE_DIMS.service
    rfNodes.push({
      id: n.id,
      type: 'service',
      position: { x: pos.x - dims.w / 2, y: pos.y - dims.h / 2 },
      zIndex: 10,
      data: { ...n, nodeType: 'service' },
    })
  })

  // Component-to-component edges (explicit LR handles to avoid auto-routing through top/bottom)
  compEdges.forEach(e => {
    rfEdges.push({
      id: `e-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'interactive',
      data: { color: nodeStatusColor[e.target] || LAYER_EDGE_COLORS.component, highlighted: false, dimmed: false, layerType: 'component' },
    })
  })

  let nextRowY = maxCompBottom + VERTICAL_GAP
  const platformPos = {}

  // ── Platform row (below components) ──
  if (activeLayers.platform) {
    const platParents = {}
    apiData.platform.edges.forEach(e => {
      if (!platParents[e.target]) platParents[e.target] = []
      platParents[e.target].push(e.source)
    })

    const platItems = apiData.platform.nodes.map(n => {
      const parents = platParents[n.id] || []
      const avgX = parents.length > 0
        ? parents.reduce((s, pid) => s + (compPos[pid]?.x || 0), 0) / parents.length
        : 0
      return { node: n, x: avgX }
    })

    resolveOverlaps(platItems, NODE_DIMS.platform.w)

    const platY = nextRowY + NODE_DIMS.platform.h / 2
    platItems.forEach(({ node: n, x }) => {
      platformPos[n.id] = { x, y: platY }
      const dims = NODE_DIMS.platform
      rfNodes.push({
        id: n.id,
        type: 'platform',
        position: { x: x - dims.w / 2, y: platY - dims.h / 2 },
        zIndex: 10,
        data: { ...n, nodeType: 'platform' },
      })
    })

    apiData.platform.edges.forEach(e => {
      rfEdges.push({
        id: `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'interactive',
        data: { color: nodeStatusColor[e.target] || LAYER_EDGE_COLORS.platform, highlighted: false, dimmed: false, layerType: 'platform' },
      })
    })

    nextRowY = platY + NODE_DIMS.platform.h / 2 + VERTICAL_GAP
  }

  // ── Data Center row ──
  if (activeLayers.datacenter && activeLayers.platform) {
    const dcParents = {}
    apiData.datacenter.edges.forEach(e => {
      if (!dcParents[e.target]) dcParents[e.target] = []
      dcParents[e.target].push(e.source)
    })

    const dcItems = apiData.datacenter.nodes.map(n => {
      const parents = dcParents[n.id] || []
      const avgX = parents.length > 0
        ? parents.reduce((s, pid) => s + (platformPos[pid]?.x || 0), 0) / parents.length
        : 0
      return { node: n, x: avgX }
    })

    resolveOverlaps(dcItems, NODE_DIMS.datacenter.w)

    const dcY = nextRowY + NODE_DIMS.datacenter.h / 2
    dcItems.forEach(({ node: n, x }) => {
      const dims = NODE_DIMS.datacenter
      rfNodes.push({
        id: n.id,
        type: 'datacenter',
        position: { x: x - dims.w / 2, y: dcY - dims.h / 2 },
        zIndex: 10,
        data: { ...n, nodeType: 'datacenter' },
      })
    })

    apiData.datacenter.edges.forEach(e => {
      rfEdges.push({
        id: `e-${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'interactive',
        data: { color: nodeStatusColor[e.target] || LAYER_EDGE_COLORS.datacenter, highlighted: false, dimmed: false, layerType: 'datacenter' },
      })
    })

    nextRowY = dcY + NODE_DIMS.datacenter.h / 2 + VERTICAL_GAP
  }

  return { nodes: rfNodes, edges: rfEdges }
}

// ── MiniMap node coloring ───────────────────────────────────────────────────
function miniMapNodeColor(n) {
  if (n.type === 'platform')   return '#C27BA0'
  if (n.type === 'datacenter') return '#5DA5A0'
  if (n.type === 'indicator')  return '#B8976B'
  return '#5C8CC2'  // dusty blue for component nodes
}

// ── Main component ──────────────────────────────────────────────────────────
export default function LayeredDependencyFlow({ apiData, activeLayers, onNodeSelect }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [highlightedEdges, setHighlightedEdges] = useState(new Set())
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Rebuild graph whenever data or layers change
  useEffect(() => {
    const { nodes: rfNodes, edges: rfEdges } = buildLayeredGraph(apiData, activeLayers)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setHighlightedEdges(new Set())
  }, [apiData, activeLayers, setNodes, setEdges])

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

    setHighlightedEdges(prev => {
      const connectedIds = new Set()
      edges.forEach(e => {
        if (e.source === node.id || e.target === node.id) connectedIds.add(e.id)
      })
      let next
      if (isCtrl) {
        next = new Set(prev)
        connectedIds.forEach(id => next.add(id))
      } else {
        next = connectedIds
      }
      applyHighlights(next)
      return next
    })
  }, [onNodeSelect, edges, applyHighlights])

  const onEdgeClick = useCallback((_evt, edge) => {
    const isCtrl = _evt.ctrlKey || _evt.metaKey
    const targetNode = nodes.find(n => n.id === edge.target)
    if (targetNode) onNodeSelect?.(targetNode.data)

    setHighlightedEdges(prev => {
      let next
      if (isCtrl) {
        next = new Set(prev)
        if (next.has(edge.id)) next.delete(edge.id)
        else next.add(edge.id)
      } else {
        next = new Set([edge.id])
      }
      applyHighlights(next)
      return next
    })
  }, [nodes, onNodeSelect, applyHighlights])

  const onPaneClick = useCallback(() => {
    setHighlightedEdges(new Set())
    setEdges(prev => prev.map(e => ({
      ...e,
      data: { ...e.data, highlighted: false, dimmed: false },
    })))
  }, [setEdges])

  const bgColor    = isDark ? '#0a0e1a' : '#f1f5f9'
  const dotColor   = isDark ? '#1e293b' : '#cbd5e1'
  const ctrlBg     = isDark ? '#111827' : '#ffffff'
  const ctrlBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  const miniMapBg  = isDark ? '#111827' : '#ffffff'
  const miniMapMask = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'

  return (
    <Box sx={{
      width: '100%', height: '100%', bgcolor: bgColor,
      '@keyframes dashdraw': { to: { strokeDashoffset: -9 } },
      '@keyframes indicatorFlash': {
        '0%, 100%': { boxShadow: 'none' },
        '50%': { boxShadow: isDark
          ? '0 0 14px rgba(244,67,54,0.5), inset 0 0 6px rgba(244,67,54,0.15)'
          : '0 0 14px rgba(244,67,54,0.35), inset 0 0 6px rgba(244,67,54,0.1)' },
      },
      '@keyframes indicatorDotPulse': {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.4, transform: 'scale(1.4)' },
      },
      // Fix Controls visibility in dark mode
      ...(isDark && {
        '& .react-flow__controls button': {
          bgcolor: '#1e293b',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          '& svg': { fill: '#e2e8f0' },
          '&:hover': { bgcolor: '#334155' },
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
        nodeTypes={layerNodeTypes}
        edgeTypes={layerEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color={dotColor} gap={22} size={1.2} />
        <Controls style={{
          background: ctrlBg,
          border: `1px solid ${ctrlBorder}`,
          borderRadius: 6,
          // Fix dark mode visibility: ensure buttons and SVG icons are visible
          ...(isDark && { '--xy-controls-button-background-color-hover': '#1e293b' }),
        }}
          className={isDark ? 'react-flow-controls-dark' : ''}
        />
        <MiniMap
          nodeColor={miniMapNodeColor}
          style={{ background: miniMapBg, border: `1px solid ${ctrlBorder}`, borderRadius: 6 }}
          maskColor={miniMapMask}
        />
      </ReactFlow>
    </Box>
  )
}
