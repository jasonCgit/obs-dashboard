import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Autocomplete, Chip,
  FormControlLabel, Checkbox, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, FormControl, InputLabel, Stack, Divider,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups'
import EmailIcon from '@mui/icons-material/Email'
import { generateNotifId } from './viewCentralStorage'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }
const labelSx = { fontSize: '0.82rem' }
const fieldSx = { fontSize: '0.82rem' }

const TEAMS_CHANNELS = [
  'General - Advisor Connect Updates',
  'General - Brokerage and TSD Team',
  'General - Client Service Manager Chat',
  'General - Connect Help - US Private Bank',
  'General - IPB Connect Alerts',
  'General - TSD - Technology Service Delivery',
  'General - US Ops and GTSS Connect Rollout',
]

const FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly digest' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
  { value: 'custom', label: 'Custom schedule' },
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ALERT_TYPES = [
  { value: 'critical', label: 'Critical incidents', color: '#f44336' },
  { value: 'warning', label: 'Warnings & degradations', color: '#ff9800' },
  { value: 'change', label: 'Change notifications', color: '#60a5fa' },
  { value: 'slo', label: 'SLO breaches', color: '#a855f7' },
  { value: 'deployment', label: 'Deployment events', color: '#34d399' },
]

const EMPTY_FORM = {
  name: '',
  alertTypes: ['critical'],
  channels: { teams: false, email: false },
  teamsChannels: [],
  emailRecipients: [],
  frequency: 'realtime',
  daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  startTime: '08:00',
  endTime: '18:00',
  enabled: true,
}

export default function NotificationForm({ open, onClose, onSave, existingNotif }) {
  const isEdit = !!existingNotif
  const [form, setForm] = useState(existingNotif || { ...EMPTY_FORM })
  const [emailInput, setEmailInput] = useState('')

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }))
  const setChannel = (ch, val) => setForm(prev => ({
    ...prev,
    channels: { ...prev.channels, [ch]: val },
  }))

  const handleEmailKey = (e) => {
    if (e.key === 'Enter' || e.key === ';' || e.key === ',') {
      e.preventDefault()
      const email = emailInput.trim().replace(/[;,]$/, '')
      if (email && !form.emailRecipients.includes(email)) {
        set('emailRecipients', [...form.emailRecipients, email])
      }
      setEmailInput('')
    }
  }

  const removeEmail = (email) => {
    set('emailRecipients', form.emailRecipients.filter(e => e !== email))
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (!form.channels.teams && !form.channels.email) return
    onSave({
      ...form,
      id: form.id || generateNotifId(),
      name: form.name.trim(),
    })
  }

  const hasChannel = form.channels.teams || form.channels.email
  const isCustom = form.frequency === 'custom'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>
        {isEdit ? 'Edit Notification' : 'Add Notification'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Name */}
          <TextField
            label="Notification Name"
            required
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g., Critical Alerts — Spectrum"
            size="small"
            inputProps={{ maxLength: 80 }}
            InputProps={{ sx: fieldSx }}
            InputLabelProps={{ sx: labelSx }}
          />

          {/* Alert types */}
          <Box>
            <Typography fontWeight={600} color="text.secondary"
              sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
              Alert Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {ALERT_TYPES.map(at => {
                const checked = form.alertTypes.includes(at.value)
                return (
                  <Chip
                    key={at.value}
                    label={at.label}
                    size="small"
                    onClick={() => {
                      if (checked) set('alertTypes', form.alertTypes.filter(a => a !== at.value))
                      else set('alertTypes', [...form.alertTypes, at.value])
                    }}
                    sx={{
                      ...fTiny,
                      height: 26,
                      fontWeight: 600,
                      bgcolor: checked ? `${at.color}22` : 'transparent',
                      color: checked ? at.color : 'text.secondary',
                      border: '1px solid',
                      borderColor: checked ? at.color : 'divider',
                      cursor: 'pointer',
                    }}
                  />
                )
              })}
            </Box>
          </Box>

          <Divider />

          {/* Channels */}
          <Box>
            <Typography fontWeight={600} color="text.secondary"
              sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
              Notification Channels
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={form.channels.teams}
                  onChange={e => setChannel('teams', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GroupsIcon sx={{ fontSize: 16, color: '#6264A7' }} />
                    <Typography sx={fSmall}>Teams</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Checkbox size="small" checked={form.channels.email}
                  onChange={e => setChannel('email', e.target.checked)} />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 16, color: '#EA4335' }} />
                    <Typography sx={fSmall}>Email</Typography>
                  </Box>
                }
              />
            </Stack>

            {/* Teams channel selector */}
            {form.channels.teams && (
              <Autocomplete
                multiple
                size="small"
                options={TEAMS_CHANNELS}
                value={form.teamsChannels}
                onChange={(_, val) => set('teamsChannels', val)}
                disableCloseOnSelect
                limitTags={2}
                renderInput={params => (
                  <TextField {...params} label="Teams Channels" variant="outlined" size="small"
                    sx={{
                      mb: 1.5,
                      '& .MuiInputLabel-root': fSmall,
                      '& .MuiInputBase-root': { ...fSmall, borderRadius: 1.5 },
                    }}
                  />
                )}
                sx={{ '& .MuiChip-root': { height: 20, ...fTiny, borderRadius: 1 } }}
              />
            )}

            {/* Email recipients */}
            {form.channels.email && (
              <Box sx={{ mb: 1.5 }}>
                <TextField
                  label="Email Recipients"
                  size="small"
                  fullWidth
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKey}
                  placeholder="Type email and press Enter"
                  InputProps={{ sx: fieldSx }}
                  InputLabelProps={{ sx: labelSx }}
                  helperText="Press Enter, comma, or semicolon to add"
                  FormHelperTextProps={{ sx: fTiny }}
                />
                {form.emailRecipients.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {form.emailRecipients.map(email => (
                      <Chip key={email} label={email} size="small" onDelete={() => removeEmail(email)}
                        sx={{ height: 22, ...fTiny, borderRadius: 1 }} />
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Divider />

          {/* Frequency */}
          <Box>
            <Typography fontWeight={600} color="text.secondary"
              sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
              Frequency & Schedule
            </Typography>
            <FormControl size="small" fullWidth sx={{ mb: 1.5 }}>
              <InputLabel sx={labelSx}>Frequency</InputLabel>
              <Select
                value={form.frequency}
                onChange={e => set('frequency', e.target.value)}
                label="Frequency"
                sx={{ ...fieldSx, borderRadius: 1.5 }}
              >
                {FREQUENCY_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value} sx={fSmall}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Custom schedule: days of week */}
            {isCustom && (
              <Box sx={{ mb: 1.5 }}>
                <Typography sx={{ ...fTiny, color: 'text.secondary', mb: 0.75 }}>
                  Days of Week
                </Typography>
                <ToggleButtonGroup
                  value={form.daysOfWeek}
                  onChange={(_, val) => set('daysOfWeek', val)}
                  size="small"
                  sx={{ flexWrap: 'wrap', gap: 0.5 }}
                >
                  {DAYS_OF_WEEK.map(day => (
                    <ToggleButton key={day} value={day}
                      sx={{ ...fTiny, px: 1.5, py: 0.5, borderRadius: '8px !important', border: '1px solid', borderColor: 'divider' }}>
                      {day}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            {/* Time window (for non-realtime) */}
            {form.frequency !== 'realtime' && (
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="From"
                  type="time"
                  size="small"
                  value={form.startTime}
                  onChange={e => set('startTime', e.target.value)}
                  InputProps={{ sx: fieldSx }}
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="To"
                  type="time"
                  size="small"
                  value={form.endTime}
                  onChange={e => set('endTime', e.target.value)}
                  InputProps={{ sx: fieldSx }}
                  InputLabelProps={{ shrink: true, sx: labelSx }}
                  sx={{ flex: 1 }}
                />
              </Stack>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} size="small">Cancel</Button>
        <Button onClick={handleSave} variant="contained" size="small"
          disabled={!form.name.trim() || !hasChannel}>
          {isEdit ? 'Save Changes' : 'Add Notification'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
