import Grid from '@mui/material/Grid';
import type { PositionItem } from '../../types/position';
import { isValidFen, boardOrientationFromFen, applyFirstMoveToFen } from '../../utils/chessPosition';
import PositionCard from '../PositionCard';

interface PositionGridProps {
  positions: PositionItem[];
  selectedIds?: Set<number>;
  cardTagsExpanded: Record<number, boolean>;
  onToggle?: (id: number) => void;
  onCopy?: (id: number, fen: string) => void;
  onToggleTags: (id: number) => void;
  hideCheckbox?: boolean;
  keyPrefix?: string | number;
}

export function PositionGrid({
  positions,
  selectedIds,
  cardTagsExpanded,
  onToggle,
  onCopy,
  onToggleTags,
  hideCheckbox,
  keyPrefix = '',
}: PositionGridProps) {
  return (
    <Grid container spacing={2}>
      {positions.map((position) => {
        const fen = applyFirstMoveToFen(position.fen, position.firstMove);
        const validFen = isValidFen(fen);
        return (
          <Grid key={`${keyPrefix}-${position.id}`} size={{ xs: 12, md: 6, lg: 4 }}>
            <PositionCard
              position={position}
              fen={fen}
              validFen={validFen}
              boardOrientation={boardOrientationFromFen(fen)}
              isSelected={selectedIds?.has(position.id) ?? false}
              tagsExpanded={!!cardTagsExpanded[position.id]}
              onToggle={onToggle ?? (() => {})}
              onCopy={onCopy ?? (() => {})}
              onToggleTags={onToggleTags}
              hideCheckbox={hideCheckbox ?? false}
            />
          </Grid>
        );
      })}
    </Grid>
  );
}
