import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { LoadingState } from '../../../src/components/feedback/LoadingState';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('LoadingState', () => {
  it('renders a progress indicator', () => {
    renderWithTheme(<LoadingState />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('passes size to CircularProgress', () => {
    const { container } = renderWithTheme(<LoadingState size={32} />);
    const root = container.querySelector('.MuiCircularProgress-root') as HTMLElement | null;
    expect(root?.style.width).toBe('32px');
    expect(root?.style.height).toBe('32px');
  });
});
