import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import { BRAND_GRADIENT } from '../../constants/branding';

interface BrandedPageProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
}

export function BrandedPage({ children, maxWidth = 'md', centered = false }: BrandedPageProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: BRAND_GRADIENT,
        py: 4,
        px: { xs: 0.25, sm: 2 },
        ...(centered ? { display: 'grid', placeItems: 'center' } : {}),
      }}
    >
      <Container maxWidth={maxWidth} disableGutters={centered}>
        {children}
      </Container>
    </Box>
  );
}
