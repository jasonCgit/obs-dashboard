import { createContext, useContext, useState, useMemo } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { createAppTheme } from './theme'

export const ThemeContext = createContext({ themeMode: 'dark', toggleTheme: () => {} })

export const useAppTheme = () => useContext(ThemeContext)

export function AppThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState('dark')
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode])
  const toggleTheme = () => setThemeMode(m => m === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
