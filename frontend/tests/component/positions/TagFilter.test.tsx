import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import SelfStatedTagFilter from '../../../src/components/SelfStated/TagFilter';
import userEvent from '@testing-library/user-event';

const TAGS = ['fork', 'pin', 'skewer', 'mate'];

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

async function expand(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText(/tagi tematyczne/i));
}

describe('SelfStatedTagFilter', () => {
  it('renders all available tags after expand', async () => {
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    for (const tag of TAGS) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });

  it('does not call onCommit when chip is toggled locally', async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={onCommit} />);
    await expand(user);
    await user.click(screen.getByText('fork'));
    await user.click(screen.getByText('pin'));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits selected tags after Zastosuj click', async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={onCommit} />);
    await expand(user);
    await user.click(screen.getByText('fork'));
    await user.click(screen.getByText('mate'));
    await user.click(screen.getByRole('button', { name: /zastosuj/i }));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(expect.arrayContaining(['fork', 'mate']));
    expect(onCommit.mock.calls[0][0]).toHaveLength(2);
  });

  it('Zastosuj is disabled when no changes (clean state)', async () => {
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    expect(screen.getByRole('button', { name: /zastosuj/i })).toBeDisabled();
  });

  it('Zastosuj becomes enabled after a local toggle and disabled again after commit', async () => {
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    await user.click(screen.getByText('fork'));
    const applyBtn = screen.getByRole('button', { name: /zastosuj/i });
    expect(applyBtn).toBeEnabled();
    await user.click(applyBtn);
    expect(applyBtn).toBeDisabled();
  });

  it('Wyczyść clears local selection and commits empty array', async () => {
    const onCommit = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(
      <SelfStatedTagFilter availableTags={TAGS} defaultValue={['fork']} onCommit={onCommit} />,
    );
    await expand(user);
    await user.click(screen.getByText('pin'));
    await user.click(screen.getByRole('button', { name: /wyczyść/i }));
    expect(onCommit).toHaveBeenCalledWith([]);
  });

  it('shows "niezapisane" indicator when local differs from committed', async () => {
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    expect(screen.queryByText(/niezapisane/i)).not.toBeInTheDocument();
    await user.click(screen.getByText('fork'));
    expect(screen.getByText(/niezapisane/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /zastosuj/i }));
    expect(screen.queryByText(/niezapisane/i)).not.toBeInTheDocument();
  });

  it('toggle twice returns to clean state (Zastosuj disabled again)', async () => {
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    await user.click(screen.getByText('fork'));
    expect(screen.getByRole('button', { name: /zastosuj/i })).toBeEnabled();
    await user.click(screen.getByText('fork'));
    expect(screen.getByRole('button', { name: /zastosuj/i })).toBeDisabled();
  });

  it('respects defaultValue as initial committed state', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SelfStatedTagFilter availableTags={TAGS} defaultValue={['pin']} onCommit={() => {}} />,
    );
    await expand(user);
    const pinChip = screen.getByText('pin').closest('.MuiChip-root');
    expect(pinChip).toHaveClass('MuiChip-colorPrimary');
    expect(screen.getByRole('button', { name: /zastosuj/i })).toBeDisabled();
  });
});
