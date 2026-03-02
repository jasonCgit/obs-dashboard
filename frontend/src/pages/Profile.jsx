import { useState, useEffect } from 'react'
import {
  Container, Typography, Box, Card, CardContent, TextField,
  Button, ToggleButtonGroup, ToggleButton, Autocomplete,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import VisibilityIcon from '@mui/icons-material/Visibility'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import SaveIcon from '@mui/icons-material/Save'
import { loadProfile, saveProfile } from '../utils/profileStorage'
import { useAuth } from '../AuthContext'
import { loadAllTenants } from '../tenant/tenantStorage'
import FilterPickerGrid from '../components/FilterPickerGrid'

const fBody  = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

export default function Profile({ themeMode, setThemeMode, activeFilters, tenant }) {
  const profile = loadProfile()
  const { role, setRole } = useAuth()
  const [displayName, setDisplayName] = useState(profile.displayName || '')
  const [defaultTenantId, setDefaultTenantId] = useState(profile.defaultTenantId || null)
  const [defaultFilters, setDefaultFilters] = useState(profile.defaultFilters || {})
  const [tenants, setTenants] = useState([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setTenants(loadAllTenants())
  }, [])

  const handleSave = () => {
    saveProfile({
      ...profile,
      displayName,
      role,
      defaultTenantId,
      defaultFilters,
    })
    window.dispatchEvent(new CustomEvent('obs-profile-changed'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tenantOptions = [
    { id: null, name: 'Default' },
    ...tenants,
  ]

  const handleFilterChange = (key, values) => {
    setDefaultFilters(prev => {
      const next = { ...prev }
      if (!values || values.length === 0) delete next[key]
      else next[key] = values
      return next
    })
  }

  const handleFilterClear = (key) => {
    setDefaultFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <PersonIcon sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700}>Profile</Typography>
      </Box>

      {/* Display Name */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Display Name</Typography>
          <TextField
            fullWidth size="small" value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            InputProps={{ sx: fBody }}
          />
        </CardContent>
      </Card>

      {/* Role */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Role</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Your role determines access to admin features like managing portal instances and links.
          </Typography>
          <ToggleButtonGroup
            value={role} exclusive
            onChange={(_, v) => v && setRole(v)}
            sx={{ gap: 1, '& .MuiToggleButton-root': { borderRadius: 2, px: 3, py: 1, textTransform: 'none' } }}
          >
            <ToggleButton value="admin">
              <AdminPanelSettingsIcon sx={{ fontSize: 18, mr: 1 }} /> Admin
            </ToggleButton>
            <ToggleButton value="viewer">
              <VisibilityIcon sx={{ fontSize: 18, mr: 1 }} /> Viewer
            </ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Appearance</Typography>
          <ToggleButtonGroup
            value={themeMode} exclusive
            onChange={(_, v) => v && setThemeMode(v)}
            sx={{ gap: 1, '& .MuiToggleButton-root': { borderRadius: 2, px: 3, py: 1, textTransform: 'none' } }}
          >
            <ToggleButton value="light">
              <LightModeIcon sx={{ fontSize: 18, mr: 1 }} /> Light
            </ToggleButton>
            <ToggleButton value="dark">
              <DarkModeIcon sx={{ fontSize: 18, mr: 1 }} /> Dark
            </ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Default Portal Instance */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Default Portal Instance</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Which portal instance to load on startup.
          </Typography>
          <Autocomplete
            size="small"
            options={tenantOptions}
            getOptionLabel={o => o.name || 'Default'}
            value={tenantOptions.find(t => t.id === defaultTenantId) || tenantOptions[0]}
            onChange={(_, v) => setDefaultTenantId(v?.id || null)}
            renderInput={params => <TextField {...params} placeholder="Select portal instance" InputProps={{ ...params.InputProps, sx: fSmall }} />}
          />
        </CardContent>
      </Card>

      {/* Default Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>Default Filters</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These filters will be applied by default when you load the dashboard (overrides portal instance defaults).
          </Typography>
          <FilterPickerGrid
            filters={defaultFilters}
            onChange={handleFilterChange}
            onClear={handleFilterClear}
            compact
          />
        </CardContent>
      </Card>

      {/* Save */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="contained" startIcon={<SaveIcon />}
          onClick={handleSave}
          color={saved ? 'success' : 'primary'}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {saved ? 'Saved!' : 'Save Profile'}
        </Button>
      </Box>
    </Container>
  )
}
