import { useNavigate } from 'react-router-dom'
import { Chip, Stack } from '@mui/material'
import LayersIcon from '@mui/icons-material/Layers'
import SpeedIcon from '@mui/icons-material/Speed'
import ShieldIcon from '@mui/icons-material/Shield'

const LINKS = [
  { key: 'blast-radius', icon: LayersIcon,  label: 'Blast Radius',  path: '/graph-layers' },
  { key: 'slo-agent',    icon: SpeedIcon,   label: 'SLO Agent',     path: '/slo-agent' },
  { key: 'incident-zero',icon: ShieldIcon,  label: 'Incident Zero', path: '/incident-zero' },
]

export default function CrossLinkChips({ seal, service, only }) {
  const navigate = useNavigate()
  const chips = only ? LINKS.filter(l => only.includes(l.key)) : LINKS

  return (
    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
      {chips.map(({ key, icon: Icon, label, path }) => {
        const params = new URLSearchParams()
        if (seal && key === 'blast-radius') params.set('seal', seal)
        if (service) params.set('service', service)
        const q = params.toString()
        const active = (key === 'blast-radius' && !!seal) || (key !== 'blast-radius' && !!service)
        return (
          <Chip
            key={key}
            icon={<Icon sx={{ fontSize: '14px !important', color: active ? '#fff !important' : undefined }} />}
            label={label}
            size="small"
            variant={active ? 'filled' : 'outlined'}
            onClick={(e) => { e.stopPropagation(); navigate(`${path}${q ? `?${q}` : ''}`) }}
            sx={{
              fontSize: '0.68rem', height: 22,
              cursor: 'pointer',
              ...(active
                ? { bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#1565c0' } }
                : { '&:hover': { bgcolor: 'action.hover' } }),
            }}
          />
        )
      })}
    </Stack>
  )
}
