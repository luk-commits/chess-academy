import { useCallback, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import type { PieceHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { ZEN_SELECTED_SQUARE } from '../components/zen/theme';
import { fenTurn, pieceColor } from '../utils/chessPosition';

export interface BoardRuntimeLike {
  currentFen: string;
  expected: string[];
  expectedIndex: number;
  introFen: string | null;
}

interface UseChessInteractionOptions {
  runtime: BoardRuntimeLike | null;
  disabled?: boolean;
  tryMove: (from: string, to: string, promotion?: string) => boolean;
}

/**
 * Wspólna logika interakcji z szachownicą używana przez ekran zadań i powtórek:
 * zaznaczenie pola, podpowiedzi ruchów, drag&drop oraz promocja piona.
 */
export function useChessInteraction({ runtime, disabled = false, tryMove }: UseChessInteractionOptions) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);

  const isInteractive = !!runtime && !runtime.introFen && runtime.expected.length > runtime.expectedIndex && !disabled;

  const legalTargets = useMemo((): Set<string> => {
    if (!selectedSquare || !runtime) return new Set();
    const chess = new Chess(runtime.currentFen);
    return new Set(
      chess.moves({ square: selectedSquare as Square, verbose: true }).map((m) => m.to),
    );
  }, [selectedSquare, runtime]);

  const handleSquareClick = useCallback(({ piece, square }: SquareHandlerArgs) => {
    if (!runtime || !isInteractive) return;
    const turn = fenTurn(runtime.currentFen);

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        return;
      }
      if (piece && pieceColor(piece.pieceType) === turn) {
        setSelectedSquare(square);
        return;
      }
      if (!legalTargets.has(square)) return;

      const chess = new Chess(runtime.currentFen);
      const chessPiece = chess.get(selectedSquare as Square);
      if (chessPiece && chessPiece.type === 'p') {
        const rank = square[1];
        if ((rank === '8' && chessPiece.color === 'w') || (rank === '1' && chessPiece.color === 'b')) {
          setPendingPromotion({ from: selectedSquare, to: square });
          setSelectedSquare(null);
          return;
        }
      }

      tryMove(selectedSquare, square);
      setSelectedSquare(null);
      return;
    }

    if (piece && pieceColor(piece.pieceType) === turn) {
      setSelectedSquare(square);
    }
  }, [runtime, isInteractive, selectedSquare, legalTargets, tryMove]);

  const canDragPiece = useCallback(({ piece }: PieceHandlerArgs): boolean => {
    if (!runtime || !isInteractive) return false;
    return pieceColor(piece.pieceType) === fenTurn(runtime.currentFen);
  }, [runtime, isInteractive]);

  const handlePieceDrop = useCallback(
    ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
      if (!targetSquare || !runtime || runtime.introFen) return false;

      const turn = fenTurn(runtime.currentFen);
      const chess = new Chess(runtime.currentFen);
      const dragPiece = chess.get(sourceSquare as Square);

      // Drop on the same square = click to select (drag triggers before click on micro-movements).
      if (sourceSquare === targetSquare) {
        if (dragPiece && dragPiece.color === turn) {
          setSelectedSquare(sourceSquare);
          return true;
        }
        return false;
      }

      if (!dragPiece || dragPiece.color !== turn) return false;
      const legal = chess.moves({ square: sourceSquare as Square, verbose: true })
        .some((m) => m.to === targetSquare);
      if (!legal) return false;

      if (dragPiece.type === 'p') {
        const rank = targetSquare[1];
        if ((rank === '8' && turn === 'w') || (rank === '1' && turn === 'b')) {
          setPendingPromotion({ from: sourceSquare, to: targetSquare });
          setSelectedSquare(null);
          return true;
        }
      }

      setSelectedSquare(null);
      return tryMove(sourceSquare, targetSquare);
    },
    [runtime, tryMove],
  );

  const squareStyles = useMemo((): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!selectedSquare || !runtime) return styles;
    styles[selectedSquare] = { backgroundColor: ZEN_SELECTED_SQUARE };
    const chess = new Chess(runtime.currentFen);
    for (const m of chess.moves({ square: selectedSquare as Square, verbose: true })) {
      styles[m.to] = m.captured
        ? { backgroundColor: 'rgba(33,150,243,0.22)', borderRadius: '50%', outline: '3px solid rgba(33,150,243,0.5)', outlineOffset: '-3px' }
        : { background: 'radial-gradient(circle, rgba(33,150,243,0.4) 28%, transparent 29%)', borderRadius: '50%' };
    }
    return styles;
  }, [selectedSquare, runtime]);

  return {
    selectedSquare,
    setSelectedSquare,
    pendingPromotion,
    setPendingPromotion,
    handleSquareClick,
    canDragPiece,
    handlePieceDrop,
    squareStyles,
  };
}
