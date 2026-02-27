const STORAGE_KEY = 'obs-tenants'
const ACTIVE_KEY  = 'obs-active-tenant'

// ── CRUD ─────────────────────────────────────────────────────────────────────

export function loadAllTenants() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

export function saveAllTenants(tenants) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tenants))
}

export function loadTenant(id) {
  return loadAllTenants().find(t => t.id === id) || null
}

export function saveTenant(tenant) {
  const all = loadAllTenants()
  const idx = all.findIndex(t => t.id === tenant.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    all[idx] = { ...tenant, updatedAt: now }
  } else {
    all.push({ ...tenant, createdAt: now, updatedAt: now })
  }
  saveAllTenants(all)
}

export function deleteTenant(id) {
  saveAllTenants(loadAllTenants().filter(t => t.id !== id))
  // Clear active if this was active
  if (getActiveTenantId() === id) setActiveTenantId(null)
}

export function generateTenantId() {
  return 'tenant-' + crypto.randomUUID()
}

// ── Active tenant ────────────────────────────────────────────────────────────

export function getActiveTenantId() {
  return localStorage.getItem(ACTIVE_KEY) || null
}

export function setActiveTenantId(id) {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id)
  } else {
    localStorage.removeItem(ACTIVE_KEY)
  }
}

export function loadActiveTenant() {
  const id = getActiveTenantId()
  return id ? loadTenant(id) : null
}

// ── Default (base portal, never stored) ──────────────────────────────────────

export const DEFAULT_TENANT = {
  id: null,
  name: 'Unified Observability Portal',
  title: 'Unified Observability Portal',
  subtitle: '',
  logoLetter: 'U',
  logoGradient: ['#1565C0', '#1e88e5'],
  description: 'purpose-built for AWM engineering',
  poweredBy: 'Powered by AWM Site Reliability Engineering (SRE)',
  defaultFilters: {},
  version: '',
}
