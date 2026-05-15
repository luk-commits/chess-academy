import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import SelfStatedText from '../../../src/components/SelfStated/Text';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('SelfStatedText', () => {
  it('renders with defaultValue', () => {
    renderWithTheme(<SelfStatedText label="Tytuł" defaultValue="hello" />);
    expect((screen.getByLabelText(/tytuł/i) as HTMLInputElement).value).toBe('hello');
  });

  it('tracks local typing without calling onCommit', async () => {
    const onCommit = vi.fn();
    renderWithTheme(<SelfStatedText label="Tytuł" onCommit={onCommit} />);
    const input = screen.getByLabelText(/tytuł/i) as HTMLInputElement;
    await userEvent.type(input, 'abc');
    expect(input.value).toBe('abc');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('commits value on blur', async () => {
    const onCommit = vi.fn();
    renderWithTheme(
      <>
        <SelfStatedText label="Tytuł" onCommit={onCommit} />
        <button>other</button>
      </>,
    );
    const input = screen.getByLabelText(/tytuł/i);
    await userEvent.type(input, 'ruy lopez');
    await userEvent.click(screen.getByText('other'));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('ruy lopez');
  });

  it('does not attach blur handler when onCommit is not provided', async () => {
    renderWithTheme(
      <>
        <SelfStatedText label="Tytuł" />
        <button>other</button>
      </>,
    );
    const input = screen.getByLabelText(/tytuł/i);
    await userEvent.type(input, 'abc');
    await userEvent.click(screen.getByText('other'));
    expect((input as HTMLInputElement).value).toBe('abc');
  });
});
