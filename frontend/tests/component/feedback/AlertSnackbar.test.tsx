import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { AlertSnackbar } from '../../../src/components/feedback/AlertSnackbar';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AlertSnackbar', () => {
  it('does not render when open=false', () => {
    renderWithTheme(
      <AlertSnackbar open={false} message="test" severity="success" onClose={() => {}} />,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders message with correct severity when open=true', () => {
    renderWithTheme(
      <AlertSnackbar open={true} message="Operation completed" severity="success" onClose={() => {}} />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Operation completed');
  });

  it('calls onClose after autoHideDuration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithTheme(
      <AlertSnackbar open={true} message="test" severity="error" onClose={onClose} />,
    );
    vi.advanceTimersByTime(4000);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
