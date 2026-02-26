import { Routes, Route, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TopNav          from './components/TopNav'
import Dashboard       from './pages/Dashboard'
import GraphExplorer   from './pages/GraphExplorer'
import Applications    from './pages/Applications'
import Favorites       from './pages/Favorites'
import ViewCentral     from './pages/ViewCentral'
import ProductCatalog  from './pages/ProductCatalog'
import CustomerJourney from './pages/CustomerJourney'
import SloAgent        from './pages/SloAgent'
import IncidentZero    from './pages/IncidentZero'
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
        <Route path="/favorites"       element={<Favorites />} />
        <Route path="/view-central"    element={<ViewCentral />} />
        <Route path="/product-catalog" element={<ProductCatalog />} />
        <Route path="/customer-journey"element={<CustomerJourney />} />
        <Route path="/slo-agent"       element={<SloAgent />} />
        <Route path="/incident-zero"   element={<IncidentZero />} />
        <Route path="/announcements"   element={<Announcements />} />
        <Route path="/links"           element={<Links />} />
        <Route path="/views"           element={<Navigate to="/view-central" replace />} />
        <Route path="*"                element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}
