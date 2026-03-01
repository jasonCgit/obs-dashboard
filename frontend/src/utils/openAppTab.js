/**
 * Ensure a tab is open in the TopNav tab bar, then navigate to it.
 * Works by updating localStorage and dispatching a custom event
 * that TopNav listens for to sync its state.
 */

const STORAGE_KEY = 'obs-open-tabs'

// path → tab label (must match ALL_TABS in TopNav.jsx)
const PATH_TO_LABEL = {
  '/':                 'Home',
  '/announcements':    'Announcements',
  '/applications':     'Applications',
  '/graph-layers':     'Blast Radius',
  '/customer-journey': 'Customer Journeys',
  '/favorites':        'Favorites',
  '/incident-zero':    'Incident Zero',
  '/links':            'Links',
  '/slo-agent':        'SLO Agent',
  '/teams':            'Teams',
  '/view-central':     'View Central',
}

export default function openAppTab(path, navigate) {
  // Strip query string for label lookup
  const basePath = path.split('?')[0]
  const label = PATH_TO_LABEL[basePath]

  if (label) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '["Home"]')
      if (!saved.includes(label)) {
        saved.push(label)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      }
    } catch { /* ignore */ }
    // Notify TopNav to re-read tabs
    window.dispatchEvent(new CustomEvent('obs-tabs-changed'))
  }

  navigate(path)
}
