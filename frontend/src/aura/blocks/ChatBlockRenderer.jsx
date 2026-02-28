import { Box, Typography } from '@mui/material'
import ChatBlockText from './ChatBlockText'
import ChatBlockMetrics from './ChatBlockMetrics'
import ChatBlockTable from './ChatBlockTable'
import ChatBlockBarChart from './ChatBlockBarChart'
import ChatBlockLineChart from './ChatBlockLineChart'
import ChatBlockPieChart from './ChatBlockPieChart'
import ChatBlockStatusList from './ChatBlockStatusList'
import ChatBlockRecommendations from './ChatBlockRecommendations'

const fSmall = { fontSize: 'clamp(0.6rem, 0.8vw, 0.7rem)' }

const RENDERERS = {
  text: ChatBlockText,
  metric_cards: ChatBlockMetrics,
  table: ChatBlockTable,
  bar_chart: ChatBlockBarChart,
  line_chart: ChatBlockLineChart,
  pie_chart: ChatBlockPieChart,
  status_list: ChatBlockStatusList,
  recommendations: ChatBlockRecommendations,
}

export default function ChatBlockRenderer({ block }) {
  const Renderer = RENDERERS[block.type]
  if (!Renderer) return null
  return (
    <Box sx={{ mt: 1.5 }}>
      {block.title && (
        <Typography
          fontWeight={700}
          sx={{ ...fSmall, textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary', mb: 0.75 }}
        >
          {block.title}
        </Typography>
      )}
      <Renderer data={block.data} />
    </Box>
  )
}
