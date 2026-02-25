import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#1565C0' },
    error:      { main: '#f44336' },
    warning:    { main: '#ff9800' },
    success:    { main: '#4caf50' },
    background: { default: '#0a0e1a', paper: '#111827' },
    text:       { primary: '#e2e8f0', secondary: '#94a3b8' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: 'rgba(255,255,255,0.08)' } },
    },
  },
})

export default theme
