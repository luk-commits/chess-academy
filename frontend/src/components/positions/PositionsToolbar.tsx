import { useCallback, useRef, useState } from 'react';
import { Box, Button, Paper } from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import SelfStatedText from '../SelfStated/Text';
import SelfStatedSlider from '../SelfStated/Slider';
import SelfStatedTagFilter, { type TagFilterHandle } from '../SelfStated/TagFilter';
import { THEME_TAGS } from '../../constants/themeTags';

interface PositionsToolbarProps {
  onSearchCommit: (query: string) => void;
  onDifficultyCommit: (range: [number, number]) => void;
  onTagsCommit: (tags: string[]) => void;
  defaultSelectedTags?: string[];
}

export function PositionsToolbar({
  onSearchCommit,
  onDifficultyCommit,
  onTagsCommit,
  defaultSelectedTags,
}: PositionsToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tagFilterRef = useRef<TagFilterHandle>(null);
  const [searchResetKey, setSearchResetKey] = useState(0);
  const ignoreBlurRef = useRef(false);

  const handleSearch = () => {
    const val = inputRef.current?.value.trim() ?? '';
    onSearchCommit(val);
    tagFilterRef.current?.commit();
  };

  const handleTextCommit = useCallback((val: string) => {
    if (ignoreBlurRef.current) {
      ignoreBlurRef.current = false;
      return;
    }
    onSearchCommit(val.trim());
  }, [onSearchCommit]);

  const handleClear = useCallback(() => {
    ignoreBlurRef.current = true;
    setSearchResetKey(k => k + 1);
    tagFilterRef.current?.resetSelection();
  }, []);

  return (
    <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' },
        }}
      >
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexGrow: 1 }}>
          <BiotechIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        </Box>

        <Box
          component="form"
          onSubmit={(e: React.FormEvent) => { e.preventDefault(); handleSearch(); }}
          sx={{ display: 'flex', gap: 1, width: '100%' }}
        >
          <SelfStatedText
            key={`search-${searchResetKey}`}
            inputRef={inputRef}
            defaultValue=""
            label="Nazwa debiutu"
            fullWidth
            onCommit={handleTextCommit}
          />
          <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
            Zastosuj
          </Button>
          <Button type="button" variant="outlined" sx={{ whiteSpace: 'nowrap' }} onMouseDown={handleClear}>
            Wyczyść
          </Button>
        </Box>
      </Box>

      <SelfStatedSlider
        key="slider"
        label="Poziom trudności"
        defaultVal={[0, 3500]}
        min={0}
        max={3500}
        step={100}
        marks={[
          { value: 0, label: '0' },
          { value: 500, label: '500' },
          { value: 1000, label: '1000' },
          { value: 1500, label: '1500' },
          { value: 2000, label: '2000' },
          { value: 2500, label: '2500' },
          { value: 3000, label: '3000' },
          { value: 3500, label: '3500' },
        ]}
        onCommit={(val) => onDifficultyCommit(val as [number, number])}
      />

      <SelfStatedTagFilter
        ref={tagFilterRef}
        availableTags={THEME_TAGS}
        defaultValue={defaultSelectedTags}
        onCommit={onTagsCommit}
      />
    </Paper>
  );
}
