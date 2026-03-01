import { memo } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Handle, Position, getSmoothStepPath } from '@xyflow/react'

// ── Color maps ──────────────────────────────────────────────────────────────
// RAG status only used for text color, NOT for node borders/backgrounds
const STATUS_TEXT = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336', no_data: '#78909c' }

// Component layer color (dusty steel blue — primary layer)
const COMP_BORDER = '#1565C0'
const COMP_BG_DARK  = 'rgba(92,140,194,0.25)'
const COMP_BG_LIGHT = 'rgba(92,140,194,0.30)'

// ── Component layer: Service node ───────────────────────────────────────────
export const ServiceNode = memo(({ data, selected }) => {
  const statusColor = STATUS_TEXT[data.status] || '#94a3b8'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  return (
    <Box sx={{
      bgcolor: isDark ? COMP_BG_DARK : COMP_BG_LIGHT,
      border: `2px solid ${COMP_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 160, maxWidth: 240,
      position: 'relative',
      opacity: selected ? 1 : 0.92,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.15)',
      '&:hover': { boxShadow: `0 0 8px ${COMP_BORDER}50` },
    }}>
      <Handle id="left"   type="target" position={Position.Left}   style={{ background: COMP_BORDER, width: 6, height: 6 }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ background: COMP_BORDER, width: 6, height: 6 }} />
      <Handle id="top"    type="source" position={Position.Top}    style={{ background: '#B8976B', width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ background: '#C27BA0', width: 6, height: 6 }} />
      <Typography sx={{
        position: 'absolute', top: 3, right: 6,
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.6,
        color: COMP_BORDER, opacity: 0.7, textTransform: 'uppercase',
      }}>
        Component
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.62rem', color: statusColor, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {data.status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.76rem', color: isDark ? '#fff' : '#000',
        wordBreak: 'break-word', lineHeight: 1.3 }}>
        {data.label}
      </Typography>
    </Box>
  )
})

// ── Platform layer node (GAP / GKP / ECS / EKS) ────────────────────────────
export const PlatformNode = memo(({ data }) => {
  const statusColor = STATUS_TEXT[data.status] || '#94a3b8'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const typeLabel = data.type?.toUpperCase() || 'PLATFORM'
  return (
    <Box sx={{
      bgcolor: isDark ? 'rgba(194,123,160,0.28)' : 'rgba(194,123,160,0.30)',
      border: '2px solid #C27BA0',
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 150, maxWidth: 200,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.15)',
      '&:hover': { boxShadow: '0 0 8px rgba(194,123,160,0.4)' },
    }}>
      <Handle id="top"    type="target" position={Position.Top}    style={{ background: '#C27BA0', width: 6, height: 6 }} />
      <Handle id="left"   type="target" position={Position.Left}   style={{ background: '#C27BA0', width: 6, height: 6 }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ background: '#C27BA0', width: 6, height: 6 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ background: '#5DA5A0', width: 6, height: 6 }} />
      <Typography sx={{
        position: 'absolute', top: 3, right: 6,
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.6,
        color: '#C27BA0', opacity: 0.7, textTransform: 'uppercase',
      }}>
        Platform
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.62rem', color: statusColor, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {data.status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600,
        color: isDark ? '#fff' : '#000', lineHeight: 1.3 }}>
        {typeLabel}: {data.label}
      </Typography>
    </Box>
  )
})

// ── Data Center layer node ──────────────────────────────────────────────────
const DC_BORDER = '#5DA5A0'

export const DataCenterNode = memo(({ data }) => {
  const statusColor = STATUS_TEXT[data.status] || '#94a3b8'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const regionLabel = data.region || 'DC'
  return (
    <Box sx={{
      bgcolor: isDark ? 'rgba(93,165,160,0.28)' : 'rgba(93,165,160,0.30)',
      border: `2px solid ${DC_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 150, maxWidth: 200,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.15)',
      '&:hover': { boxShadow: `0 0 8px ${DC_BORDER}50` },
    }}>
      <Handle id="top"  type="target" position={Position.Top}  style={{ background: DC_BORDER, width: 6, height: 6 }} />
      <Handle id="left" type="target" position={Position.Left} style={{ background: DC_BORDER, width: 6, height: 6 }} />
      <Typography sx={{
        position: 'absolute', top: 3, right: 6,
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.6,
        color: DC_BORDER, opacity: 0.7, textTransform: 'uppercase',
      }}>
        Data Center
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.62rem', color: statusColor, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {data.status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600,
        color: isDark ? '#fff' : '#000', lineHeight: 1.3 }}>
        {regionLabel}: {data.label}
      </Typography>
    </Box>
  )
})

// ── Indicator layer node (Process Groups, Services, Synthetics) ─────────────
const IND_BORDER = '#94a3b8'
const IND_BG_DARK  = 'rgba(148,163,184,0.25)'
const IND_BG_LIGHT = 'rgba(148,163,184,0.30)'

const INDICATOR_TYPE_LABELS = {
  process_group: 'PROCESS GROUP',
  service: 'SERVICE',
  synthetic: 'SYNTHETIC',
  'Process Group': 'PROCESS GROUP',
  'Service': 'SERVICE',
  'Synthetic': 'SYNTHETIC',
}

const HEALTH_STATUS_TEXT = { green: '#4caf50', amber: '#ff9800', red: '#f44336', no_data: '#78909c' }
const HEALTH_STATUS_LABEL = { green: 'healthy', amber: 'warning', red: 'critical', no_data: 'no health data' }

export const IndicatorNode = memo(({ data }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const healthColor = HEALTH_STATUS_TEXT[data.health] || '#94a3b8'
  const healthLabel = HEALTH_STATUS_LABEL[data.health] || 'unknown'
  const typeLabel = INDICATOR_TYPE_LABELS[data.indicator_type] || 'INDICATOR'
  const isImpacted = data.health === 'red' || data.health === 'amber'
  return (
    <Box sx={{
      bgcolor: isDark ? IND_BG_DARK : IND_BG_LIGHT,
      border: `2px solid ${IND_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 150, maxWidth: 210,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.15)',
      '&:hover': { boxShadow: `0 0 8px ${IND_BORDER}50` },
      ...(isImpacted && { animation: 'indicatorFlash 1.5s ease-in-out infinite' }),
    }}>
      <Handle id="top"    type="target" position={Position.Top}    style={{ background: IND_BORDER, width: 6, height: 6 }} />
      <Handle id="bottom" type="target" position={Position.Bottom} style={{ background: IND_BORDER, width: 6, height: 6 }} />
      <Handle id="left"   type="target" position={Position.Left}   style={{ background: IND_BORDER, width: 6, height: 6 }} />
      <Typography sx={{
        position: 'absolute', top: 3, right: 6,
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.6,
        color: '#94a3b8', opacity: 0.7, textTransform: 'uppercase',
      }}>
        Indicator
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{
          width: 7, height: 7, borderRadius: '50%', bgcolor: healthColor, flexShrink: 0,
          ...(isImpacted && { animation: 'indicatorDotPulse 1s ease-in-out infinite' }),
        }} />
        <Typography sx={{ fontSize: '0.62rem', color: healthColor, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {healthLabel}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600,
        color: isDark ? '#fff' : '#000', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {`${typeLabel}: ${data.label}`}
      </Typography>
    </Box>
  )
})

// ── External (cross-application) node ────────────────────────────────────────
const EXT_BORDER = '#78716c'
const EXT_BG_DARK  = 'rgba(120,113,108,0.22)'
const EXT_BG_LIGHT = 'rgba(120,113,108,0.26)'

export const ExternalNode = memo(({ data }) => {
  const statusColor = STATUS_TEXT[data.status] || '#94a3b8'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const appLabel = data.external_seal_label || 'External'
  const dir = data.cross_direction || 'downstream'
  const dirLabel = dir === 'upstream' ? '\u2192 UPSTREAM' : dir === 'downstream' ? 'DOWNSTREAM \u2192' : '\u2194 UP/DOWNSTREAM'
  return (
    <Box sx={{
      bgcolor: isDark ? EXT_BG_DARK : EXT_BG_LIGHT,
      border: `2px dashed ${EXT_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 160, maxWidth: 240,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.08)' : '0 1px 6px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: `0 0 8px ${EXT_BORDER}40` },
    }}>
      <Handle id="left"  type="target" position={Position.Left}  style={{ background: EXT_BORDER, width: 6, height: 6 }} />
      <Handle id="right" type="source" position={Position.Right} style={{ background: EXT_BORDER, width: 6, height: 6 }} />
      <Typography sx={{
        position: 'absolute', top: 2, right: 6,
        fontSize: '0.42rem', fontWeight: 700, letterSpacing: 0.4,
        color: EXT_BORDER, opacity: 0.8, textTransform: 'uppercase',
      }}>
        {dirLabel}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: statusColor, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.62rem', color: statusColor, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {data.status}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '0.72rem', color: isDark ? '#fff' : '#000',
        wordBreak: 'break-word', lineHeight: 1.3 }}>
        {data.label}
      </Typography>
      <Typography sx={{ fontSize: '0.5rem', mt: 0.25, color: isDark ? '#fff' : '#333', fontWeight: 600 }}>
        {appLabel}
      </Typography>
    </Box>
  )
})

// ── Zone background (upstream / downstream shading) ─────────────────────────
export const ZoneNode = memo(({ data }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const isUpstream = data.direction === 'upstream'
  const bg = isDark
    ? (isUpstream ? 'rgba(100,140,180,0.045)' : 'rgba(180,140,100,0.045)')
    : (isUpstream ? 'rgba(80,120,180,0.04)' : 'rgba(180,120,80,0.04)')
  const borderCol = isDark
    ? (isUpstream ? 'rgba(100,140,180,0.12)' : 'rgba(180,140,100,0.12)')
    : (isUpstream ? 'rgba(80,120,180,0.10)' : 'rgba(180,120,80,0.10)')
  const labelCol = isDark
    ? (isUpstream ? 'rgba(140,170,210,0.55)' : 'rgba(210,170,130,0.55)')
    : (isUpstream ? 'rgba(60,100,160,0.45)' : 'rgba(160,100,60,0.45)')
  return (
    <Box sx={{
      width: data.width,
      height: data.height,
      bgcolor: bg,
      borderRadius: 3,
      border: `1.5px dashed ${borderCol}`,
      pointerEvents: 'none',
    }}>
      <Typography sx={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        fontSize: '1.1rem', fontWeight: 900, letterSpacing: 3,
        color: labelCol, textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        {data.label}
      </Typography>
    </Box>
  )
})

// ── Custom interactive edge (reused from DependencyFlow pattern) ────────────
export const InteractiveEdge = memo(({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  style = {}, data,
}) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 18,
    offset: data?.offset || 26,
  })

  const isHighlighted = data?.highlighted
  const edgeColor = data?.color || '#94a3b8'
  const activeColor = isHighlighted ? edgeColor : (data?.dimmed ? '#94a3b8' : edgeColor)
  const strokeWidth = isHighlighted ? 3 : (isDark ? 2.2 : 2.4)
  const opacity = data?.dimmed ? 0.15 : 1
  const layerType = data?.layerType || 'component'
  const direction = data?.direction || 'uni'

  const dashArray =
    layerType === 'platform'   ? '6 3'
    : layerType === 'datacenter' ? '3 3'
    : layerType === 'indicator'  ? '4 2'
    : isHighlighted              ? '6 3'
    : 'none'

  // Unique marker IDs scoped to this edge
  const endMarkerId = `arrow-end-${id}`
  const startMarkerId = `arrow-start-${id}`
  const arrowSize = isHighlighted ? 11 : 10
  const arrowH = isHighlighted ? 9 : 8

  return (
    <g style={{ cursor: 'pointer', opacity }}>
      <defs>
        <marker
          id={endMarkerId}
          markerWidth={arrowSize}
          markerHeight={arrowH}
          refX={arrowSize - 1}
          refY={arrowH / 2}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points={`0 0, ${arrowSize} ${arrowH / 2}, 0 ${arrowH}`}
            fill={activeColor}
          />
        </marker>
        {direction === 'bi' && (
          <marker
            id={startMarkerId}
            markerWidth={arrowSize}
            markerHeight={arrowH}
            refX={1}
            refY={arrowH / 2}
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon
              points={`${arrowSize} 0, 0 ${arrowH / 2}, ${arrowSize} ${arrowH}`}
              fill={activeColor}
            />
          </marker>
        )}
      </defs>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={14} />
      {isHighlighted && (
        <path d={edgePath} fill="none" stroke={activeColor}
          strokeWidth={6} strokeOpacity={0.2}
          style={{ filter: `drop-shadow(0 0 4px ${activeColor})` }} />
      )}
      <path
        d={edgePath} fill="none" stroke={activeColor}
        strokeWidth={strokeWidth}
        markerEnd={`url(#${endMarkerId})`}
        markerStart={direction === 'bi' ? `url(#${startMarkerId})` : undefined}
        className={isHighlighted ? 'react-flow__edge-path animated' : 'react-flow__edge-path'}
        style={{
          strokeDasharray: dashArray,
          animation: isHighlighted ? 'dashdraw 0.5s linear infinite' : 'none',
        }}
      />
    </g>
  )
})

// ── Indicator group node (vertically stacked indicators for one component) ──
export const IndicatorGroupNode = memo(({ data }) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const indicators = data.indicators || []
  const hasImpacted = indicators.some(ind => ind.health === 'red' || ind.health === 'amber')

  return (
    <Box sx={{
      width: data.width || 220,
      bgcolor: isDark ? IND_BG_DARK : IND_BG_LIGHT,
      border: `2px solid ${IND_BORDER}`,
      borderRadius: 1.5,
      px: 1.2, pt: 0.5, pb: 0.75,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.1)' : '0 1px 6px rgba(0,0,0,0.15)',
      '&:hover': { boxShadow: `0 0 8px ${IND_BORDER}50` },
      ...(hasImpacted && { animation: 'indicatorFlash 1.5s ease-in-out infinite' }),
    }}>
      <Handle id="bottom" type="target" position={Position.Bottom} style={{ background: IND_BORDER, width: 6, height: 6 }} />
      <Typography sx={{
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.6,
        color: '#94a3b8', opacity: 0.7, textTransform: 'uppercase', mb: 0.5,
      }}>
        Indicators ({indicators.length})
      </Typography>
      {indicators.map((ind, i) => {
        const healthColor = HEALTH_STATUS_TEXT[ind.health] || '#94a3b8'
        const healthLabel = HEALTH_STATUS_LABEL[ind.health] || 'unknown'
        const typeLabel = INDICATOR_TYPE_LABELS[ind.indicator_type] || 'INDICATOR'
        const isImpacted = ind.health === 'red' || ind.health === 'amber'
        return (
          <Box key={ind.id || i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.15 }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: healthColor, flexShrink: 0,
              ...(isImpacted && { animation: 'indicatorDotPulse 1s ease-in-out infinite' }),
            }} />
            <Typography sx={{ fontSize: '0.56rem', color: healthColor, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.3, flexShrink: 0, minWidth: 42 }}>
              {healthLabel}
            </Typography>
            <Typography noWrap sx={{
              fontSize: '0.56rem', fontWeight: 500,
              color: isDark ? '#fff' : '#000', lineHeight: 1.2,
            }}>
              {typeLabel}: {ind.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
})

// ── Exported maps (must be at module scope, never inside a component) ───────
export const layerNodeTypes = {
  service:        ServiceNode,
  platform:       PlatformNode,
  datacenter:     DataCenterNode,
  indicator:      IndicatorNode,
  indicatorGroup: IndicatorGroupNode,
  external:       ExternalNode,
  zone:           ZoneNode,
}

export const layerEdgeTypes = {
  interactive: InteractiveEdge,
}
