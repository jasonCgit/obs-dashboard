import { createTheme } from '@mui/material/styles'

export function createAppTheme(mode) {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary:    { main: '#1565C0' },
      error:      { main: '#f44336' },
      warning:    { main: '#ff9800' },
      success:    { main: '#4caf50' },
      background: isDark
        ? { default: '#0a0e1a', paper: '#111827' }
        : { default: '#f1f5f9', paper: '#ffffff' },
      text: isDark
        ? { primary: '#e2e8f0', secondary: '#94a3b8' }
        : { primary: '#0f172a', secondary: '#475569' },
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
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
            borderRadius: 8,
          },
        },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.23)',
          },
        },
      },
    },
  })
}

// Default export kept for any legacy imports
export default createAppTheme('dark')
