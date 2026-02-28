import { useRef, useEffect, useState } from 'react'
import { Box, Fab } from '@mui/material'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useAuraChat } from './AuraChatContext'
import AuraChatMessage from './AuraChatMessage'
import AuraChatWelcome from './AuraChatWelcome'
import AuraChatTypingIndicator from './AuraChatTypingIndicator'

export default function AuraChatMessages() {
  const { messages, isLoading, sendMessage } = useAuraChat()
  const bottomRef = useRef(null)
  const containerRef = useRef(null)
  const [showScroll, setShowScroll] = useState(false)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    setShowScroll(!atBottom)
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <AuraChatWelcome />
      </Box>
    )
  }

  return (
    <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <Box
        ref={containerRef}
        onScroll={handleScroll}
        sx={{
          height: '100%',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          py: 1.5,
          px: 1,
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(128,128,128,0.3)', borderRadius: 3 },
        }}
      >
        {messages.map(msg => (
          <AuraChatMessage
            key={msg.id}
            message={msg}
            onFollowup={sendMessage}
          />
        ))}
        {isLoading && !messages.some(m => m._streaming) && <AuraChatTypingIndicator />}
        <div ref={bottomRef} />
      </Box>

      {showScroll && (
        <Fab
          size="small"
          onClick={scrollToBottom}
          sx={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 32, height: 32, minHeight: 32,
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
        </Fab>
      )}
    </Box>
  )
}
