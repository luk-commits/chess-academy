import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { SquareHandlerArgs } from 'react-chessboard';
import { PromotionPopover } from '../chess/PromotionPopover';
import { ZEN_SELECTED_SQUARE, shake } from '../zen/theme';
import { fenTurn, isUciCheckmate, pieceColor, uciToMove } from '../../utils/chessPosition';
import { buildPgnRuntime, type PgnRuntime } from '../../utils/pgnRuntime';
import type { DueStage } from '../../types/playerStages';

interface Props {
  stage: DueStage;
  onComplete: (passed: boolean) => void;
}

export function SrStageBoard({ stage, onComplete }: Props) {
  const [runtime, setRuntime] = useState<PgnRuntime | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [animateBoard, setAnimateBoard] = useState(true);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    setAnimateBoard(false);
    const rt = buildPgnRuntime(stage.position.fen, stage.solutionPgn);
    setRuntime(rt);
    setSelectedSquare(null);
    setPendingPromotion(null);
    if (rt?.introFen) {
      const tid = window.setTimeout(() => {
        setAnimateBoard(true);
        requestAnimationFrame(() => {
          setRuntime((prev) => (prev ? { ...prev, currentFen: prev.introFen!, introFen: null } : prev));
        });
      }, 250);
      return () => clearTimeout(tid);
    }
    const enableTid = window.setTimeout(() => setAnimateBoard(true), 100);
    return () => clearTimeout(enableTid);
  }, [stage.id, stage.position.fen, stage.solutionPgn]);

  const finish = useCallback((passed: boolean, delayMs: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    window.setTimeout(() => onComplete(passed), delayMs);
  }, [onComplete]);

  const playEngineReply = useCallback((rt: PgnRuntime) => {
    const engineUci = rt.expected[rt.expectedIndex];
    if (!engineUci) {
      setRuntime(rt);
      finish(!rt.errored, 450);
      return;
    }
    window.setTimeout(() => {
      const chess = new Chess(rt.currentFen);
      const result = chess.move(uciToMove(engineUci));
      if (!result) {
        setRuntime(rt);
        return;
      }
      const updated: PgnRuntime = {
        ...rt,
        currentFen: chess.fen(),
        expectedIndex: rt.expectedIndex + 1,
      };
      setRuntime(updated);
      if (updated.expectedIndex >= updated.expected.length) {
        finish(!updated.errored, 600);
      }
    }, 350);
  }, [finish]);

  const tryMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    if (!runtime || finishedRef.current) return false;
    const expectedUci = runtime.expected[runtime.expectedIndex];
    if (!expectedUci) return false;

    const playerUci = from + to + (promotion ?? '');
    if (playerUci !== expectedUci) {
      const attemptChess = new Chess(runtime.currentFen);
      const altResult = attemptChess.move(uciToMove(playerUci));
      if (altResult && attemptChess.isCheckmate() && isUciCheckmate(runtime.currentFen, expectedUci)) {
        const afterPlayer: PgnRuntime = {
          ...runtime,
          currentFen: attemptChess.fen(),
          expectedIndex: runtime.expectedIndex + 1,
        };
        setRuntime(afterPlayer);
        finish(!afterPlayer.errored, 600);
        return true;
      }

      setShakeKey((k) => k + 1);
      if (!runtime.errored) {
        const updated = { ...runtime, errored: true };
        setRuntime(updated);
        finish(false, 700);
      }
      return false;
    }

    const chess = new Chess(runtime.currentFen);
    const moveResult = chess.move(uciToMove(expectedUci));
    if (!moveResult) return false;

    const afterPlayer: PgnRuntime = {
      ...runtime,
      currentFen: chess.fen(),
      expectedIndex: runtime.expectedIndex + 1,
    };
    setRuntime(afterPlayer);
    playEngineReply(afterPlayer);
    return true;
  }, [runtime, playEngineReply, finish]);

  const legalTargets = useMemo((): Set<string> => {
    if (!selectedSquare || !runtime) return new Set();
    const chess = new Chess(runtime.currentFen);
    return new Set(chess.moves({ square: selectedSquare as Square, verbose: true }).map((m) => m.to));
  }, [selectedSquare, runtime]);

  const handleSquareClick = useCallback(({ piece, square }: SquareHandlerArgs) => {
    if (!runtime || finishedRef.current || runtime.introFen) return;
    if (runtime.expected.length <= runtime.expectedIndex) return;
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
  }, [runtime, selectedSquare, legalTargets, tryMove]);

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!targetSquare || !runtime || runtime.introFen) return false;
    const chess = new Chess(runtime.currentFen);
    const legal = chess.moves({ square: sourceSquare as Square, verbose: true }).some((m) => m.to === targetSquare);
    if (!legal) return false;

    const piece = chess.get(sourceSquare as Square);
    if (piece && piece.type === 'p') {
      const rank = targetSquare[1];
      const turn = fenTurn(runtime.currentFen);
      if ((rank === '8' && turn === 'w') || (rank === '1' && turn === 'b')) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        setSelectedSquare(null);
        return true;
      }
    }

    setSelectedSquare(null);
    return tryMove(sourceSquare, targetSquare);
  }, [runtime, tryMove]);

  const squareStyles = useMemo((): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!selectedSquare || !runtime) return styles;
    styles[selectedSquare] = { backgroundColor: ZEN_SELECTED_SQUARE };
    const chess = new Chess(runtime.currentFen);
    const moves = chess.moves({ square: selectedSquare as Square, verbose: true });
    for (const m of moves) {
      const isCapture = !!m.captured;
      styles[m.to] = isCapture
        ? { backgroundColor: 'rgba(33,150,243,0.22)', borderRadius: '50%', outline: '3px solid rgba(33,150,243,0.5)', outlineOffset: '-3px' }
        : { background: 'radial-gradient(circle, rgba(33,150,243,0.4) 28%, transparent 29%)', borderRadius: '50%' };
    }
    return styles;
  }, [selectedSquare, runtime]);

  if (!runtime) {
    return <Alert severity="warning">Niepoprawne rozwiązanie etapu (FEN lub PGN).</Alert>;
  }

  return (
    <Box
      key={shakeKey}
      sx={{
        width: '100%',
        height: '100%',
        animation: shakeKey > 0 ? `${shake} 280ms ease` : 'none',
      }}
    >
      <Chessboard
        options={{
          id: `sr-${stage.id}`,
          position: runtime.currentFen,
          boardOrientation: runtime.orientation,
          allowDragging: !runtime.introFen && runtime.expected.length > runtime.expectedIndex && !finishedRef.current,
          onPieceDrop: handlePieceDrop,
          onSquareClick: handleSquareClick,
          squareStyles,
          showAnimations: !pendingPromotion && animateBoard,
          animationDurationInMs: 180,
          boardStyle: {
            width: '100%',
            borderRadius: 12,
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
          },
        }}
      />
      {pendingPromotion && (
        <PromotionPopover
          color={fenTurn(runtime.currentFen)}
          onSelect={(piece) => {
            tryMove(pendingPromotion.from, pendingPromotion.to, piece);
            setPendingPromotion(null);
          }}
        />
      )}
    </Box>
  );
}
