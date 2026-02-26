import { Card, CardContent, CardHeader, Typography, Box, Chip, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

export default function AIHealthPanel({ data }) {
  if (!data) return null
  return (
    <Card
      sx={{
        mb: 2,
        // Gradient border trick
        border: '2px solid transparent',
        backgroundImage: (t) => {
          const bg = t.palette.background.paper
          return `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, #7c3aed, #1565C0)`
        },
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <CardHeader
        avatar={<AutoAwesomeIcon sx={{ color: '#a78bfa', fontSize: 20 }} />}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">AI System Health Analysis</Typography>
            <Chip
              label="Live analysis"
              size="small"
              sx={{ bgcolor: 'rgba(124,58,237,0.25)', color: '#a78bfa', fontSize: '0.7rem', height: 20 }}
            />
          </Box>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {/* Critical Alert */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{ color: '#f44336', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}
          >
            Critical Alert:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
            {data.critical_alert}
          </Typography>
        </Box>

        {/* Trend Analysis */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{ color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}
          >
            Trend Analysis:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
            {data.trend_analysis}
          </Typography>
        </Box>

        {/* AI Recommendations */}
        <Box>
          <Typography
            variant="caption"
            sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}
          >
            AI Recommendations:
          </Typography>
          <List dense sx={{ mt: 0.5 }}>
            {data.recommendations.map((rec, i) => (
              <ListItem key={i} sx={{ px: 0, py: 0.25, alignItems: 'flex-start' }}>
                <ListItemIcon sx={{ minWidth: 20, mt: 0.5 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 8, color: '#7c3aed' }} />
                </ListItemIcon>
                <ListItemText
                  primary={rec}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary', lineHeight: 1.6 }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </CardContent>
    </Card>
  )
}
