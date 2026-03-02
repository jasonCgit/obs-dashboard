import { useState, useEffect } from 'react'
import {
  Box, Typography, Card, CardContent, CardActionArea,
  Grid, Chip,
} from '@mui/material'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import BugReportIcon from '@mui/icons-material/BugReport'
import DescriptionIcon from '@mui/icons-material/Description'
import BuildIcon from '@mui/icons-material/Build'
import StorageIcon from '@mui/icons-material/Storage'
import SecurityIcon from '@mui/icons-material/Security'
import SpeedIcon from '@mui/icons-material/Speed'
import GroupsIcon from '@mui/icons-material/Groups'
import CloudIcon from '@mui/icons-material/Cloud'
import CodeIcon from '@mui/icons-material/Code'
import ScienceIcon from '@mui/icons-material/Science'
import DataObjectIcon from '@mui/icons-material/DataObject'
import DnsIcon from '@mui/icons-material/Dns'
import HubIcon from '@mui/icons-material/Hub'
import TerminalIcon from '@mui/icons-material/Terminal'
import WebhookIcon from '@mui/icons-material/Webhook'
import LinkIcon from '@mui/icons-material/Link'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { loadCategories } from '../../utils/linksStorage'

const ICON_MAP = {
  MonitorHeart: MonitorHeartIcon, BugReport: BugReportIcon, Description: DescriptionIcon,
  Build: BuildIcon, Storage: StorageIcon, Security: SecurityIcon, Speed: SpeedIcon,
  Groups: GroupsIcon, Cloud: CloudIcon, Code: CodeIcon, Science: ScienceIcon,
  DataObject: DataObjectIcon, Dns: DnsIcon, Hub: HubIcon, Terminal: TerminalIcon,
  Webhook: WebhookIcon,
}

export default function LinksWidget() {
  const [categories, setCategories] = useState([])

  useEffect(() => { setCategories(loadCategories()) }, [])

  return (
    <Box sx={{ height: '100%', overflow: 'auto', p: 1.5 }}>
      <Grid container spacing={1}>
        {categories.map(cat => {
          const CatIcon = ICON_MAP[cat.icon] || LinkIcon
          return (
            <Grid item xs={12} sm={6} md={3} key={cat.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ pb: '6px !important', pt: '10px !important', px: '10px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                    <CatIcon sx={{ fontSize: 14, color: cat.color }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: cat.color, textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.62rem' }}>
                      {cat.category}
                    </Typography>
                  </Box>
                  {cat.links.map((link, i) => (
                    <Box key={link.id || link.label}>
                      {i > 0 && <Box sx={{ height: 1, bgcolor: 'divider', my: 0.5 }} />}
                      <CardActionArea
                        onClick={() => link.url && window.open(link.url, '_blank', 'noopener,noreferrer')}
                        sx={{ borderRadius: 0.75, px: 0.5, py: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0.5 }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.72rem' }}>{link.label}</Typography>
                            {link.tag && <Chip label={link.tag} size="small" sx={{ height: 14, fontSize: '0.52rem', bgcolor: `${cat.color}22`, color: cat.color }} />}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', display: 'block' }}>{link.desc}</Typography>
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 11, color: 'text.disabled', flexShrink: 0 }} />
                      </CardActionArea>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
