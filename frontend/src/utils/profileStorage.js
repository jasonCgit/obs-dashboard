const STORAGE_KEY = 'obs-user-profile'

export const ROLES = ['admin', 'viewer']

const DEFAULTS = {
  displayName: 'Joe Pedone',
  role: 'admin',
  defaultTenantId: null,
  defaultFilters: {},
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch { /* ignore */ }
}
