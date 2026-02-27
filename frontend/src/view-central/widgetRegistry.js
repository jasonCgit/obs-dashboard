import { lazy } from 'react'
import SummaryCards from '../components/SummaryCards'
import AIHealthPanel from '../components/AIHealthPanel'
import RegionalStatus from '../components/RegionalStatus'
import CriticalApps from '../components/CriticalApps'
import IncidentTrends from '../components/IncidentTrends'
import ActiveIncidentsPanel from '../components/ActiveIncidentsPanel'
import FrequentIncidents from '../components/FrequentIncidents'
import RecentActivities from '../components/RecentActivities'

const GraphExplorerWidget   = lazy(() => import('./widgets/GraphExplorerWidget'))
const CustomerJourneyWidget = lazy(() => import('./widgets/CustomerJourneyWidget'))
const ApplicationsWidget    = lazy(() => import('./widgets/ApplicationsWidget'))
const LinksWidget           = lazy(() => import('./widgets/LinksWidget'))
const WorldClockWidget      = lazy(() => import('./widgets/WorldClockWidget'))

export const WIDGET_REGISTRY = {
  'summary-cards': {
    id: 'summary-cards',
    label: 'Health Summary Cards',
    description: 'Critical issues, warnings, recurring, and incidents today',
    category: 'Dashboard Panels',
    component: SummaryCards,
    apiEndpoint: '/api/health-summary',
    dataKey: null,
    defaultLayout: { w: 12, h: 2, minW: 2, minH: 2 },
    selfContained: false,
  },
  'ai-health': {
    id: 'ai-health',
    label: 'AI Health Analysis',
    description: 'AURA AI-powered critical alerts, trends, and recommendations',
    category: 'Dashboard Panels',
    component: AIHealthPanel,
    apiEndpoint: '/api/ai-analysis',
    dataKey: null,
    defaultLayout: { w: 8, h: 9, minW: 2, minH: 3 },
    selfContained: false,
  },
  'regional-status': {
    id: 'regional-status',
    label: 'Regional Health Status',
    description: 'Live health across US-East, US-West, EU-Central, Asia-Pacific',
    category: 'Dashboard Panels',
    component: RegionalStatus,
    apiEndpoint: '/api/regional-status',
    dataKey: null,
    defaultLayout: { w: 4, h: 5, minW: 2, minH: 3 },
    selfContained: false,
  },
  'critical-apps': {
    id: 'critical-apps',
    label: 'Critical Applications',
    description: 'Applications requiring immediate attention',
    category: 'Dashboard Panels',
    component: CriticalApps,
    apiEndpoint: '/api/critical-apps',
    dataKey: null,
    defaultLayout: { w: 8, h: 9, minW: 2, minH: 3 },
    selfContained: false,
  },
  'incident-trends': {
    id: 'incident-trends',
    label: 'Incident Trends (P1/P2)',
    description: '90-day incident frequency with trend lines',
    category: 'Dashboard Panels',
    component: IncidentTrends,
    apiEndpoint: '/api/incident-trends',
    dataKey: null,
    defaultLayout: { w: 6, h: 8, minW: 2, minH: 3 },
    selfContained: false,
  },
  'active-incidents': {
    id: 'active-incidents',
    label: 'Active Incidents & Notifications',
    description: 'P1/P2 donuts, Convey, and Spectrum banners',
    category: 'Dashboard Panels',
    component: ActiveIncidentsPanel,
    apiEndpoint: '/api/active-incidents',
    dataKey: null,
    defaultLayout: { w: 4, h: 9, minW: 2, minH: 3 },
    selfContained: false,
  },
  'frequent-incidents': {
    id: 'frequent-incidents',
    label: 'Frequent Incidents (30d)',
    description: 'Most recurring incidents with occurrence counts',
    category: 'Dashboard Panels',
    component: FrequentIncidents,
    apiEndpoint: '/api/recent-activities',
    dataKey: 'frequent',
    defaultLayout: { w: 6, h: 8, minW: 2, minH: 3 },
    selfContained: false,
  },
  'recent-activities': {
    id: 'recent-activities',
    label: 'Recent Activities',
    description: 'Activity feed across categories',
    category: 'Dashboard Panels',
    component: RecentActivities,
    apiEndpoint: '/api/recent-activities',
    dataKey: 'categories',
    defaultLayout: { w: 6, h: 8, minW: 2, minH: 3 },
    selfContained: false,
  },
  'blast-radius': {
    id: 'blast-radius',
    label: 'Blast Radius / Dependency Graph',
    description: 'Interactive dependency graph explorer',
    category: 'Interactive Views',
    component: GraphExplorerWidget,
    apiEndpoint: null,
    dataKey: null,
    defaultLayout: { w: 12, h: 14, minW: 2, minH: 4 },
    selfContained: true,
  },
  'customer-journey': {
    id: 'customer-journey',
    label: 'Customer Journeys',
    description: 'End-to-end journey path health',
    category: 'Interactive Views',
    component: CustomerJourneyWidget,
    apiEndpoint: null,
    dataKey: null,
    defaultLayout: { w: 12, h: 10, minW: 2, minH: 3 },
    selfContained: true,
  },
  'applications-table': {
    id: 'applications-table',
    label: 'Applications Registry',
    description: 'Application table with status and filter integration',
    category: 'Interactive Views',
    component: ApplicationsWidget,
    apiEndpoint: null,
    dataKey: null,
    defaultLayout: { w: 12, h: 10, minW: 2, minH: 3 },
    selfContained: true,
  },
  'links': {
    id: 'links',
    label: 'Quick Links',
    description: 'External tool and resource links',
    category: 'Interactive Views',
    component: LinksWidget,
    apiEndpoint: null,
    dataKey: null,
    defaultLayout: { w: 12, h: 8, minW: 2, minH: 3 },
    selfContained: true,
  },
  'world-clock': {
    id: 'world-clock',
    label: 'World Clock',
    description: 'Live clocks across global time zones',
    category: 'Interactive Views',
    component: WorldClockWidget,
    apiEndpoint: null,
    dataKey: null,
    defaultLayout: { w: 12, h: 2, minW: 2, minH: 2 },
    selfContained: true,
  },
}

export const WIDGET_CATEGORIES = [
  { key: 'Dashboard Panels', label: 'Dashboard Panels' },
  { key: 'Interactive Views', label: 'Interactive Views' },
]
