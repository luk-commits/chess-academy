import { memo, useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { Chessboard } from 'react-chessboard';

function LazyChessboard({ id, fen, boardOrientation }: { id: number; fen: string; boardOrientation: 'white' | 'black' }) {
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
        maxWidth: 290,
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
import SelfStatedCheckbox from './SelfStated/Checkbox';
import SelfStatedText from './SelfStated/Text';
import type { PositionItem } from '../types/position';

interface PositionCardProps {
  position: PositionItem;
  fen: string;
  validFen: boolean;
  boardOrientation: 'white' | 'black';
  isSelected: boolean;
  tagsExpanded: boolean;
  onToggle: (id: number) => void;
  onCopy: (id: number, fen: string) => void;
  onToggleTags: (id: number) => void;
  hideCheckbox?: boolean;
}

const PositionCard = memo(function PositionCard({
  position,
  fen,
  validFen,
  boardOrientation,
  isSelected,
  tagsExpanded,
  onToggle,
  onCopy,
  onToggleTags,
  hideCheckbox = false,
}: PositionCardProps) {
  return (
    <Card
      elevation={3}
      onClick={() => onToggle(position.id)}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: 2,
        cursor: 'pointer',
        borderColor: isSelected ? 'primary.main' : '#fff',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
          <Box onClick={e => e.stopPropagation()}>
            {!hideCheckbox && (
              <SelfStatedCheckbox
                size="small"
                id={`position-checkbox-${position.id}`}
                checked={isSelected}
                onCommit={() => onToggle(position.id)}
              />
            )}
          </Box>
          <Tooltip title={position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie'} placement="top">
            <Typography
              noWrap
              sx={{ fontWeight: 700, cursor: 'pointer', flex: 1 }}
            >
              {position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie'}
            </Typography>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          {validFen ? (
            <LazyChessboard id={position.id} fen={fen} boardOrientation={boardOrientation} />
          ) : (
            <Paper
              variant="outlined"
              sx={{ p: 2, width: 290, textAlign: 'center', cursor: 'pointer' }}
            >
              <Typography variant="body2" color="error.main">
                Niepoprawny FEN
              </Typography>
            </Paper>
          )}
        </Box>

        <SelfStatedText
          key={`fen-${position.id}-${fen}`}
          fullWidth
          size="small"
          variant="outlined"
          defaultValue={fen}
          slotProps={{ htmlInput: { readOnly: true } }}
          sx={{
            mb: 1,
            '& .MuiInputBase-input': {
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            },
          }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onCopy(position.id, fen); }}
        />

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
          {position.themeTags.length > 0 ? (
            <>
              {(tagsExpanded ? position.themeTags : position.themeTags.slice(0, 2)).map((tag) => (
                <Chip key={tag} size="small" label={tag} />
              ))}
              {position.themeTags.length > 2 && (
                <Chip
                  size="small"
                  label={tagsExpanded ? '▲ mniej' : `+${position.themeTags.length - 2}`}
                  variant="outlined"
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onToggleTags(position.id); }}
                  sx={{ cursor: 'pointer' }}
                />
              )}
            </>
          ) : (
            <Chip size="small" label="Brak tagow" variant="outlined" />
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {position.rating !== null && <Chip size="small" label={`Rating: ${position.rating}`} variant="outlined" />}
          {position.difficulty !== null && (
            <Chip size="small" label={`Difficulty: ${position.difficulty}`} variant="outlined" />
          )}
        </Box>
      </CardContent>
    </Card>
  );
});

export default PositionCard;
