/**
 * Build a query string from the active filter state.
 * Maps FilterContext keys → API query param names.
 * Multi-value filters produce repeated params: ?lob=AWM&lob=CIB
 */
export default function buildFilterQueryString(activeFilters, searchText) {
  const params = new URLSearchParams()

  const keyMap = {
    lob:     'lob',
    subLob:  'subLob',
    cto:     'cto',
    cbt:     'cbt',
    seal:    'seal',
    status:  'status',
  }

  for (const [feKey, apiKey] of Object.entries(keyMap)) {
    const values = activeFilters[feKey] || []
    for (const v of values) {
      params.append(apiKey, v)
    }
  }

  if (searchText) {
    params.append('search', searchText)
  }

  const qs = params.toString()
  return qs ? `?${qs}` : ''
}
