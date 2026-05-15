import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { PaginationSummary } from '../../../src/components/positions/PaginationSummary';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PaginationSummary', () => {
  it('displays total and page info', () => {
    renderWithTheme(
      <PaginationSummary total={50} page={2} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.getByText(/wszystkich pozycji: 50/i)).toBeInTheDocument();
  });

  it('displays selectedCount when > 0', () => {
    renderWithTheme(
      <PaginationSummary total={50} page={1} totalPages={5} onPageChange={() => {}} selectedCount={3} />,
    );
    expect(screen.getByText(/wybrano:\s*3/i)).toBeInTheDocument();
  });

  it('displays selectedCount as 0 when no selection', () => {
    renderWithTheme(
      <PaginationSummary total={50} page={1} totalPages={5} onPageChange={() => {}} selectedCount={0} />,
    );
    expect(screen.getByText(/wybrano:\s*0/i)).toBeInTheDocument();
  });

  it('calls onPageChange with page number on click', async () => {
    const onPageChange = vi.fn();
    renderWithTheme(
      <PaginationSummary total={50} page={1} totalPages={5} onPageChange={onPageChange} />,
    );
    const page2 = screen.getByRole('button', { name: /page 2/i });
    await userEvent.click(page2);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('pagination shows single page when totalPages is 1', () => {
    renderWithTheme(
      <PaginationSummary total={10} page={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: /page 1/i })).toBeInTheDocument();
  });

  it('hides quick-select cluster when onSelectFirst is not provided', () => {
    renderWithTheme(
      <PaginationSummary total={50} page={1} totalPages={5} onPageChange={() => {}} />,
    );
    expect(screen.queryByText(/zaznacz pierwsze/i)).not.toBeInTheDocument();
  });

  it('renders quick-select buttons when onSelectFirst provided and triggers callback', async () => {
    const onSelectFirst = vi.fn();
    renderWithTheme(
      <PaginationSummary
        total={50}
        page={1}
        totalPages={5}
        onPageChange={() => {}}
        onSelectFirst={onSelectFirst}
      />,
    );
    expect(screen.getByText(/zaznacz pierwsze/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '10' }));
    expect(onSelectFirst).toHaveBeenCalledWith(10);
  });

  it('disables clear button when selectedCount is 0', () => {
    renderWithTheme(
      <PaginationSummary
        total={50}
        page={1}
        totalPages={5}
        onPageChange={() => {}}
        onSelectFirst={() => {}}
        onClearSelection={() => {}}
        selectedCount={0}
      />,
    );
    expect(screen.getByRole('button', { name: /usuń zaznaczenie/i })).toBeDisabled();
  });

  it('clear button calls onClearSelection when something is selected', async () => {
    const onClearSelection = vi.fn();
    renderWithTheme(
      <PaginationSummary
        total={50}
        page={1}
        totalPages={5}
        onPageChange={() => {}}
        onSelectFirst={() => {}}
        onClearSelection={onClearSelection}
        selectedCount={3}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /usuń zaznaczenie/i }));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });
});
