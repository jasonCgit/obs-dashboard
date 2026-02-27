import {
  Container, Typography, Box, Card, CardContent,
  CardActionArea, Grid, Chip,
} from '@mui/material'
import MonitorHeartIcon   from '@mui/icons-material/MonitorHeart'
import BugReportIcon      from '@mui/icons-material/BugReport'
import DescriptionIcon    from '@mui/icons-material/Description'
import BuildIcon          from '@mui/icons-material/Build'
import StorageIcon        from '@mui/icons-material/Storage'
import SecurityIcon       from '@mui/icons-material/Security'
import SpeedIcon          from '@mui/icons-material/Speed'
import CloudIcon          from '@mui/icons-material/Cloud'
import GroupsIcon         from '@mui/icons-material/Groups'
import OpenInNewIcon      from '@mui/icons-material/OpenInNew'

const CATEGORIES = [
  {
    category: 'Monitoring & Alerting',
    color: '#60a5fa',
    Icon: MonitorHeartIcon,
    links: [
      { label: 'Datadog',          desc: 'Metrics, traces & logs',             tag: 'Primary' },
      { label: 'Prometheus',       desc: 'Time-series metrics & alerting',      tag: null       },
      { label: 'Grafana',          desc: 'Dashboards and visualisations',       tag: null       },
      { label: 'PagerDuty',        desc: 'On-call scheduling & incident alerts',tag: null       },
    ],
  },
  {
    category: 'Incident Management',
    color: '#f87171',
    Icon: BugReportIcon,
    links: [
      { label: 'ServiceNow',       desc: 'ITSM and incident ticketing',         tag: 'Primary' },
      { label: 'StatusPage',       desc: 'External status page for clients',    tag: null       },
      { label: 'Jira',             desc: 'Issue and project tracking',          tag: null       },
      { label: 'Confluence PIR',   desc: 'Post-incident review templates',      tag: null       },
    ],
  },
  {
    category: 'Documentation',
    color: '#34d399',
    Icon: DescriptionIcon,
    links: [
      { label: 'Confluence',       desc: 'Team wikis and runbooks',             tag: 'Primary' },
      { label: 'Architecture Docs',desc: 'System design and ADRs',              tag: null       },
      { label: 'API Registry',     desc: 'Internal API catalogue',              tag: null       },
      { label: 'Onboarding Wiki',  desc: 'New joiner guides and HOWTOs',        tag: null       },
    ],
  },
  {
    category: 'CI/CD & Deployments',
    color: '#fbbf24',
    Icon: BuildIcon,
    links: [
      { label: 'Jenkins',          desc: 'Build pipelines and job history',     tag: 'Primary' },
      { label: 'ArgoCD',           desc: 'GitOps Kubernetes deployments',       tag: null       },
      { label: 'GitHub Enterprise',desc: 'Source code and pull requests',       tag: null       },
      { label: 'Nexus Registry',   desc: 'Artefact and Docker image registry',  tag: null       },
    ],
  },
  {
    category: 'Infrastructure',
    color: '#a78bfa',
    Icon: StorageIcon,
    links: [
      { label: 'AWS Console',      desc: 'Cloud infrastructure management',     tag: 'Primary' },
      { label: 'Kubernetes Dashboard', desc: 'Cluster and pod management',      tag: null       },
      { label: 'Terraform Cloud',  desc: 'Infrastructure-as-code state',        tag: null       },
      { label: 'Vault',            desc: 'Secrets management',                  tag: null       },
    ],
  },
  {
    category: 'Security',
    color: '#fb923c',
    Icon: SecurityIcon,
    links: [
      { label: 'Snyk',             desc: 'Dependency vulnerability scanning',   tag: 'Primary' },
      { label: 'SonarQube',        desc: 'Code quality and SAST analysis',      tag: null       },
      { label: 'Okta Admin',       desc: 'Identity and access management',      tag: null       },
      { label: 'Prisma Cloud',     desc: 'Cloud security posture management',   tag: null       },
    ],
  },
  {
    category: 'Performance',
    color: '#38bdf8',
    Icon: SpeedIcon,
    links: [
      { label: 'Dynatrace',        desc: 'APM and real user monitoring',        tag: 'Primary' },
      { label: 'Gatling Reports',  desc: 'Load test results and trends',        tag: null       },
      { label: 'k6 Cloud',         desc: 'Performance test orchestration',      tag: null       },
      { label: 'Chrome UX Report', desc: 'Real-world web performance data',     tag: null       },
    ],
  },
  {
    category: 'Team & Comms',
    color: '#94a3b8',
    Icon: GroupsIcon,
    links: [
      { label: 'Slack — #platform-ops', desc: 'Primary incident war room channel', tag: 'Primary' },
      { label: 'MS Teams',          desc: 'Business communications hub',        tag: null       },
      { label: 'Engineering Calendar','desc': 'On-call, maintenance & releases', tag: null      },
      { label: 'OpsGenie',          desc: 'Escalation and alert routing',       tag: null       },
    ],
  },
]

export default function Links() {
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>Links</Typography>
        <Typography variant="body2" color="text.secondary">Quick access to platform tools, documentation, and team resources</Typography>
      </Box>

      <Grid container spacing={2}>
        {CATEGORIES.map(cat => {
          const CatIcon = cat.Icon
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={cat.category}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ pb: '8px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CatIcon sx={{ fontSize: 18, color: cat.color }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: cat.color, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.72rem' }}>
                      {cat.category}
                    </Typography>
                  </Box>
                  {cat.links.map((link, i) => (
                    <Box key={link.label}>
                      {i > 0 && <Box sx={{ height: 1, bgcolor: 'divider', my: 0.75 }} />}
                      <CardActionArea
                        sx={{ borderRadius: 1, px: 0.75, py: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>{link.label}</Typography>
                            {link.tag && <Chip label={link.tag} size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: `${cat.color}22`, color: cat.color }} />}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>{link.desc}</Typography>
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
                      </CardActionArea>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Container>
  )
}
