import { Box, Container, Paper, Typography } from '@mui/material';
import { BrandHeader } from '../../components/BrandHeader';
import { useAuth } from '../../hooks/useAuth';

export function PlayerHomeView() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #534bae 50%, #c2a878 100%)',
        py: 4,
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.97)',
          }}
        >
          <BrandHeader />

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Witaj zawodniku!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Panel zawodnika – wkrótce dostępne lekcje i lista trenerów.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
