import { useState, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import PublicIcon from '@mui/icons-material/Public'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const ZONES = [
  { label: 'UTC',    tz: 'UTC' },
  { label: 'NYC',    tz: 'America/New_York' },
  { label: 'CHI',    tz: 'America/Chicago' },
  { label: 'LON',    tz: 'Europe/London' },
  { label: 'ZRH',    tz: 'Europe/Zurich' },
  { label: 'KOL',    tz: 'Asia/Kolkata' },
  { label: 'HKG',    tz: 'Asia/Hong_Kong' },
  { label: 'TYO',    tz: 'Asia/Tokyo' },
  { label: 'SYD',    tz: 'Australia/Sydney' },
]

function formatTime(tz) {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function isBusinessHours(tz) {
  const h = parseInt(new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour: '2-digit', hour12: false,
  }))
  return h >= 8 && h < 18
}

export default function WorldClockWidget() {
  const [times, setTimes] = useState(() => ZONES.map(z => formatTime(z.tz)))

  useEffect(() => {
    const id = setInterval(() => {
      setTimes(ZONES.map(z => formatTime(z.tz)))
    }, 1_000)
    return () => clearInterval(id)
  }, [])

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: { xs: 1, sm: 2 },
      py: 0.5, px: 1,
      height: '100%',
      overflowX: 'auto',
      '&::-webkit-scrollbar': { display: 'none' },
    }}>
      <PublicIcon sx={{ fontSize: 13, color: 'text.disabled', flexShrink: 0 }} />
      {ZONES.map((z, i) => {
        const active = isBusinessHours(z.tz)
        return (
          <Box key={z.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
            <Box sx={{
              width: 5, height: 5, borderRadius: '50%',
              bgcolor: active ? '#4ade80' : 'text.disabled',
              opacity: active ? 1 : 0.4,
            }} />
            <Typography sx={{ ...fSmall, color: 'text.secondary', fontWeight: 600 }}>
              {z.label}
            </Typography>
            <Typography sx={{
              ...fSmall,
              color: active ? 'text.primary' : 'text.disabled',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: active ? 700 : 400,
            }}>
              {times[i]}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
