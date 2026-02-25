import { Routes, Route, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TopNav          from './components/TopNav'
import Dashboard       from './pages/Dashboard'
import GraphExplorer   from './pages/GraphExplorer'
import Applications    from './pages/Applications'
import Views           from './pages/Views'
import CustomerJourney from './pages/CustomerJourney'
import IncidentItem    from './pages/IncidentItem'
import SloCorrector    from './pages/SloCorrector'
import Announcements   from './pages/Announcements'
import Links           from './pages/Links'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopNav />
      <Routes>
        <Route path="/"                element={<Dashboard />} />
        <Route path="/graph"           element={<GraphExplorer />} />
        <Route path="/applications"    element={<Applications />} />
        <Route path="/views"           element={<Views />} />
        <Route path="/customer-journey"element={<CustomerJourney />} />
        <Route path="/incident-item"   element={<IncidentItem />} />
        <Route path="/slo-corrector"   element={<SloCorrector />} />
        <Route path="/announcements"   element={<Announcements />} />
        <Route path="/links"           element={<Links />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}
