import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { GroupSelectorList } from '../../../src/components/groups/GroupSelectorList';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

const items = [
  { id: 1, label: 'Alice' },
  { id: 2, label: 'Bob' },
];

describe('GroupSelectorList', () => {
  it('shows spinner when loading=true', () => {
    renderWithTheme(
      <GroupSelectorList items={items} loading={true} emptyText="Brak." resetKey={0} onCommit={() => {}} />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('shows emptyText when items empty and loading=false', () => {
    renderWithTheme(
      <GroupSelectorList items={[]} loading={false} emptyText="Brak zawodników." resetKey={0} onCommit={() => {}} />,
    );
    expect(screen.getByText('Brak zawodników.')).toBeInTheDocument();
  });

  it('renders checkbox for each item', () => {
    renderWithTheme(
      <GroupSelectorList items={items} loading={false} emptyText="Brak." resetKey={0} onCommit={() => {}} />,
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('calls onCommit with id and true on check, false on uncheck', async () => {
    const onCommit = vi.fn();
    renderWithTheme(
      <GroupSelectorList items={items} loading={false} emptyText="Brak." resetKey={0} onCommit={onCommit} />,
    );
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    expect(onCommit).toHaveBeenCalledWith(1, true);
    await userEvent.click(aliceCheckbox);
    expect(onCommit).toHaveBeenCalledWith(1, false);
  });

  it('resets checkboxes when resetKey changes', async () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <GroupSelectorList items={items} loading={false} emptyText="Brak." resetKey={0} onCommit={() => {}} />
      </ThemeProvider>,
    );
    const aliceCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    await userEvent.click(aliceCheckbox);
    expect(aliceCheckbox).toBeChecked();

    rerender(
      <ThemeProvider theme={theme}>
        <GroupSelectorList items={items} loading={false} emptyText="Brak." resetKey={1} onCommit={() => {}} />
      </ThemeProvider>,
    );
    const newCheckbox = screen.getByText('Alice').closest('.MuiFormControlLabel-root')!.querySelector('input[type="checkbox"]')!;
    expect(newCheckbox).not.toBeChecked();
  });

  it('renders title when provided', () => {
    renderWithTheme(
      <GroupSelectorList items={items} loading={false} emptyText="Brak." resetKey={0} onCommit={() => {}} title="Zawodnicy" />,
    );
    expect(screen.getByText('Zawodnicy')).toBeInTheDocument();
  });
});
