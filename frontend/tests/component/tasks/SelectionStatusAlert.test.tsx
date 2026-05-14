import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { SelectionStatusAlert } from '../../../src/components/tasks/SelectionStatusAlert';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('SelectionStatusAlert', () => {
  it('shows info message when no selections', () => {
    renderWithTheme(
      <SelectionStatusAlert selectedPositionCount={0} selectedGroupCount={0} />,
    );
    expect(screen.getByText('Wybierz pozycje oraz zawodnika/klasę')).toBeInTheDocument();
  });

  it('shows warning to select position when only group selected', () => {
    renderWithTheme(
      <SelectionStatusAlert selectedPositionCount={0} selectedGroupCount={2} />,
    );
    expect(screen.getByText('Wybierz pozycję')).toBeInTheDocument();
  });

  it('shows warning to select group when only position selected', () => {
    renderWithTheme(
      <SelectionStatusAlert selectedPositionCount={3} selectedGroupCount={0} />,
    );
    expect(screen.getByText('Wybierz zawodnika/klasę')).toBeInTheDocument();
  });

  it('shows ready message when both selected', () => {
    renderWithTheme(
      <SelectionStatusAlert selectedPositionCount={3} selectedGroupCount={2} />,
    );
    expect(screen.getByText('Gotowe (3 pozycji, 2 grup)')).toBeInTheDocument();
  });
});
