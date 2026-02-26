import { Container, Typography, Box, Grid } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import ViewCard, { ALL_VIEWS } from '../components/ViewCard'

export default function ViewCentral() {
  const navigate = useNavigate()

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>View Central</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
          All available dashboards, dependency graphs, and interactive visualisations.
        </Typography>
      </Box>
      <Grid container spacing={2.5}>
        {ALL_VIEWS.map(v => (
          <Grid item xs={12} sm={6} md={4} key={v.id}>
            <ViewCard view={v} navigate={navigate} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
