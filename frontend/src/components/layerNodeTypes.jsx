import { memo } from 'react'
import { Box, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Handle, Position, getSmoothStepPath } from '@xyflow/react'

// ── Color maps ──────────────────────────────────────────────────────────────
// RAG status only used for text color, NOT for node borders/backgrounds
const STATUS_TEXT = { healthy: '#4caf50', warning: '#ff9800', critical: '#f44336' }

// Component layer color (dusty steel blue — primary layer)
const COMP_BORDER = '#5C8CC2'
const COMP_BG_DARK  = 'rgba(92,140,194,0.10)'
const COMP_BG_LIGHT = 'rgba(92,140,194,0.07)'

// ── Component layer: Service node ───────────────────────────────────────────
export const ServiceNode = memo(({ data, selected }) => {
  const statusColor = STATUS_TEXT[data.status] || '#94a3b8'
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  return (
    <Box sx={{
      bgcolor: isDark ? COMP_BG_DARK : COMP_BG_LIGHT,
      border: `1.5px solid ${COMP_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 160, maxWidth: 240,
      position: 'relative',
      opacity: selected ? 1 : 0.92,
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: `0 0 8px ${COMP_BORDER}50` },
    }}>
      <Handle id="left"   type="target" position={Position.Left}   style={{ background: COMP_BORDER, width: 5, height: 5 }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ background: COMP_BORDER, width: 5, height: 5 }} />
      <Handle id="top"    type="source" position={Position.Top}    style={{ background: '#B8976B', width: 5, height: 5 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ background: '#C27BA0', width: 5, height: 5 }} />
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
      <Typography sx={{ fontSize: '0.76rem', color: isDark ? 'white' : '#0f172a',
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
      bgcolor: isDark ? 'rgba(194,123,160,0.12)' : 'rgba(194,123,160,0.08)',
      border: '1.5px solid #C27BA0',
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 150, maxWidth: 200,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: '0 0 8px rgba(194,123,160,0.4)' },
    }}>
      <Handle id="top"    type="target" position={Position.Top}    style={{ background: '#C27BA0', width: 5, height: 5 }} />
      <Handle id="left"   type="target" position={Position.Left}   style={{ background: '#C27BA0', width: 5, height: 5 }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ background: '#C27BA0', width: 5, height: 5 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ background: '#5DA5A0', width: 5, height: 5 }} />
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
        color: isDark ? '#e2e8f0' : '#0f172a', lineHeight: 1.3 }}>
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
      bgcolor: isDark ? 'rgba(93,165,160,0.12)' : 'rgba(93,165,160,0.08)',
      border: `1.5px solid ${DC_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 150, maxWidth: 200,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: `0 0 8px ${DC_BORDER}50` },
    }}>
      <Handle id="top"  type="target" position={Position.Top}  style={{ background: DC_BORDER, width: 5, height: 5 }} />
      <Handle id="left" type="target" position={Position.Left} style={{ background: DC_BORDER, width: 5, height: 5 }} />
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
        color: isDark ? '#e2e8f0' : '#0f172a', lineHeight: 1.3 }}>
        {regionLabel}: {data.label}
      </Typography>
    </Box>
  )
})

// ── Indicator layer node (Process Groups, Services, Synthetics) ─────────────
const IND_BORDER = '#B8976B'
const IND_BG_DARK  = 'rgba(184,151,107,0.10)'
const IND_BG_LIGHT = 'rgba(184,151,107,0.07)'

const INDICATOR_TYPE_LABELS = {
  process_group: 'PROCESS GROUP',
  service: 'SERVICE',
  synthetic: 'SYNTHETIC',
}

const HEALTH_STATUS_TEXT = { green: '#4caf50', amber: '#ff9800', red: '#f44336' }
const HEALTH_STATUS_LABEL = { green: 'healthy', amber: 'warning', red: 'critical' }

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
      border: `1.5px solid ${IND_BORDER}`,
      borderRadius: 1.5,
      px: 1.5, py: 1,
      minWidth: 150, maxWidth: 210,
      position: 'relative',
      cursor: 'pointer',
      transition: 'box-shadow 0.15s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      '&:hover': { boxShadow: `0 0 8px ${IND_BORDER}50` },
      ...(isImpacted && { animation: 'indicatorFlash 1.5s ease-in-out infinite' }),
    }}>
      <Handle id="top"    type="target" position={Position.Top}    style={{ background: IND_BORDER, width: 5, height: 5 }} />
      <Handle id="bottom" type="target" position={Position.Bottom} style={{ background: IND_BORDER, width: 5, height: 5 }} />
      <Handle id="left"   type="target" position={Position.Left}   style={{ background: IND_BORDER, width: 5, height: 5 }} />
      <Typography sx={{
        position: 'absolute', top: 3, right: 6,
        fontSize: '0.5rem', fontWeight: 700, letterSpacing: 0.6,
        color: IND_BORDER, opacity: 0.7, textTransform: 'uppercase',
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
        color: isDark ? '#e2e8f0' : '#0f172a', lineHeight: 1.3, wordBreak: 'break-word' }}>
        {`${typeLabel}: ${data.label}`}
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
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
    borderRadius: 16,
  })

  const isHighlighted = data?.highlighted
  const edgeColor = data?.color || '#94a3b8'
  const activeColor = isHighlighted ? edgeColor : (data?.dimmed ? '#94a3b8' : edgeColor)
  const strokeWidth = isHighlighted ? 2.5 : 1.4
  const opacity = data?.dimmed ? 0.15 : 1
  const layerType = data?.layerType || 'component'

  const dashArray =
    layerType === 'platform'   ? '6 3'
    : layerType === 'datacenter' ? '3 3'
    : layerType === 'indicator'  ? '4 2'
    : isHighlighted              ? '6 3'
    : 'none'

  return (
    <g style={{ cursor: 'pointer', opacity }}>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={14} />
      {isHighlighted && (
        <path d={edgePath} fill="none" stroke={activeColor}
          strokeWidth={6} strokeOpacity={0.2}
          style={{ filter: `drop-shadow(0 0 4px ${activeColor})` }} />
      )}
      <path
        d={edgePath} fill="none" stroke={activeColor}
        strokeWidth={strokeWidth}
        className={isHighlighted ? 'react-flow__edge-path animated' : 'react-flow__edge-path'}
        style={{
          strokeDasharray: dashArray,
          animation: isHighlighted ? 'dashdraw 0.5s linear infinite' : 'none',
        }}
      />
      {isHighlighted && (
        <circle cx={targetX} cy={targetY} r={4} fill={activeColor} stroke={activeColor} strokeWidth={1} />
      )}
    </g>
  )
})

// ── Exported maps (must be at module scope, never inside a component) ───────
export const layerNodeTypes = {
  service:    ServiceNode,
  platform:   PlatformNode,
  datacenter: DataCenterNode,
  indicator:  IndicatorNode,
}

export const layerEdgeTypes = {
  interactive: InteractiveEdge,
}
