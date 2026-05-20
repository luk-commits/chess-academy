import { memo, useCallback } from 'react';
import { Switch as MuiSwitch } from '@mui/material';
import type { SwitchProps } from '@mui/material';

interface SelfStatedSwitchProps extends SwitchProps {
  onCommit?: (checked: boolean) => void;
}

/**
 * Lekka otoczka switcha emitująca semantyczne callbacki commitu.
 */
const SelfStatedSwitch = memo(function SelfStatedSwitch({
  onCommit,
  onChange,
  ...rest
}: SelfStatedSwitchProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    onChange?.(e, checked);
    onCommit?.(checked);
  }, [onChange, onCommit]);

  return <MuiSwitch onChange={handleChange} {...rest} />;
});

export default SelfStatedSwitch;
