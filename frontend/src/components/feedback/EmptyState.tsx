import type { ReactNode } from 'react';
import { Paper, Typography } from '@mui/material';

interface EmptyStateProps {
  message?: string;
  children?: ReactNode;
}

/**
 * Generyczny kontener stanu pustego.
 */
export function EmptyState({ message, children }: EmptyStateProps) {
  return (
    <Paper elevation={1} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
      {message ? <Typography color="text.secondary">{message}</Typography> : children}
    </Paper>
  );
}
