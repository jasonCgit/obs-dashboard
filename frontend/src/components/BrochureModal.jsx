import { useState } from 'react'
import { useTenant } from '../tenant/TenantContext'
import {
  Dialog, DialogContent, IconButton, Typography, Box, Grid, Chip, Divider, Stack, Button,
} from '@mui/material'
import CloseIcon          from '@mui/icons-material/Close'
import HomeIcon           from '@mui/icons-material/Home'
import StarIcon           from '@mui/icons-material/Star'
import ViewQuiltIcon      from '@mui/icons-material/ViewQuilt'
import InventoryIcon      from '@mui/icons-material/Inventory'
import AppsIcon           from '@mui/icons-material/Apps'
import AccountTreeIcon    from '@mui/icons-material/AccountTree'
import RouteIcon          from '@mui/icons-material/Route'
import SpeedIcon          from '@mui/icons-material/Speed'
import CampaignIcon       from '@mui/icons-material/Campaign'
import LinkIcon           from '@mui/icons-material/Link'
import ShieldIcon         from '@mui/icons-material/Shield'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import TuneIcon           from '@mui/icons-material/Tune'
import TabIcon            from '@mui/icons-material/Tab'
import MenuBookIcon       from '@mui/icons-material/MenuBook'
import SupportAgentIcon   from '@mui/icons-material/SupportAgent'
import FeedbackIcon       from '@mui/icons-material/Feedback'
import ContactsIcon       from '@mui/icons-material/Contacts'
import DescriptionIcon    from '@mui/icons-material/Description'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'

// Ordered by tab order, with gif filename for each
const FEATURES = [
  {
    icon: HomeIcon,
    color: '#60a5fa',
    title: 'Home Dashboard',
    gif: 'dashboard-overview.gif',
    desc: 'Single pane of glass — critical apps with recent issues, AI health analysis, regional status, P1/P2 incident donuts, 90-day trend line chart, frequent incidents, and live activity feed.',
  },
  {
    icon: StarIcon,
    color: '#fbbf24',
    title: 'Favorites',
    gif: 'favorites.gif',
    desc: 'Pinned View Central dashboards for quick access. Star any custom dashboard and find them all here — searchable by name or description with SEAL associations and widget counts.',
  },
  {
    icon: ViewQuiltIcon,
    color: '#c084fc',
    title: 'View Central',
    gif: 'view-central.gif',
    desc: 'Custom dashboards scoped to product areas. Create, configure, and monitor with drag-and-drop widget grids, SEAL filtering, per-dashboard notifications, and full search.',
  },
  {
    icon: InventoryIcon,
    color: '#fb923c',
    title: 'Product Catalog',
    gif: 'product-catalog.gif',
    desc: '6 business products (Advisor Connect, Spectrum Equities, Connect OS, GWM Collateral, Client Case Mgmt, IPBOL) with per-product health, service counts, and linked views.',
  },
  {
    icon: AppsIcon,
    color: '#4ade80',
    title: 'Applications',
    gif: 'applications.gif',
    desc: '20+ registered applications with status, SLA targets, team ownership, and 30-day incident history — filterable by health status with full search.',
  },
  {
    icon: AccountTreeIcon,
    color: '#34d399',
    title: 'Blast Radius — Dependency Graphs',
    gif: 'blast-radius.gif',
    desc: 'Interactive service dependency maps for Advisor Connect, Spectrum Equities, and Connect OS with executive summary, root cause analysis, business processes, and dagre-powered layouts.',
  },
  {
    icon: RouteIcon,
    color: '#a78bfa',
    title: 'Customer Journeys',
    gif: 'customer-journey.gif',
    desc: 'End-to-end path health for Trade Execution, Client Login, and Document Delivery — step-by-step latency and error rate visibility across every service hop.',
  },
  {
    icon: SpeedIcon,
    color: '#38bdf8',
    title: 'SLO Agent',
    gif: 'slo-agent.gif',
    desc: 'Autonomous SLO monitoring agent that predicts breaches, proposes auto-remediation actions, and surfaces error budget burn rates before they cause incidents.',
  },
  {
    icon: CampaignIcon,
    color: '#f87171',
    title: 'Announcements',
    gif: 'announcements.gif',
    desc: 'Full CRUD announcement management — create, edit, close/reopen, delete, search, type filters, pinning, and auto-refresh every 30 seconds.',
  },
  {
    icon: LinkIcon,
    color: '#94a3b8',
    title: 'Links',
    gif: 'links.gif',
    desc: 'Quick-access grid for monitoring, CI/CD, security, documentation, and team tools across 8 categories with direct launch.',
  },
  {
    icon: ShieldIcon,
    color: '#fb923c',
    title: 'Incident Zero',
    gif: 'incident-zero.gif',
    desc: 'Proactive pre-incident management — burn rate alerts, error budget dashboards, breach ETAs, and prevention timelines to stop P1s before they happen.',
  },
  {
    icon: AdminPanelSettingsIcon,
    color: '#e879f9',
    title: 'Admin — Portal Instances',
    gif: 'admin.gif',
    desc: 'Create, edit, and manage branded portal instances with custom logos, titles, subtitles, default scope filters, and one-click tenant switching.',
  },
  {
    icon: TuneIcon,
    color: '#22d3ee',
    title: 'Search & Filter',
    gif: 'search-filter.gif',
    desc: 'Global search and grouped multi-select filters — taxonomy, people, risk & compliance — with a persistent scope bar showing active filters and app counts.',
  },
  {
    icon: TabIcon,
    color: '#a3e635',
    title: 'Tabs & Theming',
    gif: 'tabs-and-theme.gif',
    desc: 'Browser-style tab management — add, close, drag-to-reorder with persistent order. Full dark/light theme toggle across all components.',
  },
]

const METRICS = [
  { value: '34+',  label: 'Services Monitored' },
  { value: '14',   label: 'Observability Views' },
  { value: '<30s', label: 'Mean Time to Detect' },
  { value: '90d',  label: 'Incident History' },
]

export function BrochureButton() {
  const [open, setOpen] = useState(false)
  const [previewGif, setPreviewGif] = useState(null)
  const { tenant } = useTenant()

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<MenuBookIcon sx={{ fontSize: '14px !important' }} />}
        onClick={() => setOpen(true)}
        sx={{
          textTransform: 'none',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.7)',
          borderColor: 'rgba(255,255,255,0.3)',
          '&:hover': { borderColor: 'white', color: 'white' },
        }}
      >
        Brochure
      </Button>

      {/* Main brochure dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper', backgroundImage: 'none' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {/* Hero */}
          <Box sx={{
            background: 'linear-gradient(135deg, #0d1b2a 0%, #1565C0 100%)',
            px: 4, py: 4,
            position: 'relative',
          }}>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.6)',
                '&:hover': { color: 'white' } }}
            >
              <CloseIcon />
            </IconButton>

            <Chip label={tenant.name} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', mb: 1.5, fontSize: '0.65rem' }} />
            <Typography variant="h4" fontWeight={800} color="white" gutterBottom sx={{ lineHeight: 1.2 }}>
              {tenant.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560, mb: 2.5 }}>
              A real-time observability platform {tenant.description} — combining AI-powered incident
              detection, service dependency mapping, SLO management, proactive health monitoring, and product-centric
              views across the entire platform ecosystem.
            </Typography>

            {/* Key metrics */}
            <Stack direction="row" spacing={3}>
              {METRICS.map(m => (
                <Box key={m.label}>
                  <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>{m.value}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', mt: 0.25 }}>{m.label}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Feature grid */}
          <Box sx={{ px: 4, py: 3 }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', mb: 2 }}>
              Platform Capabilities — click any card for a live demo
            </Typography>

            <Grid container spacing={2}>
              {FEATURES.map(({ icon: Icon, color, title, desc, gif }) => (
                <Grid item xs={12} sm={6} key={title}>
                  <Box
                    onClick={() => setPreviewGif({ title, gif, desc })}
                    sx={{
                      display: 'flex', gap: 1.5,
                      p: 1.5, borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.15s',
                      '&:hover': {
                        borderColor: color,
                        bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        '& .gif-play-icon': { opacity: 1 },
                      },
                    }}
                  >
                    <Box sx={{ bgcolor: `${color}18`, borderRadius: 1.5, p: 0.9, flexShrink: 0, height: 'fit-content' }}>
                      <Icon sx={{ fontSize: 20, color }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={700} gutterBottom sx={{ lineHeight: 1.2, mb: 0.4 }}>
                        {title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.72rem' }}>
                        {desc}
                      </Typography>
                    </Box>
                    <PlayCircleOutlineIcon
                      className="gif-play-icon"
                      sx={{
                        position: 'absolute', top: 8, right: 8,
                        fontSize: 18, color: 'text.disabled', opacity: 0.3,
                        transition: 'opacity 0.15s',
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            {/* Resources & Support */}
            <Typography variant="body2" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', mb: 1.5 }}>
              Resources & Support
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
              {[
                { icon: SupportAgentIcon, label: 'Support',         color: '#60a5fa' },
                { icon: FeedbackIcon,     label: 'Feature Request', color: '#a78bfa' },
                { icon: ContactsIcon,     label: 'Contacts',        color: '#4ade80' },
                { icon: DescriptionIcon,  label: 'Documentation',   color: '#fb923c' },
              ].map(({ icon: Icon, label, color }) => (
                <Box
                  key={label}
                  sx={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', gap: 1,
                    p: 1.25, borderRadius: 1.5,
                    border: '1px solid', borderColor: 'divider',
                    cursor: 'pointer',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    '&:hover': {
                      bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: color,
                    },
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon sx={{ fontSize: 18, color }} />
                  <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.73rem' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>{tenant.poweredBy}</Typography>
                <Typography variant="caption" color="text.secondary">
                  React + Vite + MUI · FastAPI · @xyflow/react + dagre · Recharts
                </Typography>
              </Box>
              <Button variant="contained" size="small" onClick={() => setOpen(false)}
                sx={{ textTransform: 'none', px: 2 }}>
                Get Started
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* GIF preview dialog */}
      <Dialog
        open={!!previewGif}
        onClose={() => setPreviewGif(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            backgroundImage: 'none',
            maxHeight: '90vh',
          },
        }}
      >
        {previewGif && (
          <DialogContent sx={{ p: 0, position: 'relative' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 2.5, py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {previewGif.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                  {previewGif.desc}
                </Typography>
              </Box>
              <IconButton onClick={() => setPreviewGif(null)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 1, bgcolor: (t) => t.palette.mode === 'dark' ? '#0a0a0a' : '#f5f5f5' }}>
              <img
                src={`/gifs/${previewGif.gif}`}
                alt={previewGif.title}
                style={{ width: '100%', display: 'block', borderRadius: 4 }}
              />
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
