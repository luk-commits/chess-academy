import { memo } from 'react';
import { Box, CircularProgress, FormControlLabel, Paper, Typography } from '@mui/material';
import SelfStatedCheckbox from '../SelfStated/Checkbox';

export interface GroupSelectorItem {
  id: number;
  label: string;
}

export interface GroupSelectorListProps {
  items: GroupSelectorItem[];
  loading: boolean;
  emptyText: string;
  resetKey: number;
  onCommit: (groupId: number, checked: boolean) => void;
  maxHeight?: number | string;
  title?: string;
}

export const GroupSelectorList = memo(function GroupSelectorList({
  items,
  loading,
  emptyText,
  resetKey,
  onCommit,
  maxHeight = 220,
  title,
}: GroupSelectorListProps) {
  const content = (
    <Box sx={{ p: 2, maxHeight, overflowY: 'auto' }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
      ) : (
        items.map(item => (
          <FormControlLabel
            key={`${item.id}-${resetKey}`}
            control={
              <SelfStatedCheckbox
                size="small"
                defaultChecked={false}
                onCommit={(checked) => onCommit(item.id, checked)}
              />
            }
            label={item.label}
          />
        ))
      )}
    </Box>
  );

  if (title) {
    return (
      <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', color: '#fff', px: 2.5, py: 1.5, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
        </Box>
        {content}
      </Paper>
    );
  }

  return content;
});
