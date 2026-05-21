import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { EmptyState } from '../../../src/components/feedback/EmptyState';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('EmptyState', () => {
  it('renders the supplied message', () => {
    renderWithTheme(<EmptyState message="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders children when message is omitted', () => {
    renderWithTheme(
      <EmptyState>
        <span>custom content</span>
      </EmptyState>,
    );
    expect(screen.getByText('custom content')).toBeInTheDocument();
  });

  it('prefers message over children when both are provided', () => {
    renderWithTheme(
      <EmptyState message="primary">
        <span>fallback</span>
      </EmptyState>,
    );
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.queryByText('fallback')).not.toBeInTheDocument();
  });
});
