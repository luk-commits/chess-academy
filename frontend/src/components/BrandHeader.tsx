import { Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export function BrandHeader() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'common.white',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 8px 24px rgba(26, 35, 126, 0.25)',
        }}
      >
        <EmojiEventsIcon fontSize="large" />
      </Box>
      <Typography variant="h4" component="h1" color="primary.dark">
        ChessAcademy
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Profesjonalna platforma trenerska
      </Typography>
    </Box>
  );
}
