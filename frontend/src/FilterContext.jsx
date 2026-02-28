import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import { APPS, parseSealDisplay, parseDeployDisplay, SEAL_DISPLAY } from './data/appData'
import { useTenant } from './tenant/TenantContext'

const FilterContext = createContext()

export const useFilters = () => useContext(FilterContext)

// Shared filter-match logic used by both filteredApps and getCandidateApps
function appMatchesFilters(app, searchText, activeFilters, excludeKey = null) {
  if (searchText) {
    const q = searchText.toLowerCase()
    const searchable = [app.name, app.seal, app.team, app.appOwner, app.cto]
      .join(' ').toLowerCase()
    if (!searchable.includes(q)) return false
  }
  for (const [key, values] of Object.entries(activeFilters)) {
    if (key === excludeKey) continue
    if (values.length === 0) continue
    if (key === 'seal') {
      const rawValues = values.map(parseSealDisplay)
      if (!rawValues.includes(app.seal)) return false
    } else if (key === 'deploymentTypes') {
      const rawValues = values.map(parseDeployDisplay)
      if (!(app.deploymentTypes || []).some(t => rawValues.includes(t))) return false
    } else if (!values.includes(app[key])) return false
  }
  return true
}

export function FilterProvider({ children }) {
  const { tenant } = useTenant()
  const [searchText, setSearchText] = useState('')
  const [activeFilters, setActiveFilters] = useState(() => tenant.defaultFilters || {})

  // Reset filters when tenant changes
  useEffect(() => {
    setActiveFilters(tenant.defaultFilters || {})
    setSearchText('')
  }, [tenant.id])

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

  const resetToDefaults = useCallback(() => {
    setActiveFilters(tenant.defaultFilters || {})
    setSearchText('')
  }, [tenant])

  // Main filtered apps (all filters applied)
  const filteredApps = useMemo(() => {
    return APPS.filter(app => appMatchesFilters(app, searchText, activeFilters))
  }, [searchText, activeFilters])

  // Cascading filter: for a given field, return apps matching all OTHER filters
  const getCandidateApps = useCallback((excludeKey) => {
    return APPS.filter(app => appMatchesFilters(app, searchText, activeFilters, excludeKey))
  }, [searchText, activeFilters])

  // Type-ahead search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchText || searchText.length < 1) return []
    const q = searchText.toLowerCase()
    const suggestions = []
    const seen = new Set()
    // [displayLabel, appProperty, filterKey]
    const fields = [
      ['App',     'name',        'seal'],
      ['SEAL',    'seal',        'seal'],
      ['Team',    'team',        null],
      ['LOB',     'lob',         'lob'],
      ['Sub LOB', 'subLob',      'subLob'],
      ['Owner',   'appOwner',    'appOwner'],
      ['CTO',     'cto',         'cto'],
      ['CBT',     'cbt',         'cbt'],
    ]
    for (const app of APPS) {
      for (const [fieldLabel, fieldKey, filterKey] of fields) {
        const value = app[fieldKey]
        if (value && value.toLowerCase().includes(q) && !seen.has(`${fieldKey}:${value}`)) {
          seen.add(`${fieldKey}:${value}`)
          // For name/seal fields, the filter value is the SEAL display string
          let filterValue = value
          if (filterKey === 'seal' && fieldKey === 'name') {
            filterValue = SEAL_DISPLAY[app.seal] || app.seal
          } else if (filterKey === 'seal' && fieldKey === 'seal') {
            filterValue = SEAL_DISPLAY[value] || value
          }
          suggestions.push({ field: fieldLabel, value, filterKey, filterValue })
        }
      }
    }
    return suggestions.slice(0, 15)
  }, [searchText])

  const activeFilterCount = Object.keys(activeFilters).length

  const value = {
    searchText,
    setSearchText,
    activeFilters,
    setFilterValues,
    clearFilter,
    clearAllFilters,
    resetToDefaults,
    filteredApps,
    activeFilterCount,
    totalApps: APPS.length,
    getCandidateApps,
    searchSuggestions,
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}
