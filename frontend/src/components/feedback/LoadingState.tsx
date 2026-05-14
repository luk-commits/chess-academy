import { Box, CircularProgress } from '@mui/material';

interface LoadingStateProps {
  py?: number;
  size?: number;
}

export function LoadingState({ py = 8, size }: LoadingStateProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py }}>
      <CircularProgress size={size} />
    </Box>
  );
}
