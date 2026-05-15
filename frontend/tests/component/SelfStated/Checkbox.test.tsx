import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import SelfStatedCheckbox from '../../../src/components/SelfStated/Checkbox';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('SelfStatedCheckbox', () => {
  it('renders unchecked by default', () => {
    renderWithTheme(<SelfStatedCheckbox />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('honors defaultChecked', () => {
    renderWithTheme(<SelfStatedCheckbox defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onCommit on each toggle with new value', async () => {
    const onCommit = vi.fn();
    renderWithTheme(<SelfStatedCheckbox onCommit={onCommit} />);
    const cb = screen.getByRole('checkbox');
    await userEvent.click(cb);
    expect(onCommit).toHaveBeenLastCalledWith(true);
    await userEvent.click(cb);
    expect(onCommit).toHaveBeenLastCalledWith(false);
  });

  it('forwards onChange alongside onCommit', async () => {
    const onChange = vi.fn();
    const onCommit = vi.fn();
    renderWithTheme(<SelfStatedCheckbox onChange={onChange} onCommit={onCommit} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('supports controlled checked prop', () => {
    const { rerender } = renderWithTheme(<SelfStatedCheckbox checked={false} onChange={() => {}} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    rerender(
      <ThemeProvider theme={theme}>
        <SelfStatedCheckbox checked={true} onChange={() => {}} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
