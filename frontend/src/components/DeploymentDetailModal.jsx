import { useState, useMemo, useRef, useCallback } from 'react'
import {
  Dialog, DialogContent, Box, Typography, IconButton, Chip,
  Paper, Table, TableBody, TableCell, TableRow, Divider, Stack, Link,
  Autocomplete, TextField, Button,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import EmailIcon from '@mui/icons-material/Email'
import GroupsIcon from '@mui/icons-material/Groups'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useNavigate } from 'react-router-dom'
import ContactModal from './ContactModal'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50' }
const STATUS_LABEL = { critical: 'Critical', warning: 'Warning', healthy: 'Healthy' }

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
        minWidth: 600,
        minHeight: 350,
        maxWidth: 'none',
        borderRadius: 3,
      }}
    />
  )
}

export default function DeploymentDetailModal({ deployment, app, teams, onClose, onExcludedIndicatorsChanged }) {
  const navigate = useNavigate()
  const d = deployment
  const comps = d.components || []
  const healthyCount = comps.filter(c => c.status === 'healthy').length
  const color = STATUS_COLOR[d.status] || '#999'

  const initialIds = app.team_ids || []
  const [selectedTeamIds, setSelectedTeamIds] = useState(initialIds)
  const [contactTeams, setContactTeams] = useState(null)
  const [excludedIndicators, setExcludedIndicators] = useState(d.excluded_indicators || [])
  const excludedSet = new Set(excludedIndicators)

  const availableIndicatorTypes = useMemo(() => {
    const types = new Set()
    for (const c of comps) {
      if (c.indicator_type) types.add(c.indicator_type)
    }
    return [...types].sort()
  }, [comps])
  const selectedTeams = selectedTeamIds
    .map(id => teams.find(t => t.id === id))
    .filter(Boolean)

  const appSlug = app.id || app.name.toLowerCase().replace(/ /g, '-')

  const metaRows = [
    ['Deployment ID', d.deployment_id || '—'],
    ['CPOF', d.cpof ? 'Yes' : 'No'],
    ['RTO', d.rto != null ? `${d.rto}h` : '—'],
    ['Components', `${healthyCount}/${comps.length} healthy`],
    ['Application', app.name],
    ['SEAL', app.seal || '—'],
  ]

  const handleManageTeams = () => {
    onClose()
    navigate('/teams')
  }

  const saveExcludedIndicators = (indicators) => {
    setExcludedIndicators(indicators)
    onExcludedIndicatorsChanged?.(app.name, indicators, d.id)
    fetch(`/api/applications/${appSlug}/deployments/${d.id}/excluded-indicators`, {
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
        PaperProps={{ sx: { width: 1000, maxHeight: '85vh' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Header */}
          <Box data-drag-handle sx={{
            px: 3, pt: 2.5, pb: 2, cursor: 'grab', userSelect: 'none',
            '&:active': { cursor: 'grabbing' },
            background: t => t.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(124,58,237,0.08) 100%)'
              : 'linear-gradient(135deg, rgba(21,101,192,0.06) 0%, rgba(124,58,237,0.04) 100%)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
                    {d.label}
                  </Typography>
                  <Chip
                    icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: `${color} !important` }} />}
                    label={d.status?.toUpperCase()}
                    size="small"
                    sx={{ height: 22, fontSize: '0.62rem', fontWeight: 700, bgcolor: `${color}18`, color }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                  {app.name} — {app.seal}
                </Typography>
              </Box>
              <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Side-by-side: Metadata + Components (left) | Team (right) */}
          <Box sx={{ display: 'flex', minHeight: 280 }}>
            {/* Left — Metadata + Components */}
            <Box sx={{ flex: 1, px: 3, py: 2, overflow: 'auto' }}>
              <Typography variant="caption" fontWeight={700} sx={{
                fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5,
                color: 'text.secondary', mb: 1, display: 'block',
              }}>
                Metadata
              </Typography>
              <Table size="small" sx={{
                '& td': { py: 0.3, px: 0.5, border: 0, fontSize: '0.7rem' },
                '& td:first-of-type': { color: 'text.secondary', width: 110 },
              }}>
                <TableBody>
                  {metaRows.map(([k, v]) => (
                    <TableRow key={k}>
                      <TableCell>{k}</TableCell>
                      <TableCell>{v}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {comps.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight={700} sx={{
                    fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5,
                    color: 'text.secondary', mb: 0.75, display: 'block',
                  }}>
                    Components
                  </Typography>
                  <Stack spacing={0.25}>
                    {comps.map(c => {
                      const cColor = STATUS_COLOR[c.status] || '#999'
                      const isBad = c.status !== 'healthy'
                      const isExcluded = excludedSet.has(c.indicator_type)
                      return (
                        <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, py: 0.25, opacity: isExcluded ? 0.4 : 1 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 6, color: cColor }} />
                          <Typography variant="caption" sx={{
                            fontSize: '0.7rem', flex: 1, minWidth: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontWeight: isBad ? 600 : 400,
                            color: isBad ? 'text.primary' : 'text.secondary',
                            textDecoration: isExcluded ? 'line-through' : 'none',
                          }}>
                            {c.label}
                          </Typography>
                          {c.indicator_type && (
                            <Chip
                              label={c.indicator_type}
                              size="small"
                              sx={{ height: 16, fontSize: '0.46rem', fontWeight: 600, bgcolor: 'action.hover', color: 'text.secondary' }}
                            />
                          )}
                          <Chip
                            label={STATUS_LABEL[c.status]}
                            size="small"
                            sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', bgcolor: `${cColor}18`, color: cColor }}
                          />
                          {c.incidents_30d > 0 && (
                            <Chip
                              label={`${c.incidents_30d} inc`}
                              size="small"
                              sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, bgcolor: `${cColor}14`, color: cColor }}
                            />
                          )}
                        </Box>
                      )
                    })}
                  </Stack>
                </Box>
              )}

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
                    <TextField {...params} placeholder="Exclude indicators..." variant="outlined" size="small"
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
                  slotProps={{ popper: { sx: { zIndex: 1500 } } }}
                  ListboxProps={{ sx: { maxHeight: 200, '& .MuiAutocomplete-option': { fontSize: '0.78rem', py: 0.5 } } }}
                />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', mt: 0.5, display: 'block' }}>
                  Excluded types won't affect this deployment's derived health status.
                </Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Right — Team & Contact */}
            <Box sx={{ flex: 1, px: 3, py: 2, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="caption" fontWeight={700} sx={{
                  fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary',
                }}>
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
                onChange={(_, newVal) => setSelectedTeamIds(newVal.map(t => t.id))}
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

      {contactTeams && (
        <ContactModal
          app={{ ...app, name: `${app.name} — ${d.label}` }}
          teams={contactTeams}
          onClose={() => setContactTeams(null)}
        />
      )}
    </>
  )
}
