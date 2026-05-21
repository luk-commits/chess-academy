import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { BackButton } from '../../../src/components/feedback/BackButton';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('BackButton', () => {
  it('renders default "Wróć" label', () => {
    renderWithTheme(<BackButton onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /wróć/i })).toBeInTheDocument();
  });

  it('renders custom label', () => {
    renderWithTheme(<BackButton label="Przerwij" onClick={() => {}} />);
    expect(screen.getByRole('button', { name: /przerwij/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    renderWithTheme(<BackButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('respects disabled prop', () => {
    const onClick = vi.fn();
    renderWithTheme(<BackButton onClick={onClick} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
