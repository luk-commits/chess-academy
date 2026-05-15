import { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Box, Button, Chip, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface TagFilterHandle {
  commit: () => void;
  clear: () => void;
  resetSelection: () => void;
}

interface TagChipProps {
  tag: string;
  selected: boolean;
  onToggle: (tag: string) => void;
}

const TagChip = memo(function TagChip({ tag, selected, onToggle }: TagChipProps) {
  return (
    <Chip
      size="small"
      label={tag}
      color={selected ? 'primary' : 'default'}
      variant={selected ? 'filled' : 'outlined'}
      onClick={() => onToggle(tag)}
      sx={{ cursor: 'pointer' }}
    />
  );
});

interface SelfStatedTagFilterProps {
  availableTags: string[];
  defaultValue?: string[] | undefined;
  onCommit: (tags: string[]) => void;
  label?: string;
}

const SelfStatedTagFilter = memo(forwardRef<TagFilterHandle, SelfStatedTagFilterProps>(function SelfStatedTagFilter({
  availableTags,
  defaultValue,
  onCommit,
  label = 'Tagi tematyczne',
}, ref) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(defaultValue ?? []));
  const [committed, setCommitted] = useState<Set<string>>(() => new Set(defaultValue ?? []));

  const dirty = useMemo(() => {
    if (selected.size !== committed.size) return true;
    for (const t of selected) if (!committed.has(t)) return true;
    return false;
  }, [selected, committed]);

  useImperativeHandle(ref, () => ({
    commit: () => {
      const arr = Array.from(selected);
      setCommitted(new Set(arr));
      onCommit(arr);
    },
    clear: () => {
      setSelected(new Set());
      setCommitted(new Set());
      onCommit([]);
    },
    resetSelection: () => {
      setSelected(new Set());
      setCommitted(new Set());
    },
  }), [selected, onCommit]);

  const handleToggle = useCallback((tag: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const handleApply = useCallback(() => {
    const arr = Array.from(selected);
    setCommitted(new Set(arr));
    onCommit(arr);
  }, [selected, onCommit]);

  const handleClear = useCallback(() => {
    setSelected(new Set());
    setCommitted(new Set());
    onCommit([]);
  }, [onCommit]);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer' }}
        onClick={() => setExpanded(p => !p)}
      >
        <Typography variant="subtitle2" color={dirty ? 'warning.main' : 'text.secondary'}>
          {label} ({selected.size} wybranych{dirty ? ' • niezapisane' : ''})
        </Typography>
        <IconButton
          size="small"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded(p => !p); }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
          {availableTags.map(tag => (
            <TagChip
              key={tag}
              tag={tag}
              selected={selected.has(tag)}
              onToggle={handleToggle}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}));

export default SelfStatedTagFilter;
