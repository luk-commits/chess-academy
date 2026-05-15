import { Box, Paper } from '@mui/material';

export type PromotionPiece = 'q' | 'r' | 'b' | 'n';

const PROMOTION_PIECES: readonly PromotionPiece[] = ['q', 'r', 'b', 'n'];

const PIECE_SYMBOLS: Record<'w' | 'b', string[]> = {
  w: ['♕', '♖', '♗', '♘'],
  b: ['♛', '♜', '♝', '♞'],
};

interface PromotionPopoverProps {
  color: 'w' | 'b';
  onSelect: (piece: PromotionPiece) => void;
}

export function PromotionPopover({ color, onSelect }: PromotionPopoverProps) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 100,
      }}
    >
      <Paper elevation={24} sx={{ display: 'flex', gap: 0.5, p: 1, borderRadius: 2 }}>
        {PROMOTION_PIECES.map((p, i) => (
          <Box
            key={p}
            onClick={() => onSelect(p)}
            sx={{
              width: 56,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
              userSelect: 'none',
            }}
          >
            {PIECE_SYMBOLS[color][i]}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}
