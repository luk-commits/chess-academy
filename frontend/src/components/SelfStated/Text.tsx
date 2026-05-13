import { memo, useCallback, useState } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

interface SelfStatedTextProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  onCommit?: (value: string) => void;
}

const SelfStatedText = memo(function SelfStatedText({
  onCommit,
  defaultValue = '',
  inputRef,
  ...rest
}: SelfStatedTextProps) {
  const [value, setValue] = useState(defaultValue as string);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    onCommit?.(value);
  }, [onCommit, value]);

  return (
    <TextField
      value={value}
      onChange={handleChange}
      onBlur={onCommit ? handleBlur : undefined}
      inputRef={inputRef}
      {...rest}
    />
  );
});

export default SelfStatedText;
