import { memo } from 'react';
import { Box, Button, Pagination, Typography } from '@mui/material';

interface PaginationSummaryProps {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedCount?: number;
  onSelectFirst?: (count: number) => void;
  onClearSelection?: () => void;
}

/** Predefiniowane wartości szybkiego wyboru dla zaznaczenia zbiorczego. */
const SELECT_COUNTS = [5, 10, 15, 25, 50];

/**
 * Podsumowanie stronicowania i zaznaczenia wyświetlane nad siatką pozycji.
 */
export const PaginationSummary = memo(function PaginationSummary({ total, page, totalPages, onPageChange, selectedCount = 0, onSelectFirst, onClearSelection }: PaginationSummaryProps) {
  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          Wszystkich pozycji: {total}
          &middot; Wybrano:{String(selectedCount).padStart(2, '\u2007')}
        </Typography>
        {onSelectFirst && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Zaznacz pierwsze:
            </Typography>
            {SELECT_COUNTS.map(count => (
              <Button
                key={count}
                size="small"
                variant="outlined"
                onClick={() => onSelectFirst(count)}
                sx={{ minWidth: 36, height: 28, fontSize: '0.75rem' }}
              >
                {count}
              </Button>
            ))}
            {onClearSelection && (
              <Button
                size="small"
                variant="outlined"
                onClick={onClearSelection}
                disabled={selectedCount === 0}
                sx={{ minWidth: 36, height: 28, fontSize: '0.75rem', ml: 1 }}
              >
                Usuń zaznaczenie
              </Button>
            )}
          </Box>
        )}
      </Box>
      <Pagination
        color="primary"
        shape="rounded"
        count={totalPages}
        page={page}
        onChange={(_event, value) => onPageChange(value)}
      />
    </Box>
  );
});
