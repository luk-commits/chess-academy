import type { ReactNode } from 'react';
import { InputAdornment, TextField, type TextFieldProps } from '@mui/material';

type IconTextFieldProps = Omit<TextFieldProps, 'slotProps' | 'onChange'> & {
  startIcon: ReactNode;
  value: string;
  onChange: (value: string) => void;
};

export function IconTextField({
  startIcon,
  value,
  onChange,
  ...rest
}: IconTextFieldProps) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ),
        },
      }}
      {...rest}
    />
  );
}
