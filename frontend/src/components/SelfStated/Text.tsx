import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

export interface TextHandle {
  reset: () => void;
  commit: () => void;
}

interface SelfStatedTextProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  onCommit?: (value: string) => void;
}

/**
 * Pole tekstowe z lokalnym stanem, które zatwierdza wartość na blur/ręczny commit.
 */
const SelfStatedText = memo(forwardRef<TextHandle, SelfStatedTextProps>(function SelfStatedText({
  onCommit,
  defaultValue = '',
  inputRef,
  ...rest
}, ref) {
  const initial = defaultValue as string;
  const [value, setValue] = useState(initial);
  const committedRef = useRef(initial);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    if (value === committedRef.current) return;
    committedRef.current = value;
    onCommit?.(value);
  }, [onCommit, value]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setValue(initial);
      committedRef.current = initial;
    },
    commit: () => {
      if (value === committedRef.current) return;
      committedRef.current = value;
      onCommit?.(value);
    },
  }), [initial, onCommit, value]);

  return (
    <TextField
      value={value}
      onChange={handleChange}
      onBlur={onCommit ? handleBlur : undefined}
      inputRef={inputRef}
      {...rest}
    />
  );
}));

export default SelfStatedText;
