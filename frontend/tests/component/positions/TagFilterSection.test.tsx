import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { TagFilterSection } from '../../../src/components/positions/TagFilterSection';
import { THEME_TAGS } from '../../../src/constants/themeTags';
import userEvent from '@testing-library/user-event';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('TagFilterSection', () => {
  it('renders all theme tags as chips', () => {
    renderWithTheme(
      <TagFilterSection selectedTags={[]} onToggle={() => {}} />,
    );
    THEME_TAGS.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('selected tag has primary color', () => {
    renderWithTheme(
      <TagFilterSection selectedTags={['fork']} onToggle={() => {}} />,
    );
    const chip = screen.getByText('fork').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorPrimary');
  });

  it('unselected tag has default color', () => {
    renderWithTheme(
      <TagFilterSection selectedTags={[]} onToggle={() => {}} />,
    );
    const chip = screen.getByText('fork').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorDefault');
  });

  it('calls onToggle with tag name on click', async () => {
    const onToggle = vi.fn();
    renderWithTheme(
      <TagFilterSection selectedTags={[]} onToggle={onToggle} />,
    );
    await userEvent.click(screen.getByText('fork'));
    expect(onToggle).toHaveBeenCalledWith('fork');
  });
});
