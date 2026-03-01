import { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Dialog, DialogContent, DialogActions, Box, Typography, IconButton,
  TextField, Button, Chip, Stack, Divider,
  Autocomplete, Alert, Checkbox, Switch, FormControlLabel, Paper,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import EmailIcon from '@mui/icons-material/Email'
import GroupsIcon from '@mui/icons-material/Groups'
import SendIcon from '@mui/icons-material/Send'
const ReactQuill = lazy(() => import('react-quill'))
import 'react-quill/dist/quill.snow.css'

const fieldSx = { fontSize: '0.82rem' }
const labelSx = { fontSize: '0.82rem' }


const CHANNEL_META = {
  email: { color: '#EA4335', Icon: EmailIcon, label: 'Email' },
  teams: { color: '#6264A7', Icon: GroupsIcon, label: 'Teams' },
}

const QUILL_MODULES = {
  toolbar: [
    [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ],
}

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
        minWidth: 480,
        minHeight: 400,
        maxWidth: 'none',
        borderRadius: 3,
      }}
    />
  )
}

// Supports both: teams={[array]} (multi) or team={single} (legacy from table contact icon)
export default function ContactModal({ app, team, teams: teamsProp, onClose }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const teamsList = teamsProp || (team ? [team] : [])

  const title = teamsList.length === 1
    ? `Contact ${teamsList[0].name}`
    : teamsList.length > 1
      ? `Contact ${teamsList.length} Teams`
      : `Contact ${app?.team || 'Team'}`

  // Fetch all managed teams so user can add more
  const [allTeams, setAllTeams] = useState([])
  useEffect(() => {
    fetch('/api/teams').then(r => r.json()).then(setAllTeams).catch(() => {})
  }, [])

  // Channel toggles
  const [channels, setChannels] = useState({ email: true, teams: false })
  const toggleChannel = (ch, val) => setChannels(prev => ({ ...prev, [ch]: val }))

  // Teams channel state
  const [selectedTeamsForChannels, setSelectedTeamsForChannels] = useState(teamsList)
  const [toChannels, setToChannels] = useState([])

  // Email state
  const [selectedTeamsForEmail, setSelectedTeamsForEmail] = useState(teamsList)
  const [toEmails, setToEmails] = useState([])
  const [emailBody, setEmailBody] = useState('')
  const [subject, setSubject] = useState(app ? `Regarding ${app.name}` : '')

  // Shared
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  // Derive available channels from selected teams
  const availableChannels = useMemo(() => {
    const set = new Set()
    selectedTeamsForChannels.forEach(t => t.teams_channels?.forEach(ch => set.add(ch)))
    return [...set]
  }, [selectedTeamsForChannels])

  // Derive available emails from selected teams
  const availableEmails = useMemo(() => {
    const set = new Set()
    selectedTeamsForEmail.forEach(t => t.emails?.forEach(e => set.add(e)))
    return [...set]
  }, [selectedTeamsForEmail])

  // Auto-select all channels when teams change
  useEffect(() => {
    setToChannels(availableChannels)
  }, [availableChannels])

  // Auto-select all emails when teams change
  useEffect(() => {
    setToEmails(availableEmails)
  }, [availableEmails])

  // Default to Email on
  useEffect(() => {
    setChannels({ email: true, teams: false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeChannels = Object.values(channels).filter(Boolean).length
  const hasTeamsRecipients = channels.teams && toChannels.length > 0
  const hasEmailRecipients = channels.email && toEmails.length > 0
  const hasContent = message.trim() || emailBody.trim()
  const canSend = (hasTeamsRecipients || hasEmailRecipients) && hasContent

  const handleEmailKeyDown = (e) => {
    if (e.key === ';') {
      e.preventDefault()
      const val = e.target.value.trim()
      if (val && !toEmails.includes(val)) {
        setToEmails(prev => [...prev, val])
      }
      setTimeout(() => { e.target.value = '' }, 0)
    }
  }

  const handleSend = async () => {
    setSending(true)
    const payload = {
      channels,
      teams_channels: channels.teams ? toChannels : [],
      email_recipients: channels.email ? toEmails : [],
      subject: channels.email ? subject : undefined,
      email_body: channels.email ? emailBody : undefined,
      message: message.trim(),
      app_name: app?.name,
    }
    try {
      await fetch('/api/contact/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setSent(true)
      setTimeout(() => onClose(), 1500)
    } catch {
      // silently handle
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth={false}
      PaperComponent={DraggablePaper}
      PaperProps={{ sx: { width: 900, maxHeight: '90vh' } }}>
      <DialogContent sx={{ p: 0 }}>
        {/* Header — draggable */}
        <Box data-drag-handle sx={{
          px: 3, pt: 2.5, pb: 2, cursor: 'grab', userSelect: 'none',
          '&:active': { cursor: 'grabbing' },
          background: t => t.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(21,101,192,0.12) 0%, rgba(124,58,237,0.08) 100%)'
            : 'linear-gradient(135deg, rgba(21,101,192,0.06) 0%, rgba(124,58,237,0.04) 100%)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1rem', lineHeight: 1.3 }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                Send a message via Teams channel or email
              </Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
              <CloseIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ px: 3, py: 2.5 }}>
          {sent ? (
            <Alert severity="success" sx={fieldSx}>
              Message sent successfully!
            </Alert>
          ) : (
            <Stack spacing={2}>
              {/* Channel toggles */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem',
                    color: 'text.secondary', fontWeight: 700, display: 'block', mb: 1,
                  }}
                >
                  Channels
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                  {Object.entries(CHANNEL_META).map(([key, { label, Icon, color }]) => (
                    <FormControlLabel key={key}
                      control={
                        <Switch size="small" checked={channels[key] || false}
                          onChange={e => toggleChannel(key, e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: color },
                          }} />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Icon sx={{ fontSize: 16, color }} />
                          <Typography variant="body2" sx={{ fontSize: '0.78rem' }}>{label}</Typography>
                        </Box>
                      }
                    />
                  ))}
                </Box>
                {activeChannels === 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mt: 0.5 }}>
                    Select at least one channel to send
                  </Typography>
                )}
              </Box>

              {activeChannels > 0 && <Divider />}

              {/* ── Email Config ── */}
              {channels.email && (
                <>
                  <Typography variant="body2" fontWeight={700} sx={{ color: CHANNEL_META.email.color }}>
                    Email
                  </Typography>
                  <Stack spacing={1.5}>
                    {/* Rich text editor */}
                    <Box>
                      <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', mb: 0.5, display: 'block' }}>
                        Add Visuals &amp; Tables
                      </Typography>
                      <Box sx={{
                        '& .quill': { borderRadius: 1 },
                        '& .ql-toolbar': {
                          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.23)',
                          borderRadius: '4px 4px 0 0',
                          '& .ql-stroke': { stroke: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)' },
                          '& .ql-fill': { fill: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)' },
                          '& .ql-picker-label': { color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)' },
                          '& .ql-picker-options': {
                            bgcolor: isDark ? '#1e1e1e' : '#ffffff',
                            border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.2)',
                          },
                        },
                        '& .ql-container': {
                          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.23)',
                          borderRadius: '0 0 4px 4px',
                          minHeight: 150, fontSize: '0.85rem',
                          color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
                        },
                        '& .ql-editor': { minHeight: 150 },
                        '& .ql-editor.ql-blank::before': { color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' },
                      }}>
                        <Suspense fallback={<Box sx={{ p: 2, color: 'text.secondary', fontSize: '0.82rem' }}>Loading editor...</Box>}>
                          <ReactQuill theme="snow" value={emailBody} onChange={setEmailBody}
                            modules={QUILL_MODULES} placeholder="Compose email body..." />
                        </Suspense>
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'primary.main', cursor: 'pointer', mt: 0.5, display: 'block' }}>
                        Add images like jpegs, pngs, etc.
                      </Typography>
                    </Box>

                    {/* Subject */}
                    <TextField
                      size="small" label="Subject" fullWidth
                      value={subject} onChange={e => setSubject(e.target.value)}
                      InputProps={{ sx: { ...fieldSx, borderRadius: 1.5 } }}
                      InputLabelProps={{ sx: labelSx }}
                    />

                    {/* Select teams to pull emails from */}
                    <Autocomplete
                      multiple size="small" disableCloseOnSelect
                      options={allTeams.length > 0 ? allTeams : teamsList}
                      getOptionLabel={t => t.name}
                      value={selectedTeamsForEmail}
                      onChange={(_, v) => {
                        setSelectedTeamsForEmail(v)
                        const allEmails = new Set()
                        v.forEach(t => t.emails?.forEach(e => allEmails.add(e)))
                        setToEmails([...allEmails])
                      }}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{option.name}</Typography>
                            <Typography sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>
                              {option.emails?.length || 0} emails
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((t, index) => (
                          <Chip label={t.name} size="small" icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }} {...getTagProps({ index })} key={t.id} />
                        ))
                      }
                      renderInput={params => (
                        <TextField {...params} label="Select Teams" placeholder="Search teams..."
                          InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                      )}
                    />
                    {/* Email recipients from selected teams */}
                    {availableEmails.length > 0 && (
                      <Autocomplete
                        multiple size="small" freeSolo disableCloseOnSelect
                        options={availableEmails}
                        value={toEmails}
                        onChange={(_, v) => setToEmails(v)}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                            <Typography sx={{ fontSize: '0.78rem' }}>{option}</Typography></li>
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((email, index) => (
                            <Chip label={email} size="small" icon={<EmailIcon sx={{ fontSize: '12px !important' }} />}
                              sx={{ height: 20, fontSize: '0.68rem' }} {...getTagProps({ index })} key={email} />
                          ))
                        }
                        renderInput={params => (
                          <TextField {...params} label="Select Emails" placeholder="Pick emails or type custom..."
                            onKeyDown={handleEmailKeyDown}
                            InputLabelProps={{ sx: labelSx }}
                            InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                        )}
                      />
                    )}
                  </Stack>
                </>
              )}

              {/* ── Teams Config ── */}
              {channels.teams && (
                <>
                  <Typography variant="body2" fontWeight={700} sx={{ mt: channels.email ? 1 : 0, color: CHANNEL_META.teams.color }}>
                    Teams
                  </Typography>
                  <Stack spacing={1.5}>
                    {/* Select teams to pull channels from */}
                    <Autocomplete
                      multiple size="small" disableCloseOnSelect
                      options={allTeams.length > 0 ? allTeams : teamsList}
                      getOptionLabel={t => t.name}
                      value={selectedTeamsForChannels}
                      onChange={(_, v) => {
                        setSelectedTeamsForChannels(v)
                        const allCh = new Set()
                        v.forEach(t => t.teams_channels?.forEach(ch => allCh.add(ch)))
                        setToChannels([...allCh])
                      }}
                      isOptionEqualToValue={(opt, val) => opt.id === val.id}
                      renderOption={(props, option, { selected }) => (
                        <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                          <Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{option.name}</Typography>
                            <Typography sx={{ fontSize: '0.66rem', color: 'text.secondary' }}>
                              {option.teams_channels?.length || 0} channels
                            </Typography>
                          </Box>
                        </li>
                      )}
                      renderTags={(value, getTagProps) =>
                        value.map((t, index) => (
                          <Chip label={t.name} size="small" icon={<GroupsIcon sx={{ fontSize: '12px !important' }} />}
                            sx={{ height: 22, fontSize: '0.68rem', fontWeight: 600 }} {...getTagProps({ index })} key={t.id} />
                        ))
                      }
                      renderInput={params => (
                        <TextField {...params} label="Select Teams" placeholder="Search teams..."
                          InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                      )}
                    />
                    {/* Channel picker */}
                    {availableChannels.length > 0 && (
                      <Autocomplete
                        multiple size="small" disableCloseOnSelect
                        options={availableChannels}
                        value={toChannels}
                        onChange={(_, v) => setToChannels(v)}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                            <Typography sx={{ fontSize: '0.78rem' }}>{option}</Typography></li>
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((ch, index) => (
                            <Chip label={ch.length > 40 ? ch.slice(0, 40) + '...' : ch} size="small"
                              sx={{ height: 20, fontSize: '0.65rem' }} {...getTagProps({ index })} key={ch} />
                          ))
                        }
                        renderInput={params => (
                          <TextField {...params} label="Select Channels" placeholder="Pick channels to post to..."
                            InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                        )}
                      />
                    )}

                    {/* Teams message body */}
                    <TextField
                      label="Message"
                      multiline rows={4} fullWidth
                      value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Write your Teams message..."
                      InputProps={{ sx: { ...fieldSx, borderRadius: 1.5 } }}
                      InputLabelProps={{ sx: labelSx }}
                    />
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {!sent && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} size="small" sx={fieldSx}>Cancel</Button>
          <Button
            onClick={handleSend}
            variant="contained"
            size="small"
            disabled={!canSend || sending}
            startIcon={<SendIcon sx={{ fontSize: 16 }} />}
            sx={fieldSx}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}
