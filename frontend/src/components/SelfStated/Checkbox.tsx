import { memo, useCallback } from 'react';
import { Checkbox as MuiCheckbox } from '@mui/material';
import type { CheckboxProps } from '@mui/material';

interface SelfStatedCheckboxProps extends CheckboxProps {
  onCommit?: (checked: boolean) => void;
}

const SelfStatedCheckbox = memo(function SelfStatedCheckbox({
  onCommit,
  onChange,
  size = 'small',
  ...rest
}: SelfStatedCheckboxProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onChange?.(e, checked);
    onCommit?.(checked);
  }, [onChange, onCommit]);

  return (
    <MuiCheckbox
      size={size}
      onChange={handleChange}
      {...rest}
    />
  );
});

export default SelfStatedCheckbox;
