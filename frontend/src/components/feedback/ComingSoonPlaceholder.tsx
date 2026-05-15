import type { ReactNode } from 'react';
import { Paper, Typography } from '@mui/material';
import { PageLayout } from '../layout/PageLayout';

interface ComingSoonPlaceholderProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function ComingSoonPlaceholder({ icon, title, description }: ComingSoonPlaceholderProps) {
  return (
    <PageLayout maxWidth="md">
      <Paper elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 4, textAlign: 'center' }}>
        {icon}
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Paper>
    </PageLayout>
  );
}
