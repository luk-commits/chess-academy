import type { ReactNode } from 'react';
import { Box, Container } from '@mui/material';

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  bgcolor?: string;
}

/**
 * Podstawowa ramka strony z tłem na pełną wysokość i wyśrodkowanym kontenerem.
 */
export function PageLayout({ children, maxWidth = 'lg', bgcolor = '#f5f5f5' }: PageLayoutProps) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor, py: 4, px: { xs: 0.25, sm: 2 } }}>
      <Container maxWidth={maxWidth} disableGutters>{children}</Container>
    </Box>
  );
}
