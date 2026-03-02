const STORAGE_KEY = 'obs-links'

export const ICON_KEYS = [
  'MonitorHeart', 'BugReport', 'Description', 'Build', 'Storage',
  'Security', 'Speed', 'Groups', 'Cloud', 'Code', 'Science',
  'DataObject', 'Dns', 'Hub', 'Terminal', 'Webhook',
]

export const COLOR_PRESETS = [
  '#60a5fa', '#f87171', '#34d399', '#fbbf24',
  '#a78bfa', '#fb923c', '#38bdf8', '#94a3b8',
  '#e879f9', '#4ade80', '#f472b6', '#facc15',
]

const DEFAULT_CATEGORIES = [
  {
    id: 'cat-monitor', category: 'Monitoring & Alerting', color: '#60a5fa', icon: 'MonitorHeart',
    links: [
      { id: 'lnk-dd', label: 'Datadog', desc: 'Metrics, traces & logs', url: '', tag: 'Primary' },
      { id: 'lnk-prom', label: 'Prometheus', desc: 'Time-series metrics & alerting', url: '', tag: null },
      { id: 'lnk-graf', label: 'Grafana', desc: 'Dashboards and visualisations', url: '', tag: null },
      { id: 'lnk-pd', label: 'PagerDuty', desc: 'On-call scheduling & incident alerts', url: '', tag: null },
    ],
  },
  {
    id: 'cat-incident', category: 'Incident Management', color: '#f87171', icon: 'BugReport',
    links: [
      { id: 'lnk-snow', label: 'ServiceNow', desc: 'ITSM and incident ticketing', url: '', tag: 'Primary' },
      { id: 'lnk-sp', label: 'StatusPage', desc: 'External status page for clients', url: '', tag: null },
      { id: 'lnk-jira', label: 'Jira', desc: 'Issue and project tracking', url: '', tag: null },
      { id: 'lnk-cpir', label: 'Confluence PIR', desc: 'Post-incident review templates', url: '', tag: null },
    ],
  },
  {
    id: 'cat-docs', category: 'Documentation', color: '#34d399', icon: 'Description',
    links: [
      { id: 'lnk-conf', label: 'Confluence', desc: 'Team wikis and runbooks', url: '', tag: 'Primary' },
      { id: 'lnk-arch', label: 'Architecture Docs', desc: 'System design and ADRs', url: '', tag: null },
      { id: 'lnk-api', label: 'API Registry', desc: 'Internal API catalogue', url: '', tag: null },
      { id: 'lnk-onb', label: 'Onboarding Wiki', desc: 'New joiner guides and HOWTOs', url: '', tag: null },
    ],
  },
  {
    id: 'cat-cicd', category: 'CI/CD & Deployments', color: '#fbbf24', icon: 'Build',
    links: [
      { id: 'lnk-jen', label: 'Jenkins', desc: 'Build pipelines and job history', url: '', tag: 'Primary' },
      { id: 'lnk-argo', label: 'ArgoCD', desc: 'GitOps Kubernetes deployments', url: '', tag: null },
      { id: 'lnk-ghe', label: 'GitHub Enterprise', desc: 'Source code and pull requests', url: '', tag: null },
      { id: 'lnk-nex', label: 'Nexus Registry', desc: 'Artefact and Docker image registry', url: '', tag: null },
    ],
  },
  {
    id: 'cat-infra', category: 'Infrastructure', color: '#a78bfa', icon: 'Storage',
    links: [
      { id: 'lnk-aws', label: 'AWS Console', desc: 'Cloud infrastructure management', url: '', tag: 'Primary' },
      { id: 'lnk-k8s', label: 'Kubernetes Dashboard', desc: 'Cluster and pod management', url: '', tag: null },
      { id: 'lnk-tf', label: 'Terraform Cloud', desc: 'Infrastructure-as-code state', url: '', tag: null },
      { id: 'lnk-vault', label: 'Vault', desc: 'Secrets management', url: '', tag: null },
    ],
  },
  {
    id: 'cat-sec', category: 'Security', color: '#fb923c', icon: 'Security',
    links: [
      { id: 'lnk-snyk', label: 'Snyk', desc: 'Dependency vulnerability scanning', url: '', tag: 'Primary' },
      { id: 'lnk-sonar', label: 'SonarQube', desc: 'Code quality and SAST analysis', url: '', tag: null },
      { id: 'lnk-okta', label: 'Okta Admin', desc: 'Identity and access management', url: '', tag: null },
      { id: 'lnk-prisma', label: 'Prisma Cloud', desc: 'Cloud security posture management', url: '', tag: null },
    ],
  },
  {
    id: 'cat-perf', category: 'Performance', color: '#38bdf8', icon: 'Speed',
    links: [
      { id: 'lnk-dyna', label: 'Dynatrace', desc: 'APM and real user monitoring', url: '', tag: 'Primary' },
      { id: 'lnk-gatl', label: 'Gatling Reports', desc: 'Load test results and trends', url: '', tag: null },
      { id: 'lnk-k6', label: 'k6 Cloud', desc: 'Performance test orchestration', url: '', tag: null },
      { id: 'lnk-crux', label: 'Chrome UX Report', desc: 'Real-world web performance data', url: '', tag: null },
    ],
  },
  {
    id: 'cat-comms', category: 'Team & Comms', color: '#94a3b8', icon: 'Groups',
    links: [
      { id: 'lnk-slack', label: 'Slack — #platform-ops', desc: 'Primary incident war room channel', url: '', tag: 'Primary' },
      { id: 'lnk-teams', label: 'MS Teams', desc: 'Business communications hub', url: '', tag: null },
      { id: 'lnk-cal', label: 'Engineering Calendar', desc: 'On-call, maintenance & releases', url: '', tag: null },
      { id: 'lnk-opsg', label: 'OpsGenie', desc: 'Escalation and alert routing', url: '', tag: null },
    ],
  },
]

export function loadCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return DEFAULT_CATEGORIES.map(c => ({ ...c, links: c.links.map(l => ({ ...l })) }))
}

export function saveCategories(categories) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

export function generateId(prefix = 'cat') {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

export function resetToDefaults() {
  const fresh = DEFAULT_CATEGORIES.map(c => ({ ...c, links: c.links.map(l => ({ ...l })) }))
  saveCategories(fresh)
  return fresh
}
