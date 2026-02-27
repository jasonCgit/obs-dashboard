import { useState } from 'react'
import {
  Container, Typography, Box, Card, CardContent,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, ToggleButtonGroup, ToggleButton,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { APPS } from '../data/appData'
import { useFilters } from '../FilterContext'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }

export default function Applications() {
  const { filteredApps, activeFilterCount, totalApps, clearAllFilters } = useFilters()
  const [statusFilter, setStatusFilter] = useState('all')

  const visible = filteredApps.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false
    return true
  })

  const counts = {
    critical: filteredApps.filter(a => a.status === 'critical').length,
    warning:  filteredApps.filter(a => a.status === 'warning').length,
    healthy:  filteredApps.filter(a => a.status === 'healthy').length,
  }

  const isFiltered = activeFilterCount > 0

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Applications</Typography>
          <Typography variant="body2" color="text.secondary">
            {isFiltered
              ? `Showing ${filteredApps.length} of ${totalApps} applications (filtered)`
              : `${totalApps} registered applications across all teams`
            }
          </Typography>
        </Box>
        {isFiltered && (
          <Chip
            icon={<FilterListIcon sx={{ fontSize: 14 }} />}
            label={`${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`}
            size="small"
            onDelete={clearAllFilters}
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.72rem' }}
          />
        )}
      </Box>

      {/* Status summary */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        {Object.entries(counts).map(([status, count]) => (
          <Card key={status} sx={{ flex: 1, cursor: 'pointer', border: statusFilter === status ? `1px solid ${STATUS_COLOR[status]}` : undefined }} onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}>
            <CardContent sx={{ py: '12px !important' }}>
              <Typography variant="h4" fontWeight={700} sx={{ color: STATUS_COLOR[status] }}>{count}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>{status}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, v) => v && setStatusFilter(v)} size="small">
          {['all', 'critical', 'warning', 'healthy'].map(s => (
            <ToggleButton key={s} value={s} sx={{ textTransform: 'none', fontSize: '0.78rem', px: 1.5 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{visible.length} results</Typography>
      </Box>

      {/* Table */}
      <Card>
        <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { color: 'text.secondary', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.8, borderColor: 'divider' } }}>
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
              <TableRow key={app.seal} hover sx={{ '& td': { borderColor: 'divider', fontSize: '0.82rem' }, cursor: 'pointer' }}>
                <TableCell sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 320 }}>{app.name}</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', display: { xs: 'none', md: 'table-cell' } }}>{app.seal}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.team}</TableCell>
                <TableCell>
                  <Chip label={app.status.toUpperCase()} size="small" sx={{ bgcolor: `${STATUS_COLOR[app.status]}22`, color: STATUS_COLOR[app.status], fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>{app.sla}</TableCell>
                <TableCell sx={{ color: app.incidents > 5 ? '#f44336' : app.incidents > 0 ? '#ff9800' : 'text.secondary', fontWeight: app.incidents > 0 ? 600 : 400 }}>{app.incidents}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{app.last}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Card>
    </Container>
  )
}
