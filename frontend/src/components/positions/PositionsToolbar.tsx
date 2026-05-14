import { useRef } from 'react';
import { Box, Button, Paper } from '@mui/material';
import BiotechIcon from '@mui/icons-material/Biotech';
import SelfStatedText from '../SelfStated/Text';
import SelfStatedSlider from '../SelfStated/Slider';
import { TagFilterSection } from './TagFilterSection';

interface PositionsToolbarProps {
  onSearchCommit: (query: string) => void;
  onDifficultyCommit: (range: [number, number]) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export function PositionsToolbar({
  onSearchCommit,
  onDifficultyCommit,
  selectedTags,
  onTagToggle,
}: PositionsToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    const val = inputRef.current?.value.trim() ?? '';
    onSearchCommit(val);
  };

  const handleTextCommit = (val: string) => {
    onSearchCommit(val.trim());
  };

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
            inputRef={inputRef}
            defaultValue=""
            label="Nazwa debiutu"
            fullWidth
            onCommit={handleTextCommit}
          />
          <Button type="submit" variant="contained" sx={{ whiteSpace: 'nowrap' }}>
            Szukaj
          </Button>
        </Box>
      </Box>

      <SelfStatedSlider
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

      <TagFilterSection selectedTags={selectedTags} onToggle={onTagToggle} />
    </Paper>
  );
}
