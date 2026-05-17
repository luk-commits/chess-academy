import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { SquareHandlerArgs } from 'react-chessboard';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { GlassHeader } from '../../components/zen/GlassHeader';
import { StageProgressBar } from '../../components/zen/StageProgressBar';
import { ScoreBadge, type ScoreDelta } from '../../components/zen/ScoreBadge';
import { CompletionCard } from '../../components/zen/CompletionCard';
import { ZEN_SELECTED_SQUARE, shake } from '../../components/zen/theme';
import { PromotionPopover } from '../../components/chess/PromotionPopover';
import { fenTurn, isUciCheckmate, pieceColor, uciToMove } from '../../utils/chessPosition';
import { buildStageRuntime, type StageRuntime } from '../../utils/stageRuntime';
import { usePlayerTasks } from '../../hooks/usePlayerTasks';

export function PlayerTaskDetailsView() {
  const { taskId, stageId } = useParams<{ taskId: string; stageId?: string }>();
  const navigate = useNavigate();
  const { tasks, loading, error } = usePlayerTasks();

  const [stageIdx, setStageIdx] = useState(0);
  const [runtime, setRuntime] = useState<StageRuntime | null>(null);
  const [score, setScore] = useState(0);
  const [deltas, setDeltas] = useState<ScoreDelta[]>([]);

  const [shakeKey, setShakeKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [animateBoard, setAnimateBoard] = useState(true);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const deltaSeq = useRef(0);

  const task = useMemo(() => {
    const id = Number(taskId);
    return tasks.find(t => t.id === id) ?? null;
  }, [tasks, taskId]);

  const nextTaskId = useMemo(() => {
    if (!task) return null;
    const idx = tasks.findIndex(t => t.id === task.id);
    return idx !== -1 && idx + 1 < tasks.length ? tasks[idx + 1].id : null;
  }, [tasks, task]);

  // Reset session state when switching tasks (not stages)
  useEffect(() => {
    setRuntime(null);
    setScore(0);
    setDeltas([]);
    setShakeKey(0);
    setCompleted(false);
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [taskId]);

  // Redirect /tasks/:taskId → first stage; sync stageIdx from URL stageId
  useEffect(() => {
    if (!task) return;
    if (!stageId) {
      const firstStageId = task.stages[0]?.id;
      if (firstStageId != null) {
        navigate(`/home/player/tasks/${taskId}/stages/${firstStageId}`, { replace: true });
      }
      return;
    }
    const idx = task.stages.findIndex(s => s.id === Number(stageId));
    setStageIdx(idx !== -1 ? idx : 0);
  }, [task, taskId, stageId, navigate]);

  const stages = task?.stages ?? [];
  const currentStage = stages[stageIdx] ?? null;

  useEffect(() => {
    if (!currentStage) return;
    setAnimateBoard(false);
    const rt = buildStageRuntime(currentStage);
    setRuntime(rt);
    setSelectedSquare(null);
    setPendingPromotion(null);
    if (rt?.introFen) {
      const tid = window.setTimeout(() => {
        setAnimateBoard(true);
        requestAnimationFrame(() => {
          setRuntime(prev => prev ? { ...prev, currentFen: prev.introFen!, introFen: null } : prev);
        });
      }, 250);
      return () => clearTimeout(tid);
    }
    const enableTid = window.setTimeout(() => setAnimateBoard(true), 100);
    return () => clearTimeout(enableTid);
  }, [currentStage]);

  useEffect(() => {
    if (!completed || !autoAdvance) return;
    const tid = window.setTimeout(() => {
      if (nextTaskId !== null) {
        navigate(`/home/player/tasks/${nextTaskId}`);
      } else {
        navigate('/home/player/tasks');
      }
    }, 1800);
    return () => clearTimeout(tid);
  }, [completed, autoAdvance, nextTaskId, navigate]);

  const pushDelta = useCallback((value: number) => {
    const id = ++deltaSeq.current;
    setDeltas(prev => [...prev, { id, value }]);
    window.setTimeout(() => setDeltas(prev => prev.filter(d => d.id !== id)), 900);
  }, []);

  const advanceStage = useCallback(() => {
    if (!task) return;
    const nextIdx = stageIdx + 1;
    if (nextIdx >= task.stages.length) {
      setCompleted(true);
      return;
    }
    const nextStageId = task.stages[nextIdx].id;
    navigate(`/home/player/tasks/${taskId}/stages/${nextStageId}`, { replace: true });
  }, [task, stageIdx, taskId, navigate]);

  const playEngineReply = useCallback((rt: StageRuntime) => {
    const engineUci = rt.expected[rt.expectedIndex];
    if (!engineUci) {
      setRuntime(rt);
      window.setTimeout(advanceStage, 450);
      return;
    }
    window.setTimeout(() => {
      const chess = new Chess(rt.currentFen);
      const result = chess.move(uciToMove(engineUci));
      if (!result) { setRuntime(rt); return; }
      const updated: StageRuntime = { ...rt, currentFen: chess.fen(), expectedIndex: rt.expectedIndex + 1 };
      setRuntime(updated);
      if (updated.expectedIndex >= updated.expected.length) {
        window.setTimeout(advanceStage, 600);
      }
    }, 350);
  }, [advanceStage]);

  const tryMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    if (!runtime || completed) return false;
    const expectedUci = runtime.expected[runtime.expectedIndex];
    if (!expectedUci) return false;

    const playerUci = from + to + (promotion ?? '');
    const matches = playerUci === expectedUci;

    if (!matches) {
      const attemptChess = new Chess(runtime.currentFen);
      const altResult = attemptChess.move(uciToMove(playerUci));
      if (altResult && attemptChess.isCheckmate() && isUciCheckmate(runtime.currentFen, expectedUci)) {
        const afterPlayer: StageRuntime = {
          ...runtime,
          currentFen: attemptChess.fen(),
          expectedIndex: runtime.expectedIndex + 1,
        };
        setRuntime(afterPlayer);
        setScore(s => s + 10);
        pushDelta(10);
        window.setTimeout(advanceStage, 450);
        return true;
      }

      setShakeKey(k => k + 1);
      if (!runtime.errored) {
        setRuntime({ ...runtime, errored: true });
        setScore(s => Math.max(0, s - 5));
        pushDelta(-5);
      }
      return false;
    }

    const chess = new Chess(runtime.currentFen);
    const moveResult = chess.move(uciToMove(expectedUci));
    if (!moveResult) return false;

    const afterPlayer: StageRuntime = {
      ...runtime,
      currentFen: chess.fen(),
      expectedIndex: runtime.expectedIndex + 1,
    };
    setRuntime(afterPlayer);
    setScore(s => s + 10);
    pushDelta(10);
    playEngineReply(afterPlayer);
    return true;
  }, [runtime, completed, pushDelta, playEngineReply, advanceStage]);

  const legalTargets = useMemo((): Set<string> => {
    if (!selectedSquare || !runtime) return new Set();
    const chess = new Chess(runtime.currentFen);
    return new Set(
      chess.moves({ square: selectedSquare as Square, verbose: true })
        .map(m => m.to)
    );
  }, [selectedSquare, runtime]);

  const handleSquareClick = useCallback(({ piece, square }: SquareHandlerArgs) => {
    if (!runtime || completed || runtime.introFen) return;
    const isPlayerTurn = runtime.expected.length > runtime.expectedIndex;
    if (!isPlayerTurn) return;

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
  }, [runtime, completed, selectedSquare, legalTargets, tryMove]);

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!targetSquare || !runtime || runtime.introFen) return false;
    const chess = new Chess(runtime.currentFen);
    const legal = chess.moves({ square: sourceSquare as Square, verbose: true })
      .some(m => m.to === targetSquare);
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

  const handleContinue = useCallback(() => {
    if (nextTaskId !== null) navigate(`/home/player/tasks/${nextTaskId}`);
    else navigate('/home/player/tasks');
  }, [nextTaskId, navigate]);

  if (loading) return <PageLayout maxWidth="md"><LoadingState /></PageLayout>;
  if (error) {
    return (
      <PageLayout maxWidth="md">
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/home/player/tasks')}>Wróć do listy</Button>
      </PageLayout>
    );
  }
  if (!task) {
    return (
      <PageLayout maxWidth="md">
        <EmptyState message="Nie znaleziono zadania." />
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/home/player/tasks')}>Wróć do listy</Button>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/home/player/tasks')}>
          Wróć do listy
        </Button>
        <Box sx={{ flex: 1 }} />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
            />
          }
          label={
            <Typography variant="caption" color="text.secondary">
              Auto-następne
            </Typography>
          }
          labelPlacement="start"
          sx={{ m: 0 }}
        />
      </Box>

      <StageProgressBar total={stages.length} currentIndex={stageIdx} />

      <GlassHeader
        title={task.title}
        description={task.description}
        stageTitle={currentStage ? `Etap ${stageIdx + 1} z ${stages.length} · ${currentStage.title}` : ''}
      />

      <Box
        sx={{
          position: 'relative',
          maxWidth: 560,
          mx: 'auto',
          aspectRatio: '1 / 1',
          width: '100%',
        }}
      >
        <ScoreBadge score={score} deltas={deltas} />

        {completed ? (
          <CompletionCard
            score={score}
            hasNext={nextTaskId !== null}
            autoAdvance={autoAdvance}
            onContinue={handleContinue}
          />
        ) : runtime ? (
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
                id: `play-${currentStage?.id ?? 'none'}`,
                position: runtime.currentFen,
                boardOrientation: runtime.orientation,
                allowDragging: !runtime.introFen && runtime.expected.length > runtime.expectedIndex,
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
        ) : (
          <Alert severity="warning">Niepoprawna pozycja startowa tego etapu.</Alert>
        )}
      </Box>
    </PageLayout>
  );
}
