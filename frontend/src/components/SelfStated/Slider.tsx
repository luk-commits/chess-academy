import { memo, useCallback, useState } from 'react';
import { Slider as MuiSlider, Typography, Box } from '@mui/material';
import type { SliderProps } from '@mui/material';

interface SelfStatedSliderProps {
  defaultVal?: number[];
  min?: number;
  max?: number;
  step?: number;
  marks?: { value: number; label: string }[];
  valueLabelDisplay?: SliderProps['valueLabelDisplay'];
  label?: string;
  onCommit?: (value: number[]) => void;
}

const SelfStatedSlider = memo(function SelfStatedSlider({
  defaultVal = [0, 3500],
  min = 0,
  max = 3500,
  step = 100,
  marks,
  valueLabelDisplay = 'auto',
  label,
  onCommit,
}: SelfStatedSliderProps) {
  const [value, setValue] = useState<number[]>(defaultVal);

  const handleChange = useCallback((_event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
  }, []);

  const handleCommitted = useCallback((_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    onCommit?.(newValue as number[]);
  }, [onCommit]);

  return (
    <Box sx={{ px: 1 }}>
      {label && (
        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
          {label}: {value[0]} – {value[1]}
        </Typography>
      )}
      <MuiSlider
        value={value}
        onChange={handleChange}
        onChangeCommitted={handleCommitted}
        min={min}
        max={max}
        step={step}
        marks={marks}
        valueLabelDisplay={valueLabelDisplay}
      />
    </Box>
  );
});

export default SelfStatedSlider;
