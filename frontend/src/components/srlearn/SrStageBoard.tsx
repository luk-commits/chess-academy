import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box } from '@mui/material';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { PromotionPopover } from '../chess/PromotionPopover';
import { shake } from '../zen/theme';
import { fenTurn, isUciCheckmate, uciToMove } from '../../utils/chessPosition';
import { buildPgnRuntime, type PgnRuntime } from '../../utils/pgnRuntime';
import { useChessInteraction } from '../../hooks/useChessInteraction';
import { useStageIntroAnimation } from '../../hooks/useStageIntroAnimation';
import type { DueStage } from '../../types/playerStages';

interface Props {
  stage: DueStage;
  onComplete: (passed: boolean) => void;
}

export function SrStageBoard({ stage, onComplete }: Props) {
  const [runtime, setRuntime] = useState<PgnRuntime | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const finishedRef = useRef(false);

  const revealIntro = useCallback(() => {
    setRuntime((prev) => (prev ? { ...prev, currentFen: prev.introFen!, introFen: null } : prev));
  }, []);

  const buildKey = useMemo(() => `${stage.id}|${stage.position.fen}|${stage.solutionPgn}`, [stage.id, stage.position.fen, stage.solutionPgn]);

  useEffect(() => {
    finishedRef.current = false;
    const rt = buildPgnRuntime(stage.position.fen, stage.solutionPgn);
    setRuntime(rt);
  }, [buildKey, stage.position.fen, stage.solutionPgn]);

  const animateBoard = useStageIntroAnimation(buildKey, !!runtime?.introFen, revealIntro);

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

  const {
    pendingPromotion,
    setPendingPromotion,
    handleSquareClick,
    canDragPiece,
    handlePieceDrop,
    squareStyles,
  } = useChessInteraction({ runtime, disabled: finishedRef.current, tryMove });

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
          canDragPiece,
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
