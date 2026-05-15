import { Box, Typography } from '@mui/material';
import { BrandedPage } from '../layout/BrandedPage';
import { GlassPaper } from '../layout/GlassPaper';
import { BrandHeader } from '../BrandHeader';

interface WelcomeCardProps {
  greeting: string;
  description: string;
}

export function WelcomeCard({ greeting, description }: WelcomeCardProps) {
  return (
    <BrandedPage maxWidth="md">
      <GlassPaper>
        <BrandHeader />
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            {greeting}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </GlassPaper>
    </BrandedPage>
  );
}
