import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { AppSnackbar } from '../../../src/components/feedback/AppSnackbar';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AppSnackbar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with severity (Alert mode)', () => {
    it('does not render when open=false', () => {
      renderWithTheme(
        <AppSnackbar open={false} message="test" severity="success" onClose={() => {}} />,
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('renders message with correct severity when open=true', () => {
      renderWithTheme(
        <AppSnackbar open={true} message="Operation completed" severity="success" onClose={() => {}} />,
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Operation completed');
    });

    it('calls onClose after default 4000ms autoHide', () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      renderWithTheme(
        <AppSnackbar open={true} message="test" severity="error" onClose={onClose} />,
      );
      vi.advanceTimersByTime(4000);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('without severity (copy-feedback mode)', () => {
    it('does not render when open=false', () => {
      renderWithTheme(
        <AppSnackbar open={false} message="Skopiowano do schowka" onClose={() => {}} />,
      );
      expect(screen.queryByText(/skopiowano/i)).not.toBeInTheDocument();
    });

    it('renders message when open=true', () => {
      renderWithTheme(
        <AppSnackbar open={true} message="Skopiowano do schowka" onClose={() => {}} />,
      );
      expect(screen.getByText('Skopiowano do schowka')).toBeInTheDocument();
    });

    it('calls onClose after default 1500ms autoHide', () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      renderWithTheme(
        <AppSnackbar open={true} message="ok" onClose={onClose} />,
      );
      vi.advanceTimersByTime(1500);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
