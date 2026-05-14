import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { PositionsToolbar } from '../../../src/components/positions/PositionsToolbar';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PositionsToolbar', () => {
  it('calls onSearchCommit with trimmed value on button click', async () => {
    const onSearchCommit = vi.fn();
    renderWithTheme(
      <PositionsToolbar
        onSearchCommit={onSearchCommit}
        onDifficultyCommit={() => {}}
        selectedTags={[]}
        onTagToggle={() => {}}
      />,
    );
    const input = screen.getByLabelText(/nazwa debiutu/i);
    await userEvent.type(input, '  ruy lopez  ');
    await userEvent.click(screen.getByRole('button', { name: /szukaj/i }));
    expect(onSearchCommit).toHaveBeenCalledWith('ruy lopez');
  });

  it('submits on Enter in search field', async () => {
    const onSearchCommit = vi.fn();
    renderWithTheme(
      <PositionsToolbar
        onSearchCommit={onSearchCommit}
        onDifficultyCommit={() => {}}
        selectedTags={[]}
        onTagToggle={() => {}}
      />,
    );
    const input = screen.getByLabelText(/nazwa debiutu/i);
    await userEvent.type(input, 'italian{Enter}');
    expect(onSearchCommit).toHaveBeenCalledWith('italian');
  });

  it('calls onTagToggle when a tag chip is clicked', async () => {
    const onTagToggle = vi.fn();
    renderWithTheme(
      <PositionsToolbar
        onSearchCommit={() => {}}
        onDifficultyCommit={() => {}}
        selectedTags={[]}
        onTagToggle={onTagToggle}
      />,
    );
    await userEvent.click(screen.getByText('fork'));
    expect(onTagToggle).toHaveBeenCalledWith('fork');
  });
});
