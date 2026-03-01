import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  Box, Typography, ToggleButtonGroup, ToggleButton,
  Collapse, IconButton, Tooltip,
} from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

const STATUS_RANK = { critical: 0, warning: 1, healthy: 2, no_data: 3 }
const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50', no_data: '#78909c' }

const SS_TREE_KEY = 'apps-tree-expanded'

function loadExpandedPaths() {
  try {
    const raw = sessionStorage.getItem(SS_TREE_KEY)
    return raw ? new Set(JSON.parse(raw)) : null
  } catch { return null }
}

function saveExpandedPaths(expanded) {
  sessionStorage.setItem(SS_TREE_KEY, JSON.stringify([...expanded]))
}

function derivedStatus(app) {
  const deployments = app.deployments || []
  if (deployments.length === 0) return 'no_data'
  const appExcl = new Set(app.excluded_indicators || [])
  let worst = 'no_data'
  let hasRag = false
  for (const d of deployments) {
    const depExcl = new Set([...appExcl, ...(d.excluded_indicators || [])])
    for (const c of (d.components || [])) {
      if (depExcl.has(c.indicator_type)) continue
      if (c.status === 'no_data') continue
      if (!hasRag) { worst = 'healthy'; hasRag = true }
      if ((STATUS_RANK[c.status] ?? 2) < (STATUS_RANK[worst] ?? 2)) worst = c.status
    }
  }
  return worst
}

function worstStatus(apps) {
  let worst = 'no_data'
  let hasRag = false
  for (const a of apps) {
    const s = derivedStatus(a)
    if (s === 'no_data') continue
    if (!hasRag) { worst = 'healthy'; hasRag = true }
    if (STATUS_RANK[s] < STATUS_RANK[worst]) worst = s
  }
  return worst
}

/* ── Build nested trees from a flat app list ── */

function buildBusinessTree(apps) {
  const tree = {}
  apps.forEach(app => {
    const lob = app.lob || '(No LOB)'
    const sub = app.subLob || '(General)'
    const pl = app.productLine || '(No Product Line)'
    const prod = app.product || '(No Product)'
    tree[lob] ??= {}
    tree[lob][sub] ??= {}
    tree[lob][sub][pl] ??= {}
    tree[lob][sub][pl][prod] ??= []
    tree[lob][sub][pl][prod].push(app)
  })
  return tree
}

function buildTechTree(apps) {
  const tree = {}
  apps.forEach(app => {
    const lob = app.lob || '(No LOB)'
    const cto = app.cto || '(No CTO)'
    const cbt = app.cbt || '(No CBT)'
    tree[lob] ??= {}
    tree[lob][cto] ??= {}
    tree[lob][cto][cbt] ??= []
    tree[lob][cto][cbt].push(app)
  })
  return tree
}

function collectApps(obj) {
  if (Array.isArray(obj)) return obj
  return Object.values(obj).flatMap(v => collectApps(v))
}

/* ── Generic collapsible tree node ── */

function isAncestorOf(nodePath, selectedPath) {
  if (!selectedPath || selectedPath === 'all' || nodePath === 'all') return false
  const selParts = selectedPath.replace(/^[^:]+:/, '').split('/')
  const nodeParts = nodePath.replace(/^[^:]+:/, '').split('/')
  if (nodeParts.length >= selParts.length) return false
  return nodeParts.every((p, i) => p === selParts[i])
}

function TreeNode({ label, apps, depth, children, selectedPath, onSelect, path, expandedPaths, onToggle }) {
  const isOpen = expandedPaths.has(path)
  const isLeafBranch = !children
  const status = worstStatus(apps)
  const isSelected = selectedPath === path

  return (
    <Box>
      <Box
        onClick={() => {
          if (children) onToggle(path)
          onSelect(path, apps)
        }}
        sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          pl: depth * 1.5, pr: 0.5, py: 0.35,
          cursor: 'pointer', borderRadius: 1,
          bgcolor: isSelected ? 'action.selected' : 'transparent',
          '&:hover': { bgcolor: 'action.hover' },
          transition: 'background 0.12s',
        }}
      >
        {children ? (
          <IconButton size="small" sx={{ p: 0, width: 18, height: 18 }}>
            {isOpen ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ChevronRightIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 18 }} />
        )}
        <FiberManualRecordIcon sx={{ fontSize: 7, color: STATUS_COLOR[status], flexShrink: 0 }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.72rem', fontWeight: isSelected ? 700 : 500,
            color: 'text.primary', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            flex: 1, minWidth: 0,
          }}
          title={label}
        >
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.62rem', color: 'text.disabled', flexShrink: 0 }}>
          {apps.length}
        </Typography>
      </Box>
      {children && (
        <Collapse in={isOpen} timeout={150}>
          {children}
        </Collapse>
      )}
    </Box>
  )
}

/* ── Main sidebar ── */

export default function AppTreeSidebar({ apps, onSelect, selectedPath, statusFilter = 'all', onStatusFilter, treeMode: mode, onTreeModeChange: setMode, width = 300 }) {

  const businessTree = useMemo(() => buildBusinessTree(apps), [apps])
  const techTree = useMemo(() => buildTechTree(apps), [apps])

  const tree = mode === 'business' ? businessTree : techTree

  // Collect all possible tree paths for expand/collapse-all
  const allPaths = useMemo(() => {
    const paths = new Set(['all'])
    for (const lob of Object.keys(tree)) {
      paths.add(`lob:${lob}`)
      for (const sub of Object.keys(tree[lob])) {
        paths.add(`sub:${lob}/${sub}`)
        for (const l3 of Object.keys(tree[lob][sub])) {
          paths.add(`l3:${lob}/${sub}/${l3}`)
          if (!Array.isArray(tree[lob][sub][l3])) {
            for (const l4 of Object.keys(tree[lob][sub][l3])) {
              paths.add(`l4:${lob}/${sub}/${l3}/${l4}`)
            }
          }
        }
      }
    }
    return paths
  }, [tree])

  // Centralized expansion state — persisted to sessionStorage
  const [expandedPaths, setExpandedPaths] = useState(() => {
    const saved = loadExpandedPaths()
    if (saved) return saved
    return new Set(['all'])
  })

  // Persist whenever expandedPaths changes
  useEffect(() => { saveExpandedPaths(expandedPaths) }, [expandedPaths])

  // Reset expansions when tree mode changes (paths differ between business/technology)
  const prevMode = useRef(mode)
  useEffect(() => {
    if (prevMode.current !== mode) {
      setExpandedPaths(new Set(['all']))
      prevMode.current = mode
    }
  }, [mode])

  const toggleNode = useCallback((path) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const isAllExpanded = allPaths.size > 0 && [...allPaths].every(p => expandedPaths.has(p))

  const toggleExpandAll = useCallback(() => {
    setExpandedPaths(prev => {
      if ([...allPaths].every(p => prev.has(p))) return new Set()
      return new Set(allPaths)
    })
  }, [allPaths])

  return (
    <Box sx={{
      width, minWidth: width, height: '100%',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid', borderColor: 'divider',
      bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
    }}>
      {/* Header */}
      <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            size="small"
            sx={{ flex: 1 }}
          >
            <ToggleButton value="business" sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.4, flex: 1 }}>
              Business
            </ToggleButton>
            <ToggleButton value="technology" sx={{ textTransform: 'none', fontSize: '0.7rem', py: 0.4, flex: 1 }}>
              Technology
            </ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title={isAllExpanded ? 'Collapse All' : 'Expand All'} arrow>
            <IconButton size="small" onClick={toggleExpandAll} sx={{ p: 0.5 }}>
              {isAllExpanded ? <UnfoldLessIcon sx={{ fontSize: 18 }} /> : <UnfoldMoreIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Tree */}
      <Box sx={{ flex: 1, overflow: 'auto', pb: 1 }}>
        {/* "All" root node */}
        <TreeNode
          label="All Applications"
          apps={apps}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          path="all"
          expandedPaths={expandedPaths}
          onToggle={toggleNode}
        >
          {Object.keys(tree).sort().map((lob) => {
            const lobApps = collectApps(tree[lob])
            return (
              <TreeNode key={lob} label={lob} apps={lobApps} depth={1}
                selectedPath={selectedPath} onSelect={onSelect} path={`lob:${lob}`}
                expandedPaths={expandedPaths} onToggle={toggleNode}
              >
                {Object.keys(tree[lob]).sort().map((sub) => {
                  const subApps = collectApps(tree[lob][sub])
                  const skipSub = sub === '(General)' && Object.keys(tree[lob]).length === 1

                  const l3Keys = Object.keys(tree[lob][sub]).sort()
                  const l3Content = l3Keys.map((l3) => {
                    const l3Apps = collectApps(tree[lob][sub][l3])
                    const l3Children = Array.isArray(tree[lob][sub][l3]) ? null : tree[lob][sub][l3]
                    const l4Keys = l3Children ? Object.keys(l3Children).sort() : []
                    return (
                      <TreeNode key={l3} label={l3} apps={l3Apps} depth={skipSub ? 2 : 3}
                        selectedPath={selectedPath} onSelect={onSelect} path={`l3:${lob}/${sub}/${l3}`}
                        expandedPaths={expandedPaths} onToggle={toggleNode}
                      >
                        {l3Children && l4Keys.map((l4) => {
                          const l4Apps = collectApps(l3Children[l4])
                          return (
                            <TreeNode key={l4} label={l4} apps={l4Apps} depth={skipSub ? 3 : 4}
                              selectedPath={selectedPath} onSelect={onSelect} path={`l4:${lob}/${sub}/${l3}/${l4}`}
                              expandedPaths={expandedPaths} onToggle={toggleNode}
                            />
                          )
                        })}
                      </TreeNode>
                    )
                  })

                  if (skipSub) return l3Content

                  return (
                    <TreeNode key={sub} label={sub} apps={subApps} depth={2}
                      selectedPath={selectedPath} onSelect={onSelect} path={`sub:${lob}/${sub}`}
                      expandedPaths={expandedPaths} onToggle={toggleNode}
                    >
                      {l3Content}
                    </TreeNode>
                  )
                })}
              </TreeNode>
            )
          })}
        </TreeNode>
      </Box>

      {/* Footer summary */}
      <Box sx={{
        px: 1.5, py: 1, borderTop: '1px solid', borderColor: 'divider',
        display: 'flex', justifyContent: 'center',
      }}>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary' }}>
          {apps.length} Applications
        </Typography>
      </Box>
    </Box>
  )
}
