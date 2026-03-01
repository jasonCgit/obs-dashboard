import { useState, useRef, useCallback, lazy, Suspense } from 'react'
import { useTheme } from '@mui/material/styles'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, TextField, Stack,
  Switch, FormControlLabel, Chip, Divider,
  FormControl, InputLabel, Select, MenuItem, Checkbox,
  Autocomplete, Paper,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import EmailIcon from '@mui/icons-material/Email'

const ReactQuill = lazy(() => import('react-quill'))
import 'react-quill/dist/quill.snow.css'

const CHANNEL_META = {
  teams: { color: '#6264A7', Icon: GroupsIcon, label: 'Teams' },
  email: { color: '#EA4335', Icon: EmailIcon,  label: 'Email' },
}

const TEAMS_CHANNEL_OPTIONS = [
  'Custom channel Advisor Connect Updates USPB - Advisor Connect Updates – U.S. Private Bank',
  'General - Brokerage and TSD Team',
  'General - Client Service Manager Chat',
  'General - Connect Help - US Private Bank',
  'General - IPB Connect Alerts',
  'General - TSD - Technology Service Delivery',
  'General - US Ops and GTSS Connect Rollout',
]

const SOURCE_OPTIONS = ['COB', 'NOC', 'Engineering', 'Security', 'DBA', 'Platform']

const EMPTY_FORM = {
  subject: '',
  message: '',
  channels: { teams: false, email: false },
  teams_channels: [],
  email_recipients: [],
  email_source: '',
  email_body: '',
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

const fieldSx = { fontSize: '0.82rem' }
const labelSx = { fontSize: '0.82rem' }

/* ─── Draggable dialog paper ─── */
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
        minHeight: 300,
        maxWidth: 'none',
      }}
    />
  )
}

export default function AppContactForm({ app, onClose }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const fCh = (ch, val) => setForm(prev => ({
    ...prev,
    channels: { ...prev.channels, [ch]: val },
  }))

  const activeChannels = Object.values(form.channels).filter(Boolean).length

  const handleEmailKeyDown = (e) => {
    if (e.key === ';' || e.key === 'Enter') {
      e.preventDefault()
      const val = e.target.value.trim()
      if (val && !form.email_recipients.includes(val)) {
        f('email_recipients', [...form.email_recipients, val])
      }
      setTimeout(() => { e.target.value = '' }, 0)
    }
  }

  const handleSend = () => {
    // Mock send — in production this would POST to an API
    onClose()
  }

  return (
    <Dialog open onClose={onClose} maxWidth={false}
      PaperComponent={DraggablePaper}
      PaperProps={{ sx: { maxHeight: '90vh', width: '720px' } }}>
      <DialogTitle data-drag-handle sx={{
        fontSize: '1rem', fontWeight: 700, pb: 0,
        cursor: 'grab', userSelect: 'none',
        '&:active': { cursor: 'grabbing' },
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 400 }}>
            Contact — {app.name || app.team || 'Application'}
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700 }}>
            Compose Message
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: '12px !important' }}>
        {/* ── Subject ── */}
        <TextField label="Subject" size="small" fullWidth required
          value={form.subject} onChange={e => f('subject', e.target.value)}
          InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }}
          sx={{ mb: 2 }}
        />

        {/* ── Message ── */}
        <TextField label="Message" size="small" fullWidth multiline rows={3}
          value={form.message} onChange={e => f('message', e.target.value)}
          InputProps={{ sx: fieldSx }} InputLabelProps={{ sx: labelSx }}
          sx={{ mb: 2 }}
        />

        {/* ── Channels ── */}
        <Typography variant="caption" fontWeight={700} sx={{
          textTransform: 'uppercase', letterSpacing: 0.8, fontSize: '0.68rem',
          color: 'text.secondary', display: 'block', mb: 1,
        }}>
          Communication Channels
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
          {Object.entries(CHANNEL_META).map(([key, { label, Icon, color }]) => (
            <FormControlLabel key={key}
              control={
                <Switch size="small" checked={form.channels[key] || false}
                  onChange={e => fCh(key, e.target.checked)}
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
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block', mb: 1 }}>
            Select at least one channel to send
          </Typography>
        )}

        {activeChannels > 0 && <Divider sx={{ my: 1 }} />}

        {/* ── Teams Config ── */}
        {form.channels.teams && (
          <>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 1.5, mb: 1, color: CHANNEL_META.teams.color }}>
              Teams
            </Typography>
            <Autocomplete
              multiple size="small" disableCloseOnSelect
              options={TEAMS_CHANNEL_OPTIONS}
              value={form.teams_channels}
              onChange={(_, v) => f('teams_channels', v)}
              renderOption={(props, option, { selected }) => (
                <li {...props}><Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
                  <Typography sx={{ fontSize: '0.78rem' }}>{option}</Typography></li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option.length > 40 ? option.slice(0, 40) + '...' : option} size="small"
                    sx={{ height: 20, fontSize: '0.65rem' }} {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={params => (
                <TextField {...params} label="Select Teams Channels" placeholder="Select Teams Channels.."
                  InputLabelProps={{ sx: labelSx }} InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
              )}
            />
          </>
        )}

        {/* ── Email Config ── */}
        {form.channels.email && (
          <>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 2, mb: 1, color: CHANNEL_META.email.color }}>
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
                    <ReactQuill theme="snow" value={form.email_body} onChange={v => f('email_body', v)}
                      modules={QUILL_MODULES} placeholder="Compose email body..." />
                  </Suspense>
                </Box>
              </Box>

              {/* Source */}
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel sx={labelSx}>Source</InputLabel>
                <Select value={form.email_source} label="Source" onChange={e => f('email_source', e.target.value)} sx={fieldSx}>
                  <MenuItem value="" sx={{ fontSize: '0.82rem' }}><em>Select source for email</em></MenuItem>
                  {SOURCE_OPTIONS.map(s => <MenuItem key={s} value={s} sx={{ fontSize: '0.82rem' }}>{s}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Email recipients */}
              <Autocomplete
                multiple size="small" freeSolo options={[]}
                value={form.email_recipients}
                onChange={(_, v) => f('email_recipients', v)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} size="small" sx={{ height: 20, fontSize: '0.7rem' }} {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={params => (
                  <TextField {...params} label="Enter emails" placeholder="example@jpmchase.com"
                    helperText="Enter valid email and press ; or Enter"
                    onKeyDown={handleEmailKeyDown}
                    InputLabelProps={{ sx: labelSx }}
                    InputProps={{ ...params.InputProps, sx: { ...fieldSx, flexWrap: 'wrap' } }} />
                )}
              />
            </Stack>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small" sx={{ textTransform: 'none', fontSize: '0.82rem' }}>
          Cancel
        </Button>
        <Button onClick={handleSend} variant="contained" size="small"
          disabled={!form.subject.trim() || activeChannels === 0}
          sx={{ textTransform: 'none', fontSize: '0.82rem' }}>
          Send
        </Button>
      </DialogActions>
    </Dialog>
  )
}
