import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../../src/theme';
import { PositionGrid } from '../../../src/components/positions/PositionGrid';
import type { PositionItem } from '../../../src/types/position';
import userEvent from '@testing-library/user-event';

vi.mock('../../../src/components/PositionCard', () => ({
  default: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="position-card" data-selected={String(props.isSelected)} data-id={props.onToggle ? String((props as { position: PositionItem }).position.id) : ''}>
      <button onClick={() => (props.onToggle as (id: number) => void)((props as { position: PositionItem }).position.id)}>toggle</button>
    </div>
  )),
}));

const positions: PositionItem[] = [
  { id: 1, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', firstMove: null, opening: 'Italian', themeTags: ['fork'], rating: null, difficulty: null },
  { id: 2, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', firstMove: null, opening: 'Ruy Lopez', themeTags: [], rating: 1500, difficulty: 1200 },
  { id: 3, fen: 'invalid', firstMove: null, opening: 'Invalid', themeTags: [], rating: null, difficulty: null },
];

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PositionGrid', () => {
  it('renders N cards for N positions', () => {
    renderWithTheme(
      <PositionGrid positions={positions} cardTagsExpanded={{}} onToggleTags={() => {}} />,
    );
    expect(screen.getAllByTestId('position-card')).toHaveLength(3);
  });

  it('passes isSelected from selectedIds', () => {
    const selectedIds = new Set([1, 3]);
    renderWithTheme(
      <PositionGrid positions={positions} selectedIds={selectedIds} cardTagsExpanded={{}} onToggleTags={() => {}} />,
    );
    const cards = screen.getAllByTestId('position-card');
    expect(cards[0]).toHaveAttribute('data-selected', 'true');
    expect(cards[1]).toHaveAttribute('data-selected', 'false');
    expect(cards[2]).toHaveAttribute('data-selected', 'true');
  });

  it('calls onToggle with position id on card click', async () => {
    const onToggle = vi.fn();
    const u = userEvent.setup();
    renderWithTheme(
      <PositionGrid positions={[positions[0]]} cardTagsExpanded={{}} onToggle={onToggle} onToggleTags={() => {}} />,
    );
    await u.click(screen.getByText('toggle'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('keyPrefix changes card keys (new mount)', () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <PositionGrid positions={[positions[0]]} cardTagsExpanded={{}} onToggleTags={() => {}} keyPrefix="a" />
      </ThemeProvider>,
    );
    renderWithTheme(
      rerender(
        <ThemeProvider theme={theme}>
          <PositionGrid positions={[positions[0]]} cardTagsExpanded={{}} onToggleTags={() => {}} keyPrefix="b" />
        </ThemeProvider>,
      ),
    );
    expect(screen.getByTestId('position-card')).toBeTruthy();
  });
});
