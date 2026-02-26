import { useState } from 'react'
import {
  Dialog, DialogContent, IconButton, Typography, Box, Grid, Chip, Divider, Stack, Button,
} from '@mui/material'
import CloseIcon          from '@mui/icons-material/Close'
import DashboardIcon      from '@mui/icons-material/Dashboard'
import StarIcon           from '@mui/icons-material/Star'
import ViewModuleIcon     from '@mui/icons-material/ViewModule'
import CategoryIcon       from '@mui/icons-material/Category'
import StorageIcon        from '@mui/icons-material/Storage'
import AccountTreeIcon    from '@mui/icons-material/AccountTree'
import RouteIcon          from '@mui/icons-material/Route'
import TimelineIcon       from '@mui/icons-material/Timeline'
import CampaignIcon       from '@mui/icons-material/Campaign'
import LinkIcon           from '@mui/icons-material/Link'
import ShieldIcon         from '@mui/icons-material/Shield'
import LightModeIcon      from '@mui/icons-material/LightMode'
import MenuBookIcon       from '@mui/icons-material/MenuBook'

// Ordered by tab order: Home, Favorites, View Central, Product Catalog,
// Applications, Blast Radius, Customer Journeys, SLO Agent, Announcements, Links
const FEATURES = [
  {
    icon: DashboardIcon,
    color: '#60a5fa',
    title: 'Home Dashboard',
    desc: 'Single pane of glass — critical apps with recent issues, AI health analysis, regional status, P1/P2 incident donuts, 90-day trend line chart, frequent incidents, and live activity feed.',
  },
  {
    icon: StarIcon,
    color: '#fbbf24',
    title: 'Favorites',
    desc: 'Pin your most-used observability views for instant access. Star any view from View Central and see them all in one place.',
  },
  {
    icon: ViewModuleIcon,
    color: '#c084fc',
    title: 'View Central',
    desc: '12 observability views across dependency graphs, analytics dashboards, AI-powered tools, and live monitoring — searchable and organized by domain.',
  },
  {
    icon: CategoryIcon,
    color: '#fb923c',
    title: 'Product Catalog',
    desc: '6 business products (Advisor Connect, Spectrum Equities, Connect OS, GWM Collateral, Client Case Mgmt, IPBOL) with per-product health, service counts, and linked views.',
  },
  {
    icon: StorageIcon,
    color: '#4ade80',
    title: 'Applications Registry',
    desc: '20+ registered applications with status, SLA targets, team ownership, and 30-day incident history — filterable by health status with full search.',
  },
  {
    icon: AccountTreeIcon,
    color: '#34d399',
    title: 'Blast Radius — Dependency Graphs',
    desc: 'Interactive service dependency maps for Advisor Connect, Spectrum Equities, and Connect OS with executive summary, root cause analysis, business processes, and dagre-powered layouts.',
  },
  {
    icon: RouteIcon,
    color: '#a78bfa',
    title: 'Customer Journeys',
    desc: 'End-to-end path health for Trade Execution, Client Login, and Document Delivery — step-by-step latency and error rate visibility across every service hop.',
  },
  {
    icon: TimelineIcon,
    color: '#38bdf8',
    title: 'SLO Agent',
    desc: 'Autonomous SLO monitoring agent that predicts breaches, proposes auto-remediation actions, and surfaces error budget burn rates before they cause incidents.',
  },
  {
    icon: CampaignIcon,
    color: '#f87171',
    title: 'Announcements',
    desc: 'Full CRUD announcement management — create, edit, close/reopen, delete, search, type filters, pinning, and auto-refresh every 30 seconds.',
  },
  {
    icon: LinkIcon,
    color: '#94a3b8',
    title: 'Links',
    desc: 'Quick-access grid for monitoring, CI/CD, security, documentation, and team tools across 8 categories with direct launch.',
  },
  {
    icon: ShieldIcon,
    color: '#fb923c',
    title: 'Incident Zero',
    desc: 'Proactive pre-incident management — burn rate alerts, error budget dashboards, breach ETAs, and prevention timelines to stop P1s before they happen.',
  },
  {
    icon: LightModeIcon,
    color: '#fbbf24',
    title: 'Dark & Light Mode',
    desc: 'Full dark/light theme toggle with theme-aware cards, graphs, nav bar, and components. Preference persists across sessions.',
  },
]

const METRICS = [
  { value: '34+',  label: 'Services Monitored' },
  { value: '12',   label: 'Observability Views' },
  { value: '<30s', label: 'Mean Time to Detect' },
  { value: '90d',  label: 'Incident History' },
]

export function BrochureButton() {
  const [open, setOpen] = useState(false)

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

            <Chip label="AWM · Unified Observability" size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', mb: 1.5, fontSize: '0.65rem' }} />
            <Typography variant="h4" fontWeight={800} color="white" gutterBottom sx={{ lineHeight: 1.2 }}>
              Unified Observability Portal
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.75)', maxWidth: 560, mb: 2.5 }}>
              A real-time observability platform purpose-built for AWM engineering — combining AI-powered incident
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
              Platform Capabilities
            </Typography>

            <Grid container spacing={2}>
              {FEATURES.map(({ icon: Icon, color, title, desc }) => (
                <Grid item xs={12} sm={6} key={title}>
                  <Box sx={{
                    display: 'flex', gap: 1.5,
                    p: 1.5, borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                  }}>
                    <Box sx={{ bgcolor: `${color}18`, borderRadius: 1.5, p: 0.9, flexShrink: 0, height: 'fit-content' }}>
                      <Icon sx={{ fontSize: 20, color }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700} gutterBottom sx={{ lineHeight: 1.2, mb: 0.4 }}>
                        {title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.72rem' }}>
                        {desc}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2.5 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>Powered by AWM Site Reliability Engineering (SRE)</Typography>
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
    </>
  )
}
