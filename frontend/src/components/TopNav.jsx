import { useState, useRef } from 'react'
import {
  AppBar, Toolbar, Box, Typography, Button, InputBase,
  Chip, Stack, IconButton, Menu, MenuItem, Tooltip,
  Avatar, Divider, ListItemIcon, ListItemText,
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
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppTheme } from '../ThemeContext'
import { BrochureButton } from './BrochureModal'

const ALL_TABS = [
  { label: 'Home',              path: '/' },
  { label: 'Favorites',         path: '/favorites' },
  { label: 'View Central',      path: '/view-central' },
  { label: 'Product Catalog',   path: '/product-catalog' },
  { label: 'Applications',      path: '/applications' },
  { label: 'Blast Radius',      path: '/graph' },
  { label: 'Customer Journeys', path: '/customer-journey' },
  { label: 'SLO Agent',         path: '/slo-agent' },
  { label: 'Announcements',     path: '/announcements' },
  { label: 'Links',             path: '/links' },
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
  const [profileAnchor, setProfileAnchor] = useState(null)
  const { themeMode, toggleTheme } = useAppTheme()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  // Drag-and-drop state — label-based (no index math)
  const dragLabel = useRef(null)
  const [dragging, setDragging] = useState(null)   // label being dragged
  const [dragOver, setDragOver] = useState(null)    // label being hovered

  const availableToAdd = ALL_TABS.filter(t => !openTabs.includes(t.label))

  const addTab = (label) => {
    const next = [...openTabs, label]
    setOpenTabs(next)
    saveTabs(next)
    setAnchorEl(null)
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
    if (label !== 'Home') setDragOver(label)
  }

  const onDrop = (e, dropLabel) => {
    e.preventDefault()
    const from = dragLabel.current
    if (!from || from === dropLabel || dropLabel === 'Home') {
      dragLabel.current = null; setDragging(null); setDragOver(null)
      return
    }
    // Remove dragged tab, then insert it before the drop target
    const without = openTabs.filter(l => l !== from)
    const dropPos = without.indexOf(dropLabel)
    without.splice(dropPos, 0, from)
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
      <Toolbar sx={{ gap: 1.5, minHeight: '56px !important', px: '24px !important' }}>

        {/* Logo + Brand — both clickable to Home */}
        <Box
          onClick={() => navigate('/')}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0, mr: 2 }}
        >
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1565C0, #1e88e5)',
              borderRadius: 1.5,
              width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(21,101,192,0.35)',
            }}
          >
            <Typography sx={{ fontWeight: 900, color: 'white', fontSize: '1.1rem', lineHeight: 1, fontFamily: '"Inter", sans-serif' }}>
              U
            </Typography>
          </Box>
          <Typography variant="body2" fontWeight={700} color="white" lineHeight={1.2}>
            Unified Observability Portal
          </Typography>
        </Box>

        {/* Nav tabs — draggable */}
        <Stack direction="row" spacing={0} sx={{ flexGrow: 1, alignItems: 'center' }}>
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
                  borderLeft: isTabDragOver ? '2px solid rgba(96,165,250,0.8)' : '2px solid transparent',
                  transition: 'border-color 0.15s, opacity 0.15s',
                  cursor: isHome ? 'default' : 'grab',
                  '&:active': { cursor: isHome ? 'default' : 'grabbing' },
                }}
              >
                <Button
                  size="small"
                  onClick={() => tab.path && navigate(tab.path)}
                  sx={{
                    color: active ? 'white' : 'rgba(255,255,255,0.65)',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    px: isHome ? 1 : 0.75,
                    pr: isHome ? 1 : 2.5,
                    minWidth: 'auto',
                    fontWeight: active ? 600 : 400,
                    '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                    pointerEvents: 'auto',
                  }}
                >
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
                  color: 'rgba(255,255,255,0.4)',
                  '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: {
                bgcolor: menuBg,
                border: `1px solid ${menuBorder}`,
                minWidth: 180,
                mt: 0.5,
              },
            }}
          >
            {availableToAdd.map((tab) => (
              <MenuItem
                key={tab.label}
                onClick={() => addTab(tab.label)}
                sx={{
                  fontSize: '0.82rem',
                  color: 'text.secondary',
                  '&:hover': { color: 'text.primary', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'action.hover' },
                  gap: 1,
                }}
              >
                {tab.label}
              </MenuItem>
            ))}
          </Menu>
        </Stack>

        {/* Search */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: searchBg, borderRadius: 1,
            px: 1.5, py: 0.4,
          }}
        >
          <SearchIcon sx={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', mr: 0.5 }} />
          <InputBase
            placeholder="Search..."
            sx={{ color: 'white', fontSize: '0.8rem', width: 130 }}
          />
        </Box>

        {/* Support */}
        <Button
          variant="outlined"
          size="small"
          sx={{
            textTransform: 'none',
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.7)',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': { borderColor: 'white', color: 'white' },
          }}
        >
          Support
        </Button>

        {/* Brochure */}
        <BrochureButton />

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
