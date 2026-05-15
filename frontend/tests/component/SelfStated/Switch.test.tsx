import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import SelfStatedSwitch from '../../../src/components/SelfStated/Switch';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('SelfStatedSwitch', () => {
  it('renders unchecked by default', () => {
    renderWithTheme(<SelfStatedSwitch />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('honors defaultChecked', () => {
    renderWithTheme(<SelfStatedSwitch defaultChecked />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('toggles internal state without controlled value', async () => {
    renderWithTheme(<SelfStatedSwitch />);
    const sw = screen.getByRole('switch');
    await userEvent.click(sw);
    expect(sw).toBeChecked();
    await userEvent.click(sw);
    expect(sw).not.toBeChecked();
  });

  it('calls onCommit with new checked value', async () => {
    const onCommit = vi.fn();
    renderWithTheme(<SelfStatedSwitch onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onCommit).toHaveBeenLastCalledWith(true);
    await userEvent.click(screen.getByRole('switch'));
    expect(onCommit).toHaveBeenLastCalledWith(false);
  });

  it('forwards onChange in addition to onCommit', async () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    renderWithTheme(<SelfStatedSwitch onChange={onChange} onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('respects onClick handler (e.g. stopPropagation)', async () => {
    const onClick = vi.fn();
    renderWithTheme(<SelfStatedSwitch onClick={onClick} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onClick).toHaveBeenCalled();
  });
});
