import { useState, useEffect } from 'react'
import { Fab, Box } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CloseIcon from '@mui/icons-material/Close'
import { useAuraChat } from './AuraChatContext'
import AuraChatPanel from './AuraChatPanel'

export default function AuraChatFab() {
  const { isOpen, toggleOpen } = useAuraChat()
  const [pulse, setPulse] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {isOpen && <AuraChatPanel />}

      <Fab
        onClick={toggleOpen}
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          zIndex: 1301,
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          background: isOpen
            ? 'linear-gradient(135deg, #37474f, #546e7a)'
            : 'linear-gradient(135deg, #1565C0, #0ea5e9)',
          color: '#fff',
          boxShadow: isOpen
            ? '0 4px 12px rgba(0,0,0,0.25)'
            : '0 4px 16px rgba(21,101,192,0.4)',
          '&:hover': {
            background: isOpen
              ? 'linear-gradient(135deg, #455a64, #607d8b)'
              : 'linear-gradient(135deg, #0d47a1, #0284c7)',
          },
          transition: 'all 0.3s ease',
          ...(pulse && !isOpen ? {
            animation: 'auraPulse 2s ease-in-out infinite',
            '@keyframes auraPulse': {
              '0%, 100%': { boxShadow: '0 4px 16px rgba(21,101,192,0.4)' },
              '50%': { boxShadow: '0 4px 28px rgba(21,101,192,0.65)' },
            },
          } : {}),
        }}
      >
        {isOpen ? <CloseIcon /> : <AutoAwesomeIcon />}
      </Fab>
    </>
  )
}
