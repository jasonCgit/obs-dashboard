import { useState, useEffect } from 'react'
import { Container, Grid, Box, CircularProgress, Alert } from '@mui/material'
import SummaryCards    from '../components/SummaryCards'
import AIHealthPanel   from '../components/AIHealthPanel'
import CriticalApps    from '../components/CriticalApps'
import RegionalStatus  from '../components/RegionalStatus'
import IncidentTrends  from '../components/IncidentTrends'

export default function Dashboard() {
  const [summary,   setSummary]   = useState(null)
  const [aiData,    setAiData]    = useState(null)
  const [regional,  setRegional]  = useState(null)
  const [critApps,  setCritApps]  = useState(null)
  const [trends,    setTrends]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  useEffect(() => {
    const endpoints = [
      ['/api/health-summary',  setSummary],
      ['/api/ai-analysis',     setAiData],
      ['/api/regional-status', setRegional],
      ['/api/critical-apps',   setCritApps],
      ['/api/incident-trends', setTrends],
    ]
    Promise.all(
      endpoints.map(([url, setter]) =>
        fetch(url)
          .then(r => { if (!r.ok) throw new Error(`${url} — ${r.status}`); return r.json() })
          .then(setter)
      )
    )
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

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
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <SummaryCards data={summary} />
      <Grid container spacing={3}>
        {/* Left column — 70% */}
        <Grid item xs={12} lg={8}>
          <AIHealthPanel  data={aiData}   />
          <CriticalApps   data={critApps} />
        </Grid>
        {/* Right column — 30% */}
        <Grid item xs={12} lg={4}>
          <RegionalStatus data={regional} />
          <IncidentTrends data={trends}   />
        </Grid>
      </Grid>
    </Container>
  )
}
