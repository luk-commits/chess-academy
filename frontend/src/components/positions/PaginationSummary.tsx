import { Box, Pagination, Typography } from '@mui/material';

interface PaginationSummaryProps {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedCount?: number;
}

export function PaginationSummary({ total, page, totalPages, onPageChange, selectedCount = 0 }: PaginationSummaryProps) {
  return (
    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" color="text.secondary">
        Wszystkich pozycji: {total}
        {selectedCount > 0 && (
          <> &middot; Wybrano: {selectedCount}</>
        )}
      </Typography>
      <Pagination
        color="primary"
        shape="rounded"
        count={totalPages}
        page={page}
        onChange={(_event, value) => onPageChange(value)}
      />
    </Box>
  );
}
