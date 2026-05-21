import { Box, Typography } from '@mui/material';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { ZEN_PENALTY, ZEN_REWARD } from '../zen/theme';

interface Props {
  kind: 'pass' | 'fail';
}

export function FeedbackOverlay({ kind }: Props) {
  const passed = kind === 'pass';
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.55)',
        borderRadius: 3,
        color: 'common.white',
        zIndex: 2,
        gap: 1,
      }}
    >
      {passed
        ? <CheckCircle sx={{ fontSize: 80, color: ZEN_REWARD }} />
        : <Cancel sx={{ fontSize: 80, color: ZEN_PENALTY }} />}
      <Typography variant="h6">
        {passed ? 'Świetnie!' : 'Następnym razem.'}
      </Typography>
    </Box>
  );
}
