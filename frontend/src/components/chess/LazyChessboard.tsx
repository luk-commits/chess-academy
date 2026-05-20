import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Chessboard } from 'react-chessboard';

interface LazyChessboardProps {
  id: string | number;
  fen: string;
  boardOrientation: 'white' | 'black';
  maxWidth?: number;
}

/**
 * Renderuje szachownicę tylko gdy jest blisko viewportu.
 *
 * Dzięki temu długie listy kart pozostają responsywne, a koszt
 * początkowego renderowania jest mniejszy.
 */
export function LazyChessboard({ id, fen, boardOrientation, maxWidth = 320 }: LazyChessboardProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <Box
      ref={ref}
      sx={{
        width: '100%',
        maxWidth,
        aspectRatio: '1 / 1',
        cursor: 'pointer',
        '& *': {
          cursor: 'pointer !important',
          pointerEvents: 'none',
        },
      }}
    >
      {visible && (
        <Chessboard
          options={{
            id: `position-${id}`,
            position: fen,
            boardOrientation,
            allowDragging: false,
            boardStyle: {
              width: '100%',
              borderRadius: '8px',
            },
          }}
        />
      )}
    </Box>
  );
}
