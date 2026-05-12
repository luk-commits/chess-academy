import { Box, Container, Paper, Typography } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';

export function PlayersView() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }}>
      <Container maxWidth="md">
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: 'center' }}>
          <PeopleIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Zawodnicy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Zarządzaj swoimi zawodnikami.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
