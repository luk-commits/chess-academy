import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { PieceHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import {
  useChessInteraction,
  type BoardRuntimeLike,
} from '../../../src/hooks/useChessInteraction';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
// White pawn one square from promotion on a7, black to move next:
const PROMO_FEN = '8/P7/8/8/8/8/k7/4K3 w - - 0 1';

function runtime(overrides: Partial<BoardRuntimeLike> = {}): BoardRuntimeLike {
  return {
    currentFen: START_FEN,
    expected: ['e2e4', 'e7e5'],
    expectedIndex: 0,
    introFen: null,
    ...overrides,
  };
}

function clickArg(square: string, pieceType?: string): SquareHandlerArgs {
  return {
    square,
    piece: pieceType ? { pieceType, isSparePiece: false } : undefined,
  } as unknown as SquareHandlerArgs;
}

function dragArg(piece: string): PieceHandlerArgs {
  return { piece: { pieceType: piece, isSparePiece: false } } as unknown as PieceHandlerArgs;
}

describe('useChessInteraction', () => {
  describe('handleSquareClick', () => {
    it('selects own piece on first click', () => {
      const tryMove = vi.fn().mockReturnValue(true);
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      expect(result.current.selectedSquare).toBe('e2');
    });

    it('does not select opponent piece', () => {
      const tryMove = vi.fn();
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove }),
      );
      act(() => result.current.handleSquareClick(clickArg('e7', 'bP')));
      expect(result.current.selectedSquare).toBeNull();
    });

    it('deselects when clicking the same square twice', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      expect(result.current.selectedSquare).toBeNull();
    });

    it('switches selection to another own piece', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      act(() => result.current.handleSquareClick(clickArg('d2', 'wP')));
      expect(result.current.selectedSquare).toBe('d2');
    });

    it('calls tryMove when clicking a legal target', () => {
      const tryMove = vi.fn().mockReturnValue(true);
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      act(() => result.current.handleSquareClick(clickArg('e4')));
      expect(tryMove).toHaveBeenCalledWith('e2', 'e4');
      expect(result.current.selectedSquare).toBeNull();
    });

    it('ignores click on an illegal target without clearing selection', () => {
      const tryMove = vi.fn();
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      act(() => result.current.handleSquareClick(clickArg('e5')));
      expect(tryMove).not.toHaveBeenCalled();
      expect(result.current.selectedSquare).toBe('e2');
    });

    it('opens promotion popover instead of moving when pawn reaches last rank', () => {
      const tryMove = vi.fn();
      const { result } = renderHook(() =>
        useChessInteraction({
          runtime: runtime({ currentFen: PROMO_FEN, expected: ['a7a8q'] }),
          tryMove,
        }),
      );
      act(() => result.current.handleSquareClick(clickArg('a7', 'wP')));
      act(() => result.current.handleSquareClick(clickArg('a8')));
      expect(tryMove).not.toHaveBeenCalled();
      expect(result.current.pendingPromotion).toEqual({ from: 'a7', to: 'a8' });
    });

    it('does nothing when intro animation is active', () => {
      const tryMove = vi.fn();
      const { result } = renderHook(() =>
        useChessInteraction({
          runtime: runtime({ introFen: 'some-intro' }),
          tryMove,
        }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      expect(result.current.selectedSquare).toBeNull();
    });

    it('does nothing when disabled', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), disabled: true, tryMove: vi.fn() }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      expect(result.current.selectedSquare).toBeNull();
    });

    it('does nothing when all expected moves are consumed', () => {
      const { result } = renderHook(() =>
        useChessInteraction({
          runtime: runtime({ expectedIndex: 2 }),
          tryMove: vi.fn(),
        }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      expect(result.current.selectedSquare).toBeNull();
    });
  });

  describe('canDragPiece', () => {
    it('returns true for own piece when active', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      expect(result.current.canDragPiece(dragArg('wP'))).toBe(true);
    });

    it('returns false for opponent piece', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      expect(result.current.canDragPiece(dragArg('bP'))).toBe(false);
    });

    it('returns false during intro', () => {
      const { result } = renderHook(() =>
        useChessInteraction({
          runtime: runtime({ introFen: 'x' }),
          tryMove: vi.fn(),
        }),
      );
      expect(result.current.canDragPiece(dragArg('wP'))).toBe(false);
    });

    it('returns false when disabled', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), disabled: true, tryMove: vi.fn() }),
      );
      expect(result.current.canDragPiece(dragArg('wP'))).toBe(false);
    });
  });

  describe('handlePieceDrop', () => {
    it('returns false when targetSquare is null', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      const ok = result.current.handlePieceDrop({ sourceSquare: 'e2', targetSquare: null });
      expect(ok).toBe(false);
    });

    it('treats same-square drop as selection of own piece', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      let ok = false;
      act(() => {
        ok = result.current.handlePieceDrop({ sourceSquare: 'e2', targetSquare: 'e2' });
      });
      expect(ok).toBe(true);
      expect(result.current.selectedSquare).toBe('e2');
    });

    it('rejects same-square drop for opponent piece', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      const ok = result.current.handlePieceDrop({ sourceSquare: 'e7', targetSquare: 'e7' });
      expect(ok).toBe(false);
    });

    it('calls tryMove for legal drop', () => {
      const tryMove = vi.fn().mockReturnValue(true);
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove }),
      );
      let ok = false;
      act(() => {
        ok = result.current.handlePieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' });
      });
      expect(tryMove).toHaveBeenCalledWith('e2', 'e4');
      expect(ok).toBe(true);
    });

    it('rejects illegal drop without calling tryMove', () => {
      const tryMove = vi.fn();
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove }),
      );
      const ok = result.current.handlePieceDrop({ sourceSquare: 'e2', targetSquare: 'e5' });
      expect(tryMove).not.toHaveBeenCalled();
      expect(ok).toBe(false);
    });

    it('opens promotion on pawn reaching last rank', () => {
      const tryMove = vi.fn();
      const { result } = renderHook(() =>
        useChessInteraction({
          runtime: runtime({ currentFen: PROMO_FEN, expected: ['a7a8q'] }),
          tryMove,
        }),
      );
      let ok = false;
      act(() => {
        ok = result.current.handlePieceDrop({ sourceSquare: 'a7', targetSquare: 'a8' });
      });
      expect(tryMove).not.toHaveBeenCalled();
      expect(result.current.pendingPromotion).toEqual({ from: 'a7', to: 'a8' });
      expect(ok).toBe(true);
    });

    it('rejects drop during intro', () => {
      const { result } = renderHook(() =>
        useChessInteraction({
          runtime: runtime({ introFen: 'x' }),
          tryMove: vi.fn(),
        }),
      );
      const ok = result.current.handlePieceDrop({ sourceSquare: 'e2', targetSquare: 'e4' });
      expect(ok).toBe(false);
    });
  });

  describe('squareStyles', () => {
    it('is empty when nothing selected', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      expect(result.current.squareStyles).toEqual({});
    });

    it('highlights selected square and legal targets', () => {
      const { result } = renderHook(() =>
        useChessInteraction({ runtime: runtime(), tryMove: vi.fn() }),
      );
      act(() => result.current.handleSquareClick(clickArg('e2', 'wP')));
      const styles = result.current.squareStyles;
      expect(styles['e2']).toBeDefined();
      expect(styles['e3']).toBeDefined();
      expect(styles['e4']).toBeDefined();
    });
  });

  it('returns null/empty when runtime is null', () => {
    const { result } = renderHook(() =>
      useChessInteraction({ runtime: null, tryMove: vi.fn() }),
    );
    expect(result.current.canDragPiece(dragArg('wP'))).toBe(false);
    expect(result.current.squareStyles).toEqual({});
  });
});
