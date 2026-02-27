import { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { APPS, parseSealDisplay } from './data/appData'

const FilterContext = createContext()

export const useFilters = () => useContext(FilterContext)

export function FilterProvider({ children }) {
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState({})

  const setFilterValues = useCallback((key, values) => {
    setActiveFilters(prev => {
      const next = { ...prev }
      if (!values || values.length === 0) {
        delete next[key]
      } else {
        next[key] = values
      }
      return next
    })
  }, [])

  const clearFilter = useCallback((key) => {
    setActiveFilters(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setActiveFilters({})
    setSearchText('')
  }, [])

  const filteredApps = useMemo(() => {
    return APPS.filter(app => {
      // Text search: match against name, seal, team, appOwner, cto
      if (searchText) {
        const q = searchText.toLowerCase()
        const searchable = [app.name, app.seal, app.team, app.appOwner, app.cto]
          .join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      // Each active filter: AND across fields, OR within a field
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue
        if (key === 'seal') {
          // SEAL filter uses display format "Name - 90176", extract raw value
          const rawValues = values.map(parseSealDisplay)
          if (!rawValues.includes(app.seal)) return false
        } else if (!values.includes(app[key])) return false
      }
      return true
    })
  }, [searchText, activeFilters])

  const activeFilterCount = Object.keys(activeFilters).length

  const value = {
    searchText,
    setSearchText,
    activeFilters,
    setFilterValues,
    clearFilter,
    clearAllFilters,
    filteredApps,
    activeFilterCount,
    totalApps: APPS.length,
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}
