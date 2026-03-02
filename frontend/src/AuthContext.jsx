import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { loadProfile, saveProfile } from './utils/profileStorage'

const AuthContext = createContext({ role: 'admin', setRole: () => {}, isAdmin: true })

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [role, setRoleState] = useState(() => loadProfile().role || 'admin')

  const setRole = useCallback((newRole) => {
    setRoleState(newRole)
    const profile = loadProfile()
    saveProfile({ ...profile, role: newRole })
    window.dispatchEvent(new CustomEvent('obs-profile-changed'))
  }, [])

  const isAdmin = role === 'admin'
  const value = useMemo(() => ({ role, setRole, isAdmin }), [role, setRole, isAdmin])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
