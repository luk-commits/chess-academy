import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import SelfStatedSlider from '../../../src/components/SelfStated/Slider';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('SelfStatedSlider', () => {
  it('renders label with initial range from defaultVal', () => {
    renderWithTheme(
      <SelfStatedSlider label="Trudność" defaultVal={[500, 2500]} min={0} max={3500} />,
    );
    expect(screen.getByText(/trudność:\s*500\s*–\s*2500/i)).toBeInTheDocument();
  });

  it('renders two slider thumbs for range', () => {
    renderWithTheme(<SelfStatedSlider defaultVal={[0, 3500]} label="Trudność" />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('updates local label display while sliding', () => {
    renderWithTheme(
      <SelfStatedSlider label="Trudność" defaultVal={[0, 3500]} />,
    );
    const thumbs = screen.getAllByRole('slider');
    fireEvent.mouseDown(thumbs[0], { clientX: 0 });
    fireEvent.change(thumbs[0], { target: { value: 800 } });
    expect(screen.getByText(/trudność:\s*800\s*–\s*3500/i)).toBeInTheDocument();
  });

  it('uses provided min/max props on slider thumbs', () => {
    renderWithTheme(
      <SelfStatedSlider label="X" defaultVal={[0, 100]} min={0} max={100} />,
    );
    const thumbs = screen.getAllByRole('slider');
    expect(thumbs[0]).toHaveAttribute('aria-valuemin', '0');
    expect(thumbs[0]).toHaveAttribute('aria-valuemax', '100');
  });
});
