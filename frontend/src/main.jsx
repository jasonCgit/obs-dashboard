import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppThemeProvider } from './ThemeContext'
import { FilterProvider } from './FilterContext'
import { RefreshProvider } from './RefreshContext'
import App from './App'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <FilterProvider>
          <RefreshProvider>
            <App />
          </RefreshProvider>
        </FilterProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
