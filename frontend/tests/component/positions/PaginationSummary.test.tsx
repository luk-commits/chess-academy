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
    expect(screen.getByText(/wybrano: 3/i)).toBeInTheDocument();
  });

  it('does not display selectedCount when 0', () => {
    renderWithTheme(
      <PaginationSummary total={50} page={1} totalPages={5} onPageChange={() => {}} selectedCount={0} />,
    );
    expect(screen.queryByText(/wybrano:/i)).not.toBeInTheDocument();
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
});
