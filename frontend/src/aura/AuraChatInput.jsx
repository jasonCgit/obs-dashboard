import { useState, useRef } from 'react'
import { Box, TextField, IconButton, Chip, Tooltip, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import { useAuraChat } from './AuraChatContext'

const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }
const ACCEPT = 'image/*,.csv,.json,.log,.txt,.pdf'

export default function AuraChatInput() {
  const [text, setText] = useState('')
  const fileRef = useRef(null)
  const { sendMessage, isLoading, attachments, addAttachment, removeAttachment } = useAuraChat()

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    sendMessage(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItems = items.filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return // let default text paste through
    e.preventDefault()
    imageItems.forEach(item => {
      const file = item.getAsFile()
      if (file && file.size <= 5 * 1024 * 1024) {
        // Give pasted images a readable name with timestamp
        const ext = file.type.split('/')[1] || 'png'
        const named = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type })
        addAttachment(named)
      }
    })
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(f => {
      if (f.size <= 5 * 1024 * 1024) addAttachment(f)
    })
    e.target.value = ''
  }

  return (
    <Box sx={{
      borderTop: '1px solid',
      borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'divider',
      p: 1.5,
      flexShrink: 0,
    }}>
      {attachments.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {attachments.map((f, i) => (
            <Chip
              key={i}
              icon={<InsertDriveFileIcon sx={{ fontSize: 14 }} />}
              label={f.name}
              size="small"
              onDelete={() => removeAttachment(i)}
              sx={{ ...fSmall, height: 24 }}
            />
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
        <Tooltip title="Attach file">
          <IconButton
            size="small"
            onClick={() => fileRef.current?.click()}
            sx={{ color: 'text.secondary', mb: 0.25, '&:hover': { color: 'text.primary' } }}
          >
            <AttachFileIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={handleFileChange}
        />

        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Ask AURA anything..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={isLoading}
          variant="outlined"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)',
              bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'transparent',
            },
          }}
        />

        <IconButton
          size="small"
          onClick={handleSend}
          disabled={!text.trim() || isLoading}
          sx={{
            mb: 0.25,
            color: t => text.trim()
              ? (t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0')
              : 'text.disabled',
            bgcolor: t => text.trim()
              ? (t.palette.mode === 'dark' ? 'rgba(96,165,250,0.15)' : 'rgba(21,101,192,0.1)')
              : 'transparent',
            '&:hover': {
              bgcolor: t => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.25)' : 'rgba(21,101,192,0.18)',
            },
          }}
        >
          <SendIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Fine print disclaimer */}
      <Typography sx={{
        fontSize: 'clamp(0.58rem, 0.72vw, 0.66rem)',
        color: 'text.disabled',
        textAlign: 'center',
        mt: 0.75,
        lineHeight: 1.35,
        px: 1,
      }}>
        This product leverages approved, firmwide AI models. The outputs from LLM can have potential risks for hallucinations, and so we require our users to review the outputs provided for accuracy (human in the loop required for any outputs that this product offers.)
      </Typography>
    </Box>
  )
}
