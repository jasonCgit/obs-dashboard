import { useState, useMemo, useEffect, useImperativeHandle, forwardRef, Fragment } from 'react'
import {
  Box, Typography, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, TextField, InputAdornment,
  IconButton, Link, Tooltip, Button, ButtonGroup,
} from '@mui/material'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import SearchIcon from '@mui/icons-material/Search'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import TuneIcon from '@mui/icons-material/Tune'
import SubdirectoryArrowRightIcon from '@mui/icons-material/SubdirectoryArrowRight'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import CrossLinkChips from './CrossLinkChips'
import AppDetailModal from './AppDetailModal'
import DeploymentDetailModal from './DeploymentDetailModal'
import ContactModal from './ContactModal'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }
const STATUS_RANK = { critical: 0, warning: 1, healthy: 2 }

// Derive a deterministic relative time from id + incident count
function deriveLastIncident(id, incidents, status) {
  if (!incidents || incidents <= 0) return null
  // Simple hash from id string
  let h = 0
  for (let i = 0; i < (id || '').length; i++) h = ((h << 5) - h + (id || '').charCodeAt(i)) | 0
  h = Math.abs(h)
  if (status === 'critical') {
    const mins = (h % 45) + 5
    return `${mins}m ago`
  }
  if (status === 'warning') {
    const hrs = (h % 12) + 1
    return `${hrs}h ago`
  }
  const days = (h % 7) + 1
  return `${days}d ago`
}

const COLUMNS = [
  { id: 'name',          label: 'Applications → Deployments → Components' },
  { id: 'cpof',          label: 'CPOF',            align: 'center' },
  { id: 'rto',           label: 'RTO',             align: 'center' },
  { id: 'slo',           label: 'SLO Status',      align: 'center' },
  { id: 'incidents_30d', label: 'Open P1/P2',      align: 'center' },
  { id: 'last',          label: 'Last Incident',   align: 'center' },
  { id: 'blastRadius',   label: '',                sortable: false },
  { id: 'contact',       label: '',                sortable: false, align: 'center' },
  { id: 'manage',        label: '',                sortable: false, align: 'center' },
]

function deriveAppData(app) {
  const deployments = app.deployments || []
  const appExcl = new Set(app.excluded_indicators || [])
  const hasCpof = app.cpof === 'Yes' || deployments.some(d => d.cpof)
  const deployRtos = deployments.filter(d => d.rto != null).map(d => d.rto)
  const strictestRto = deployRtos.length > 0 ? Math.min(...deployRtos) : null
  const displayRto = strictestRto ?? app.rto
  // Derive status purely from non-excluded components
  let derivedStatus = 'healthy'
  if (deployments.length > 0) {
    for (const d of deployments) {
      const depExcl = new Set([...appExcl, ...(d.excluded_indicators || [])])
      for (const c of (d.components || [])) {
        if (depExcl.has(c.indicator_type)) continue
        if ((STATUS_RANK[c.status] ?? 2) < (STATUS_RANK[derivedStatus] ?? 2)) derivedStatus = c.status
      }
    }
  } else {
    derivedStatus = app.status
  }
  // Derive SLO from deployments (min)
  const depSlos = deployments.map(d => d.slo).filter(v => v != null)
  const derivedSlo = depSlos.length > 0 ? Math.min(...depSlos) : app.slo?.current
  return { ...app, derivedStatus, hasCpof, displayRto, depCount: deployments.length, derivedSlo }
}

function getSortValue(row, key) {
  switch (key) {
    case 'status': return STATUS_RANK[row.derivedStatus] ?? 9
    case 'incidents_30d': return row.incidents_30d ?? 0
    case 'last': {
      const v = row.last || '—'
      if (v === '—') return 99999
      const m = v.match(/(\d+)/)
      const n = m ? parseInt(m[1], 10) : 99999
      if (v.includes('m ago')) return n
      if (v.includes('h ago')) return n * 60
      if (v.includes('d ago')) return n * 1440
      return 99999
    }
    case 'slo': return row.slo?.current ?? 999
    case 'cpof': return row.hasCpof ? 0 : 1
    case 'rto': return row.displayRto ?? 999
    default: return (row[key] ?? '').toString().toLowerCase()
  }
}

const cellSx = { py: 0.5, px: 1, fontSize: '0.7rem', borderColor: 'divider' }
const tightCellSx = { ...cellSx, px: 0.25 }
const headSx = { ...cellSx, fontWeight: 700, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: 0.5, bgcolor: 'background.paper' }

// Inline style for centered cells — inline styles beat all class-based CSS
const cAlign = { textAlign: 'center' }

const depRowBg = t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
const compRowBg = t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.028)'

const AppTable = forwardRef(function AppTable({ apps, teams = [], onAppTeamsChanged, onAppExcludedChanged, externalFilter, onExternalFilterChange, hideFilterBar }, ref) {
  const [orderBy, setOrderBy] = useState('status')
  const [order, setOrder] = useState('asc')
  const [internalFilter, setInternalFilter] = useState('')
  const filter = onExternalFilterChange ? externalFilter : internalFilter
  const setFilter = onExternalFilterChange || setInternalFilter

  const [statusFilter, setStatusFilter] = useState([])
  const [detailApp, setDetailApp] = useState(null)
  const [contactApp, setContactApp] = useState(null)
  const [detailDep, setDetailDep] = useState(null)

  const rows = useMemo(() => apps.map(deriveAppData), [apps])

  const [expandedApps, setExpandedApps] = useState(new Set())
  const [expandedDeps, setExpandedDeps] = useState(new Set())

  // Restore expand-all state from sessionStorage on mount
  const expandedOnce = useState(false)
  useEffect(() => {
    if (!expandedOnce[0] && sessionStorage.getItem('apps-table-expanded') === 'true' && rows.length > 0) {
      expandedOnce[0] = true
      setExpandedApps(new Set(rows.filter(r => r.depCount > 0).map(r => r.name)))
      setExpandedDeps(new Set(rows.flatMap(r => (r.deployments || []).filter(d => (d.components || []).length > 0).map(d => d.id))))
    }
  }, [rows])

  const toggleApp = (name) => setExpandedApps(prev => {
    const next = new Set(prev)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    return next
  })

  const toggleDep = (id) => setExpandedDeps(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const expandAll = () => {
    setExpandedApps(new Set(rows.filter(r => r.depCount > 0).map(r => r.name)))
    setExpandedDeps(new Set(rows.flatMap(r => (r.deployments || []).filter(d => (d.components || []).length > 0).map(d => d.id))))
    sessionStorage.setItem('apps-table-expanded', 'true')
  }

  const collapseAll = () => {
    setExpandedApps(new Set())
    setExpandedDeps(new Set())
    sessionStorage.setItem('apps-table-expanded', 'false')
  }

  const isAllExpanded = rows.filter(r => r.depCount > 0).every(r => expandedApps.has(r.name))

  useImperativeHandle(ref, () => ({ expandAll, collapseAll, isAllExpanded }), [isAllExpanded, rows])

  const filtered = useMemo(() => {
    let result = rows
    if (statusFilter.length > 0) {
      const allowed = new Set(statusFilter)
      const filtered_ = []
      for (const r of result) {
        const deployments = r.deployments || []
        if (deployments.length === 0) {
          if (allowed.has(r.derivedStatus)) filtered_.push(r)
          continue
        }
        const appExcl = new Set(r.excluded_indicators || [])
        const filteredDeps = []
        for (const d of deployments) {
          const depExcl = new Set([...appExcl, ...(d.excluded_indicators || [])])
          const filteredComps = (d.components || []).filter(c => {
            if (depExcl.has(c.indicator_type)) return allowed.has('healthy')
            return allowed.has(c.status || 'healthy')
          })
          let depStatus = 'healthy'
          for (const c of (d.components || [])) {
            if (depExcl.has(c.indicator_type)) continue
            if ((STATUS_RANK[c.status] ?? 2) < (STATUS_RANK[depStatus] ?? 2)) depStatus = c.status
          }
          if (allowed.has(depStatus) || filteredComps.length > 0) {
            filteredDeps.push({ ...d, components: filteredComps })
          }
        }
        if (filteredDeps.length > 0) {
          filtered_.push({ ...r, deployments: filteredDeps })
        }
      }
      result = filtered_
    }
    if (filter.trim()) {
      const q = filter.toLowerCase()
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.seal || '').toLowerCase().includes(q) ||
        (r.team || '').toLowerCase().includes(q)
      )
    }
    return result
  }, [rows, filter, statusFilter])

  const sorted = useMemo(() => {
    const cmp = order === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, orderBy)
      const bv = getSortValue(b, orderBy)
      if (av < bv) return -1 * cmp
      if (av > bv) return 1 * cmp
      return 0
    })
  }, [filtered, orderBy, order])

  const handleSort = (colId) => {
    if (orderBy === colId) {
      setOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setOrderBy(colId)
      setOrder('asc')
    }
  }

  const resolveTeams = (app) => (app.team_ids || []).map(id => teams.find(t => t.id === id)).filter(Boolean)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Filter bar (hidden when parent provides its own) */}
      {!hideFilterBar && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, flexShrink: 0 }}>
          <TextField
            size="small"
            placeholder="Filter applications..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
              sx: { fontSize: '0.76rem', height: 32 },
            }}
            sx={{ width: 260 }}
          />
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <ButtonGroup size="small" variant="outlined" sx={{ height: 28 }}>
              {[
                { key: 'all', label: 'All', active: statusFilter.length === 0, color: null },
                { key: 'critical', label: 'Critical', active: statusFilter.includes('critical'), color: '#f44336' },
                { key: 'warning', label: 'Warning', active: statusFilter.includes('warning'), color: '#ff9800' },
                { key: 'healthy', label: 'Healthy', active: statusFilter.includes('healthy'), color: '#4caf50' },
              ].map(({ key, label, active, color }) => (
                <Button
                  key={key}
                  onClick={() => {
                    if (key === 'all') { setStatusFilter([]); return }
                    setStatusFilter(prev =>
                      prev.includes(key) ? prev.filter(v => v !== key) : [...prev, key]
                    )
                  }}
                  sx={{
                    fontSize: '0.66rem', fontWeight: 600, textTransform: 'none', px: 1.5, py: 0,
                    borderColor: 'divider',
                    ...(active && {
                      bgcolor: color ? `${color}14` : 'action.selected',
                      color: color || 'text.primary',
                      borderColor: color ? `${color}66` : 'divider',
                      '&:hover': { bgcolor: color ? `${color}22` : 'action.hover' },
                    }),
                  }}
                >{label}</Button>
              ))}
            </ButtonGroup>
          </Box>
          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.secondary', flexShrink: 0 }}>
            {sorted.length} of {rows.length}
          </Typography>
        </Box>
      )}

      <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader sx={{ tableLayout: 'auto' }}>
          <TableHead>
            <TableRow>
              {COLUMNS.map(col => (
                <TableCell
                  key={col.id}
                  style={col.align === 'center' ? cAlign : undefined}
                  sx={{ ...headSx, whiteSpace: 'nowrap' }}
                >
                  {col.sortable === false ? col.label : (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                      sx={{
                        '& .MuiTableSortLabel-icon': { fontSize: 14, position: 'absolute', right: -16, opacity: orderBy === col.id ? 1 : 0 },
                        ...(col.align === 'center' ? { justifyContent: 'center', width: '100%' } : {}),
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(row => {
              const statusColor = STATUS_COLOR[row.derivedStatus] || '#999'
              const deployments = row.deployments || []
              const isAppExpanded = expandedApps.has(row.name)
              const sloVal = row.derivedSlo ?? row.slo?.current

              return (
                <Fragment key={row.name}>
                  {/* ── Application row ── */}
                  <TableRow hover sx={{ '&:last-child td': { border: 0 } }}>
                    {/* Name — manage icon + expand chevron + name */}
                    <TableCell sx={cellSx}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {row.depCount > 0 ? (
                          <IconButton
                            size="small"
                            onClick={() => toggleApp(row.name)}
                            sx={{ p: 0, mr: 0.5, flexShrink: 0 }}
                          >
                            {isAppExpanded
                              ? <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              : <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                            }
                          </IconButton>
                        ) : (
                          <Box sx={{ width: 20, flexShrink: 0 }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{ fontSize: '0.82rem', fontWeight: 700, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, color: '#1976d2' }}
                        >
                          {row.name} — {row.seal}
                        </Typography>
                        <Chip
                          label={row.derivedStatus}
                          size="small"
                          sx={{
                            height: 20, fontSize: '0.6rem', fontWeight: 700,
                            textTransform: 'uppercase',
                            bgcolor: `${statusColor}18`,
                            color: statusColor,
                            ml: 1, flexShrink: 0,
                          }}
                        />
                      </Box>
                    </TableCell>
                    {/* CPOF */}
                    <TableCell style={cAlign} sx={cellSx}>
                      {row.hasCpof ? (
                        <Chip label="Yes" size="small" sx={{ height: 18, fontSize: '0.56rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                      ) : (
                        <Typography variant="caption" sx={{ fontSize: '0.64rem', color: 'text.disabled' }}>—</Typography>
                      )}
                    </TableCell>
                    {/* RTO */}
                    <TableCell style={cAlign} sx={cellSx}>
                      <Typography variant="caption" sx={{ fontSize: '0.68rem', color: row.displayRto ? 'text.primary' : 'text.disabled' }}>
                        {row.displayRto ? `${row.displayRto}h` : '—'}
                      </Typography>
                    </TableCell>
                    {/* SLO Status */}
                    <TableCell style={cAlign} sx={cellSx}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.78rem', fontWeight: 700,
                          color: sloVal != null ? 'text.secondary' : 'text.disabled',
                        }}
                      >
                        {sloVal != null ? `${sloVal}%` : '—'}
                      </Typography>
                    </TableCell>
                    {/* Open P1/P2 */}
                    <TableCell style={cAlign} sx={cellSx}>
                      {(row.incidents_30d ?? 0) > 0 ? (
                        <Link
                          href="#"
                          onClick={e => e.preventDefault()}
                          underline="hover"
                          sx={{
                            fontSize: '0.78rem', fontWeight: 700,
                            color: (row.incidents_30d ?? 0) > 2 ? '#f44336' : '#ff9800',
                          }}
                        >
                          {row.incidents_30d}
                        </Link>
                      ) : (
                        <Typography variant="caption" sx={{ fontSize: '0.78rem', fontWeight: 700, color: 'text.disabled' }}>
                          0
                        </Typography>
                      )}
                    </TableCell>
                    {/* Last Incident */}
                    <TableCell style={cAlign} sx={cellSx}>
                      <Typography variant="caption" sx={{ fontSize: '0.68rem', color: row.last && row.last !== '—' ? 'text.secondary' : 'text.disabled' }}>
                        {row.last || '—'}
                      </Typography>
                    </TableCell>
                    {/* Blast Radius */}
                    <TableCell sx={tightCellSx}>
                      <CrossLinkChips seal={row.seal} only={['blast-radius']} />
                    </TableCell>
                    {/* Contact */}
                    <TableCell style={cAlign} sx={tightCellSx}>
                      <Tooltip title="Contact Team" arrow>
                        <IconButton
                          size="small"
                          onClick={() => setContactApp(row)}
                          sx={{ p: 0.25 }}
                        >
                          <ChatBubbleIcon sx={{ fontSize: 16, color: '#42a5f5' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    {/* Manage */}
                    <TableCell style={cAlign} sx={tightCellSx}>
                      <Tooltip title="Manage" arrow>
                        <IconButton
                          size="small"
                          onClick={() => setDetailApp(row)}
                          sx={{ p: 0.25, color: '#42a5f5', '&:hover': { color: '#1e88e5' } }}
                        >
                          <TuneIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* ── Deployment sub-rows ── */}
                  {isAppExpanded && deployments.map(d => {
                    const dColor = STATUS_COLOR[d.status] || '#999'
                    const comps = d.components || []
                    const hasComps = comps.length > 0
                    const isDepExpanded = expandedDeps.has(d.id)
                    const depIncidents = comps.reduce((s, c) => s + (c.incidents_30d || 0), 0)
                    const depLastIncident = deriveLastIncident(d.id, depIncidents, d.status)

                    return (
                      <Fragment key={d.id}>
                        <TableRow sx={{ bgcolor: depRowBg }}>
                          {/* Name — manage icon + indented, colored dot + expand + name */}
                          <TableCell sx={cellSx}>
                            <Box sx={{ display: 'flex', alignItems: 'center', pl: 6 }}>
                              {hasComps ? (
                                <IconButton
                                  size="small"
                                  onClick={() => toggleDep(d.id)}
                                  sx={{ p: 0, mr: 0.5, flexShrink: 0 }}
                                >
                                  {isDepExpanded
                                    ? <ExpandMoreIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                    : <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  }
                                </IconButton>
                              ) : (
                                <Box sx={{ width: 18, flexShrink: 0 }} />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.74rem', fontWeight: 600, textAlign: 'left',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  minWidth: 0, color: 'text.secondary',
                                }}
                              >
                                {d.label}
                              </Typography>
                              <Chip
                                label={d.status}
                                size="small"
                                sx={{
                                  height: 18, fontSize: '0.52rem', fontWeight: 700,
                                  textTransform: 'uppercase',
                                  bgcolor: `${dColor}18`,
                                  color: dColor,
                                  ml: 1, flexShrink: 0,
                                }}
                              />
                            </Box>
                          </TableCell>
                          {/* CPOF */}
                          <TableCell style={cAlign} sx={cellSx}>
                            {d.cpof ? (
                              <Chip label="Yes" size="small" sx={{ height: 16, fontSize: '0.52rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }} />
                            ) : (
                              <Typography variant="caption" sx={{ fontSize: '0.64rem', color: 'text.disabled' }}>—</Typography>
                            )}
                          </TableCell>
                          {/* RTO */}
                          <TableCell style={cAlign} sx={cellSx}>
                            <Typography variant="caption" sx={{ fontSize: '0.66rem', color: d.rto != null ? 'text.primary' : 'text.disabled' }}>
                              {d.rto != null ? `${d.rto}h` : '—'}
                            </Typography>
                          </TableCell>
                          {/* SLO Status */}
                          <TableCell style={cAlign} sx={cellSx}>
                            <Typography variant="caption" sx={{
                              fontSize: '0.66rem', fontWeight: 600,
                              color: d.slo != null ? 'text.secondary' : 'text.disabled',
                            }}>
                              {d.slo != null ? `${d.slo}%` : '—'}
                            </Typography>
                          </TableCell>
                          {/* Open P1/P2 */}
                          <TableCell style={cAlign} sx={cellSx}>
                            {depIncidents > 0 ? (
                              <Link
                                href="#"
                                onClick={e => e.preventDefault()}
                                underline="hover"
                                sx={{
                                  fontSize: '0.66rem', fontWeight: 600,
                                  color: depIncidents > 2 ? '#f44336' : '#ff9800',
                                }}
                              >
                                {depIncidents}
                              </Link>
                            ) : (
                              <Typography variant="caption" sx={{ fontSize: '0.66rem', fontWeight: 600, color: 'text.disabled' }}>—</Typography>
                            )}
                          </TableCell>
                          {/* Last Incident */}
                          <TableCell style={cAlign} sx={cellSx}>
                            <Typography variant="caption" sx={{ fontSize: '0.64rem', color: depLastIncident ? 'text.secondary' : 'text.disabled' }}>
                              {depLastIncident || '—'}
                            </Typography>
                          </TableCell>
                          {/* Blast Radius */}
                          <TableCell sx={tightCellSx} />
                          {/* Contact */}
                          <TableCell style={cAlign} sx={tightCellSx}>
                            <Tooltip title="Contact Team" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setContactApp({ ...row, name: `${row.name} — ${d.label}` })}
                                sx={{ p: 0.25 }}
                              >
                                <ChatBubbleIcon sx={{ fontSize: 14, color: '#42a5f5' }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          {/* Manage */}
                          <TableCell style={cAlign} sx={tightCellSx}>
                            <Tooltip title="Manage" arrow>
                              <IconButton
                                size="small"
                                onClick={() => setDetailDep({ deployment: d, app: row })}
                                sx={{ p: 0.25, color: '#42a5f5', '&:hover': { color: '#1e88e5' } }}
                              >
                                <TuneIcon sx={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* ── Component sub-rows (no divider lines between them) ── */}
                        {isDepExpanded && comps.map((c, ci) => {
                          const cColor = STATUS_COLOR[c.status] || '#999'
                          const isBad = c.status !== 'healthy'
                          const compBorder = ci < comps.length - 1 ? 'none' : undefined
                          return (
                            <TableRow key={c.id} sx={{ bgcolor: depRowBg }}>
                              {/* Name — deeper indent, colored dot + name */}
                              <TableCell sx={{ ...cellSx, borderBottom: compBorder }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', pl: 12.5 }}>
                                  <SubdirectoryArrowRightIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0, mr: 0.25 }} />
                                  <Typography variant="caption" sx={{
                                    fontSize: '0.66rem',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    fontWeight: isBad ? 600 : 400,
                                    color: '#fff',
                                    minWidth: 0,
                                  }}>
                                    {c.label}
                                  </Typography>
                                  <Chip
                                    label={c.status}
                                    size="small"
                                    sx={{
                                      height: 16, fontSize: '0.48rem', fontWeight: 700,
                                      textTransform: 'uppercase',
                                      bgcolor: `${cColor}18`,
                                      color: cColor,
                                      ml: 1, flexShrink: 0,
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              {/* CPOF */}
                              <TableCell sx={{ ...cellSx, borderBottom: compBorder }} />
                              {/* RTO */}
                              <TableCell sx={{ ...cellSx, borderBottom: compBorder }} />
                              {/* SLO Status */}
                              <TableCell style={cAlign} sx={{ ...cellSx, borderBottom: compBorder }}>
                                <Typography variant="caption" sx={{
                                  fontSize: '0.64rem', fontWeight: 600,
                                  color: c.slo != null ? 'text.secondary' : 'text.disabled',
                                }}>
                                  {c.slo != null ? `${c.slo}%` : '—'}
                                </Typography>
                              </TableCell>
                              {/* Open P1/P2 */}
                              <TableCell style={cAlign} sx={{ ...cellSx, borderBottom: compBorder }}>
                                {c.incidents_30d > 0 ? (
                                  <Link
                                    href="#"
                                    onClick={e => e.preventDefault()}
                                    underline="hover"
                                    sx={{
                                      fontSize: '0.66rem', fontWeight: 600,
                                      color: c.incidents_30d > 2 ? '#f44336' : '#ff9800',
                                    }}
                                  >
                                    {c.incidents_30d}
                                  </Link>
                                ) : (
                                  <Typography variant="caption" sx={{ fontSize: '0.66rem', fontWeight: 600, color: 'text.disabled' }}>—</Typography>
                                )}
                              </TableCell>
                              {/* Last Incident */}
                              <TableCell style={cAlign} sx={{ ...cellSx, borderBottom: compBorder }}>
                                {(() => {
                                  const cLast = deriveLastIncident(c.id, c.incidents_30d, c.status)
                                  return (
                                    <Typography variant="caption" sx={{ fontSize: '0.64rem', color: cLast ? 'text.secondary' : 'text.disabled' }}>
                                      {cLast || '—'}
                                    </Typography>
                                  )
                                })()}
                              </TableCell>
                              {/* Blast Radius */}
                              <TableCell sx={{ ...tightCellSx, borderBottom: compBorder }} />
                              {/* Contact */}
                              <TableCell sx={{ ...tightCellSx, borderBottom: compBorder }} />
                              {/* Manage */}
                              <TableCell sx={{ ...tightCellSx, borderBottom: compBorder }} />
                            </TableRow>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modals */}
      {detailApp && (
        <AppDetailModal
          app={detailApp}
          teams={teams}
          onClose={() => setDetailApp(null)}
          onTeamsChanged={onAppTeamsChanged}
          onExcludedIndicatorsChanged={onAppExcludedChanged}
        />
      )}
      {detailDep && (
        <DeploymentDetailModal
          deployment={detailDep.deployment}
          app={detailDep.app}
          teams={teams}
          onClose={() => setDetailDep(null)}
          onExcludedIndicatorsChanged={onAppExcludedChanged}
        />
      )}
      {contactApp && (
        <ContactModal
          app={contactApp}
          teams={resolveTeams(contactApp)}
          onClose={() => setContactApp(null)}
        />
      )}
    </Box>
  )
})

export default AppTable
