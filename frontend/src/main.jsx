import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppThemeProvider } from './ThemeContext'
import { AuthProvider } from './AuthContext'
import { TenantProvider } from './tenant/TenantContext'
import { FilterProvider } from './FilterContext'
import { RefreshProvider } from './RefreshContext'
import { AuraChatProvider } from './aura/AuraChatContext'
import App from './App'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppThemeProvider>
        <AuthProvider>
        <TenantProvider>
        <FilterProvider>
          <RefreshProvider>
            <AuraChatProvider>
              <App />
            </AuraChatProvider>
          </RefreshProvider>
        </FilterProvider>
        </TenantProvider>
        </AuthProvider>
      </AppThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
)
