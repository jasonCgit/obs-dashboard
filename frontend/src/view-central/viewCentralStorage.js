const STORAGE_KEY = 'obs-view-centrals'
const VERSION_KEY = 'obs-vc-layout-version'
const LAYOUT_VERSION = 4  // bump when default layouts change

function migrateIfNeeded() {
  const stored = localStorage.getItem(VERSION_KEY)
  if (stored !== String(LAYOUT_VERSION)) {
    // Wipe old layouts so defaults re-seed with correct heights
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(VERSION_KEY, String(LAYOUT_VERSION))
  }
}

export function loadAllViewCentrals() {
  migrateIfNeeded()
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

export function saveAllViewCentrals(views) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
}

export function loadViewCentral(id) {
  return loadAllViewCentrals().find(v => v.id === id) || null
}

export function saveViewCentral(view) {
  const all = loadAllViewCentrals()
  const idx = all.findIndex(v => v.id === view.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    all[idx] = { ...view, updatedAt: now }
  } else {
    all.push({ ...view, createdAt: now, updatedAt: now })
  }
  saveAllViewCentrals(all)
}

export function deleteViewCentral(id) {
  saveAllViewCentrals(loadAllViewCentrals().filter(v => v.id !== id))
}

export function toggleViewCentralFavorite(id) {
  const all = loadAllViewCentrals()
  const idx = all.findIndex(v => v.id === id)
  if (idx < 0) return
  all[idx] = { ...all[idx], favorite: !all[idx].favorite }
  saveAllViewCentrals(all)
  return all[idx].favorite
}

export function generateId() {
  return 'vc-' + crypto.randomUUID()
}

export function generateWidgetId() {
  return 'w-' + crypto.randomUUID()
}

export function resetToDefaults() {
  const now = new Date().toISOString()
  const seeded = DEFAULT_VIEW_CENTRALS.map(v => ({ ...v, createdAt: now, updatedAt: now }))
  saveAllViewCentrals(seeded)
  return seeded
}

export function resetViewToDefault(id) {
  const defaultView = DEFAULT_VIEW_CENTRALS.find(v => v.id === id)
  if (!defaultView) return null
  const now = new Date().toISOString()
  const reset = { ...defaultView, updatedAt: now }
  saveViewCentral(reset)
  return reset
}

// ── Notification Storage ──
const NOTIF_KEY = 'obs-vc-notifications'

function loadAllNotifications() {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') }
  catch { return {} }
}

function saveAllNotifications(all) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all))
}

export function loadNotifications(viewId) {
  return loadAllNotifications()[viewId] || []
}

export function saveNotification(viewId, notif) {
  const all = loadAllNotifications()
  const list = all[viewId] || []
  const idx = list.findIndex(n => n.id === notif.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    list[idx] = { ...notif, updatedAt: now }
  } else {
    list.push({ ...notif, createdAt: now, updatedAt: now })
  }
  all[viewId] = list
  saveAllNotifications(all)
}

export function deleteNotification(viewId, notifId) {
  const all = loadAllNotifications()
  all[viewId] = (all[viewId] || []).filter(n => n.id !== notifId)
  saveAllNotifications(all)
}

export function generateNotifId() {
  return 'notif-' + crypto.randomUUID()
}

// Default seed View Centrals for first-time users
export const DEFAULT_VIEW_CENTRALS = [
  {
    id: 'vc-seed-spectrum',
    name: 'Spectrum Equities',
    description: 'Equities & Trading team observability dashboard',
    filters: { seal: ['90215'] },
    widgets: [
      { i: 'w-s1', type: 'summary-cards',    x: 0, y: 0,  w: 12, h: 2,  config: {} },
      { i: 'w-s2', type: 'critical-apps',    x: 0, y: 2,  w: 8,  h: 9,  config: {} },
      { i: 'w-s3', type: 'active-incidents', x: 8, y: 2,  w: 4,  h: 9,  config: {} },
      { i: 'w-s4', type: 'incident-trends',  x: 0, y: 11, w: 6,  h: 8,  config: {} },
      { i: 'w-s5', type: 'blast-radius',     x: 6, y: 11, w: 6,  h: 8,  config: {} },
    ],
  },
  {
    id: 'vc-seed-advisor',
    name: 'Advisor Connect',
    description: 'CRM & Client Engagement observability',
    filters: { seal: ['90176'] },
    widgets: [
      { i: 'w-a1', type: 'summary-cards',      x: 0, y: 0,  w: 12, h: 2,  config: {} },
      { i: 'w-a2', type: 'ai-health',          x: 0, y: 2,  w: 8,  h: 9,  config: {} },
      { i: 'w-a3', type: 'regional-status',    x: 8, y: 2,  w: 4,  h: 5,  config: {} },
      { i: 'w-a4', type: 'applications-table', x: 0, y: 11, w: 12, h: 10, config: {} },
    ],
  },
  {
    id: 'vc-seed-connectos',
    name: 'Connect OS',
    description: 'Platform Infrastructure monitoring',
    filters: { seal: ['88180'] },
    widgets: [
      { i: 'w-c1', type: 'summary-cards',    x: 0, y: 0,  w: 12, h: 2,  config: {} },
      { i: 'w-c2', type: 'customer-journey', x: 0, y: 2,  w: 12, h: 10, config: {} },
      { i: 'w-c3', type: 'links',            x: 0, y: 12, w: 12, h: 8,  config: {} },
    ],
  },
]
