import type { ReactNode } from 'react';
import { Paper, type PaperProps } from '@mui/material';
import { GLASS_PAPER_BG } from '../../constants/branding';

interface GlassPaperProps extends Omit<PaperProps, 'children'> {
  children: ReactNode;
  padding?: { xs: number; sm: number };
}

export function GlassPaper({
  children,
  padding = { xs: 3, sm: 5 },
  elevation = 12,
  sx,
  ...rest
}: GlassPaperProps) {
  return (
    <Paper
      elevation={elevation}
      sx={{
        p: padding,
        borderRadius: 4,
        backdropFilter: 'blur(8px)',
        background: GLASS_PAPER_BG,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}
