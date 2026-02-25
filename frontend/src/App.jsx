import { Routes, Route, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import TopNav from './components/TopNav'
import Dashboard from './pages/Dashboard'
import GraphExplorer from './pages/GraphExplorer'

export default function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopNav />
      <Routes>
        <Route path="/"      element={<Dashboard />} />
        <Route path="/graph" element={<GraphExplorer />} />
        <Route path="*"      element={<Navigate to="/" replace />} />
      </Routes>
    </Box>
  )
}
