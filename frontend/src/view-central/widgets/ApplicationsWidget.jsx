import { useState, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import { APPS } from '../../data/appData'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

export default function ApplicationsWidget({ viewFilters }) {
  const [statusFilter, setStatusFilter] = useState('all')

  // Filter by SEAL from viewFilters
  const sealFiltered = useMemo(() => {
    const seals = viewFilters?.seal || []
    if (seals.length === 0) return APPS
    return APPS.filter(a => seals.includes(a.seal))
  }, [viewFilters])

  const visible = sealFiltered.filter(a => statusFilter === 'all' || a.status === statusFilter)

  const counts = {
    critical: sealFiltered.filter(a => a.status === 'critical').length,
    warning: sealFiltered.filter(a => a.status === 'warning').length,
    healthy: sealFiltered.filter(a => a.status === 'healthy').length,
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Status summary + filter */}
      <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 0.75 }}>
          {Object.entries(counts).map(([status, count]) => (
            <Card key={status} sx={{
              flex: 1, cursor: 'pointer',
              border: statusFilter === status ? `1px solid ${STATUS_COLOR[status]}` : undefined,
            }} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}>
              <CardContent sx={{ py: '6px !important', px: '10px !important' }}>
                <Typography fontWeight={700} sx={{ color: STATUS_COLOR[status], fontSize: '1rem' }}>{count}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.58rem' }}>{status}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, v) => v && setStatusFilter(v)} size="small">
            {['all', 'critical', 'warning', 'healthy'].map(s => (
              <ToggleButton key={s} value={s} sx={{ textTransform: 'none', fontSize: '0.68rem', px: 1, py: 0.15 }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{visible.length} results</Typography>
        </Box>
      </Box>

      {/* Table */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.8, borderColor: 'divider', bgcolor: 'background.paper' } }}>
              <TableCell>Application</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>SEAL</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>SLA</TableCell>
              <TableCell>Incidents 30d</TableCell>
              <TableCell>Last Incident</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.map(app => (
              <TableRow key={app.name} hover sx={{ '& td': { borderColor: 'divider', fontSize: '0.72rem', py: 0.5 } }}>
                <TableCell sx={{ fontWeight: 600, maxWidth: 200 }}>{app.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.68rem', display: { xs: 'none', md: 'table-cell' } }}>{app.seal}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.team}</TableCell>
                <TableCell>
                  <Chip label={app.status.toUpperCase()} size="small" sx={{ bgcolor: `${STATUS_COLOR[app.status]}22`, color: STATUS_COLOR[app.status], fontWeight: 700, fontSize: '0.58rem', height: 18 }} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>{app.sla}</TableCell>
                <TableCell sx={{ color: app.incidents > 5 ? '#f44336' : app.incidents > 0 ? '#ff9800' : 'text.secondary', fontWeight: app.incidents > 0 ? 600 : 400 }}>{app.incidents}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.last}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}
