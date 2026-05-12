import { Box, Container, Paper, Typography } from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';

export function PositionsView() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }}>
      <Container maxWidth="md">
        <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: 'center' }}>
          <BiotechIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Pozycje
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Analizuj pozycje szachowe.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
