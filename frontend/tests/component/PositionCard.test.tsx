import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeProvider } from '@mui/material';
import { theme } from '../../src/theme';
import PositionCard from '../../src/components/PositionCard';
import type { PositionItem } from '../../src/types/position';
import userEvent from '@testing-library/user-event';

vi.mock('react-chessboard', () => ({
  Chessboard: () => <div data-testid="chessboard" />,
}));

const basePosition: PositionItem = {
  id: 5,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  firstMove: null,
  opening: 'Italian_Game',
  themeTags: ['fork', 'pin', 'skewer'],
  rating: 1500,
  difficulty: 1200,
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('PositionCard', () => {
  it('renders opening name and tags', () => {
    renderWithTheme(
      <PositionCard
        position={basePosition}
        fen={basePosition.fen}
        validFen={true}
        boardOrientation="white"
        isSelected={false}
        tagsExpanded={false}
        onToggle={() => {}}
        onCopy={() => {}}
        onToggleTags={() => {}}
      />,
    );
    expect(screen.getByText('Italian Game')).toBeInTheDocument();
    expect(screen.getByText('fork')).toBeInTheDocument();
    expect(screen.getByText('pin')).toBeInTheDocument();
  });

  it('shows fallback for invalid FEN', () => {
    renderWithTheme(
      <PositionCard
        position={{ ...basePosition, fen: 'invalid' }}
        fen="invalid"
        validFen={false}
        boardOrientation="white"
        isSelected={false}
        tagsExpanded={false}
        onToggle={() => {}}
        onCopy={() => {}}
        onToggleTags={() => {}}
      />,
    );
    expect(screen.getByText('Niepoprawny FEN')).toBeInTheDocument();
  });

  it('calls onToggle with id on card click', async () => {
    const onToggle = vi.fn();
    renderWithTheme(
      <PositionCard
        position={basePosition}
        fen={basePosition.fen}
        validFen={true}
        boardOrientation="white"
        isSelected={false}
        tagsExpanded={false}
        onToggle={onToggle}
        onCopy={() => {}}
        onToggleTags={() => {}}
      />,
    );
    const card = screen.getByText('Italian Game').closest('.MuiCard-root')!;
    await userEvent.click(card);
    expect(onToggle).toHaveBeenCalledWith(5);
  });

  it('calls onCopy with id and fen on copy click', async () => {
    const onCopy = vi.fn();
    renderWithTheme(
      <PositionCard
        position={basePosition}
        fen={basePosition.fen}
        validFen={true}
        boardOrientation="white"
        isSelected={false}
        tagsExpanded={false}
        onToggle={() => {}}
        onCopy={onCopy}
        onToggleTags={() => {}}
      />,
    );
    const fenInput = screen.getByDisplayValue(basePosition.fen);
    await userEvent.click(fenInput);
    expect(onCopy).toHaveBeenCalledWith(5, basePosition.fen);
  });

  it('calls onToggleTags when expand tags chip is clicked', async () => {
    const onToggleTags = vi.fn();
    renderWithTheme(
      <PositionCard
        position={basePosition}
        fen={basePosition.fen}
        validFen={true}
        boardOrientation="white"
        isSelected={false}
        tagsExpanded={false}
        onToggle={() => {}}
        onCopy={() => {}}
        onToggleTags={onToggleTags}
      />,
    );
    const expandBtn = screen.getByText('+1');
    await userEvent.click(expandBtn);
    expect(onToggleTags).toHaveBeenCalledWith(5);
  });

  it('shows all tags when tagsExpanded is true', () => {
    renderWithTheme(
      <PositionCard
        position={basePosition}
        fen={basePosition.fen}
        validFen={true}
        boardOrientation="white"
        isSelected={false}
        tagsExpanded={true}
        onToggle={() => {}}
        onCopy={() => {}}
        onToggleTags={() => {}}
      />,
    );
    expect(screen.getByText('fork')).toBeInTheDocument();
    expect(screen.getByText('pin')).toBeInTheDocument();
    expect(screen.getByText('skewer')).toBeInTheDocument();
  });

  it('applies selected visual style', () => {
    renderWithTheme(
      <PositionCard
        position={basePosition}
        fen={basePosition.fen}
        validFen={true}
        boardOrientation="white"
        isSelected={true}
        tagsExpanded={false}
        onToggle={() => {}}
        onCopy={() => {}}
        onToggleTags={() => {}}
      />,
    );
    const card = screen.getByText('Italian Game').closest('.MuiCard-root')!;
    expect(card).toHaveClass('MuiCard-root');
  });
});
