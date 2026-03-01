import { useState, useEffect } from 'react'
import {
  Card, CardContent, Box, Typography, Chip, Link,
  IconButton, Stack, Tooltip,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import TuneIcon from '@mui/icons-material/Tune'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CrossLinkChips from './CrossLinkChips'
import AppDetailModal from './AppDetailModal'
import DeploymentDetailModal from './DeploymentDetailModal'
import ContactModal from './ContactModal'

const STATUS_COLOR = { critical: '#f44336', warning: '#ff9800', healthy: '#4caf50', no_data: '#78909c' }
const STATUS_RANK = { critical: 0, warning: 1, healthy: 2, no_data: 3 }
const STATUS_LABEL = { critical: 'critical', warning: 'warning', healthy: 'healthy', no_data: 'No health data' }

/* ── Deployment sub-card ── */

function DeploymentCard({ deployment, app, teams, onSetContactApp, onSetDetailDep, allExpanded }) {
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(!!allExpanded) }, [allExpanded])
  const d = deployment
  const comps = d.components || []
  const dColor = STATUS_COLOR[d.status] || '#999'

  const depMetaItems = [
    ['Deployment ID', d.id],
    ['RTO', d.rto != null ? `${d.rto}h` : null],
    ['SLO', d.slo != null ? `${d.slo}%` : null],
    ['CPOF', d.cpof ? 'Yes' : null],
  ].filter(([, v]) => v)

  return (
    <Card variant="outlined" sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
      <Box sx={{ px: 1.25, py: 0.75 }}>
        {/* Row 1: name ... status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
          {comps.length > 0 && (
            <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ p: 0, width: 18, height: 18 }}>
              {open ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          )}
          <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'text.secondary' }}>
            {d.label}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={STATUS_LABEL[d.status] || d.status}
            size="small"
            sx={{
              height: 16, fontSize: '0.48rem', fontWeight: 700,
              textTransform: 'uppercase',
              bgcolor: `${dColor}18`,
              color: dColor,
              flexShrink: 0,
            }}
          />
        </Box>

        {/* Row 2: metadata + contact + manage + cpof */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {depMetaItems.length > 0 && (
            <Tooltip
              arrow
              title={
                <Box sx={{ fontSize: '0.64rem' }}>
                  {depMetaItems.map(([k, v]) => (
                    <Box key={k}><b>{k}:</b> {v}</Box>
                  ))}
                </Box>
              }
            >
              <IconButton size="small" sx={{ p: 0.25, flexShrink: 0 }}>
                <InfoOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Contact Team" arrow>
            <IconButton size="small" onClick={() => onSetContactApp?.({ ...app, name: `${app.name} — ${d.label}` })} sx={{ p: 0.25, flexShrink: 0 }}>
              <ChatBubbleIcon sx={{ fontSize: 13, color: '#42a5f5' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage" arrow>
            <IconButton size="small" onClick={() => onSetDetailDep?.({ deployment: d, app })} sx={{ p: 0.25, flexShrink: 0, color: '#42a5f5', '&:hover': { color: '#1e88e5' } }}>
              <TuneIcon sx={{ fontSize: 13 }} />
            </IconButton>
          </Tooltip>
          {d.cpof && (
            <Chip
              label="CPOF"
              size="small"
              sx={{ height: 16, fontSize: '0.48rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0', flexShrink: 0 }}
            />
          )}
        </Box>

        {/* Components (expandable) */}
        {open && comps.length > 0 && (
          <Stack spacing={0.25} sx={{ mt: 0.75, pl: 1 }}>
            {comps.map(c => {
              const cColor = STATUS_COLOR[c.status] || '#999'
              return (
                <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 5, color: cColor, flexShrink: 0 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.62rem', flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: 'text.primary',
                    }}
                  >
                    {c.label}
                  </Typography>
                </Box>
              )
            })}
          </Stack>
        )}
      </Box>
    </Card>
  )
}

/* ── Main Card ── */

export default function AppCard({ app, teams = [], onAppTeamsChanged, onAppExcludedChanged, allExpanded }) {
  const [contactApp, setContactApp] = useState(null)
  const [detailApp, setDetailApp] = useState(null)
  const [detailDep, setDetailDep] = useState(null)
  const [showDeps, setShowDeps] = useState(false)
  useEffect(() => { setShowDeps(!!allExpanded) }, [allExpanded])
  const resolveTeams = (a) => (a.team_ids || []).map(id => teams.find(t => t.id === id)).filter(Boolean)
  const {
    name, status, incidents_30d, last,
    seal, lob, subLob, cto, cbt, appOwner, cpof,
    riskRanking, classification, state, investmentStrategy, rto,
    productLine, product,
    deployments = [],
  } = app

  // Derive CPOF from deployments
  const hasCpof = cpof === 'Yes' || deployments.some(d => d.cpof)
  // Derive strictest RTO
  const deployRtos = deployments.filter(d => d.rto != null).map(d => d.rto)
  const strictestRto = deployRtos.length > 0 ? Math.min(...deployRtos) : null
  const displayRto = strictestRto ?? rto

  // Derive status from deployments/components (skip no_data for worst-of)
  let derivedStatus = 'no_data'
  if (deployments.length > 0) {
    let hasRag = false
    for (const d of deployments) {
      if (d.status && d.status !== 'no_data') {
        if (!hasRag) { derivedStatus = 'healthy'; hasRag = true }
        if ((STATUS_RANK[d.status] ?? 2) < (STATUS_RANK[derivedStatus] ?? 2)) derivedStatus = d.status
      }
      for (const c of (d.components || [])) {
        if (c.status === 'no_data') continue
        if (!hasRag) { derivedStatus = 'healthy'; hasRag = true }
        if ((STATUS_RANK[c.status] ?? 2) < (STATUS_RANK[derivedStatus] ?? 2)) derivedStatus = c.status
      }
    }
  } else {
    derivedStatus = 'no_data'
  }

  // Derive SLO
  const depSlos = deployments.map(d => d.slo).filter(v => v != null)
  const sloVal = depSlos.length > 0 ? Math.min(...depSlos) : app.slo?.current

  const statusColor = STATUS_COLOR[derivedStatus] || '#999'

  // Metadata tooltip content
  const metaItems = [
    ['LOB', lob], ['Sub LOB', subLob], ['Product Line', productLine], ['Product', product],
    ['CTO', cto], ['CBT', cbt], ['App Owner', appOwner],
    ['RTO', displayRto ? `${displayRto}h` : null],
    ['Risk Ranking', riskRanking], ['Classification', classification],
    ['State', state], ['Investment', investmentStrategy],
  ].filter(([, v]) => v)

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ py: '10px !important', px: 1.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* ── Row 1: name ... status ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.82rem', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1976d2' }}>
            {name} — {seal}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={STATUS_LABEL[derivedStatus] || derivedStatus}
            size="small"
            sx={{
              height: 20, fontSize: '0.6rem', fontWeight: 700,
              textTransform: 'uppercase',
              bgcolor: `${statusColor}18`,
              color: statusColor,
              flexShrink: 0,
            }}
          />
        </Box>

        {/* ── Row 2: blast radius + metadata + contact + manage + cpof ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
          <CrossLinkChips seal={seal} only={['blast-radius']} />
          <Tooltip
            arrow
            title={
              <Box sx={{ fontSize: '0.64rem' }}>
                {metaItems.map(([k, v]) => (
                  <Box key={k}><b>{k}:</b> {v}</Box>
                ))}
              </Box>
            }
          >
            <IconButton size="small" sx={{ p: 0.25, flexShrink: 0 }}>
              <InfoOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Contact Team" arrow>
            <IconButton size="small" onClick={() => setContactApp(app)} sx={{ p: 0.25, flexShrink: 0 }}>
              <ChatBubbleIcon sx={{ fontSize: 15, color: '#42a5f5' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Manage" arrow>
            <IconButton size="small" onClick={() => setDetailApp(app)} sx={{ p: 0.25, flexShrink: 0, color: '#42a5f5', '&:hover': { color: '#1e88e5' } }}>
              <TuneIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          {hasCpof && (
            <Chip
              label="CPOF"
              size="small"
              sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0', flexShrink: 0 }}
            />
          )}
        </Box>

        {/* ── Row 3: stats ── */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            SLO Status: <Box component="span" sx={{ fontWeight: 700, color: sloVal != null ? 'text.secondary' : 'text.disabled' }}>{sloVal != null ? `${sloVal}%` : '—'}</Box>
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            Open P1/P2:{' '}
            {(incidents_30d ?? 0) > 0 ? (
              <Link href="#" onClick={e => e.preventDefault()} underline="hover" sx={{ fontSize: '0.72rem', fontWeight: 700, color: incidents_30d > 2 ? '#f44336' : '#ff9800' }}>
                {incidents_30d}
              </Link>
            ) : (
              <Box component="span" sx={{ fontWeight: 700, color: 'text.disabled' }}>0</Box>
            )}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            Last Incident: <Box component="span" sx={{ color: last && last !== '—' ? 'text.secondary' : 'text.disabled' }}>{last || '—'}</Box>
          </Typography>
        </Box>

        {/* ── Deployment cards ── */}
        {deployments.length > 0 && (
          <>
            <Box
              onClick={() => setShowDeps(v => !v)}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mb: 0.5 }}
            >
              <IconButton size="small" sx={{ p: 0, width: 18, height: 18 }}>
                {showDeps ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ChevronRightIcon sx={{ fontSize: 14 }} />}
              </IconButton>
              <Typography variant="caption" sx={{ fontSize: '0.66rem', color: 'text.disabled', fontWeight: 600 }}>
                {deployments.length} Deployment{deployments.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {showDeps && (
              <Stack spacing={0.75} sx={{ flex: 1 }}>
                {deployments.map(d => (
                  <DeploymentCard key={d.id} deployment={d} app={app} teams={teams} onSetContactApp={setContactApp} onSetDetailDep={setDetailDep} allExpanded={allExpanded} />
                ))}
              </Stack>
            )}
          </>
        )}
        {deployments.length === 0 && (
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.66rem' }}>
            No deployment data
          </Typography>
        )}
      </CardContent>

      {/* Modals */}
      {detailApp && (
        <AppDetailModal
          app={detailApp}
          teams={teams}
          onClose={() => setDetailApp(null)}
          onTeamsChanged={onAppTeamsChanged}
          onExcludedIndicatorsChanged={onAppExcludedChanged}
        />
      )}
      {detailDep && (
        <DeploymentDetailModal
          deployment={detailDep.deployment}
          app={detailDep.app}
          teams={teams}
          onClose={() => setDetailDep(null)}
          onExcludedIndicatorsChanged={onAppExcludedChanged}
        />
      )}
      {contactApp && (
        <ContactModal
          app={contactApp}
          teams={resolveTeams(contactApp)}
          onClose={() => setContactApp(null)}
        />
      )}
    </Card>
  )
}
