import { AppBar, Toolbar, Box, Typography, Button, InputBase, Chip, Stack } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home',             path: '/' },
  { label: 'Applications',     path: null },
  { label: 'Views',            path: null, dropdown: true },
  { label: 'Customer Journey', path: null },
  { label: 'Incident Item',    path: null },
  { label: 'SLO Corrector',    path: null, beta: true },
  { label: 'Announcements',    path: null },
  { label: 'Links',            path: null, dropdown: true },
]

export default function TopNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <AppBar
      position="sticky"
      sx={{ bgcolor: '#0d1b2a', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
    >
      <Toolbar sx={{ gap: 1.5, minHeight: '56px !important', px: '24px !important' }}>
        {/* Logo */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            bgcolor: '#1a3a5c', borderRadius: 1, px: 1.5, py: 0.75,
            cursor: 'pointer', flexShrink: 0,
          }}
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

        {/* Nav links */}
        <Stack direction="row" spacing={0} sx={{ flexGrow: 1 }}>
          {NAV_LINKS.map((link) => {
            const active = link.path && pathname === link.path
            return (
              <Button
                key={link.label}
                size="small"
                onClick={() => link.path && navigate(link.path)}
                sx={{
                  color: active ? 'white' : 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.8rem',
                  px: 1,
                  minWidth: 'auto',
                  fontWeight: active ? 600 : 400,
                  '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                {link.label}
                {link.beta && (
                  <Chip
                    label="Beta"
                    size="small"
                    sx={{ ml: 0.5, height: 16, fontSize: '0.6rem', bgcolor: '#7c3aed', color: 'white' }}
                  />
                )}
                {link.dropdown && (
                  <Box component="span" sx={{ ml: 0.25, fontSize: '0.65rem' }}>▾</Box>
                )}
              </Button>
            )
          })}
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
