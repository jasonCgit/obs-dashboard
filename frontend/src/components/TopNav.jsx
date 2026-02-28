import { useState, useRef, useEffect, useCallback } from 'react'
import {
  AppBar, Toolbar, Box, Typography, Button, Badge, TextField, InputAdornment,
  Chip, Stack, IconButton, Menu, MenuItem, Tooltip,
  Avatar, Divider, ListItemIcon, ListItemText,
  Popover, List, ListItem, ListItemButton, Tab, Tabs, Dialog, DialogTitle, DialogContent,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import SearchIcon    from '@mui/icons-material/Search'
import AddIcon       from '@mui/icons-material/Add'
import CloseIcon     from '@mui/icons-material/Close'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon  from '@mui/icons-material/DarkMode'
import PersonIcon    from '@mui/icons-material/Person'
import SettingsIcon  from '@mui/icons-material/Settings'
import LogoutIcon    from '@mui/icons-material/Logout'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import NotificationsIcon from '@mui/icons-material/Notifications'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen'
import HomeIcon from '@mui/icons-material/Home'
import CampaignIcon from '@mui/icons-material/Campaign'
import AppsIcon from '@mui/icons-material/Apps'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import RouteIcon from '@mui/icons-material/Route'
import StarIcon from '@mui/icons-material/Star'
import LinkIcon from '@mui/icons-material/Link'
import ShieldIcon from '@mui/icons-material/Shield'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import InventoryIcon from '@mui/icons-material/Inventory'
import SpeedIcon from '@mui/icons-material/Speed'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'
import LayersIcon from '@mui/icons-material/Layers'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppTheme } from '../ThemeContext'
import { useFilters } from '../FilterContext'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { BrochureButton } from './BrochureModal'
import SearchFilterPopover from './SearchFilterPopover'
import { useRefresh } from '../RefreshContext'
import { useTenant } from '../tenant/TenantContext'
import { loadAllTenants, DEFAULT_TENANT } from '../tenant/tenantStorage'

const ALL_TABS = [
  { label: 'Home',              path: '/',                Icon: HomeIcon,        desc: 'Dashboard overview' },
  { label: 'Announcements',     path: '/announcements',   Icon: CampaignIcon,    desc: 'Manage communications' },
  { label: 'Applications',      path: '/applications',    Icon: AppsIcon,        desc: 'Manage app inventory & health' },
  { label: 'Blast Radius',      path: '/graph-layers',    Icon: LayersIcon,      desc: 'Multi-layer dependency visualization' },
  { label: 'Customer Journeys', path: '/customer-journey', Icon: RouteIcon,      desc: 'End-to-end user experience' },
  { label: 'Favorites',         path: '/favorites',       Icon: StarIcon,        desc: 'Pinned View Centrals' },
  { label: 'Incident Zero',    path: '/incident-zero',   Icon: ShieldIcon,      desc: 'Proactive pre-incident management' },
  { label: 'Links',             path: '/links',           Icon: LinkIcon,        desc: 'Quick links & resources' },
  { label: 'Product Catalog',   path: '/product-catalog', Icon: InventoryIcon,   desc: 'Mapping of applications' },
  { label: 'SLO Agent',         path: '/slo-agent',       Icon: SpeedIcon,       desc: 'Auto management of SLOs' },
  { label: 'View Central',      path: '/view-central',    Icon: ViewQuiltIcon,   desc: 'Custom dashboards' },
]

const STORAGE_KEY = 'obs-open-tabs'

function loadTabs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return ['Home']
}

function saveTabs(tabs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs))
}

export default function TopNav() {
  const navigate           = useNavigate()
  const { pathname }       = useLocation()
  const [openTabs, setOpenTabs] = useState(loadTabs)
  const [anchorEl, setAnchorEl] = useState(null)
  const [tabSearch, setTabSearch] = useState('')
  const [profileAnchor, setProfileAnchor] = useState(null)
  const { themeMode, toggleTheme } = useAppTheme()
  const { filteredApps, totalApps, activeFilterCount, searchText, resetToDefaults } = useFilters()
  const { refreshMs, setRefreshMs, displayTime, REFRESH_OPTIONS, triggerRefresh } = useRefresh()
  const { tenant, switchTenant } = useTenant()
  const [tenants, setTenants] = useState([])
  const [searchAnchor, setSearchAnchor] = useState(null)
  const [refreshAnchor, setRefreshAnchor] = useState(null)
  const [notifAnchor, setNotifAnchor] = useState(null)
  const [notifTab, setNotifTab] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [readItems, setReadItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('obs-read-activities') || '[]') } catch { return [] }
  })
  const [notifExpanded, setNotifExpanded] = useState(false)
  const [detailItem, setDetailItem] = useState(null)
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Refresh tenant list when profile menu opens
  useEffect(() => {
    if (profileAnchor) setTenants(loadAllTenants().sort((a, b) => (a.name || '').localeCompare(b.name || '')))
  }, [profileAnchor])

  // Persist read items
  const persistRead = (keys) => { setReadItems(keys); localStorage.setItem('obs-read-activities', JSON.stringify(keys)) }
  const itemKey = (cat, desc) => `${cat}::${desc}`
  const isRead = (cat, desc) => readItems.includes(itemKey(cat, desc))
  const markRead = (cat, desc) => { if (!isRead(cat, desc)) persistRead([...readItems, itemKey(cat, desc)]) }
  const markAllRead = () => {
    const allKeys = recentActivities.flatMap(s => (s.items || []).map(it => itemKey(s.category, it.description)))
    persistRead([...new Set([...readItems, ...allKeys])])
  }
  const markAllUnread = () => { persistRead([]) }

  // Fetch banner notifications + recent activities
  const fetchNotifications = useCallback(async () => {
    try {
      const [notifRes, actRes] = await Promise.all([
        fetch('/api/announcements/notifications'),
        fetch('/api/recent-activities'),
      ])
      const notifJson = await notifRes.json()
      setNotifications(Array.isArray(notifJson) ? notifJson : [])
      const actJson = await actRes.json()
      setRecentActivities(Array.isArray(actJson) ? actJson : [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Count only unread activity items for badge
  const activityCount = recentActivities.reduce((s, sec) =>
    s + (sec.items || []).filter(it => !isRead(sec.category, it.description)).length, 0)

  // Ctrl+K / Cmd+K to open search
  const searchTriggerRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchAnchor(searchTriggerRef.current)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Drag-and-drop state — label-based
  const dragLabel = useRef(null)
  const [dragging, setDragging] = useState(null)   // label being dragged
  const [dragOver, setDragOver] = useState(null)    // label being hovered
  const [dragSide, setDragSide] = useState('left')  // 'left' or 'right' half of target

  const availableToAdd = ALL_TABS.filter(t => !openTabs.includes(t.label))

  const addTab = (label) => {
    const next = [...openTabs, label]
    setOpenTabs(next)
    saveTabs(next)
    setAnchorEl(null)
    setTabSearch('')
    const tab = ALL_TABS.find(t => t.label === label)
    if (tab?.path) navigate(tab.path)
  }

  const removeTab = (label, e) => {
    e.stopPropagation()
    const next = openTabs.filter(l => l !== label)
    setOpenTabs(next)
    saveTabs(next)
    const tab = ALL_TABS.find(t => t.label === label)
    if (tab?.path && pathname === tab.path) navigate('/')
  }

  // Preserve user's tab order from openTabs (not ALL_TABS order)
  const visibleTabs = openTabs
    .map(label => ALL_TABS.find(t => t.label === label))
    .filter(Boolean)

  // ── Drag-and-drop handlers (label-based, no index math) ──
  const onDragStart = (e, label) => {
    if (label === 'Home') { e.preventDefault(); return }
    dragLabel.current = label
    setDragging(label)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', label)
  }

  const onDragOver = (e, label) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (label !== 'Home') {
      setDragOver(label)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragSide((e.clientX - rect.left) > rect.width / 2 ? 'right' : 'left')
    }
  }

  const onDrop = (e, dropLabel) => {
    e.preventDefault()
    const from = dragLabel.current
    if (!from || from === dropLabel || dropLabel === 'Home') {
      dragLabel.current = null; setDragging(null); setDragOver(null)
      return
    }
    const without = openTabs.filter(l => l !== from)
    const dropPos = without.indexOf(dropLabel)
    // Insert before or after based on which half of the target was hovered
    const insertAt = dragSide === 'right' ? dropPos + 1 : dropPos
    without.splice(insertAt, 0, from)
    setOpenTabs(without)
    saveTabs(without)
    dragLabel.current = null; setDragging(null); setDragOver(null)
  }

  const onDragEnd = () => {
    dragLabel.current = null; setDragging(null); setDragOver(null)
  }

  const navBg      = isDark ? '#0d1b2a' : theme.palette.primary.dark
  const menuBg     = isDark ? '#131f2e' : theme.palette.background.paper
  const menuBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'
  const searchBg   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.2)'

  return (
    <AppBar
      position="sticky"
      sx={{ bgcolor: navBg, boxShadow: 'none', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)'}` }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '56px !important', px: { xs: '12px !important', sm: '24px !important' } }}>

        {/* Logo + Brand — both clickable to Home */}
        <Box
          onClick={() => { resetToDefaults(); navigate('/') }}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0, mr: 2 }}
        >
          {tenant.logoImage ? (
            <Box component="img" src={tenant.logoImage}
              sx={{ width: 34, height: 34, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <Box
              sx={{
                background: `linear-gradient(135deg, ${tenant.logoGradient[0]}, ${tenant.logoGradient[1]})`,
                borderRadius: 1.5,
                width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 8px ${tenant.logoGradient[0]}58`,
              }}
            >
              <Typography sx={{ fontWeight: 900, color: 'white', fontSize: '1.1rem', lineHeight: 1, fontFamily: '"Inter", sans-serif' }}>
                {tenant.logoLetter}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={700} color="white" lineHeight={1.1}>
              {tenant.title}
            </Typography>
            {tenant.subtitle && (
              <Typography noWrap sx={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.1, mt: 0.15 }}>
                {tenant.subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Nav tabs — draggable */}
        <Stack direction="row" spacing={0} sx={{
          flexGrow: 1, alignItems: 'center',
          overflowX: 'auto', overflowY: 'hidden',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {visibleTabs.map((tab) => {
            const active = tab.path && pathname === tab.path
            const isHome = tab.label === 'Home'
            const isTabDragging = dragging === tab.label
            const isTabDragOver = dragOver === tab.label && dragging !== tab.label
            return (
              <Box
                key={tab.label}
                draggable={!isHome}
                onDragStart={(e) => onDragStart(e, tab.label)}
                onDragOver={(e) => onDragOver(e, tab.label)}
                onDrop={(e) => onDrop(e, tab.label)}
                onDragEnd={onDragEnd}
                sx={{
                  display: 'flex', alignItems: 'center', position: 'relative',
                  opacity: isTabDragging ? 0.4 : 1,
                  borderLeft: (isTabDragOver && dragSide === 'left') ? '2px solid rgba(96,165,250,0.8)' : '2px solid transparent',
                  borderRight: (isTabDragOver && dragSide === 'right') ? '2px solid rgba(96,165,250,0.8)' : '2px solid transparent',
                  transition: 'border-color 0.15s, opacity 0.15s',
                  cursor: isHome ? 'default' : 'grab',
                  '&:active': { cursor: isHome ? 'default' : 'grabbing' },
                  ...(active && {
                    bgcolor: 'rgba(96,165,250,0.15)',
                    borderRadius: 1,
                    borderBottom: '2px solid #60a5fa',
                  }),
                  '& .drag-handle': { opacity: 0 },
                  '&:hover .drag-handle': { opacity: 0.5 },
                }}
              >
                {!isHome && (
                  <DragIndicatorIcon className="drag-handle" sx={{
                    fontSize: 12, color: 'rgba(255,255,255,0.5)',
                    transition: 'opacity 0.15s', ml: 0.25, mr: -0.5,
                    cursor: 'grab',
                  }} />
                )}
                <Button
                  size="small"
                  onClick={() => tab.path && navigate(tab.path)}
                  sx={{
                    color: active ? '#93c5fd' : 'rgba(255,255,255,0.65)',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    px: isHome ? 1 : 0.75,
                    pr: isHome ? 1 : 2.5,
                    minWidth: 'auto',
                    fontWeight: active ? 600 : 400,
                    '&:hover': { color: active ? '#bfdbfe' : 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                    pointerEvents: 'auto',
                  }}
                >
                  {tab.Icon && <tab.Icon sx={{ fontSize: 14, mr: 0.5, opacity: active ? 0.9 : 0.7 }} />}
                  {tab.label}
                </Button>

                {/* Close button — hidden for Home */}
                {!isHome && (
                  <Tooltip title={`Close ${tab.label}`} placement="bottom">
                    <IconButton
                      size="small"
                      onClick={(e) => removeTab(tab.label, e)}
                      sx={{
                        position: 'absolute',
                        right: 2,
                        p: 0.1,
                        color: 'rgba(255,255,255,0.4)',
                        '&:hover': { color: 'white', bgcolor: 'transparent' },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )
          })}

          {/* + Add tab button */}
          {availableToAdd.length > 0 && (
            <Tooltip title="Add tab">
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  ml: 0.5,
                  color: '#60a5fa',
                  border: '1.5px dashed rgba(96,165,250,0.5)',
                  borderRadius: 1,
                  width: 28,
                  height: 28,
                  '&:hover': { color: '#93c5fd', bgcolor: 'rgba(96,165,250,0.15)', borderColor: '#60a5fa' },
                }}
              >
                <AddIcon sx={{ fontSize: 20, fontWeight: 'bold' }} />
              </IconButton>
            </Tooltip>
          )}

          <Popover
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => { setAnchorEl(null); setTabSearch('') }}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                bgcolor: menuBg,
                border: `1px solid ${menuBorder}`,
                width: 280,
                mt: 0.5,
                borderRadius: 2,
              },
            }}
          >
            <Box sx={{ px: 1.5, pt: 1.5, pb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', display: 'block', mb: 1 }}>
                Add a tab
              </Typography>
              <TextField
                autoFocus
                size="small"
                fullWidth
                placeholder="Search tabs..."
                value={tabSearch}
                onChange={(e) => setTabSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  sx: { fontSize: '0.82rem', borderRadius: 1.5 },
                }}
              />
            </Box>
            <Divider />
            <List sx={{ maxHeight: 480, overflow: 'auto', py: 0.5 }}>
              {availableToAdd
                .filter(t => t.label.toLowerCase().includes(tabSearch.toLowerCase()))
                .map((tab) => {
                  const TabIcon = tab.Icon
                  return (
                    <ListItem key={tab.label} disablePadding>
                      <ListItemButton
                        onClick={() => addTab(tab.label)}
                        sx={{
                          py: 1, px: 1.5, gap: 1.5,
                          borderRadius: 1, mx: 0.5,
                          transition: 'background-color 0.15s',
                          '&:hover': {
                            bgcolor: 'rgba(96,165,250,0.1)',
                            '& .tab-icon': { color: '#60a5fa', bgcolor: 'rgba(96,165,250,0.15)' },
                            '& .tab-label': { color: '#60a5fa' },
                          },
                        }}
                      >
                        <Box className="tab-icon" sx={{
                          width: 32, height: 32, borderRadius: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                          color: 'text.secondary', transition: 'color 0.15s, background-color 0.15s',
                          flexShrink: 0,
                        }}>
                          {TabIcon && <TabIcon sx={{ fontSize: 17 }} />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography className="tab-label" sx={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3, color: 'text.primary', transition: 'color 0.15s' }}>
                            {tab.label}
                          </Typography>
                          {tab.desc && (
                            <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.3 }}>
                              {tab.desc}
                            </Typography>
                          )}
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              {availableToAdd.filter(t => t.label.toLowerCase().includes(tabSearch.toLowerCase())).length === 0 && (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <SearchIcon sx={{ fontSize: 24, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    No matching tabs
                  </Typography>
                </Box>
              )}
            </List>
          </Popover>
        </Stack>

        {/* Auto-refresh control */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <AutorenewIcon
            onClick={triggerRefresh}
            sx={{
              fontSize: 13, color: 'rgba(255,255,255,0.5)',
              animation: 'spin 2s linear infinite',
              '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
              cursor: 'pointer',
              borderRadius: '50%',
              '&:hover': { color: 'rgba(255,255,255,0.9)' },
            }}
          />
          <Box
            onClick={e => setRefreshAnchor(e.currentTarget)}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.25,
              cursor: 'pointer', borderRadius: 0.5,
              px: 0.5, py: 0.125,
              bgcolor: 'rgba(255,255,255,0.07)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
              {REFRESH_OPTIONS.find(o => o.ms === refreshMs)?.label}
            </Typography>
            <KeyboardArrowDownIcon sx={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }} />
          </Box>
          <Menu
            anchorEl={refreshAnchor}
            open={Boolean(refreshAnchor)}
            onClose={() => setRefreshAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { bgcolor: menuBg, border: `1px solid ${menuBorder}`, minWidth: 80 } }}
          >
            {REFRESH_OPTIONS.map(opt => (
              <MenuItem
                key={opt.ms}
                selected={opt.ms === refreshMs}
                onClick={() => { setRefreshMs(opt.ms); setRefreshAnchor(null) }}
                sx={{ fontSize: '0.75rem', py: 0.5 }}
              >
                {opt.label}
              </MenuItem>
            ))}
          </Menu>
          {displayTime && (
            <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
              {displayTime}
            </Typography>
          )}
        </Box>

        {/* Search & Filter trigger */}
        <Box
          ref={searchTriggerRef}
          onClick={(e) => setSearchAnchor(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            bgcolor: searchBg, borderRadius: 1,
            px: 1.5, py: 0.4,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
            transition: 'background-color 0.15s',
          }}
        >
          <Badge
            badgeContent={activeFilterCount}
            color="primary"
            sx={{ '& .MuiBadge-badge': { fontSize: '0.58rem', minWidth: 15, height: 15, p: 0 } }}
          >
            <SearchIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }} />
          </Badge>
          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', userSelect: 'none', whiteSpace: 'nowrap' }}>
            {activeFilterCount > 0 || searchText
              ? `${filteredApps.length} of ${totalApps} apps`
              : 'Search & Filter'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', ml: 0.5, display: { xs: 'none', sm: 'block' } }}>
            Ctrl+K
          </Typography>
        </Box>
        <SearchFilterPopover
          anchorEl={searchAnchor}
          open={Boolean(searchAnchor)}
          onClose={() => setSearchAnchor(null)}
        />

        {/* Brochure */}
        <BrochureButton />

        {/* Notification bell */}
        <Tooltip title="Notifications">
          <IconButton
            size="small"
            onClick={(e) => setNotifAnchor(e.currentTarget)}
            sx={{
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <Badge
              badgeContent={activityCount + notifications.length}
              color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, p: 0 } }}
            >
              <NotificationsIcon sx={{ fontSize: 18 }} />
            </Badge>
          </IconButton>
        </Tooltip>
        <Popover
          open={Boolean(notifAnchor)}
          anchorEl={notifAnchor}
          onClose={() => setNotifAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              width: notifExpanded ? 560 : 380,
              maxHeight: notifExpanded ? 640 : 520,
              bgcolor: menuBg, border: `1px solid ${menuBorder}`, mt: 0.5,
              transition: 'width 0.2s, max-height 0.2s',
            },
          }}
        >
          {/* Tabs header + expand toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${menuBorder}` }}>
            <Tabs
              value={notifTab}
              onChange={(_, v) => setNotifTab(v)}
              variant="fullWidth"
              sx={{
                flex: 1, minHeight: 36,
                '& .MuiTab-root': { minHeight: 36, fontSize: '0.75rem', textTransform: 'none', fontWeight: 600 },
                '& .MuiTabs-indicator': { height: 2 },
              }}
            >
              <Tab label={`Activities (${activityCount})`} />
              <Tab label={`Announcements (${notifications.length})`} />
            </Tabs>
            <Tooltip title={notifExpanded ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={() => setNotifExpanded(p => !p)} sx={{ mr: 0.5, color: 'text.secondary' }}>
                {notifExpanded
                  ? <CloseFullscreenIcon sx={{ fontSize: 14 }} />
                  : <OpenInFullIcon sx={{ fontSize: 14 }} />
                }
              </IconButton>
            </Tooltip>
          </Box>

          {/* Activities tab */}
          {notifTab === 0 && (
            <Box sx={{ maxHeight: notifExpanded ? 580 : 440, overflow: 'auto' }}>
              {recentActivities.length === 0 ? (
                <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">No recent activity</Typography>
                </Box>
              ) : (
                <>
                  {/* Mark all read / unread header */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 2, pt: 0.75, pb: 0 }}>
                    {activityCount > 0 && (
                      <Button
                        size="small"
                        startIcon={<DoneAllIcon sx={{ fontSize: 13 }} />}
                        onClick={markAllRead}
                        sx={{ fontSize: '0.65rem', textTransform: 'none', color: 'primary.main', py: 0, minHeight: 0 }}
                      >
                        Mark all read
                      </Button>
                    )}
                    {readItems.length > 0 && (
                      <Button
                        size="small"
                        onClick={markAllUnread}
                        sx={{ fontSize: '0.65rem', textTransform: 'none', color: 'text.secondary', py: 0, minHeight: 0 }}
                      >
                        Mark all unread
                      </Button>
                    )}
                  </Box>
                  <Stack spacing={0} divider={<Divider />}>
                    {recentActivities.map((section, si) => {
                      const unreadItems = (section.items || []).filter(it => !isRead(section.category, it.description))
                      const readItemsList = (section.items || []).filter(it => isRead(section.category, it.description))
                      if (unreadItems.length === 0 && readItemsList.length === 0) return null
                      return (
                        <Box key={si} sx={{ py: 1, px: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: section.items?.length ? 0.75 : 0 }}>
                            <Box sx={{ width: 3, height: 14, borderRadius: 1, bgcolor: section.color || '#94a3b8' }} />
                            <Typography sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: 0.9, color: 'text.primary', textTransform: 'uppercase' }}>
                              {section.category}
                            </Typography>
                            {unreadItems.length > 0 && (
                              <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>({unreadItems.length})</Typography>
                            )}
                          </Box>
                          {/* Unread items */}
                          {unreadItems.length > 0 ? (
                            <Stack spacing={0.5}>
                              {unreadItems.map((item, ii) => {
                                const sc = { CRITICAL:'#f44336', WARNING:'#ff9800', UNRESOLVED:'#fbbf24', REASSIGNED:'#60a5fa', RESOLVED:'#4ade80', SUCCESS:'#4ade80', INFO:'#60a5fa' }[item.status] || '#94a3b8'
                                return (
                                  <Box
                                    key={ii}
                                    onClick={() => markRead(section.category, item.description)}
                                    sx={{
                                      display: 'flex', alignItems: 'flex-start', gap: 0.75,
                                      cursor: 'pointer', borderRadius: 0.5, px: 0.5, mx: -0.5,
                                      '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                  >
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0, mt: '5px' }} />
                                    <Chip
                                      label={item.status}
                                      size="small"
                                      sx={{
                                        bgcolor: `${sc}18`, color: sc,
                                        fontWeight: 700, fontSize: '0.6rem', height: 16, flexShrink: 0,
                                        borderRadius: 0.5, mt: '1px',
                                      }}
                                    />
                                    <Typography color="text.secondary" sx={{
                                      fontSize: '0.72rem', lineHeight: 1.4, flex: 1,
                                      overflow: 'hidden', display: '-webkit-box',
                                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                    }}>
                                      {item.description}
                                    </Typography>
                                    <Typography color="text.secondary" sx={{ fontSize: '0.6rem', flexShrink: 0, whiteSpace: 'nowrap', mt: '2px' }}>
                                      {item.time_ago}
                                    </Typography>
                                  </Box>
                                )
                              })}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', ml: 1.5 }}>All read</Typography>
                          )}
                          {/* Read items — collapsed, dimmed, clickable to expand */}
                          {readItemsList.length > 0 && (
                            <Stack spacing={0.25} sx={{ mt: 0.5, opacity: 0.4 }}>
                              {readItemsList.map((item, ii) => {
                                const sc = { CRITICAL:'#f44336', WARNING:'#ff9800', UNRESOLVED:'#fbbf24', REASSIGNED:'#60a5fa', RESOLVED:'#4ade80', SUCCESS:'#4ade80', INFO:'#60a5fa' }[item.status] || '#94a3b8'
                                return (
                                  <Box
                                    key={`r-${ii}`}
                                    onClick={() => setDetailItem({ ...item, category: section.category, color: section.color })}
                                    sx={{
                                      display: 'flex', alignItems: 'flex-start', gap: 0.75, pl: '14px',
                                      cursor: 'pointer', borderRadius: 0.5, px: 0.5,
                                      '&:hover': { opacity: 1.8, bgcolor: 'action.hover' },
                                    }}
                                  >
                                    <Chip
                                      label={item.status}
                                      size="small"
                                      sx={{
                                        bgcolor: `${sc}18`, color: sc,
                                        fontWeight: 700, fontSize: '0.55rem', height: 14, flexShrink: 0,
                                        borderRadius: 0.5, mt: '1px',
                                      }}
                                    />
                                    <Typography color="text.disabled" sx={{
                                      fontSize: '0.65rem', lineHeight: 1.3, flex: 1,
                                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                    }}>
                                      {item.description}
                                    </Typography>
                                  </Box>
                                )
                              })}
                            </Stack>
                          )}
                        </Box>
                      )
                    })}
                  </Stack>
                </>
              )}
            </Box>
          )}

          {/* Announcements tab */}
          {notifTab === 1 && (
            <Box sx={{ maxHeight: notifExpanded ? 580 : 440, overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
                  <NotificationsIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">No active announcements</Typography>
                </Box>
              ) : (
                <List dense sx={{ py: 0 }}>
                  {notifications.map((n) => (
                    <ListItem key={n.id} disablePadding divider>
                      <ListItemButton
                        onClick={() => { setNotifAnchor(null); navigate('/announcements') }}
                        sx={{ py: 1.5, px: 2 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem', lineHeight: 1.3 }}>
                              {n.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" sx={{
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                overflow: 'hidden', fontSize: '0.72rem', lineHeight: 1.4, mt: 0.25,
                              }}>
                                {n.description}
                              </Typography>
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem', mt: 0.5, display: 'block' }}>
                                {n.date}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Popover>

        {/* Detail popup for read activity items */}
        <Dialog
          open={Boolean(detailItem)}
          onClose={() => setDetailItem(null)}
          maxWidth="sm"
          PaperProps={{ sx: { bgcolor: menuBg, border: `1px solid ${menuBorder}`, minWidth: 340 } }}
        >
          {detailItem && (() => {
            const sc = { CRITICAL:'#f44336', WARNING:'#ff9800', UNRESOLVED:'#fbbf24', REASSIGNED:'#60a5fa', RESOLVED:'#4ade80', SUCCESS:'#4ade80', INFO:'#60a5fa' }[detailItem.status] || '#94a3b8'
            return (
              <>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1, pt: 2, px: 2.5 }}>
                  <Box sx={{ width: 4, height: 20, borderRadius: 1, bgcolor: detailItem.color || '#94a3b8' }} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: 0.8, textTransform: 'uppercase', color: 'text.secondary' }}>
                    {detailItem.category}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label={detailItem.status}
                    size="small"
                    sx={{ bgcolor: `${sc}18`, color: sc, fontWeight: 700, fontSize: '0.68rem', height: 20, borderRadius: 0.5 }}
                  />
                </DialogTitle>
                <DialogContent sx={{ px: 2.5, pb: 2.5 }}>
                  <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'text.primary', mb: 1.5 }}>
                    {detailItem.description}
                  </Typography>
                  <Typography color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {detailItem.time_ago}
                  </Typography>
                </DialogContent>
              </>
            )
          })()}
        </Dialog>

        {/* Light / Dark toggle */}
        <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
          <IconButton
            onClick={toggleTheme}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            {themeMode === 'dark'
              ? <LightModeIcon sx={{ fontSize: 18 }} />
              : <DarkModeIcon  sx={{ fontSize: 18 }} />
            }
          </IconButton>
        </Tooltip>

        {/* User avatar */}
        <Tooltip title="Profile & Settings">
          <IconButton
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            size="small"
            sx={{ p: 0, ml: 0.5 }}
          >
            <Avatar
              sx={{
                width: 30, height: 30,
                bgcolor: isDark ? '#334155' : '#475569',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: '2px solid rgba(255,255,255,0.2)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.5)' },
              }}
            >
              JD
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Profile dropdown */}
        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          PaperProps={{
            sx: {
              bgcolor: menuBg,
              border: `1px solid ${menuBorder}`,
              minWidth: 220,
              mt: 0.5,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User info */}
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={700}>Jason Davis</Typography>
            <Typography variant="caption" color="text.secondary">jason.davis@company.com</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => setProfileAnchor(null)} sx={{ fontSize: '0.82rem', gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.82rem' }}>My Profile</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setProfileAnchor(null)} sx={{ fontSize: '0.82rem', gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <ManageAccountsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.82rem' }}>Account Settings</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setProfileAnchor(null)} sx={{ fontSize: '0.82rem', gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <SettingsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.82rem' }}>Preferences</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setProfileAnchor(null); navigate('/admin') }} sx={{ fontSize: '0.82rem', gap: 1.5, py: 1 }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <AdminPanelSettingsIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.82rem' }}>Admin</ListItemText>
          </MenuItem>
          {/* Tenant switcher */}
          <Divider />
          <Box sx={{ px: 2, py: 0.75 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary' }}>
              Portal Instance
            </Typography>
          </Box>
          <MenuItem
            selected={!tenant.id}
            onClick={() => { switchTenant(null); setProfileAnchor(null) }}
            sx={{ fontSize: '0.82rem', gap: 1.5, py: 0.75 }}
          >
            <Box sx={{
              background: `linear-gradient(135deg, ${DEFAULT_TENANT.logoGradient[0]}, ${DEFAULT_TENANT.logoGradient[1]})`,
              borderRadius: 0.75, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Typography sx={{ fontWeight: 900, color: 'white', fontSize: 9, lineHeight: 1 }}>{DEFAULT_TENANT.logoLetter}</Typography>
            </Box>
            <ListItemText primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: !tenant.id ? 700 : 400 }}>
              Default
            </ListItemText>
          </MenuItem>
          {tenants.map(t => (
            <MenuItem
              key={t.id}
              selected={tenant.id === t.id}
              onClick={() => { switchTenant(t); setProfileAnchor(null) }}
              sx={{ fontSize: '0.82rem', gap: 1.5, py: 0.75 }}
            >
              {t.logoImage ? (
                <Box component="img" src={t.logoImage}
                  sx={{ width: 18, height: 18, borderRadius: 0.75, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <Box sx={{
                  background: `linear-gradient(135deg, ${(t.logoGradient || ['#1565C0','#1e88e5'])[0]}, ${(t.logoGradient || ['#1565C0','#1e88e5'])[1]})`,
                  borderRadius: 0.75, width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Typography sx={{ fontWeight: 900, color: 'white', fontSize: 9, lineHeight: 1 }}>{t.logoLetter || 'U'}</Typography>
                </Box>
              )}
              <ListItemText primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: tenant.id === t.id ? 700 : 400 }}>
                {t.name}
              </ListItemText>
            </MenuItem>
          ))}

          <Divider />
          <MenuItem onClick={() => setProfileAnchor(null)} sx={{ fontSize: '0.82rem', gap: 1.5, py: 1, color: 'error.main' }}>
            <ListItemIcon sx={{ minWidth: 'auto' }}>
              <LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: '0.82rem', color: 'error.main' }}>Sign Out</ListItemText>
          </MenuItem>
        </Menu>

      </Toolbar>
    </AppBar>
  )
}
