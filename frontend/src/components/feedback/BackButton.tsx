import { Button, type ButtonProps } from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';

interface BackButtonProps extends Omit<ButtonProps, 'startIcon' | 'children'> {
  label?: string;
}

/**
 * Standardowy przycisk "wstecz" ze strzałką w lewo.
 */
export function BackButton({ label = 'Wróć', ...rest }: BackButtonProps) {
  return (
    <Button startIcon={<ArrowBack />} {...rest}>
      {label}
    </Button>
  );
}
