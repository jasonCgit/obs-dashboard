import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from './theme'

const STORAGE_KEY = 'obs-theme-mode'

export const ThemeContext = createContext({ themeMode: 'dark', toggleTheme: () => {}, setThemeMode: () => {} })

export const useAppTheme = () => useContext(ThemeContext)

export function AppThemeProvider({ children }) {
  const [themeMode, setThemeModeRaw] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'dark' } catch { return 'dark' }
  })
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode])

  const setThemeMode = useCallback((mode) => {
    setThemeModeRaw(mode)
    try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeMode(themeMode === 'dark' ? 'light' : 'dark')
  }, [themeMode, setThemeMode])

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme, setThemeMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
