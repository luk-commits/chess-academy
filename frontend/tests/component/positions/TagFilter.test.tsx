import { createRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import SelfStatedTagFilter, { type TagFilterHandle } from '../../../src/components/SelfStated/TagFilter';
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

  it('imperative commit() emits selected tags via onCommit', async () => {
    const onCommit = vi.fn();
    const ref = createRef<TagFilterHandle>();
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter ref={ref} availableTags={TAGS} onCommit={onCommit} />);
    await expand(user);
    await user.click(screen.getByText('fork'));
    await user.click(screen.getByText('mate'));
    expect(onCommit).not.toHaveBeenCalled();
    act(() => { ref.current!.commit(); });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(expect.arrayContaining(['fork', 'mate']));
    expect(onCommit.mock.calls[0][0]).toHaveLength(2);
  });

  it('imperative clear() resets selection and commits empty array', async () => {
    const onCommit = vi.fn();
    const ref = createRef<TagFilterHandle>();
    const user = userEvent.setup();
    renderWithTheme(
      <SelfStatedTagFilter ref={ref} availableTags={TAGS} defaultValue={['fork']} onCommit={onCommit} />,
    );
    await expand(user);
    await user.click(screen.getByText('pin'));
    act(() => { ref.current!.clear(); });
    expect(onCommit).toHaveBeenCalledWith([]);
  });

  it('imperative resetSelection() clears state without emitting onCommit', async () => {
    const onCommit = vi.fn();
    const ref = createRef<TagFilterHandle>();
    const user = userEvent.setup();
    renderWithTheme(
      <SelfStatedTagFilter ref={ref} availableTags={TAGS} defaultValue={['fork']} onCommit={onCommit} />,
    );
    await expand(user);
    await user.click(screen.getByText('pin'));
    act(() => { ref.current!.resetSelection(); });
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('shows "niezapisane" indicator when local differs from committed', async () => {
    const ref = createRef<TagFilterHandle>();
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter ref={ref} availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    expect(screen.queryByText(/niezapisane/i)).not.toBeInTheDocument();
    await user.click(screen.getByText('fork'));
    expect(screen.getByText(/niezapisane/i)).toBeInTheDocument();
    act(() => { ref.current!.commit(); });
    expect(screen.queryByText(/niezapisane/i)).not.toBeInTheDocument();
  });

  it('toggle twice returns to clean state (no dirty indicator)', async () => {
    const user = userEvent.setup();
    renderWithTheme(<SelfStatedTagFilter availableTags={TAGS} onCommit={() => {}} />);
    await expand(user);
    await user.click(screen.getByText('fork'));
    expect(screen.getByText(/niezapisane/i)).toBeInTheDocument();
    await user.click(screen.getByText('fork'));
    expect(screen.queryByText(/niezapisane/i)).not.toBeInTheDocument();
  });

  it('respects defaultValue as initial committed state', async () => {
    const user = userEvent.setup();
    renderWithTheme(
      <SelfStatedTagFilter availableTags={TAGS} defaultValue={['pin']} onCommit={() => {}} />,
    );
    await expand(user);
    const pinChip = screen.getByText('pin').closest('.MuiChip-root');
    expect(pinChip).toHaveClass('MuiChip-colorPrimary');
    expect(screen.queryByText(/niezapisane/i)).not.toBeInTheDocument();
  });
});
