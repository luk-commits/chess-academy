import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import PlusOneIcon from '@mui/icons-material/PlusOne';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Cancel from '@mui/icons-material/Cancel';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { PieceHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { GlassHeader } from '../../components/zen/GlassHeader';
import { StageProgressBar } from '../../components/zen/StageProgressBar';
import { type ScoreDelta } from '../../components/zen/ScoreBadge';
import { CompletionCard } from '../../components/zen/CompletionCard';
import { ZEN_PENALTY, ZEN_REWARD, ZEN_SELECTED_SQUARE, shake } from '../../components/zen/theme';
import { PromotionPopover } from '../../components/chess/PromotionPopover';
import { fenTurn, isUciCheckmate, pieceColor, uciToMove } from '../../utils/chessPosition';
import { buildStageRuntime, type StageRuntime } from '../../utils/stageRuntime';
import { usePlayerTasks } from '../../hooks/usePlayerTasks';
import { playerTasksService } from '../../services/playerTasksService';
import type { StageCompletePayload } from '../../types/position';

export function PlayerTaskDetailsView() {
  const { taskId, stageId } = useParams<{ taskId: string; stageId?: string }>();
  const navigate = useNavigate();
  const { tasks, loading, error, reload } = usePlayerTasks();

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
  const [feedback, setFeedback] = useState<{ kind: 'pass' | 'fail' } | null>(null);
  const deltaSeq = useRef(0);

  // Stage stats tracking
  const stageStartRef = useRef<number>(0);
  const lastDecisionRef = useRef<number>(0);
  const moveTimesMsRef = useRef<number[]>([]);
  const wrongMovesRef = useRef<string[]>([]);
  const errorsTotalRef = useRef<number>(0);
  const attemptsTotalRef = useRef<number>(0);
  const firstErrorAtPlyRef = useRef<number | null>(null);
  const moveCountRef = useRef<number>(0);

  const task = useMemo(() => {
    const id = Number(taskId);
    return tasks.find(t => t.id === id) ?? null;
  }, [tasks, taskId]);

  const nextTaskId = useMemo(() => {
    if (!task) return null;
    const idx = tasks.findIndex(t => t.id === task.id);
    return idx !== -1 && idx + 1 < tasks.length ? tasks[idx + 1].id : null;
  }, [tasks, task]);

  // Reset session state when switching tasks
  useEffect(() => {
    setRuntime(null);
    setScore(0);
    setDeltas([]);
    setShakeKey(0);
    setCompleted(false);
    setSelectedSquare(null);
    setPendingPromotion(null);
  }, [taskId]);

  // Auto start/resume task progress on mount
  const initialisedRef = useRef(false);
  useEffect(() => {
    if (!task || initialisedRef.current) return;
    initialisedRef.current = true;
    const tp = task.taskProgress;
    if (tp?.status === 'new' || !tp) {
      playerTasksService.startTask(task.id).catch(() => {});
    } else if (tp.status === 'interrupted') {
      playerTasksService.resumeTask(task.id).catch(() => {});
    }
  }, [task]);

  // Redirect /tasks/:taskId -> first stage; sync stageIdx from URL stageId or progress
  useEffect(() => {
    if (!task) return;
    const tp = task.taskProgress;
    const targetStageId = stageId
      ? Number(stageId)
      : (tp?.currentStageId ?? task.stages[0]?.id);
    if (!stageId && targetStageId) {
      navigate(`/home/player/tasks/${taskId}/stages/${targetStageId}`, { replace: true });
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

    // Reset stage stats
    const now = performance.now();
    stageStartRef.current = now;
    lastDecisionRef.current = now;
    moveTimesMsRef.current = [];
    wrongMovesRef.current = [];
    errorsTotalRef.current = 0;
    attemptsTotalRef.current = 0;
    firstErrorAtPlyRef.current = null;
    moveCountRef.current = 0;

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

  const sendCompleteStats = useCallback(async () => {
    if (!task || !currentStage) return;
    const moveTimes = moveTimesMsRef.current;
    const payload: StageCompletePayload = {
      thinkingTimeMs: Math.round(performance.now() - stageStartRef.current),
      attemptsTotal: attemptsTotalRef.current,
      errorsTotal: errorsTotalRef.current,
      wrongMoves: wrongMovesRef.current,
      moveTimesMs: moveTimes,
      firstErrorAtPly: firstErrorAtPlyRef.current,
    };
    try {
      await playerTasksService.completeStage(task.id, currentStage.id, payload);
      reload();
    } catch {
      // silently fail stats save
    }
  }, [task, currentStage, reload]);

  const advanceStage = useCallback(() => {
    if (!task) return;
    const nextIdx = stageIdx + 1;
    if (nextIdx >= task.stages.length) {
      setCompleted(true);
      sendCompleteStats();
      return;
    }
    sendCompleteStats();
    const nextStageId = task.stages[nextIdx].id;
    navigate(`/home/player/tasks/${taskId}/stages/${nextStageId}`, { replace: true });
  }, [task, stageIdx, taskId, navigate, sendCompleteStats]);

  const completeWithFeedback = useCallback(() => {
    setFeedback({ kind: 'pass' });
    window.setTimeout(() => {
      advanceStage();
      window.setTimeout(() => {
        setFeedback(null);
      }, 400);
    }, 1500);
  }, [advanceStage]);

  const playEngineReply = useCallback((rt: StageRuntime) => {
    const engineUci = rt.expected[rt.expectedIndex];
    if (!engineUci) {
      setRuntime(rt);
      window.setTimeout(completeWithFeedback, 450);
      return;
    }
    window.setTimeout(() => {
      const chess = new Chess(rt.currentFen);
      const result = chess.move(uciToMove(engineUci));
      if (!result) { setRuntime(rt); return; }
      const updated: StageRuntime = { ...rt, currentFen: chess.fen(), expectedIndex: rt.expectedIndex + 1 };
      setRuntime(updated);
      if (updated.expectedIndex >= updated.expected.length) {
        window.setTimeout(completeWithFeedback, 600);
      }
    }, 350);
  }, [completeWithFeedback]);

  const tryMove = useCallback((from: string, to: string, promotion?: string): boolean => {
    if (!runtime || completed) return false;
    const expectedUci = runtime.expected[runtime.expectedIndex];
    if (!expectedUci) return false;

    const playerUci = from + to + (promotion ?? '');
    const now = performance.now();

    // Track move time
    if (lastDecisionRef.current > 0) {
      moveTimesMsRef.current.push(Math.round(now - lastDecisionRef.current));
    }
    lastDecisionRef.current = now;
    attemptsTotalRef.current += 1;

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
        moveCountRef.current += 1;
        window.setTimeout(completeWithFeedback, 450);
        return true;
      }

      setShakeKey(k => k + 1);
      errorsTotalRef.current += 1;
      wrongMovesRef.current.push(playerUci);
      if (firstErrorAtPlyRef.current === null) {
        firstErrorAtPlyRef.current = moveCountRef.current;
      }
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
    moveCountRef.current += 1;
    playEngineReply(afterPlayer);
    return true;
  }, [runtime, completed, pushDelta, playEngineReply, completeWithFeedback]);

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

  const canDragPiece = useCallback(({ piece }: PieceHandlerArgs): boolean => {
    if (!runtime || runtime.introFen) return false;
    if (runtime.expected.length <= runtime.expectedIndex) return false;
    return pieceColor(piece.pieceType) === fenTurn(runtime.currentFen);
  }, [runtime]);

  const handlePieceDrop = useCallback(({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (!targetSquare || !runtime || runtime.introFen) return false;
    const chess = new Chess(runtime.currentFen);
    const dragPiece = chess.get(sourceSquare as Square);
    if (!dragPiece || dragPiece.color !== fenTurn(runtime.currentFen)) return false;
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

  const handleInterrupt = useCallback(() => {
    if (task) {
      playerTasksService.interruptTask(task.id).catch(() => {});
    }
    navigate('/home/player/tasks');
  }, [task, navigate]);

  const uciMovesToPgn = useCallback((fen: string, uciMoves: string[]): string => {
    try {
      const chess = new Chess(fen);
      for (const uci of uciMoves) {
        chess.move(uciToMove(uci));
      }
      return chess.pgn();
    } catch {
      return '';
    }
  }, []);

  const handleToggleRepetition = useCallback(() => {
    if (!currentStage) return;
    const sp = currentStage.progress;
    const newEnabled = !(sp?.inRepetition ?? false);
    const moves = currentStage.position.moves ?? (currentStage.position.firstMove ? [currentStage.position.firstMove] : []);
    const pgn = newEnabled ? uciMovesToPgn(currentStage.position.fen, moves) : undefined;
    playerTasksService.setStageRepetition(currentStage.id, newEnabled, pgn).then(() => reload()).catch(() => {});
  }, [currentStage, reload, uciMovesToPgn]);

  const stageProgress = currentStage?.progress;

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
        <Button startIcon={<ArrowBack />} onClick={handleInterrupt}>
          Przerwij
        </Button>

        {currentStage && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlusOneIcon />}
            color={stageProgress?.inRepetition ? 'primary' : 'inherit'}
            onClick={handleToggleRepetition}
            sx={{ textTransform: 'none' }}
          >
            {stageProgress?.inRepetition ? 'Usuń z powtórek' : 'Dodaj do powtórek'}
          </Button>
        )}

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
        score={score}
        deltas={deltas}
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
        ) : (
          <Alert severity="warning">Niepoprawna pozycja startowa tego etapu.</Alert>
        )}

        {feedback && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(15, 23, 42, 0.55)',
              borderRadius: 3,
              color: 'common.white',
              zIndex: 2,
              gap: 1,
            }}
          >
            {feedback.kind === 'pass' ? (
              <CheckCircle sx={{ fontSize: 80, color: ZEN_REWARD }} />
            ) : (
              <Cancel sx={{ fontSize: 80, color: ZEN_PENALTY }} />
            )}
            <Typography variant="h6">
              {feedback.kind === 'pass' ? 'Świetnie!' : 'Następnym razem.'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Stage statistics panel */}
      {currentStage && stageProgress && stageProgress.status === 'completed' && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: 'grey.50',
            border: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Statystyki etapu
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {stageProgress.thinkingTimeMs > 0 && (
              <Chip
                label={`Czas: ${Math.round(stageProgress.thinkingTimeMs / 1000)}s`}
                size="small"
                variant="outlined"
              />
            )}
            {stageProgress.errorsTotal > 0 && (
              <Chip
                label={`Błędy: ${stageProgress.errorsTotal}`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
            {stageProgress.avgMoveTimeMs > 0 && (
              <Chip
                label={`Średni ruch: ${Math.round(stageProgress.avgMoveTimeMs / 1000)}s`}
                size="small"
                variant="outlined"
              />
            )}
            {stageProgress.longestMoveTimeMs > 0 && (
              <Chip
                label={`Najdłuższy: ${Math.round(stageProgress.longestMoveTimeMs / 1000)}s`}
                size="small"
                variant="outlined"
              />
            )}
            {stageProgress.wrongMoves.length > 0 && (
              <Chip
                label={`Błędne ruchy: ${stageProgress.wrongMoves.join(', ')}`}
                size="small"
                color="error"
                variant="outlined"
              />
            )}
            {stageProgress.inRepetition && (
              <Chip
                label="W powtórkach"
                size="small"
                color="success"
                variant="filled"
              />
            )}
          </Box>
        </Box>
      )}
    </PageLayout>
  );
}
