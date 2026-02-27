import { useState, useEffect, useCallback } from 'react'
import { Container, Grid, Box, Stack, CircularProgress, Alert } from '@mui/material'
import SummaryCards          from '../components/SummaryCards'
import AIHealthPanel         from '../components/AIHealthPanel'
import CriticalApps          from '../components/CriticalApps'
import RegionalStatus        from '../components/RegionalStatus'
import ActiveIncidentsPanel  from '../components/ActiveIncidentsPanel'
import IncidentTrends        from '../components/IncidentTrends'
import WorldClock            from '../components/WorldClock'
import { useRefresh } from '../RefreshContext'

export default function Dashboard() {
  const [summary,          setSummary]          = useState(null)
  const [aiData,           setAiData]           = useState(null)
  const [regional,         setRegional]         = useState(null)
  const [critApps,         setCritApps]         = useState(null)
  const [trends,           setTrends]           = useState(null)
  const [activeIncidents,  setActiveIncidents]  = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState(null)
  const { refreshTick, reportUpdated } = useRefresh()

  const endpoints = [
    ['/api/health-summary',     setSummary],
    ['/api/ai-analysis',        setAiData],
    ['/api/regional-status',    setRegional],
    ['/api/critical-apps',      setCritApps],
    ['/api/incident-trends',    setTrends],
    ['/api/active-incidents',   setActiveIncidents],
  ]

  const fetchData = useCallback(() => {
    return Promise.all(
      endpoints.map(([url, setter]) =>
        fetch(url)
          .then(r => { if (!r.ok) throw new Error(`${url} — ${r.status}`); return r.json() })
          .then(setter)
      )
    )
      .then(() => reportUpdated())
      .catch(e => setError(e.message))
  }, [reportUpdated])

  // Initial fetch
  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  // Re-fetch on global refresh tick
  useEffect(() => {
    if (refreshTick > 0) fetchData()
  }, [refreshTick])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Alert severity="error">Failed to load dashboard: {error}</Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      <WorldClock />
      <SummaryCards data={summary} />
      <Grid container spacing={2}>
        {/* Left column */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={1}>
            <AIHealthPanel data={aiData} />
            <CriticalApps  data={critApps} />
          </Stack>
        </Grid>
        {/* Right column */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={1}>
            <RegionalStatus       data={regional} />
            <ActiveIncidentsPanel data={activeIncidents} />
            <IncidentTrends       data={trends} />
          </Stack>
        </Grid>
      </Grid>
    </Container>
  )
}
