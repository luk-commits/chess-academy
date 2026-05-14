import { Box } from '@mui/material';
import { ZEN_ACCENT, ZEN_MUTED } from './theme';

interface Props {
  total: number;
  currentIndex: number;
  maxWidth?: number;
}

export function StageProgressBar({ total, currentIndex, maxWidth = 560 }: Props) {
  return (
    <Box sx={{ width: '100%', maxWidth, mx: 'auto', display: 'flex', gap: 0.75, mb: 2 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i <= currentIndex;
        return (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              bgcolor: active ? ZEN_ACCENT : ZEN_MUTED,
              transition: 'background-color 0.4s ease',
              boxShadow: active ? `0 0 8px ${ZEN_ACCENT}55` : 'none',
            }}
          />
        );
      })}
    </Box>
  );
}
