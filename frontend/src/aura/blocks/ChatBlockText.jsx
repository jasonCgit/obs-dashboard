import { Typography } from '@mui/material'

const fBody = { fontSize: 'clamp(0.82rem, 1.1vw, 0.92rem)' }

export default function ChatBlockText({ data }) {
  if (!data) return null

  const parts = data.split('\n').filter(Boolean)
  return (
    <>
      {parts.map((line, i) => {
        const isBullet = line.startsWith('• ') || line.startsWith('- ')
        return (
          <Typography
            key={i}
            sx={{
              ...fBody,
              color: 'text.primary',
              lineHeight: 1.6,
              mt: i > 0 ? 0.5 : 0,
              pl: isBullet ? 1 : 0,
            }}
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/`(.*?)`/g, '<code style="background:rgba(128,128,128,0.15);padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>'),
            }}
          />
        )
      })}
    </>
  )
}
