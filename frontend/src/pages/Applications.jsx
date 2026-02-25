import { useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, TextField, InputAdornment, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

const APPS = [
  { name: 'GWM GLOBAL COLLATERAL MANAGEMENT', seal: 'SEAL-90083', team: 'Collateral',  status: 'critical', sla: '99.9%',  incidents: 12, last: '15m ago' },
  { name: 'PAYMENT GATEWAY API',              seal: 'SEAL-88451', team: 'Payments',    status: 'critical', sla: '99.99%', incidents: 8,  last: '2h ago'  },
  { name: 'MERIDIAN SERVICE-QUERY V1',        seal: 'SEAL-77201', team: 'Trading',     status: 'critical', sla: '99.5%',  incidents: 7,  last: '45m ago' },
  { name: 'IPBOL-DOC-DOMAIN',                 seal: 'SEAL-82340', team: 'IPBOL',       status: 'critical', sla: '99.0%',  incidents: 4,  last: '1h ago'  },
  { name: 'MERIDIAN SERVICE-ORDER V1',        seal: 'SEAL-77202', team: 'Trading',     status: 'warning',  sla: '99.5%',  incidents: 3,  last: '3h ago'  },
  { name: 'IPBOL-ACCOUNT-SERVICES',           seal: 'SEAL-83001', team: 'IPBOL',       status: 'warning',  sla: '99.0%',  incidents: 2,  last: '5h ago'  },
  { name: 'IPBOL-INVESTMENTS-SERVICES',       seal: 'SEAL-83110', team: 'IPBOL',       status: 'warning',  sla: '99.0%',  incidents: 3,  last: '4h ago'  },
  { name: 'POSTGRES-DB-REPLICA',              seal: 'SEAL-91002', team: 'Database',    status: 'warning',  sla: '99.9%',  incidents: 2,  last: '6h ago'  },
  { name: 'DATA-PIPELINE-SERVICE',            seal: 'SEAL-85430', team: 'Data',        status: 'warning',  sla: '99.0%',  incidents: 3,  last: '7h ago'  },
  { name: 'API-GATEWAY',                      seal: 'SEAL-70001', team: 'Platform',    status: 'healthy',  sla: '99.99%', incidents: 0,  last: '—'       },
  { name: 'AUTH-SERVICE-V2',                  seal: 'SEAL-71200', team: 'Security',    status: 'healthy',  sla: '99.99%', incidents: 0,  last: '—'       },
  { name: 'REDIS-CACHE-CLUSTER',              seal: 'SEAL-91100', team: 'Platform',    status: 'healthy',  sla: '99.9%',  incidents: 1,  last: '2d ago'  },
  { name: 'KAFKA-MESSAGE-QUEUE',              seal: 'SEAL-91300', team: 'Platform',    status: 'healthy',  sla: '99.9%',  incidents: 1,  last: '1d ago'  },
  { name: 'SPRINGBOOT PROD SERVICE-ORDER',    seal: 'SEAL-78010', team: 'Orders',      status: 'healthy',  sla: '99.0%',  incidents: 0,  last: '—'       },
  { name: 'SPRINGBOOT PROD SERVICE-QUERY',    seal: 'SEAL-78011', team: 'Orders',      status: 'healthy',  sla: '99.0%',  incidents: 0,  last: '—'       },
  { name: 'ACTIVE-ADVISORY',                  seal: 'SEAL-80500', team: 'Advisory',    status: 'healthy',  sla: '99.0%',  incidents: 1,  last: '3d ago'  },
  { name: 'IPBOL-CONTACT-SYNC',               seal: 'SEAL-83200', team: 'IPBOL',       status: 'healthy',  sla: '99.0%',  incidents: 0,  last: '—'       },
  { name: 'IPBOL-MANAGER-AUTH',               seal: 'SEAL-83400', team: 'IPBOL',       status: 'healthy',  sla: '99.5%',  incidents: 0,  last: '—'       },
  { name: 'POSTGRES-DB-PRIMARY',              seal: 'SEAL-91001', team: 'Database',    status: 'critical', sla: '99.99%', incidents: 9,  last: '30m ago' },
  { name: 'EMAIL-NOTIFICATION-SERVICE',       seal: 'SEAL-86001', team: 'Messaging',   status: 'critical', sla: '99.5%',  incidents: 5,  last: '1h ago'  },
]

export default function Applications() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const visible = APPS.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.seal.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = { critical: APPS.filter(a => a.status === 'critical').length, warning: APPS.filter(a => a.status === 'warning').length, healthy: APPS.filter(a => a.status === 'healthy').length }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Applications</Typography>
        <Typography variant="body2" color="text.secondary">{APPS.length} registered applications across all teams</Typography>
      </Box>

      {/* Status summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} sx={{ flex: 1, cursor: 'pointer', border: filter === status ? `1px solid ${STATUS_COLOR[status]}` : undefined }} onClick={() => setFilter(filter === status ? 'all' : status)}>
            <CardContent sx={{ py: '12px !important' }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: STATUS_COLOR[status] }}>{count}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{status}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by name or SEAL..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment> }}
          sx={{ width: 280 }}
        />
        <ToggleButtonGroup value={filter} exclusive onChange={(_, v) => v && setFilter(v)} size="small">
          {['all', 'critical', 'warning', 'healthy'].map(s => (
            <ToggleButton key={s} value={s} sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{visible.length} results</Typography>
      </Box>

      {/* Table */}
      <Card>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.8, borderColor: 'rgba(255,255,255,0.08)' } }}>
              <TableCell>Application</TableCell>
              <TableCell>SEAL</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>SLA</TableCell>
              <TableCell>Incidents 30d</TableCell>
              <TableCell>Last Incident</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map(app => (
              <TableRow key={app.seal} hover sx={{ '& td': { borderColor: 'rgba(255,255,255,0.05)', fontSize: '0.82rem' }, cursor: 'pointer' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 320 }}>{app.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{app.seal}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.team}</TableCell>
                <TableCell>
                  <Chip label={app.status.toUpperCase()} size="small" sx={{ bgcolor: `${STATUS_COLOR[app.status]}22`, color: STATUS_COLOR[app.status], fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.sla}</TableCell>
                <TableCell sx={{ color: app.incidents > 5 ? '#f44336' : app.incidents > 0 ? '#ff9800' : 'text.secondary', fontWeight: app.incidents > 0 ? 600 : 400 }}>{app.incidents}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.last}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Container>
  )
}
