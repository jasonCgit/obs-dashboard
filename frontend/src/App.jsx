import { Component } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TopNav          from './components/TopNav'
import ScopeBar        from './components/ScopeBar'
import Dashboard       from './pages/Dashboard'
import GraphLayers     from './pages/GraphLayers'
import Applications    from './pages/Applications'
import Favorites       from './pages/Favorites'
import ViewCentralListing   from './view-central/ViewCentralListing'
import ViewCentralDashboard from './view-central/ViewCentralDashboard'

import CustomerJourney from './pages/CustomerJourney'
import SloAgent        from './pages/SloAgent'
import IncidentZero    from './pages/IncidentZero'
import Announcements   from './pages/Announcements'
import Links           from './pages/Links'
import Admin           from './pages/Admin'
import Teams           from './pages/Teams'
import AuraChatFab     from './aura/AuraChatFab'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>Something went wrong</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
            {this.state.error?.message}
          </Typography>
        </Box>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <TopNav />
        <ScopeBar />
        <Routes>
          <Route path="/"                element={<Dashboard />} />
          <Route path="/graph-layers"    element={<GraphLayers />} />
          <Route path="/graph"           element={<Navigate to="/graph-layers" replace />} />
          <Route path="/applications"    element={<Applications />} />
          <Route path="/favorites"       element={<Favorites />} />
          <Route path="/view-central"    element={<ViewCentralListing />} />
          <Route path="/view-central/:id" element={<ViewCentralDashboard />} />
<Route path="/customer-journey"element={<CustomerJourney />} />
          <Route path="/slo-agent"       element={<SloAgent />} />
          <Route path="/incident-zero"   element={<IncidentZero />} />
          <Route path="/announcements"   element={<Announcements />} />
          <Route path="/links"           element={<Links />} />
          <Route path="/teams"           element={<Teams />} />
          <Route path="/portals"         element={<Admin />} />
          <Route path="/admin"           element={<Navigate to="/portals" replace />} />
          <Route path="/views"           element={<Navigate to="/view-central" replace />} />
          <Route path="*"                element={<Navigate to="/" replace />} />
        </Routes>
        <AuraChatFab />
      </Box>
    </ErrorBoundary>
  )
}
