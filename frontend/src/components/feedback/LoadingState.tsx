import { Box, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  py?: number;
  size?: number;
}

/**
 * Generyczny wyśrodkowany wskaźnik ładowania.
 */
export function LoadingState({ py = 8, size }: LoadingStateProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py }}>
      <CircularProgress size={size} />
    </Box>
  );
}
