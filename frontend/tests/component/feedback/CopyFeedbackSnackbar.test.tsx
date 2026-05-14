import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { CopyFeedbackSnackbar } from '../../../src/components/feedback/CopyFeedbackSnackbar';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('CopyFeedbackSnackbar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not render when open=false', () => {
    renderWithTheme(
      <CopyFeedbackSnackbar open={false} onClose={() => {}} />,
    );
    expect(screen.queryByText(/skopiowano/i)).not.toBeInTheDocument();
  });

  it('renders default message when open=true', () => {
    renderWithTheme(
      <CopyFeedbackSnackbar open={true} onClose={() => {}} />,
    );
    expect(screen.getByText('Skopiowano do schowka')).toBeInTheDocument();
  });

  it('calls onClose after auto-hide duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithTheme(
      <CopyFeedbackSnackbar open={true} onClose={onClose} />,
    );
    vi.advanceTimersByTime(1500);
    expect(onClose).toHaveBeenCalled();
  });
});
