import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, IconButton, Typography } from '@mui/material';
import SkipPrevious from '@mui/icons-material/SkipPrevious';
import NavigateBefore from '@mui/icons-material/NavigateBefore';
import NavigateNext from '@mui/icons-material/NavigateNext';
import SkipNext from '@mui/icons-material/SkipNext';
import { Chessboard } from 'react-chessboard';
import { boardOrientationFromFen } from '../../utils/chessPosition';
import { parsePgnReplay } from '../../utils/pgnReplay';

interface Props {
  baseFen: string;
  solutionPgn: string;
}

export function PgnPreview({ baseFen, solutionPgn }: Props) {
  const replay = useMemo(() => parsePgnReplay(baseFen, solutionPgn), [baseFen, solutionPgn]);
  const [moveIndex, setMoveIndex] = useState(0);

  useEffect(() => {
    setMoveIndex(0);
  }, [baseFen, solutionPgn]);

  if (!replay) {
    return <Alert severity="warning">Nieprawidłowy PGN lub FEN startowy.</Alert>;
  }

  const total = replay.moves.length;
  const currentFen = moveIndex === 0 ? replay.startFen : replay.moves[moveIndex - 1].fenAfter;
  const orientation = boardOrientationFromFen(replay.startFen);

  const pairs: { num: number; white?: { idx: number; san: string }; black?: { idx: number; san: string } }[] = [];
  const firstColor = replay.moves[0]?.color ?? 'w';
  let pairBase = 0;
  if (firstColor === 'b') {
    pairs.push({ num: 1, black: { idx: 1, san: replay.moves[0].san } });
    pairBase = 1;
  }
  for (let i = pairBase; i < total; i += 2) {
    const num = Math.floor((i - pairBase) / 2) + (pairBase === 0 ? 1 : 2);
    const w = replay.moves[i];
    const b = replay.moves[i + 1];
    const entry: { num: number; white?: { idx: number; san: string }; black?: { idx: number; san: string } } = { num };
    if (w) entry.white = { idx: i + 1, san: w.san };
    if (b) entry.black = { idx: i + 2, san: b.san };
    pairs.push(entry);
  }

  return (
    <Box>
      <Box sx={{ maxWidth: 400, mx: 'auto', aspectRatio: '1 / 1', width: '100%' }}>
        <Chessboard
          options={{
            id: 'pgn-preview',
            position: currentFen,
            boardOrientation: orientation,
            allowDragging: false,
            showAnimations: true,
            animationDurationInMs: 160,
            boardStyle: {
              width: '100%',
              borderRadius: 8,
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.15)',
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
        <IconButton size="small" onClick={() => setMoveIndex(0)} disabled={moveIndex === 0} aria-label="Początek">
          <SkipPrevious />
        </IconButton>
        <IconButton size="small" onClick={() => setMoveIndex((i) => Math.max(0, i - 1))} disabled={moveIndex === 0} aria-label="Poprzedni">
          <NavigateBefore />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 56, textAlign: 'center' }}>
          {moveIndex} / {total}
        </Typography>
        <IconButton size="small" onClick={() => setMoveIndex((i) => Math.min(total, i + 1))} disabled={moveIndex === total || total === 0} aria-label="Następny">
          <NavigateNext />
        </IconButton>
        <IconButton size="small" onClick={() => setMoveIndex(total)} disabled={moveIndex === total || total === 0} aria-label="Koniec">
          <SkipNext />
        </IconButton>
      </Box>

      {total > 0 && (
        <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 0.5, alignItems: 'center', fontFamily: 'monospace' }}>
          {pairs.map((p) => (
            <Box key={p.num} sx={{ display: 'contents' }}>
              <Typography variant="caption" color="text.secondary" sx={{ pr: 1 }}>{p.num}.</Typography>
              <Box>
                {p.white && (
                  <Chip
                    label={p.white.san}
                    size="small"
                    color={moveIndex === p.white.idx ? 'primary' : 'default'}
                    variant={moveIndex === p.white.idx ? 'filled' : 'outlined'}
                    onClick={() => setMoveIndex(p.white!.idx)}
                  />
                )}
              </Box>
              <Box>
                {p.black && (
                  <Chip
                    label={p.black.san}
                    size="small"
                    color={moveIndex === p.black.idx ? 'primary' : 'default'}
                    variant={moveIndex === p.black.idx ? 'filled' : 'outlined'}
                    onClick={() => setMoveIndex(p.black!.idx)}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
