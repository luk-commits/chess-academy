import { useState } from 'react';
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'slotProps' | 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function PasswordField({
  label,
  value,
  onChange,
  disabled,
  required,
  autoComplete,
  error,
  helperText,
  sx,
  ...rest
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <TextField
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      error={error}
      helperText={helperText}
      sx={sx}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <LockOutlinedIcon color="action" fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword((v) => !v)}
                edge="end"
                size="small"
                aria-label="toggle password visibility"
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      {...rest}
    />
  );
}
