import { useState } from 'react'
import { Box, Typography, Chip, Fade, IconButton, Tooltip } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckIcon from '@mui/icons-material/Check'
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt'
import ThumbDownOffAltIcon from '@mui/icons-material/ThumbDownOffAlt'
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt'
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt'
import ChatBlockRenderer from './blocks/ChatBlockRenderer'
import { useAuraChat } from './AuraChatContext'

const fBody = { fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)' }
const fSmall = { fontSize: 'clamp(0.7rem, 0.9vw, 0.8rem)' }

function formatTime(ts) {
  try {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

/* Extract plain text from assistant content blocks for clipboard */
function extractText(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map(block => {
    if (block.type === 'text') return block.data || ''
    if (block.type === 'metric_cards' && Array.isArray(block.data)) {
      return block.data.map(m => `${m.label}: ${m.value}`).join('\n')
    }
    if (block.type === 'status_list' && Array.isArray(block.data)) {
      return block.data.map(s => `[${s.status}] ${s.name} — ${s.detail}`).join('\n')
    }
    if (block.type === 'recommendations' && Array.isArray(block.data)) {
      return block.data.map(r => `[${r.priority}] ${r.text}${r.impact ? ' — ' + r.impact : ''}`).join('\n')
    }
    if (block.type === 'table' && block.data?.columns && block.data?.rows) {
      const header = block.data.columns.join(' | ')
      const rows = block.data.rows.map(r => r.join(' | ')).join('\n')
      return header + '\n' + rows
    }
    return ''
  }).filter(Boolean).join('\n\n')
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* fallback silently */ }
  }

  return (
    <Tooltip title={copied ? 'Copied!' : 'Copy'}>
      <IconButton size="small" onClick={handleCopy} sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}>
        {copied
          ? <CheckIcon sx={{ fontSize: 14, color: '#4caf50' }} />
          : <ContentCopyIcon sx={{ fontSize: 14 }} />}
      </IconButton>
    </Tooltip>
  )
}

function FeedbackButtons({ message }) {
  const { setMessageFeedback } = useAuraChat()
  const fb = message.feedback

  return (
    <>
      <Tooltip title={fb === 'up' ? 'Remove rating' : 'Helpful'}>
        <IconButton
          size="small"
          onClick={() => setMessageFeedback(message.id, 'up')}
          sx={{ color: fb === 'up' ? '#4caf50' : 'text.disabled', '&:hover': { color: '#4caf50' } }}
        >
          {fb === 'up'
            ? <ThumbUpAltIcon sx={{ fontSize: 14 }} />
            : <ThumbUpOffAltIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Tooltip>
      <Tooltip title={fb === 'down' ? 'Remove rating' : 'Not helpful'}>
        <IconButton
          size="small"
          onClick={() => setMessageFeedback(message.id, 'down')}
          sx={{ color: fb === 'down' ? '#f44336' : 'text.disabled', '&:hover': { color: '#f44336' } }}
        >
          {fb === 'down'
            ? <ThumbDownAltIcon sx={{ fontSize: 14 }} />
            : <ThumbDownOffAltIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Tooltip>
    </>
  )
}

export default function AuraChatMessage({ message, onFollowup }) {
  const isUser = message.role === 'user'

  if (isUser) {
    const userText = typeof message.content === 'string' ? message.content : ''
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', px: 0.5 }}>
        <Box sx={{
          maxWidth: '85%',
          bgcolor: '#1565C0',
          color: '#fff',
          borderRadius: '12px 12px 4px 12px',
          px: 1.5, py: 1,
        }}>
          <Typography sx={{ ...fBody, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>
          {message.attachments?.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
              {message.attachments.map((a, i) => (
                <Chip
                  key={i}
                  icon={<InsertDriveFileIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.7) !important' }} />}
                  label={a.name}
                  size="small"
                  sx={{
                    ...fSmall, height: 22,
                    bgcolor: 'rgba(255,255,255,0.15)', color: '#fff',
                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.5)' },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25, mr: 0.25 }}>
          <Typography sx={{ ...fSmall, color: 'text.disabled' }}>
            {formatTime(message.timestamp)}
          </Typography>
          <CopyButton text={userText} />
        </Box>
      </Box>
    )
  }

  // Assistant message
  const content = Array.isArray(message.content) ? message.content : [{ type: 'text', data: message.content }]
  const plainText = extractText(message.content)

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, px: 0.5 }}>
      <Box sx={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg, #1565C0, #0ea5e9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, mt: 0.25,
      }}>
        <AutoAwesomeIcon sx={{ fontSize: 13, color: '#fff' }} />
      </Box>

      <Box sx={{ maxWidth: '92%', minWidth: 0, flex: 1 }}>
        <Box sx={{
          bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'divider',
          borderRadius: '4px 12px 12px 12px',
          px: 1.5, py: 1.25,
        }}>
          {content.map((block, i) => (
            <Fade in key={i} timeout={400}>
              <Box><ChatBlockRenderer block={block} /></Box>
            </Fade>
          ))}
          {message._streaming && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5 }}>
              {[0, 0.15, 0.3].map((delay, i) => (
                <Box key={i} sx={{
                  width: 5, height: 5, borderRadius: '50%',
                  bgcolor: t => t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0',
                  animation: 'auraBounce 1.2s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  '@keyframes auraBounce': {
                    '0%, 60%, 100%': { transform: 'translateY(0)' },
                    '30%': { transform: 'translateY(-5px)' },
                  },
                }} />
              ))}
            </Box>
          )}
        </Box>

        {/* Suggested followups — only show when done streaming */}
        {!message._streaming && message.suggestedFollowups?.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
            {message.suggestedFollowups.map((f, i) => (
              <Chip
                key={i}
                label={f}
                size="small"
                onClick={() => onFollowup?.(f)}
                sx={{
                  ...fSmall, height: 24,
                  borderColor: t => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.4)' : '#1565C044',
                  color: t => t.palette.mode === 'dark' ? '#93c5fd' : '#1565C0',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: t => t.palette.mode === 'dark' ? 'rgba(96,165,250,0.12)' : 'rgba(21,101,192,0.08)',
                    borderColor: t => t.palette.mode === 'dark' ? '#60a5fa' : '#1565C0',
                  },
                }}
                variant="outlined"
              />
            ))}
          </Box>
        )}

        {/* Actions row: timestamp + copy + feedback */}
        {!message._streaming && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mt: 0.25, ml: 0.25 }}>
            <Typography sx={{ ...fSmall, color: 'text.disabled', mr: 0.5 }}>
              AURA · {formatTime(message.timestamp)}
            </Typography>
            <CopyButton text={plainText} />
            <FeedbackButtons message={message} />
          </Box>
        )}
      </Box>
    </Box>
  )
}
