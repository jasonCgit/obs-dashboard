import { useState } from 'react'
import {
  AppBar, Toolbar, Box, Typography, Button, InputBase,
  Chip, Stack, IconButton, Menu, MenuItem, Tooltip,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddIcon    from '@mui/icons-material/Add'
import CloseIcon  from '@mui/icons-material/Close'
import { useNavigate, useLocation } from 'react-router-dom'

const ALL_TABS = [
  { label: 'Home',             path: '/' },
  { label: 'Applications',     path: '/applications' },
  { label: 'Views',            path: '/views' },
  { label: 'Customer Journey', path: '/customer-journey' },
  { label: 'Incident Item',    path: '/incident-item' },
  { label: 'SLO Corrector',    path: '/slo-corrector', beta: true },
  { label: 'Announcements',    path: '/announcements' },
  { label: 'Links',            path: '/links' },
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

  const availableToAdd = ALL_TABS.filter(t => !openTabs.includes(t.label))

  const addTab = (label) => {
    const next = [...openTabs, label]
    setOpenTabs(next)
    saveTabs(next)
    setAnchorEl(null)
  }

  const removeTab = (label, e) => {
    e.stopPropagation()
    const next = openTabs.filter(l => l !== label)
    setOpenTabs(next)
    saveTabs(next)
    // if we removed the active tab, go home
    const tab = ALL_TABS.find(t => t.label === label)
    if (tab?.path && pathname === tab.path) navigate('/')
  }

  const visibleTabs = ALL_TABS.filter(t => openTabs.includes(t.label))

  return (
    <AppBar
      position="sticky"
      sx={{ bgcolor: '#0d1b2a', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '56px !important', px: '24px !important' }}>

        {/* Logo */}
        <Box
          onClick={() => navigate('/')}
          sx={{ bgcolor: '#1a3a5c', borderRadius: 1, px: 1.5, py: 0.75, cursor: 'pointer', flexShrink: 0 }}
        >
          <Typography variant="body1" fontWeight={800} color="white" lineHeight={1}>U</Typography>
        </Box>

        {/* Brand */}
        <Box sx={{ mr: 2, flexShrink: 0 }}>
          <Typography variant="body2" fontWeight={700} color="white" lineHeight={1.2}>
            Unified Observability Portal
          </Typography>
          <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
            Powered by #Digital
          </Typography>
        </Box>

        {/* Nav tabs */}
        <Stack direction="row" spacing={0} sx={{ flexGrow: 1, alignItems: 'center' }}>
          {visibleTabs.map((tab) => {
            const active = tab.path && pathname === tab.path
            const isHome = tab.label === 'Home'
            return (
              <Box
                key={tab.label}
                sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}
              >
                <Button
                  size="small"
                  onClick={() => tab.path && navigate(tab.path)}
                  sx={{
                    color: active ? 'white' : 'text.secondary',
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    px: isHome ? 1 : 0.75,
                    pr: isHome ? 1 : 2.5,
                    minWidth: 'auto',
                    fontWeight: active ? 600 : 400,
                    '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  {tab.label}
                  {tab.beta && (
                    <Chip
                      label="Beta"
                      size="small"
                      sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', bgcolor: '#7c3aed', color: 'white' }}
                    />
                  )}
                  {tab.dropdown && (
                    <Box component="span" sx={{ ml: 0.25, fontSize: '0.65rem' }}>▾</Box>
                  )}
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
                        color: 'rgba(255,255,255,0.3)',
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
                  color: 'rgba(255,255,255,0.35)',
                  '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.07)' },
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
                bgcolor: '#131f2e',
                border: '1px solid rgba(255,255,255,0.1)',
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
                  '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.06)' },
                  gap: 1,
                }}
              >
                {tab.label}
                {tab.beta && (
                  <Chip
                    label="Beta"
                    size="small"
                    sx={{ height: 15, fontSize: '0.58rem', bgcolor: '#7c3aed', color: 'white' }}
                  />
                )}
              </MenuItem>
            ))}
          </Menu>
        </Stack>

        {/* Search */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 1,
            px: 1.5, py: 0.4, mr: 1,
          }}
        >
          <SearchIcon sx={{ fontSize: 15, color: 'text.secondary', mr: 0.5 }} />
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
            fontSize: '0.8rem',
            color: 'text.secondary',
            borderColor: 'rgba(255,255,255,0.2)',
            '&:hover': { borderColor: 'rgba(255,255,255,0.5)', color: 'white' },
          }}
        >
          Support
        </Button>

      </Toolbar>
    </AppBar>
  )
}
