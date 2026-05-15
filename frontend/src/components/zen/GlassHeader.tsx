import { Fade, Paper, Typography } from '@mui/material';
import { ZEN_ACCENT } from './theme';

interface Props {
  title: string;
  description: string;
  stageTitle: string;
}

export function GlassHeader({ title, description, stageTitle }: Props) {
  return (
    <Fade in timeout={400}>
      <Paper
        elevation={0}
        sx={{
          mx: 'auto',
          maxWidth: 560,
          mb: 2,
          px: 3,
          py: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(241,245,249,0.45))',
          border: '1px solid rgba(255,255,255,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Typography variant="overline" sx={{ color: ZEN_ACCENT, fontWeight: 700, letterSpacing: 1 }}>
          {stageTitle}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25, mt: 0.25 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Paper>
    </Fade>
  );
}
