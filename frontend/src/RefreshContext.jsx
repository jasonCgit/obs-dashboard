import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const REFRESH_OPTIONS = [
  { label: '30s',  ms: 30_000 },
  { label: '1m',   ms: 60_000 },
  { label: '2m',   ms: 120_000 },
  { label: '5m',   ms: 300_000 },
]

const RefreshContext = createContext(null)

function timeAgo(date) {
  if (!date) return ''
  const secs = Math.round((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  return `${mins}m ago`
}

export function RefreshProvider({ children }) {
  const [refreshMs, setRefreshMs] = useState(60_000)
  const [refreshTick, setRefreshTick] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [displayTime, setDisplayTime] = useState('')
  const intervalRef = useRef(null)

  // Fire tick on interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRefreshTick(t => t + 1)
    }, refreshMs)
    return () => clearInterval(intervalRef.current)
  }, [refreshMs])

  // Update display time every 5s
  useEffect(() => {
    if (!lastUpdated) return
    setDisplayTime(timeAgo(lastUpdated))
    const id = setInterval(() => setDisplayTime(timeAgo(lastUpdated)), 5000)
    return () => clearInterval(id)
  }, [lastUpdated])

  const reportUpdated = useCallback(() => {
    setLastUpdated(new Date())
  }, [])

  const triggerRefresh = useCallback(() => {
    setRefreshTick(t => t + 1)
  }, [])

  return (
    <RefreshContext.Provider value={{
      refreshMs, setRefreshMs, refreshTick,
      reportUpdated, displayTime, REFRESH_OPTIONS, triggerRefresh,
    }}>
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  return useContext(RefreshContext)
}
