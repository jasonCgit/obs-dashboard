import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Dialog, DialogContent, Box, Typography, IconButton, Chip,
  Table, TableBody, TableRow, TableCell, Divider,
  Autocomplete, TextField, Stack, Button, Paper, Link,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import EmailIcon from '@mui/icons-material/Email'
import GroupsIcon from '@mui/icons-material/Groups'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import { useNavigate } from 'react-router-dom'
import ContactModal from './ContactModal'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50', no_data: '#78909c' }

/* ── Draggable + resizable paper ── */

function DraggablePaper(props) {
  const paperRef = useRef(null)
  const offset = useRef({ x: 0, y: 0 })
  const dragging = useRef(false)

  const onMouseDown = useCallback((e) => {
    if (!e.target.closest('[data-drag-handle]')) return
    e.preventDefault()
    dragging.current = true
    const rect = paperRef.current.getBoundingClientRect()
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    const onMouseMove = (ev) => {
      if (!dragging.current) return
      const x = Math.max(0, Math.min(ev.clientX - offset.current.x, window.innerWidth - 200))
      const y = Math.max(0, Math.min(ev.clientY - offset.current.y, window.innerHeight - 100))
      paperRef.current.style.position = 'fixed'
      paperRef.current.style.left = `${x}px`
      paperRef.current.style.top = `${y}px`
      paperRef.current.style.margin = '0'
      paperRef.current.style.transform = 'none'
    }
    const onMouseUp = () => {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  return (
    <Paper
      {...props}
      ref={paperRef}
      onMouseDown={onMouseDown}
      sx={{
        ...props.sx,
        resize: 'both',
        overflow: 'auto',
        minWidth: 700,
        minHeight: 400,
        maxWidth: 'none',
        borderRadius: 3,
      }}
    />
  )
}

export default function AppDetailModal({ app, teams, onClose, onTeamsChanged, onExcludedIndicatorsChanged }) {
  const navigate = useNavigate()
  const initialIds = app.team_ids || []
  const [selectedTeamIds, setSelectedTeamIds] = useState(initialIds)
  const [contactTeams, setContactTeams] = useState(null) // null = closed, array = open with those teams
  const [excludedIndicators, setExcludedIndicators] = useState(app.excluded_indicators || [])

  // Derive available indicator types from this app's actual components
  const availableIndicatorTypes = useMemo(() => {
    const types = new Set()
    for (const d of (app.deployments || [])) {
      for (const c of (d.components || [])) {
        if (c.indicator_type) types.add(c.indicator_type)
      }
    }
    return [...types].sort()
  }, [app.deployments])
  const selectedTeams = selectedTeamIds
    .map(id => teams.find(t => t.id === id))
    .filter(Boolean)

  const {
    name, seal, status, derivedStatus, lob, subLob, cto, cbt, appOwner, cpof,
    riskRanking, classification, state, investmentStrategy, rto,
    productLine, product, deployments = [],
  } = app

  const displayStatus = derivedStatus || status
  const appSlug = app.id || name.toLowerCase().replace(/ /g, '-')

  const hasCpof = cpof === 'Yes' || deployments.some(d => d.cpof)
  const deployRtos = deployments.filter(d => d.rto != null).map(d => d.rto)
  const strictestRto = deployRtos.length > 0 ? Math.min(...deployRtos) : null
  const displayRto = strictestRto ?? rto

  const metaRows = [
    ['LOB', lob],
    ['Sub LOB', subLob || '—'],
    ['Product Line', productLine || '—'],
    ['Product', product || '—'],
    ['CTO', cto],
    ['CBT', cbt],
    ['App Owner', appOwner],
    ['CPOF', hasCpof ? 'Yes' : 'No'],
    ['Risk Ranking', riskRanking],
    ['Classification', classification],
    ['State', state],
    ['Investment', investmentStrategy],
    ['Strictest RTO', displayRto ? `${displayRto}h` : '—'],
  ]

  const handleManageTeams = () => {
    onClose()
    navigate('/teams')
  }

  const saveTeamIds = (ids) => {
    setSelectedTeamIds(ids)
    onTeamsChanged?.(name, ids)
    fetch(`/api/applications/${appSlug}/teams`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team_ids: ids }),
    }).catch(() => {})
  }

  const handleTeamChange = (_, newVal) => {
    const ids = newVal.map(t => t.id)
    saveTeamIds(ids)
  }

  const saveExcludedIndicators = (indicators) => {
    setExcludedIndicators(indicators)
    onExcludedIndicatorsChanged?.(name, indicators)
    fetch(`/api/applications/${appSlug}/excluded-indicators`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluded_indicators: indicators }),
    }).catch(() => {})
  }

  return (
    <>
      <Dialog
        open
        onClose={onClose}
        maxWidth={false}
        PaperComponent={DraggablePaper}
        PaperProps={{ sx: { width: 900 } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header — draggable */}
          <Box
            data-drag-handle
            sx={{
              px: 3, pt: 2.5, pb: 2, cursor: 'move',
              background: t => t.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(124,58,237,0.08) 100%)'
                : 'linear-gradient(135deg, rgba(21,101,192,0.06) 0%, rgba(124,58,237,0.04) 100%)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
                  {name} — {seal}
                </Typography>
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: `${STATUS_COLOR[displayStatus]} !important` }} />}
                  label={displayStatus?.toUpperCase()}
                  size="small"
                  sx={{
                    mt: 0.75, height: 22, fontSize: '0.62rem', fontWeight: 700,
                    bgcolor: `${STATUS_COLOR[displayStatus]}18`, color: STATUS_COLOR[displayStatus],
                  }}
                />
              </Box>
              <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Side-by-side: Metadata (left) | Team (right) */}
          <Box sx={{ display: 'flex', minHeight: 300 }}>
            {/* Left — Metadata */}
            <Box sx={{ flex: 1, px: 3, py: 2 }}>
              <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', mb: 1, display: 'block' }}>
                Metadata
              </Typography>
              <Table size="small" sx={{ '& td': { py: 0.3, px: 0.5, border: 0, fontSize: '0.7rem' }, '& td:first-of-type': { color: 'text.secondary', width: 110 } }}>
                <TableBody>
                  {metaRows.map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell>{k}</TableCell>
                      <TableCell>{v}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Excluded Health Indicators */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight={700} sx={{
                  fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5,
                  color: 'text.secondary', mb: 0.75, display: 'block',
                }}>
                  Excluded Health Indicators
                </Typography>
                <Autocomplete
                  multiple
                  size="small"
                  options={availableIndicatorTypes}
                  value={excludedIndicators}
                  onChange={(_, newVal) => saveExcludedIndicators(newVal)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select indicators to exclude..." variant="outlined" size="small"
                      sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem', borderRadius: 1.5 } }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((label, idx) => (
                      <Chip
                        {...getTagProps({ index: idx })}
                        key={label}
                        label={label}
                        size="small"
                        sx={{ height: 22, fontSize: '0.66rem', fontWeight: 600, bgcolor: '#fff3e0', color: '#e65100' }}
                      />
                    ))
                  }
                  ListboxProps={{ sx: { maxHeight: 200, '& .MuiAutocomplete-option': { fontSize: '0.78rem', py: 0.5 } } }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', mt: 0.5, display: 'block' }}>
                  Excluded types won't affect this application's derived health status.
                </Typography>
              </Box>
            </Box>

            {/* Vertical divider */}
            <Divider orientation="vertical" flexItem />

            {/* Right — Team */}
            <Box sx={{ flex: 1, px: 3, py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary' }}>
                  Assigned Teams
                </Typography>
                {selectedTeams.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setContactTeams(selectedTeams)}
                    sx={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', py: 0, minWidth: 0 }}
                  >
                    Contact All
                  </Button>
                )}
              </Box>

              <Autocomplete
                multiple
                size="small"
                options={teams}
                getOptionLabel={t => t.name}
                value={selectedTeams}
                onChange={handleTeamChange}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select teams..." variant="outlined" size="small"
                    sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem', borderRadius: 1.5 } }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((t, idx) => (
                    <Chip
                      {...getTagProps({ index: idx })}
                      key={t.id}
                      label={t.name}
                      size="small"
                      sx={{ height: 22, fontSize: '0.66rem', fontWeight: 600 }}
                    />
                  ))
                }
                sx={{
                  '& .MuiChip-root': { height: 22, fontSize: '0.66rem' },
                }}
                ListboxProps={{ sx: { maxHeight: 200, '& .MuiAutocomplete-option': { fontSize: '0.78rem', py: 0.5 } } }}
              />

              <Button
                size="small"
                variant="text"
                startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                onClick={handleManageTeams}
                sx={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', mt: 0.75, color: 'primary.main' }}
              >
                Manage Teams
              </Button>

              {/* Contact info for selected teams */}
              {selectedTeams.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Stack spacing={2} divider={<Divider />}>
                    {selectedTeams.map(t => (
                      <Box key={t.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                          <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.7rem' }}>
                            {t.name}
                          </Typography>
                          <Link
                            component="button"
                            variant="caption"
                            underline="hover"
                            onClick={() => setContactTeams([t])}
                            sx={{ fontSize: '0.76rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.4 }}
                          >
                            <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} /> Contact
                          </Link>
                        </Box>
                        <Stack spacing={1}>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>Email</Typography>
                            </Box>
                            {t.emails?.length > 0 ? t.emails.map(e => (
                              <Typography key={e} variant="caption" sx={{ fontSize: '0.72rem', display: 'block', pl: 2.5 }}>{e}</Typography>
                            )) : (
                              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled', pl: 2.5 }}>No emails</Typography>
                            )}
                          </Box>
                          <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                              <GroupsIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>Teams Channels</Typography>
                            </Box>
                            {t.teams_channels?.length > 0 ? t.teams_channels.map(ch => (
                              <Typography key={ch} variant="caption" sx={{ fontSize: '0.72rem', display: 'block', pl: 2.5 }}>{ch}</Typography>
                            )) : (
                              <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'text.disabled', pl: 2.5 }}>No channels</Typography>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Contact modal (opened from per-team or contact all) */}
      {contactTeams && (
        <ContactModal
          app={app}
          teams={contactTeams}
          onClose={() => setContactTeams(null)}
        />
      )}
    </>
  )
}
