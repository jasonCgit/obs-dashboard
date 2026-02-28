import { Box, Typography, Chip } from '@mui/material'
import { useTheme } from '@mui/material/styles'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

const STATUS_COLORS = {
  critical: '#f44336',
  warning: '#ff9800',
  healthy: '#4caf50',
  rollback: '#f44336',
}

export default function ChatBlockTable({ data }) {
  const { palette } = useTheme()
  const isDark = palette.mode === 'dark'
  if (!data?.columns || !data?.rows) return null

  return (
    <Box sx={{
      overflowX: 'auto', borderRadius: 1.5,
      border: '1px solid',
      borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'divider',
    }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <Box component="thead">
          <Box component="tr" sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }}>
            {data.columns.map((col, i) => (
              <Box
                component="th"
                key={i}
                sx={{
                  ...fSmall,
                  fontWeight: 700,
                  color: 'text.secondary',
                  textAlign: 'left',
                  px: 1.25,
                  py: 0.75,
                  borderBottom: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'divider',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {col}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {data.rows.map((row, ri) => (
            <Box
              component="tr"
              key={ri}
              sx={{
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.015)' },
                '&:not(:last-of-type) td': {
                  borderBottom: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
                },
              }}
            >
              {row.map((cell, ci) => {
                const statusColor = STATUS_COLORS[cell]
                return (
                  <Box
                    component="td"
                    key={ci}
                    sx={{ ...fSmall, color: 'text.primary', px: 1.25, py: 0.75, whiteSpace: 'nowrap' }}
                  >
                    {statusColor ? (
                      <Chip
                        label={String(cell).toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: isDark ? `${statusColor}28` : `${statusColor}18`,
                          color: statusColor,
                          fontWeight: 700,
                          ...fSmall,
                          height: 20,
                        }}
                      />
                    ) : (
                      <Typography component="span" sx={{ ...fSmall, fontWeight: ci === 0 ? 600 : 400 }}>
                        {cell}
                      </Typography>
                    )}
                  </Box>
                )
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
