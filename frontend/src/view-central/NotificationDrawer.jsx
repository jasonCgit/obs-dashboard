import { useState, useEffect } from 'react'
import {
  Drawer, Box, Typography, IconButton, Button, Chip, Stack,
  Switch, Divider, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import NotificationsIcon from '@mui/icons-material/Notifications'
import GroupsIcon from '@mui/icons-material/Groups'
import EmailIcon from '@mui/icons-material/Email'
import {
  loadNotifications, saveNotification, deleteNotification,
} from './viewCentralStorage'
import NotificationForm from './NotificationForm'

const fBody = { fontSize: 'clamp(0.72rem, 0.95vw, 0.82rem)' }
const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }
const fTiny = { fontSize: 'clamp(0.55rem, 0.72vw, 0.64rem)' }

const ALERT_TYPE_COLOR = {
  critical: '#f44336',
  warning: '#ff9800',
  change: '#60a5fa',
  slo: '#a855f7',
  deployment: '#34d399',
}

const ALERT_TYPE_LABEL = {
  critical: 'Critical',
  warning: 'Warning',
  change: 'Change',
  slo: 'SLO',
  deployment: 'Deploy',
}

const FREQ_LABEL = {
  realtime: 'Real-time',
  hourly: 'Hourly',
  daily: 'Daily',
  weekly: 'Weekly',
  custom: 'Custom',
}

export default function NotificationDrawer({ open, onClose, viewId, viewName }) {
  const [notifications, setNotifications] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingNotif, setEditingNotif] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const refresh = () => setNotifications(loadNotifications(viewId))

  useEffect(() => {
    if (open) refresh()
  }, [open, viewId])

  const handleSave = (notif) => {
    saveNotification(viewId, notif)
    refresh()
    setFormOpen(false)
    setEditingNotif(null)
  }

  const handleToggleEnabled = (notif) => {
    saveNotification(viewId, { ...notif, enabled: !notif.enabled })
    refresh()
  }

  const handleDelete = (id) => {
    deleteNotification(viewId, id)
    refresh()
    setDeleteConfirm(null)
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 }, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              <Typography fontWeight={700} sx={fBody}>Notifications</Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          <Typography color="text.secondary" sx={fTiny}>
            Manage alert subscriptions for {viewName}
          </Typography>
        </Box>

        {/* Add button */}
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon sx={{ fontSize: 16 }} />}
            onClick={() => setFormOpen(true)}
            sx={{ ...fSmall, textTransform: 'none', borderRadius: 1.5, py: 0.75 }}
          >
            Add Notification
          </Button>
        </Box>

        {/* Notification list */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, pb: 2 }}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary" sx={fSmall}>
                No notifications configured
              </Typography>
              <Typography color="text.disabled" sx={{ ...fTiny, mt: 0.5 }}>
                Add a notification to receive alerts via Teams or Email
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {notifications.map(notif => (
                <Box key={notif.id} sx={{
                  p: 1.5, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  opacity: notif.enabled ? 1 : 0.55,
                  transition: 'opacity 0.15s',
                }}>
                  {/* Top row: name + toggle */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography fontWeight={600} sx={{ ...fSmall, flex: 1, minWidth: 0 }} noWrap>
                      {notif.name}
                    </Typography>
                    <Switch size="small" checked={notif.enabled}
                      onChange={() => handleToggleEnabled(notif)}
                      sx={{ ml: 1 }} />
                  </Box>

                  {/* Alert type chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.75 }}>
                    {(notif.alertTypes || []).map(at => (
                      <Chip key={at} label={ALERT_TYPE_LABEL[at] || at} size="small"
                        sx={{
                          height: 18, ...fTiny, fontWeight: 600,
                          bgcolor: `${ALERT_TYPE_COLOR[at] || '#94a3b8'}18`,
                          color: ALERT_TYPE_COLOR[at] || '#94a3b8',
                        }}
                      />
                    ))}
                  </Box>

                  {/* Channel + frequency info */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                    {notif.channels?.teams && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <GroupsIcon sx={{ fontSize: 12, color: '#6264A7' }} />
                        <Typography sx={fTiny} color="text.secondary">
                          Teams{notif.teamsChannels?.length ? ` (${notif.teamsChannels.length})` : ''}
                        </Typography>
                      </Box>
                    )}
                    {notif.channels?.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                        <EmailIcon sx={{ fontSize: 12, color: '#EA4335' }} />
                        <Typography sx={fTiny} color="text.secondary">
                          Email{notif.emailRecipients?.length ? ` (${notif.emailRecipients.length})` : ''}
                        </Typography>
                      </Box>
                    )}
                    <Chip label={FREQ_LABEL[notif.frequency] || notif.frequency} size="small"
                      sx={{ height: 18, ...fTiny, bgcolor: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontWeight: 600 }} />
                  </Stack>

                  {/* Schedule info for custom */}
                  {notif.frequency === 'custom' && notif.daysOfWeek?.length > 0 && (
                    <Typography sx={{ ...fTiny, color: 'text.disabled', mb: 0.5 }}>
                      {notif.daysOfWeek.join(', ')} · {notif.startTime}–{notif.endTime}
                    </Typography>
                  )}
                  {notif.frequency !== 'realtime' && notif.frequency !== 'custom' && (
                    <Typography sx={{ ...fTiny, color: 'text.disabled', mb: 0.5 }}>
                      {notif.startTime}–{notif.endTime}
                    </Typography>
                  )}

                  {/* Action buttons */}
                  <Divider sx={{ my: 0.75 }} />
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" startIcon={<EditIcon sx={{ fontSize: 12 }} />}
                      onClick={() => setEditingNotif(notif)}
                      sx={{ ...fTiny, textTransform: 'none', px: 1, py: 0.25, minWidth: 0 }}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon sx={{ fontSize: 12 }} />}
                      onClick={() => setDeleteConfirm(notif)}
                      sx={{ ...fTiny, textTransform: 'none', px: 1, py: 0.25, minWidth: 0 }}>
                      Delete
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Drawer>

      {/* Add/Edit form */}
      {(formOpen || editingNotif) && (
        <NotificationForm
          open
          onClose={() => { setFormOpen(false); setEditingNotif(null) }}
          onSave={handleSave}
          existingNotif={editingNotif}
        />
      )}

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Delete Notification</DialogTitle>
        <DialogContent>
          <DialogContentText sx={fBody}>
            Delete "{deleteConfirm?.name}"? This will stop all alerts for this notification.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} size="small">Cancel</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} color="error" variant="contained" size="small">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
