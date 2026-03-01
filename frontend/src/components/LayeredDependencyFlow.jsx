import { memo, useState, useEffect, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import dagre from '@dagrejs/dagre'
import { layerNodeTypes, layerEdgeTypes } from './layerNodeTypes'

// ── Color helpers ────────────────────────────────────────────────────────────
const STATUS_EDGE_COLOR = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336', no_data: '#78909c' }
const HEALTH_EDGE_COLOR = { green: '#4caf50', amber: '#ff9800', red: '#f44336' }

// Fallback layer colors (used when node has no status)
const LAYER_EDGE_COLORS = {
  component:  '#1565C0',
  platform:   '#C27BA0',
  datacenter: '#5DA5A0',
  indicator:  '#94a3b8',
}

// ── Node dimensions per type ────────────────────────────────────────────────
const NODE_DIMS = {
  service:    { w: 190, h: 50 },
  platform:   { w: 160, h: 45 },
  datacenter: { w: 150, h: 55 },
  indicator:  { w: 170, h: 48 },
}
const PAD_X = 50
const PAD_Y = 30

// ── Overlap resolution (center-preserving) ────────────────────────────────────
// Sorts items by x, pushes apart overlaps, then re-centers to minimise drift
// from ideal (parent-aligned) positions — keeps vertical edges as straight as possible.
function resolveOverlaps(items, nodeWidth, minGap = 50) {
  if (items.length <= 1) return
  items.sort((a, b) => a.x - b.x)
  const origCenter = items.reduce((s, it) => s + it.x, 0) / items.length
  for (let i = 1; i < items.length; i++) {
    const minX = items[i - 1].x + nodeWidth + minGap
    if (items[i].x < minX) items[i].x = minX
  }
  const newCenter = items.reduce((s, it) => s + it.x, 0) / items.length
  const drift = origCenter - newCenter
  items.forEach(it => { it.x += drift })
}

// ── Edge-avoidance nudge for sub-layer rows ──────────────────────────────────
// Detects if a node sits in the horizontal shadow of a cross-layer edge
// it's NOT connected to, and nudges it to the nearest clear side.
function nudgeFromEdgePaths(items, edges, sourcePos, nodeWidth) {
  if (items.length <= 1) return
  const itemMap = new Map(items.map(it => [it.node.id, it]))
  const halfW = nodeWidth / 2
  const margin = 20

  // Collect edge X-spans (source center → target center)
  const spans = []
  edges.forEach(e => {
    const srcX = sourcePos[e.source]?.x
    const tgtItem = itemMap.get(e.target)
    if (srcX == null || !tgtItem) return
    spans.push({
      lo: Math.min(srcX, tgtItem.x),
      hi: Math.max(srcX, tgtItem.x),
      targetId: e.target,
    })
  })
  if (spans.length === 0) return

  // Up to 3 iterations to settle
  for (let iter = 0; iter < 3; iter++) {
    let moved = false
    items.forEach(item => {
      for (const span of spans) {
        if (item.node.id === span.targetId) continue
        const nL = item.x - halfW - margin
        const nR = item.x + halfW + margin
        if (nR > span.lo && nL < span.hi) {
          // Node overlaps edge shadow — nudge to nearest clear side
          const dL = item.x - span.lo
          const dR = span.hi - item.x
          item.x = dL <= dR
            ? span.lo - halfW - margin
            : span.hi + halfW + margin
          moved = true
        }
      }
    })
    if (!moved) break
  }
  // Re-resolve overlaps after nudging
  resolveOverlaps(items, nodeWidth, 80)
}

// ── Clamp sub-layer items to stay inside the internal component bounds ──────
// Prevents indicator / platform / datacenter nodes from drifting into
// the upstream or downstream external-node zones.
// Uses bounded push-apart (no re-centering) so items never escape the bounds.
function clampToZoneBounds(items, nodeWidth, upColX, downColX) {
  if (items.length === 0 || (upColX == null && downColX == null)) return

  const zoneHalfW = (NODE_DIMS.service.w + 120) / 2  // 155 — matches zone background width
  const clearance = zoneHalfW + nodeWidth / 2 + 20    // zone edge + node edge + visual gap
  const leftLimit  = upColX   != null ? upColX   + clearance : -Infinity
  const rightLimit = downColX != null ? downColX - clearance :  Infinity
  const minGap = 30

  // 1. Hard-clamp every item inside bounds
  items.forEach(item => {
    if (item.x < leftLimit)  item.x = leftLimit
    if (item.x > rightLimit) item.x = rightLimit
  })

  // 2. Push apart left-to-right (no centering drift)
  items.sort((a, b) => a.x - b.x)
  for (let i = 1; i < items.length; i++) {
    const minX = items[i - 1].x + nodeWidth + minGap
    if (items[i].x < minX) items[i].x = minX
  }

  // 3. If rightmost overflows, compress back from the right
  if (isFinite(rightLimit) && items[items.length - 1].x > rightLimit) {
    items[items.length - 1].x = rightLimit
    for (let i = items.length - 2; i >= 0; i--) {
      const maxX = items[i + 1].x - nodeWidth - minGap
      if (items[i].x > maxX) items[i].x = maxX
    }
  }

  // 4. If leftmost underflows after compression, clamp again
  if (isFinite(leftLimit) && items[0].x < leftLimit) {
    items[0].x = leftLimit
    for (let i = 1; i < items.length; i++) {
      const minX = items[i - 1].x + nodeWidth + minGap
      if (items[i].x < minX) items[i].x = minX
    }
  }
}

// ── Build layered graph (two-phase layout) ──────────────────────────────────
// Phase 1: Dagre for component-to-component layout (LR flow)
// Phase 2: Manual positioning of platform/datacenter/indicator rows below
function buildLayeredGraph(apiData, activeLayers) {
  if (!apiData) return { nodes: [], edges: [] }

  const VERTICAL_GAP = 80

  // ── Phase 1: Dagre for component nodes only ──
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: 'LR',
    nodesep: 25,
    edgesep: 15,
    ranksep: 90,
    marginx: 30,
    marginy: 20,
    ranker: 'network-simplex',
  })

  const { nodes: compNodes, edges: compEdges, external_nodes: extNodesRaw = [] } = apiData.components
  const showCrossApp = activeLayers.crossapp !== false
  const extNodes = showCrossApp ? extNodesRaw : []
  const extIds = new Set(extNodes.map(n => n.id))
  compNodes.forEach(n => {
    const dims = NODE_DIMS.service
    g.setNode(n.id, { width: dims.w + PAD_X, height: dims.h + PAD_Y })
  })
  extNodes.forEach(n => {
    const dims = NODE_DIMS.service
    g.setNode(n.id, { width: dims.w + PAD_X, height: dims.h + PAD_Y })
  })
  // Only include edges that have both endpoints in the graph
  const activeEdges = compEdges.filter(e => {
    const isCross = extIds.has(e.source) || extIds.has(e.target)
    return !isCross || showCrossApp
  })
  activeEdges.forEach(e => {
    g.setEdge(e.source, e.target, { weight: 1, minlen: 1 })
  })

  dagre.layout(g)

  // Collect component center positions (including external nodes)
  const compPos = {}
  compNodes.forEach(n => {
    const p = g.node(n.id)
    compPos[n.id] = { x: p.x, y: p.y }
  })
  extNodes.forEach(n => {
    const p = g.node(n.id)
    if (p) compPos[n.id] = { x: p.x, y: p.y }
  })

  // ── Enforce upstream/downstream separation ──
  // Push upstream external nodes to a column LEFT of all components,
  // and downstream external nodes to a column RIGHT of all components.
  let upstreamColX = null
  let downstreamColX = null
  if (extNodes.length > 0 && compNodes.length > 0) {
    const compXs = compNodes.map(n => compPos[n.id].x)
    const minCompX = Math.min(...compXs)
    const maxCompX = Math.max(...compXs)
    const compYs = compNodes.map(n => compPos[n.id].y)
    const avgCompY = compYs.reduce((s, y) => s + y, 0) / compYs.length

    const separationGap = 280
    const verticalSpacing = 80

    const upstreamExt = extNodes.filter(n => n.cross_direction === 'upstream')
    const downstreamExt = extNodes.filter(n => n.cross_direction !== 'upstream')

    if (upstreamExt.length > 0) {
      const colX = minCompX - separationGap
      upstreamColX = colX
      const totalH = (upstreamExt.length - 1) * verticalSpacing
      const startY = avgCompY - totalH / 2
      upstreamExt.forEach((n, i) => {
        if (compPos[n.id]) {
          compPos[n.id].x = colX
          compPos[n.id].y = startY + i * verticalSpacing
        }
      })
    }

    if (downstreamExt.length > 0) {
      const colX = maxCompX + separationGap
      downstreamColX = colX
      const totalH = (downstreamExt.length - 1) * verticalSpacing
      const startY = avgCompY - totalH / 2
      downstreamExt.forEach((n, i) => {
        if (compPos[n.id]) {
          compPos[n.id].x = colX
          compPos[n.id].y = startY + i * verticalSpacing
        }
      })
    }
  }

  const rfNodes = []
  const rfEdges = []

  // Build a lookup: node ID → status color (for edge coloring by target node health)
  const nodeStatusColor = {}
  compNodes.forEach(n => {
    nodeStatusColor[n.id] = STATUS_EDGE_COLOR[n.status] || LAYER_EDGE_COLORS.component
  })
  extNodes.forEach(n => {
    nodeStatusColor[n.id] = STATUS_EDGE_COLOR[n.status] || '#78716c'
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
  // (Indicator group colors are registered inside the indicator section below)

  // ── Phase 2: Position non-component rows ──
  // Compute the top and bottom edges of the component layer (include external nodes)
  const allCompLike = [...compNodes, ...extNodes.filter(n => compPos[n.id])]
  const minCompTop = Math.min(
    ...allCompLike.map(n => compPos[n.id].y - NODE_DIMS.service.h / 2)
  )
  const maxCompBottom = Math.max(
    ...allCompLike.map(n => compPos[n.id].y + NODE_DIMS.service.h / 2)
  )

  // ── Indicator row (ABOVE components) — grouped by parent component ──
  // Each group aligns with its parent component's X position. Instead of
  // pushing groups apart horizontally (which spills into zones), overlapping
  // groups are stacked into multiple rows above the component layer.
  if (activeLayers.indicator) {
    const compIndicators = {}
    apiData.indicators.nodes.forEach(n => {
      if (!compIndicators[n.component]) compIndicators[n.component] = []
      compIndicators[n.component].push(n)
    })

    const IND_GROUP_W = 220
    const IND_ROW_H = 18
    const IND_GROUP_TOP = 26   // header + top padding
    const IND_GROUP_BOT = 10   // bottom padding
    const groupHeight = (count) => IND_GROUP_TOP + count * IND_ROW_H + IND_GROUP_BOT

    // Build one layout item per component group, pinned to parent X
    const groupItems = Object.entries(compIndicators)
      .filter(([compId]) => compPos[compId])
      .map(([compId, indicators]) => ({
        compId, indicators,
        x: compPos[compId].x,
        h: groupHeight(indicators.length),
        row: 0,
      }))

    // Sort by X, then assign rows via greedy bin-packing (avoids horizontal overlap)
    groupItems.sort((a, b) => a.x - b.x)
    const rowEnds = []  // rightmost occupied edge per row
    groupItems.forEach(item => {
      const leftEdge = item.x - IND_GROUP_W / 2
      let placed = false
      for (let r = 0; r < rowEnds.length; r++) {
        if (leftEdge >= rowEnds[r] + 12) {   // 12px minimum gap
          item.row = r
          rowEnds[r] = item.x + IND_GROUP_W / 2
          placed = true
          break
        }
      }
      if (!placed) {
        item.row = rowEnds.length
        rowEnds.push(item.x + IND_GROUP_W / 2)
      }
    })

    // Position groups above the component row, stacking rows upward
    const maxGroupH = groupItems.length > 0 ? Math.max(...groupItems.map(g => g.h)) : 50
    const ROW_GAP = 10
    const indBaseY = minCompTop - VERTICAL_GAP

    groupItems.forEach(({ compId, indicators, x, h, row }) => {
      const groupId = `ind-group-${compId}`
      const yOffset = row * (maxGroupH + ROW_GAP)
      // Stagger higher rows horizontally so edges don't stack on top of each other
      // Row 0: 0, Row 1: +35, Row 2: -35, Row 3: +70, ...
      const stagger = row === 0 ? 0 : (row % 2 === 1 ? 1 : -1) * Math.ceil(row / 2) * 120

      rfNodes.push({
        id: groupId,
        type: 'indicatorGroup',
        position: { x: x + stagger - IND_GROUP_W / 2, y: indBaseY - h - yOffset },
        zIndex: 10,
        data: {
          indicators,
          componentId: compId,
          nodeType: 'indicatorGroup',
          width: IND_GROUP_W,
          height: h,
        },
      })

      // Edge color = worst health in group
      const worstHealth = indicators.some(i => i.health === 'red') ? 'red'
        : indicators.some(i => i.health === 'amber') ? 'amber' : 'green'
      const edgeColor = HEALTH_EDGE_COLOR[worstHealth] || LAYER_EDGE_COLORS.indicator

      nodeStatusColor[groupId] = edgeColor

      // Single edge from component → indicator group
      rfEdges.push({
        id: `e-${compId}-${groupId}`,
        source: compId,
        target: groupId,
        sourceHandle: 'top',
        targetHandle: 'bottom',
        type: 'interactive',
        data: { color: edgeColor, highlighted: false, dimmed: false, layerType: 'indicator', direction: 'uni', offset: 40 },
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

  // Add external (cross-app) nodes
  extNodes.forEach(n => {
    const pos = compPos[n.id]
    if (!pos) return
    const dims = NODE_DIMS.service
    rfNodes.push({
      id: n.id,
      type: 'external',
      position: { x: pos.x - dims.w / 2, y: pos.y - dims.h / 2 },
      zIndex: 10,
      data: { ...n, nodeType: 'external' },
    })
  })

  // Component-to-component edges (explicit LR handles to avoid auto-routing through top/bottom)
  activeEdges.forEach(e => {
    const isCrossApp = extIds.has(e.source) || extIds.has(e.target)
    rfEdges.push({
      id: `e-${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'interactive',
      data: {
        color: isCrossApp ? '#78716c' : (nodeStatusColor[e.target] || LAYER_EDGE_COLORS.component),
        highlighted: false, dimmed: false,
        layerType: isCrossApp ? 'platform' : 'component',
        direction: e.direction || 'uni',
        offset: 26,
      },
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

    resolveOverlaps(platItems, NODE_DIMS.platform.w, 80)

    // Nudge platform nodes away from cross-layer edge paths they're not part of
    nudgeFromEdgePaths(platItems, apiData.platform.edges, compPos, NODE_DIMS.platform.w)
    clampToZoneBounds(platItems, NODE_DIMS.platform.w, upstreamColX, downstreamColX)

    // Snap single-parent platform nodes directly below their parent for straight edges
    // (constrained to zone bounds so snap-back can't push into upstream/downstream zones)
    {
      const zoneHalfW = (NODE_DIMS.service.w + 120) / 2
      const snapClearance = zoneHalfW + NODE_DIMS.platform.w / 2 + 20
      const snapLeft  = upstreamColX   != null ? upstreamColX   + snapClearance : -Infinity
      const snapRight = downstreamColX != null ? downstreamColX - snapClearance :  Infinity
      platItems.forEach((item, i) => {
        const parents = platParents[item.node.id] || []
        if (parents.length === 1) {
          const parentX = compPos[parents[0]]?.x
          if (parentX != null && parentX >= snapLeft && parentX <= snapRight) {
            const gap = NODE_DIMS.platform.w + 40
            const prevMax = i > 0 ? platItems[i - 1].x + gap : -Infinity
            const nextMin = i < platItems.length - 1 ? platItems[i + 1].x - gap : Infinity
            if (parentX >= prevMax && parentX <= nextMin) item.x = parentX
          }
        }
      })
    }

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
        data: { color: nodeStatusColor[e.target] || LAYER_EDGE_COLORS.platform, highlighted: false, dimmed: false, layerType: 'platform', direction: e.direction || 'uni', offset: 40 },
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

    resolveOverlaps(dcItems, NODE_DIMS.datacenter.w, 70)

    // Nudge datacenter nodes away from cross-layer edge paths
    nudgeFromEdgePaths(dcItems, apiData.datacenter.edges, platformPos, NODE_DIMS.datacenter.w)
    clampToZoneBounds(dcItems, NODE_DIMS.datacenter.w, upstreamColX, downstreamColX)

    // Snap single-parent datacenter nodes directly below their parent for straight edges
    // (constrained to zone bounds so snap-back can't push into upstream/downstream zones)
    {
      const zoneHalfW = (NODE_DIMS.service.w + 120) / 2
      const snapClearance = zoneHalfW + NODE_DIMS.datacenter.w / 2 + 20
      const snapLeft  = upstreamColX   != null ? upstreamColX   + snapClearance : -Infinity
      const snapRight = downstreamColX != null ? downstreamColX - snapClearance :  Infinity
      dcItems.forEach((item, i) => {
        const parents = dcParents[item.node.id] || []
        if (parents.length === 1) {
          const parentX = platformPos[parents[0]]?.x
          if (parentX != null && parentX >= snapLeft && parentX <= snapRight) {
            const gap = NODE_DIMS.datacenter.w + 35
            const prevMax = i > 0 ? dcItems[i - 1].x + gap : -Infinity
            const nextMin = i < dcItems.length - 1 ? dcItems[i + 1].x - gap : Infinity
            if (parentX >= prevMax && parentX <= nextMin) item.x = parentX
          }
        }
      })
    }

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
        data: { color: nodeStatusColor[e.target] || LAYER_EDGE_COLORS.datacenter, highlighted: false, dimmed: false, layerType: 'datacenter', direction: e.direction || 'uni', offset: 40 },
      })
    })

    nextRowY = dcY + NODE_DIMS.datacenter.h / 2 + VERTICAL_GAP
  }

  // ── Zone background shading for upstream / downstream columns ──
  if (showCrossApp && (upstreamColX != null || downstreamColX != null)) {
    const realNodes = rfNodes.filter(n => n.type !== 'zone')
    if (realNodes.length > 0) {
      const ys = realNodes.flatMap(n => {
        const h = n.type === 'indicatorGroup'
          ? (n.data.height || 50)
          : (NODE_DIMS[n.type === 'service' || n.type === 'external' ? 'service' : n.type]?.h || 50)
        return [n.position.y, n.position.y + h]
      })
      const minY = Math.min(...ys)
      const maxY = Math.max(...ys)
      const zonePadY = 40
      const zoneHeight = maxY - minY + zonePadY * 2
      const zoneTop = minY - zonePadY
      const zoneW = NODE_DIMS.service.w + 120

      if (upstreamColX != null) {
        rfNodes.push({
          id: '__zone-upstream', type: 'zone',
          position: { x: upstreamColX - zoneW / 2, y: zoneTop },
          zIndex: 0, selectable: false, draggable: false, connectable: false,
          data: { width: zoneW, height: zoneHeight, label: 'Upstream', direction: 'upstream' },
        })
      }
      if (downstreamColX != null) {
        rfNodes.push({
          id: '__zone-downstream', type: 'zone',
          position: { x: downstreamColX - zoneW / 2, y: zoneTop },
          zIndex: 0, selectable: false, draggable: false, connectable: false,
          data: { width: zoneW, height: zoneHeight, label: 'Downstream', direction: 'downstream' },
        })
      }
    }
  }

  return { nodes: rfNodes, edges: rfEdges }
}

// ── MiniMap node coloring ───────────────────────────────────────────────────
function miniMapNodeColor(n) {
  if (n.type === 'zone')           return 'transparent'
  if (n.type === 'platform')       return '#C27BA0'
  if (n.type === 'datacenter')     return '#5DA5A0'
  if (n.type === 'indicator')      return '#94a3b8'
  if (n.type === 'indicatorGroup') return '#94a3b8'
  if (n.type === 'external')       return '#78716c'
  return '#1565C0'  // dusty blue for component nodes
}

// ── Main component ──────────────────────────────────────────────────────────
function LayeredDependencyFlowInner({ apiData, activeLayers, onNodeSelect }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [highlightedEdges, setHighlightedEdges] = useState(new Set())
  const { fitView } = useReactFlow()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Rebuild graph whenever data or layers change
  useEffect(() => {
    const { nodes: rfNodes, edges: rfEdges } = buildLayeredGraph(apiData, activeLayers)
    setNodes(rfNodes)
    setEdges(rfEdges)
    setHighlightedEdges(new Set())
    // If only component layer is active, zoom to fit components; otherwise fit everything
    const hasExtraLayers = activeLayers.platform || activeLayers.datacenter || activeLayers.indicator
    const fitOpts = { padding: 0.15, duration: 300 }
    if (!hasExtraLayers) {
      const compNodeIds = rfNodes.filter(n => n.type === 'service').map(n => n.id)
      fitOpts.nodes = compNodeIds.map(id => ({ id }))
    }
    const timer = setTimeout(() => fitView(fitOpts), 80)
    return () => clearTimeout(timer)
  }, [apiData, activeLayers, setNodes, setEdges, fitView])

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

  const bgColor    = isDark ? '#0a0e1a' : '#ffffff'
  const ctrlBg     = isDark ? '#111827' : '#ffffff'
  const ctrlBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'
  const miniMapBg  = isDark ? '#111827' : '#ffffff'
  const miniMapMask = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'

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
      // Fix Controls visibility
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
        nodeTypes={layerNodeTypes}
        edgeTypes={layerEdgeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="transparent" />
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

export default function LayeredDependencyFlow(props) {
  return (
    <ReactFlowProvider>
      <LayeredDependencyFlowInner {...props} />
    </ReactFlowProvider>
  )
}
