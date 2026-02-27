import { createContext, useContext, useState, useCallback } from 'react'
import { loadActiveTenant, setActiveTenantId, DEFAULT_TENANT } from './tenantStorage'

const TenantContext = createContext()

export const useTenant = () => useContext(TenantContext)

export function TenantProvider({ children }) {
  const [activeTenant, setActiveTenant] = useState(() => {
    return loadActiveTenant() || DEFAULT_TENANT
  })

  const switchTenant = useCallback((tenantOrNull) => {
    if (!tenantOrNull || !tenantOrNull.id) {
      setActiveTenantId(null)
      setActiveTenant(DEFAULT_TENANT)
      document.title = DEFAULT_TENANT.title
    } else {
      setActiveTenantId(tenantOrNull.id)
      setActiveTenant(tenantOrNull)
      document.title = tenantOrNull.title || DEFAULT_TENANT.title
    }
  }, [])

  const refreshTenant = useCallback(() => {
    const t = loadActiveTenant()
    const tenant = t || DEFAULT_TENANT
    setActiveTenant(tenant)
    document.title = tenant.title
  }, [])

  return (
    <TenantContext.Provider value={{ tenant: activeTenant, switchTenant, refreshTenant }}>
      {children}
    </TenantContext.Provider>
  )
}
