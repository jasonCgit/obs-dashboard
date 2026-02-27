import { Card, CardContent, Typography, Box, Chip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

/* Responsive font helpers — consistent across all dashboard panels */
const fTitle   = { fontSize: 'clamp(0.85rem, 1.2vw, 1rem)' }
const fBody    = { fontSize: 'clamp(0.75rem, 1vw, 0.85rem)' }
const fCaption = { fontSize: 'clamp(0.68rem, 0.9vw, 0.78rem)' }
const fSmall   = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

export default function AIHealthPanel({ data }) {
  if (!data) return null
  return (
    <Card
      sx={{
        border: '2px solid transparent',
        backgroundImage: (t) => {
          const bg = t.palette.background.paper
          return `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, #7c3aed, #1565C0)`
        },
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <AutoAwesomeIcon sx={{ color: '#a78bfa', fontSize: 20, mt: 0.2 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontWeight={700} sx={fTitle}>AURA — Summary</Typography>
              <Chip
                label="Live"
                size="small"
                sx={{
                  bgcolor: 'rgba(124,58,237,0.25)', color: '#a78bfa', ...fSmall, height: 20,
                  '& .MuiChip-label': {
                    animation: 'livePulse 2s ease-in-out infinite',
                  },
                  '@keyframes livePulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.3 },
                  },
                }}
              />
            </Box>
            <Typography color="text.secondary" sx={{ ...fCaption, mt: 0.2 }}>
              Agentic, Unified Personas, Reliability, Automation
            </Typography>
          </Box>
        </Box>

        {/* Critical Alert */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{ color: '#f44336', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, ...fCaption }}
          >
            Critical Alert:
          </Typography>
          <Typography sx={{ mt: 0.5, lineHeight: 1.6, ...fBody, color: 'text.primary' }}>
            {data.critical_alert}
          </Typography>
        </Box>

        {/* Trend Analysis */}
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{ color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, ...fCaption }}
          >
            Trend Analysis:
          </Typography>
          <Typography sx={{ mt: 0.5, lineHeight: 1.6, ...fBody, color: 'text.primary' }}>
            {data.trend_analysis}
          </Typography>
        </Box>

        {/* AI Recommendations */}
        <Box>
          <Typography
            sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, ...fCaption }}
          >
            AI Recommendations:
          </Typography>
          <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2, listStyle: 'none' }}>
            {data.recommendations.map((rec, i) => (
              <Box component="li" key={i} sx={{ display: 'flex', gap: 1, py: 0.3 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7c3aed', flexShrink: 0, mt: '7px' }} />
                <Typography sx={{ lineHeight: 1.6, ...fBody, color: 'text.primary' }}>{rec}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
