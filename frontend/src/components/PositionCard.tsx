import { memo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import { Chessboard } from 'react-chessboard';
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
}: PositionCardProps) {
  return (
    <Card
      elevation={3}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: isSelected ? 2 : 0,
        borderColor: 'primary.main',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 0.5 }}>
          <SelfStatedCheckbox
            size="small"
            defaultChecked={isSelected}
            onCommit={() => onToggle(position.id)}
          />
          <Typography
            noWrap
            sx={{ fontWeight: 700 }}
            title={position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie'}
          >
            {position.opening?.replace(/_/g, ' ') || 'Nieznane otwarcie'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          {validFen ? (
            <Box
              sx={{
                width: '100%',
                maxWidth: 290,
                '& *': {
                  cursor: 'default !important',
                },
              }}
            >
              <Chessboard
                options={{
                  id: `position-${position.id}`,
                  position: fen,
                  boardOrientation,
                  allowDragging: false,
                  boardStyle: {
                    width: '100%',
                    borderRadius: '8px',
                  },
                }}
              />
            </Box>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, width: 290, textAlign: 'center' }}>
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
          onClick={() => onCopy(position.id, fen)}
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
                  onClick={() => onToggleTags(position.id)}
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
