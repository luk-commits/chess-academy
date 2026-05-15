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
        onTagsCommit={() => {}}
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
        onTagsCommit={() => {}}
      />,
    );
    const input = screen.getByLabelText(/nazwa debiutu/i);
    await userEvent.type(input, 'italian{Enter}');
    expect(onSearchCommit).toHaveBeenCalledWith('italian');
  });

  it('calls onTagsCommit only after Zastosuj button click (deferred commit)', async () => {
    const onTagsCommit = vi.fn();
    renderWithTheme(
      <PositionsToolbar
        onSearchCommit={() => {}}
        onDifficultyCommit={() => {}}
        onTagsCommit={onTagsCommit}
      />,
    );
    // Expand tag section
    await userEvent.click(screen.getByText(/tagi tematyczne/i));
    // Toggle chip locally - no commit yet
    await userEvent.click(screen.getByText('fork'));
    expect(onTagsCommit).not.toHaveBeenCalled();
    // Commit
    await userEvent.click(screen.getByRole('button', { name: /zastosuj/i }));
    expect(onTagsCommit).toHaveBeenCalledWith(['fork']);
  });
});
