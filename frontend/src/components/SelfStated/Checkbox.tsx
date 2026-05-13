import { memo } from 'react';
import { Checkbox as MuiCheckbox } from '@mui/material';
import type { CheckboxProps } from '@mui/material';

const SelfStatedCheckbox = memo(function SelfStatedCheckbox({
  size = 'small',
  ...rest
}: CheckboxProps) {
  return <MuiCheckbox size={size} {...rest} />;
});

export default SelfStatedCheckbox;
