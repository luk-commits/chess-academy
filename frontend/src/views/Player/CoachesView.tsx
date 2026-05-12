import { Box, Container, Paper, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

export function CoachesView() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }}>
      <Container maxWidth="md">
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: 'center' }}>
          <GroupIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Trenerzy
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lista dostępnych trenerów szachowych.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
