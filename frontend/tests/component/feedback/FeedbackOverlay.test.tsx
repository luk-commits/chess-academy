import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { FeedbackOverlay } from '../../../src/components/feedback/FeedbackOverlay';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('FeedbackOverlay', () => {
  it('renders positive message for pass', () => {
    renderWithTheme(<FeedbackOverlay kind="pass" />);
    expect(screen.getByText(/świetnie/i)).toBeInTheDocument();
  });

  it('renders fail message for fail', () => {
    renderWithTheme(<FeedbackOverlay kind="fail" />);
    expect(screen.getByText(/następnym razem/i)).toBeInTheDocument();
  });

  it('renders different icon for pass vs fail (SVG test-id)', () => {
    const { container: passContainer } = renderWithTheme(<FeedbackOverlay kind="pass" />);
    const passPath = passContainer.querySelector('svg')?.innerHTML;
    const { container: failContainer } = renderWithTheme(<FeedbackOverlay kind="fail" />);
    const failPath = failContainer.querySelector('svg')?.innerHTML;
    expect(passPath).toBeTruthy();
    expect(failPath).toBeTruthy();
    expect(passPath).not.toBe(failPath);
  });
});
