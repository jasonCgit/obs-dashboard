import { useState, useRef, useCallback, useEffect } from 'react'
import { Paper, Box } from '@mui/material'
import { useAuraChat } from './AuraChatContext'
import AuraChatHeader from './AuraChatHeader'
import AuraChatMessages from './AuraChatMessages'
import AuraChatInput from './AuraChatInput'
import AuraChatMenu from './AuraChatMenu'

const MIN_W = 420
const MIN_H = 400
const DEFAULT_W = 580
const DEFAULT_H = 700
const MENU_W = 250

export default function AuraChatPanel() {
  const { isExpanded, menuOpen, toggleMenu } = useAuraChat()
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H })
  const dragRef = useRef(null)

  const startResize = useCallback((e, direction) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    dragRef.current = { startX, startY, startW, startH, direction }

    const onMove = (ev) => {
      const d = dragRef.current
      if (!d) return
      let newW = d.startW
      let newH = d.startH
      if (d.direction.includes('w')) newW = Math.max(MIN_W, d.startW - (ev.clientX - d.startX))
      if (d.direction.includes('n')) newH = Math.max(MIN_H, d.startH - (ev.clientY - d.startY))
      setSize({ w: Math.min(newW, window.innerWidth - 48), h: Math.min(newH, window.innerHeight - 80) })
    }

    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [size])

  // Reset to defaults when toggling expand
  useEffect(() => {
    if (isExpanded) setSize({ w: DEFAULT_W, h: DEFAULT_H })
  }, [isExpanded])

  // Calculate total width: chat + menu when open
  const chatW = isExpanded ? 750 : size.w
  const totalW = menuOpen ? chatW + MENU_W : chatW

  const panelSx = {
    position: 'fixed',
    bottom: { xs: 0, sm: 88 },
    right: { xs: 0, sm: 24 },
    borderRadius: { xs: 0, sm: '16px' },
    zIndex: 1300,
    display: 'flex',
    flexDirection: 'row',
    overflow: 'hidden',
    border: '1px solid',
    borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'divider',
    bgcolor: t => t.palette.mode === 'dark' ? '#151c2c' : 'background.paper',
    transition: 'width 0.25s ease',
  }

  if (isExpanded) {
    return (
      <Paper
        elevation={12}
        sx={{
          ...panelSx,
          width: { xs: '100vw', sm: totalW },
          height: { xs: '100vh', sm: 'calc(100vh - 196px)' },
        }}
      >
        {/* Menu sidebar */}
        {menuOpen && (
          <Box sx={{
            width: MENU_W,
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
            display: { xs: 'none', sm: 'flex' },
          }}>
            <AuraChatMenu onClose={toggleMenu} />
          </Box>
        )}
        {/* Chat area — always full width */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <AuraChatHeader />
          <AuraChatMessages />
          <AuraChatInput />
        </Box>
      </Paper>
    )
  }

  return (
    <Paper
      elevation={12}
      sx={{
        ...panelSx,
        width: { xs: '100vw', sm: totalW },
        height: { xs: '100vh', sm: Math.min(size.h, window.innerHeight - 100) },
      }}
    >
      {/* Menu sidebar */}
      {menuOpen && (
        <Box sx={{
          width: MENU_W,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'divider',
          display: { xs: 'none', sm: 'flex' },
        }}>
          <AuraChatMenu onClose={toggleMenu} />
        </Box>
      )}
      {/* Chat area — always full width */}
      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative' }}>
        {/* Resize handle — left edge */}
        <Box
          onMouseDown={e => startResize(e, 'w')}
          sx={{
            position: 'absolute', left: 0, top: 40, bottom: 0, width: 5, zIndex: 10,
            cursor: 'ew-resize',
            display: { xs: 'none', sm: 'block' },
            '&:hover': { bgcolor: 'rgba(21,101,192,0.25)' },
            transition: 'background 0.15s',
          }}
        />
        {/* Resize handle — top edge */}
        <Box
          onMouseDown={e => startResize(e, 'n')}
          sx={{
            position: 'absolute', top: 0, left: 16, right: 16, height: 5, zIndex: 10,
            cursor: 'ns-resize',
            display: { xs: 'none', sm: 'block' },
            '&:hover': { bgcolor: 'rgba(21,101,192,0.25)' },
            transition: 'background 0.15s',
          }}
        />
        {/* Resize handle — top-left corner */}
        <Box
          onMouseDown={e => startResize(e, 'nw')}
          sx={{
            position: 'absolute', top: 0, left: 0, width: 14, height: 14, zIndex: 11,
            cursor: 'nwse-resize',
            display: { xs: 'none', sm: 'block' },
            '&:hover': { bgcolor: 'rgba(21,101,192,0.35)', borderRadius: '16px 0 4px 0' },
            transition: 'background 0.15s',
          }}
        />

        <AuraChatHeader />
        <AuraChatMessages />
        <AuraChatInput />
      </Box>
    </Paper>
  )
}
