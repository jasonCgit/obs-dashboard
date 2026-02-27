import { useState, useEffect } from 'react'
import {
  Box, Typography, Menu, MenuItem, Divider, Chip, ListItemIcon, ListItemText,
} from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { useNavigate } from 'react-router-dom'
import { useTenant } from './TenantContext'
import { loadAllTenants, DEFAULT_TENANT } from './tenantStorage'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny  = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

function MiniLogo({ letter, gradient, size = 18 }) {
  return (
    <Box sx={{
      background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
      borderRadius: 0.75, width: size, height: size,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Typography sx={{ fontWeight: 900, color: 'white', fontSize: size * 0.5, lineHeight: 1 }}>
        {letter || 'U'}
      </Typography>
    </Box>
  )
}

export default function TenantSwitcher() {
  const navigate = useNavigate()
  const { tenant: activeTenant, switchTenant } = useTenant()
  const [anchorEl, setAnchorEl] = useState(null)
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    setTenants(loadAllTenants())
  }, [anchorEl]) // refresh list each time menu opens

  if (tenants.length === 0) return null

  return (
    <>
      <Chip
        icon={<MiniLogo letter={activeTenant.logoLetter} gradient={activeTenant.logoGradient} />}
        label={activeTenant.id ? activeTenant.name : 'Default'}
        deleteIcon={<KeyboardArrowDownIcon sx={{ fontSize: '16px !important', color: 'rgba(255,255,255,0.5) !important' }} />}
        onDelete={(e) => setAnchorEl(e.currentTarget.closest('.MuiChip-root'))}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        size="small"
        sx={{
          ...fSmall, fontWeight: 600, pl: 0.25,
          bgcolor: 'rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(255,255,255,0.12)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
          cursor: 'pointer',
          maxWidth: 180,
        }}
      />

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 220, mt: 1 } }}
      >
        {/* Default portal option */}
        <MenuItem
          selected={!activeTenant.id}
          onClick={() => { switchTenant(null); setAnchorEl(null) }}
          sx={{ gap: 1.5, py: 0.75 }}
        >
          <MiniLogo letter={DEFAULT_TENANT.logoLetter} gradient={DEFAULT_TENANT.logoGradient} />
          <ListItemText
            primary="Default Portal"
            primaryTypographyProps={{ ...fSmall, fontWeight: !activeTenant.id ? 700 : 400 }}
          />
        </MenuItem>

        {tenants.length > 0 && <Divider />}

        {tenants.map(t => (
          <MenuItem
            key={t.id}
            selected={activeTenant.id === t.id}
            onClick={() => { switchTenant(t); setAnchorEl(null) }}
            sx={{ gap: 1.5, py: 0.75 }}
          >
            <MiniLogo letter={t.logoLetter} gradient={t.logoGradient || ['#1565C0', '#1e88e5']} />
            <ListItemText
              primary={t.name}
              secondary={t.version || null}
              primaryTypographyProps={{ ...fSmall, fontWeight: activeTenant.id === t.id ? 700 : 400, noWrap: true }}
              secondaryTypographyProps={{ ...fTiny }}
            />
          </MenuItem>
        ))}

        <Divider />
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin') }} sx={{ gap: 1.5, py: 0.75 }}>
          <ListItemIcon sx={{ minWidth: 'auto' }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ ...fSmall, color: 'text.secondary' }}>
            Manage Instances
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
