// Centralized application data — single source of truth for Applications page + global filter
export const APPS = [
  { name: 'GWM GLOBAL COLLATERAL MANAGEMENT', seal: '90176', team: 'Collateral',  status: 'critical', sla: '99.9%',  incidents: 12, last: '15m ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Gitanjali Nistala', cbt: 'Aadi Thayyar', appOwner: 'Nathan Brooks', cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2' },
  { name: 'PAYMENT GATEWAY API', seal: '90215', team: 'Payments', status: 'critical', sla: '99.99%', incidents: 8, last: '2h ago',
    lob: 'CCB', subLob: '', cto: 'Sheetal Gandhi', cbt: 'Adrian Cave', appOwner: 'Diana Reeves', cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4' },
  { name: 'MERIDIAN SERVICE-QUERY V1', seal: '90215', team: 'Trading', status: 'critical', sla: '99.5%', incidents: 7, last: '45m ago',
    lob: 'CIB', subLob: 'Markets', cto: 'Joe Pedone', cbt: 'Alex Feinberg', appOwner: 'Marcus Chen', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4' },
  { name: 'IPBOL-DOC-DOMAIN', seal: '90176', team: 'IPBOL', status: 'critical', sla: '99.0%', incidents: 4, last: '1h ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Gitanjali Nistala', cbt: 'Abhishek Dubey', appOwner: 'Tara Okonkwo', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '24' },
  { name: 'MERIDIAN SERVICE-ORDER V1', seal: '90215', team: 'Trading', status: 'warning', sla: '99.5%', incidents: 3, last: '3h ago',
    lob: 'CIB', subLob: 'Markets', cto: 'Joe Pedone', cbt: 'Alex Feinberg', appOwner: 'Marcus Chen', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4' },
  { name: 'IPBOL-ACCOUNT-SERVICES', seal: '90176', team: 'IPBOL', status: 'warning', sla: '99.0%', incidents: 2, last: '5h ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Vrinda Menon', cbt: 'Abhishek Dubey', appOwner: 'Tara Okonkwo', cpof: 'No', riskRanking: 'Medium', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '48' },
  { name: 'IPBOL-INVESTMENTS-SERVICES', seal: '90176', team: 'IPBOL', status: 'warning', sla: '99.0%', incidents: 3, last: '4h ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Vrinda Menon', cbt: 'Amol Waikul', appOwner: 'Serena Whitfield', cpof: 'No', riskRanking: 'Medium', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '48' },
  { name: 'POSTGRES-DB-REPLICA', seal: '88180', team: 'Database', status: 'warning', sla: '99.9%', incidents: 2, last: '6h ago',
    lob: 'CT', subLob: '', cto: 'Stephen Clark', cbt: 'Ajay Mehta', appOwner: 'Kevin Gallagher', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2' },
  { name: 'DATA-PIPELINE-SERVICE', seal: '88180', team: 'Data', status: 'warning', sla: '99.0%', incidents: 3, last: '7h ago',
    lob: 'CDAO', subLob: '', cto: 'Kamesh Karra', cbt: 'Angus Liu', appOwner: 'Rebecca Tan', cpof: 'No', riskRanking: 'Medium', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '24' },
  { name: 'API-GATEWAY', seal: '88180', team: 'Platform', status: 'healthy', sla: '99.99%', incidents: 0, last: '—',
    lob: 'CT', subLob: '', cto: 'Stephen Clark', cbt: 'Ajay Mehta', appOwner: 'Kevin Gallagher', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4' },
  { name: 'AUTH-SERVICE-V2', seal: '88180', team: 'Security', status: 'healthy', sla: '99.99%', incidents: 0, last: '—',
    lob: 'CT', subLob: '', cto: 'Stephen Musacchia', cbt: 'Aju Pillai', appOwner: 'Hannah Morales', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4' },
  { name: 'REDIS-CACHE-CLUSTER', seal: '88180', team: 'Platform', status: 'healthy', sla: '99.9%', incidents: 1, last: '2d ago',
    lob: 'CT', subLob: '', cto: 'Stephen Clark', cbt: 'Adam DAccordo', appOwner: 'Kevin Gallagher', cpof: 'No', riskRanking: 'Medium', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '24' },
  { name: 'KAFKA-MESSAGE-QUEUE', seal: '88180', team: 'Platform', status: 'healthy', sla: '99.9%', incidents: 1, last: '1d ago',
    lob: 'CT', subLob: '', cto: 'Stephen Musacchia', cbt: 'Adam DAccordo', appOwner: 'Leo Petrov', cpof: 'No', riskRanking: 'Medium', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '24' },
  { name: 'SPRINGBOOT PROD SERVICE-ORDER', seal: '90215', team: 'Orders', status: 'healthy', sla: '99.0%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Global Banking', cto: 'Rafael Forte', cbt: 'Albert Naclerio', appOwner: 'Jordan Kessler', cpof: 'No', riskRanking: 'Low', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '72' },
  { name: 'SPRINGBOOT PROD SERVICE-QUERY', seal: '90215', team: 'Orders', status: 'healthy', sla: '99.0%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Global Banking', cto: 'Rafael Forte', cbt: 'Albert Naclerio', appOwner: 'Jordan Kessler', cpof: 'No', riskRanking: 'Low', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '72' },
  { name: 'ACTIVE-ADVISORY', seal: '90176', team: 'Advisory', status: 'healthy', sla: '99.0%', incidents: 1, last: '3d ago',
    lob: 'AWM', subLob: 'AWM Shared', cto: 'Lakith Leelasena', cbt: 'Alison Hickey', appOwner: 'Nathan Brooks', cpof: 'No', riskRanking: 'Low', classification: 'Third Party External', state: 'Operate', investmentStrategy: 'Maintain', rto: '73' },
  { name: 'IPBOL-CONTACT-SYNC', seal: '90176', team: 'IPBOL', status: 'healthy', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Lakith Leelasena', cbt: 'Aadi Thayyar', appOwner: 'Tara Okonkwo', cpof: 'No', riskRanking: 'Low', classification: 'Third Party External', state: 'Operate', investmentStrategy: 'Divest', rto: 'NRR' },
  { name: 'IPBOL-MANAGER-AUTH', seal: '90176', team: 'IPBOL', status: 'healthy', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Gitanjali Nistala', cbt: 'Aadi Thayyar', appOwner: 'Tara Okonkwo', cpof: 'No', riskRanking: 'Low', classification: 'Third Party External', state: 'Operate', investmentStrategy: 'Divest', rto: 'NRR' },
  { name: 'POSTGRES-DB-PRIMARY', seal: '88180', team: 'Database', status: 'critical', sla: '99.99%', incidents: 9, last: '30m ago',
    lob: 'CT', subLob: '', cto: 'Stephen Clark', cbt: 'Ajay Mehta', appOwner: 'Kevin Gallagher', cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2' },
  { name: 'EMAIL-NOTIFICATION-SERVICE', seal: '90215', team: 'Messaging', status: 'critical', sla: '99.5%', incidents: 5, last: '1h ago',
    lob: 'EP', subLob: '', cto: 'Mark Napier', cbt: 'Alex Samsonov', appOwner: 'Diana Reeves', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '24' },
  { name: 'CIB-DIGITAL-ONBOARDING', seal: '90215', team: 'Digital', status: 'healthy', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Digital Platform and Services', cto: 'Rich Spencer', cbt: 'Alison Hickey', appOwner: 'Priya Nair', cpof: 'No', riskRanking: 'Not Rated', classification: 'Third Party Internal', state: 'Build', investmentStrategy: 'Invest', rto: '48' },
  { name: 'CIB-PAYMENTS-GATEWAY', seal: '90215', team: 'Payments', status: 'warning', sla: '99.9%', incidents: 2, last: '3h ago',
    lob: 'CIB', subLob: 'Payments', cto: 'Rod Thomas', cbt: 'Adrian Cave', appOwner: 'Hannah Morales', cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4' },
  { name: 'IP-RISK-ANALYTICS', seal: '90176', team: 'Risk', status: 'healthy', sla: '99.0%', incidents: 0, last: '—',
    lob: 'IP', subLob: '', cto: 'Michael Heizer', cbt: 'Angus Liu', appOwner: 'Sam Hendricks', cpof: 'No', riskRanking: 'Not Rated', classification: 'Third Party Internal', state: 'Plan', investmentStrategy: 'Maintain', rto: '73' },
]

export const SUB_LOB_MAP = {
  AWM: ['Asset Management', 'AWM Shared', 'Global Private Bank'],
  CIB: ['Digital Platform and Services', 'Global Banking', 'Markets', 'Payments'],
}

export const FILTER_FIELDS = [
  { key: 'seal',               label: 'App' },
  { key: 'lob',                label: 'LOB' },
  { key: 'subLob',             label: 'Sub LOB' },
  { key: 'cto',                label: 'CTO' },
  { key: 'cbt',                label: 'CBT' },
  { key: 'appOwner',           label: 'App Owner' },
  { key: 'cpof',               label: 'CPOF' },
  { key: 'riskRanking',        label: 'Risk Ranking' },
  { key: 'classification',     label: 'Classification' },
  { key: 'state',              label: 'State' },
  { key: 'investmentStrategy', label: 'Investment Strategy' },
  { key: 'rto',                label: 'RTO' },
]

export const SEAL_DISPLAY = {
  '90176': 'Advisor Connect - 90176',
  '90215': 'Spectrum Portfolio Mgmt - 90215',
  '88180': 'Connect OS - 88180',
}

export function getFilterOptions(fieldKey, activeFilters = {}) {
  if (fieldKey === 'subLob') {
    const selectedLobs = activeFilters.lob || []
    const lobsWithSubs = selectedLobs.length > 0
      ? selectedLobs.filter(l => SUB_LOB_MAP[l])
      : Object.keys(SUB_LOB_MAP)
    return lobsWithSubs.flatMap(l => SUB_LOB_MAP[l]).sort()
  }
  if (fieldKey === 'cpof') return ['Yes', 'No']
  if (fieldKey === 'seal') {
    return [...new Set(APPS.map(a => a[fieldKey]).filter(Boolean))]
      .sort()
      .map(s => SEAL_DISPLAY[s] || s)
  }
  return [...new Set(APPS.map(a => a[fieldKey]).filter(Boolean))].sort()
}

// Extract raw SEAL value from display format
export function parseSealDisplay(display) {
  const match = display.match(/- (\d+)$/)
  return match ? match[1] : display
}
