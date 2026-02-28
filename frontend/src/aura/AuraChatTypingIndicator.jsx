import { Box } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

const dotSx = (delay) => ({
  width: 6, height: 6, borderRadius: '50%', bgcolor: '#60a5fa',
  animation: 'auraBounce 1.2s ease-in-out infinite',
  animationDelay: `${delay}s`,
  '@keyframes auraBounce': {
    '0%, 60%, 100%': { transform: 'translateY(0)' },
    '30%': { transform: 'translateY(-6px)' },
  },
})

export default function AuraChatTypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 0.5 }}>
      <Box sx={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg, #1565C0, #0ea5e9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 13, color: '#fff' }} />
      </Box>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 0.5,
        bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.03)',
        border: '1px solid',
        borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'divider',
        borderRadius: '4px 12px 12px 12px',
        px: 1.5, py: 1.25,
      }}>
        <Box sx={dotSx(0)} />
        <Box sx={dotSx(0.15)} />
        <Box sx={dotSx(0.3)} />
      </Box>
    </Box>
  )
}
