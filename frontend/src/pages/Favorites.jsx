import { Container, Typography, Box, Grid } from '@mui/material'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import { useNavigate } from 'react-router-dom'
import ViewCard, { ALL_VIEWS } from '../components/ViewCard'

export default function Favorites() {
  const navigate = useNavigate()
  const favs = ALL_VIEWS.filter(v => v.favorite)

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>Favorites</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          Your pinned views — click the star on any card to pin or unpin.
        </Typography>
      </Box>
      {favs.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <StarBorderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No favorites yet — star a view from View Central.</Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {favs.map(v => (
            <Grid item xs={12} sm={6} md={4} key={v.id}>
              <ViewCard view={v} navigate={navigate} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  )
}
