import { Card, CardContent, Typography, Box, Chip, Tooltip } from '@mui/material'
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
          return `linear-gradient(${bg}, ${bg}), linear-gradient(135deg, #1565C0, #0ea5e9)`
        },
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
          <AutoAwesomeIcon sx={{ color: '#60a5fa', fontSize: 20, mt: 0.2 }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip
                title="Agentic, Unified Personas, Reliability, Automation"
                arrow
                placement="top"
                slotProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(30,41,59,0.95)',
                      color: '#e2e8f0',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      letterSpacing: 0.3,
                      whiteSpace: 'nowrap',
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 1.5,
                    },
                  },
                  arrow: { sx: { color: 'rgba(30,41,59,0.95)' } },
                }}
              >
                <Typography
                  fontWeight={700}
                  sx={{ ...fTitle, cursor: 'default', borderBottom: '1px dashed rgba(148,163,184,0.4)' }}
                >
                  AURA
                </Typography>
              </Tooltip>
              <Typography fontWeight={700} sx={fTitle}>— Summary</Typography>
              <Chip
                label="Live"
                size="small"
                sx={{
                  bgcolor: 'rgba(21,101,192,0.25)', color: '#60a5fa', ...fSmall, height: 20,
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
            sx={{ color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, ...fCaption }}
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
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1565C0', flexShrink: 0, mt: '7px' }} />
                <Typography sx={{ lineHeight: 1.6, ...fBody, color: 'text.primary' }}>{rec}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}
