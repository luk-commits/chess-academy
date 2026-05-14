import { useState } from 'react';
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { THEME_TAGS } from '../../constants/themeTags';

interface TagFilterSectionProps {
  selectedTags: string[];
  onToggle: (tag: string) => void;
  label?: string;
}

export function TagFilterSection({ selectedTags, onToggle, label = 'Tagi tematyczne' }: TagFilterSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, cursor: 'pointer' }}
        onClick={() => setExpanded(prev => !prev)}
      >
        <Typography variant="subtitle2" color="text.secondary">
          {label} ({selectedTags.length} wybrano)
        </Typography>
        <IconButton
          size="small"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setExpanded(prev => !prev); }}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {THEME_TAGS.map(tag => (
            <Chip
              key={tag}
              size="small"
              label={tag}
              color={selectedTags.includes(tag) ? 'primary' : 'default'}
              variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
              onClick={() => onToggle(tag)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
