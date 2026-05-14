import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Fade,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Tooltip,
  Typography,
  keyframes,
} from '@mui/material';
import ArrowBack from '@mui/icons-material/ArrowBack';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import EmojiEventsOutlined from '@mui/icons-material/EmojiEventsOutlined';
import { Chess } from 'chess.js';
import type { Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { SquareHandlerArgs } from 'react-chessboard';
import { playerTasksService } from '../../services/playerTasksService';
import type { PlayerTask, PlayerTaskStage } from '../../types/position';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { applyFirstMoveToFen, boardOrientationFromFen, isValidFen } from '../../utils/chessPosition';

const ACCENT = '#2196f3';
const MUTED = 'rgba(148, 163, 184, 0.35)';
const REWARD = '#16a34a';
const PENALTY = '#fb7185';
const SELECTED_SQ = 'rgba(33, 150, 243, 0.35)';

const floatUp = keyframes`
  0%   { opacity: 0; transform: translate(-50%, 0) scale(0.85); }
  20%  { opacity: 1; transform: translate(-50%, -10px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -55px) scale(1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
`;

interface FloatDelta { id: number; value: number; }

function RollingScore({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;
    const duration = 450;
    let raf = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display}</>;
}

function ProgressBar({ total, currentIndex }: { total: number; currentIndex: number }) {
  return (
    <Box sx={{ width: '100%', maxWidth: 560, mx: 'auto', display: 'flex', gap: 0.75, mb: 2 }}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i <= currentIndex;
        return (
          <Box
            key={i}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 999,
              bgcolor: active ? ACCENT : MUTED,
              transition: 'background-color 0.4s ease',
              boxShadow: active ? `0 0 8px ${ACCENT}55` : 'none',
            }}
          />
        );
      })}
    </Box>
  );
}

function ScoreBadge({ score, deltas }: { score: number; deltas: FloatDelta[] }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.5,
        borderRadius: 999,
        bgcolor: 'rgba(15, 23, 42, 0.85)',
        color: '#f1f5f9',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: 600,
        fontSize: 14,
        zIndex: 4,
        pointerEvents: 'none',
      }}
    >
      <EmojiEventsOutlined sx={{ fontSize: 16, color: '#facc15' }} />
      <Box component="span" sx={{ minWidth: 32, textAlign: 'right' }}>
        <RollingScore value={score} />
      </Box>
      {deltas.map((d) => (
        <Box
          key={d.id}
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            color: d.value > 0 ? REWARD : PENALTY,
            fontWeight: 700,
            fontSize: 14,
            animation: `${floatUp} 900ms ease-out forwards`,
            pointerEvents: 'none',
          }}
        >
          {d.value > 0 ? `+${d.value}` : d.value}
        </Box>
      ))}
    </Box>
  );
}

function GlassHeader({
  title, description, stageTitle, minimized, onExpand,
}: {
  title: string;
  description: string;
  stageTitle: string;
  minimized: boolean;
  onExpand: () => void;
}) {
  if (minimized) {
    return (
      <Tooltip title={`${title}${description ? ' — ' + description : ''}`} placement="bottom">
        <IconButton
          onClick={onExpand}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            bgcolor: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.5)',
            zIndex: 4,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.85)' },
          }}
        >
          <InfoOutlined fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Fade in timeout={400}>
      <Paper
        elevation={0}
        sx={{
          mx: 'auto',
          maxWidth: 560,
          mb: 2,
          px: 3,
          py: 2,
          borderRadius: 3,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.65), rgba(241,245,249,0.45))',
          border: '1px solid rgba(255,255,255,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Typography variant="overline" sx={{ color: ACCENT, fontWeight: 700, letterSpacing: 1 }}>
          {stageTitle}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25, mt: 0.25 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Paper>
    </Fade>
  );
}

interface StageRuntime {
  introFen: string | null;
  expected: string[];
  expectedIndex: number;
  orientation: 'white' | 'black';
  currentFen: string;
  errored: boolean;
}

function buildStageRuntime(stage: PlayerTaskStage): StageRuntime | null {
  const baseFen = stage.position.fen;
  if (!isValidFen(baseFen)) return null;
  const moves = stage.position.moves ?? (stage.position.firstMove ? [stage.position.firstMove] : []);
  if (moves.length === 0) {
    return {
      introFen: null,
      expected: [],
      expectedIndex: 0,
      orientation: boardOrientationFromFen(baseFen),
      currentFen: baseFen,
      errored: false,
    };
  }
  const startFen = applyFirstMoveToFen(baseFen, moves[0]);
  return {
    introFen: startFen,
    expected: moves.slice(1),
    expectedIndex: 0,
    orientation: boardOrientationFromFen(startFen),
    currentFen: baseFen,
    errored: false,
  };
}

function uciToMove(uci: string): { from: string; to: string; promotion?: string } {
  const move: { from: string; to: string; promotion?: string } = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) move.promotion = uci.slice(4);
  return move;
}

function pieceColor(piece: string): 'w' | 'b' {
  return piece[0] === 'w' ? 'w' : 'b';
}

function fenTurn(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

export function PlayerTaskDetailsView() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<PlayerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stageIdx, setStageIdx] = useState(0);
  const [runtime, setRuntime] = useState<StageRuntime | null>(null);
  const [score, setScore] = useState(0);
  const [deltas, setDeltas] = useState<FloatDelta[]>([]);
  const [headerMinimized, setHeaderMinimized] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const deltaSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await playerTasksService.fetchTasks();
        if (!cancelled) setTasks(data.tasks);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Nie udało się pobrać zadania.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const task = useMemo(() => {
    const id = Number(taskId);
    return tasks.find(t => t.id === id) ?? null;
  }, [tasks, taskId]);

  const nextTaskId = useMemo(() => {
    if (!task) return null;
    const idx = tasks.findIndex(t => t.id === task.id);
    return idx !== -1 && idx + 1 < tasks.length ? tasks[idx + 1].id : null;
  }, [tasks, task]);

  useEffect(() => {
    setStageIdx(0);
    setRuntime(null);
    setScore(0);
    setDeltas([]);
    setHeaderMinimized(false);
    setShakeKey(0);
    setCompleted(false);
    setSelectedSquare(null);
  }, [taskId]);

  const stages = task?.stages ?? [];
  const currentStage = stages[stageIdx] ?? null;

  useEffect(() => {
    if (!currentStage) return;
    const rt = buildStageRuntime(currentStage);
    setRuntime(rt);
    setHeaderMinimized(false);
    setSelectedSquare(null);
    if (rt?.introFen) {
      const tid = window.setTimeout(() => {
        setRuntime(prev => prev ? { ...prev, currentFen: prev.introFen!, introFen: null } : prev);
      }, 600);
      return () => clearTimeout(tid);
    }
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
    if (stageIdx + 1 >= task.stages.length) {
      setCompleted(true);
      return;
    }
    setStageIdx(i => i + 1);
  }, [task, stageIdx]);

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

  const tryMove = useCallback((from: string, to: string): boolean => {
    if (!runtime || completed) return false;
    const expectedUci = runtime.expected[runtime.expectedIndex];
    if (!expectedUci) return false;

    const matches = from === expectedUci.slice(0, 2) && to === expectedUci.slice(2, 4);

    if (!matches) {
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
    if (!headerMinimized) setHeaderMinimized(true);
    playEngineReply(afterPlayer);
    return true;
  }, [runtime, completed, pushDelta, headerMinimized, playEngineReply]);

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
    setSelectedSquare(null);
    return tryMove(sourceSquare, targetSquare);
  }, [runtime, tryMove]);

  const squareStyles = useMemo((): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!selectedSquare || !runtime) return styles;
    styles[selectedSquare] = { backgroundColor: SELECTED_SQ };
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

      <ProgressBar total={stages.length} currentIndex={stageIdx} />

      <GlassHeader
        title={task.title}
        description={task.description}
        stageTitle={currentStage ? `Etap ${stageIdx + 1} z ${stages.length} · ${currentStage.title}` : ''}
        minimized={headerMinimized && !completed}
        onExpand={() => setHeaderMinimized(false)}
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
          <Paper
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              textAlign: 'center',
              gap: 1.5,
              background: 'linear-gradient(135deg, #ffffff, #f0f9ff)',
            }}
          >
            <EmojiEventsOutlined sx={{ fontSize: 56, color: '#facc15' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Zadanie ukończone
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Wynik końcowy: <strong>{score}</strong>
            </Typography>
            {autoAdvance && (
              <Typography variant="caption" color="text.secondary">
                {nextTaskId !== null ? 'Przechodzę do następnego...' : 'Brak kolejnego zadania.'}
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={() => nextTaskId !== null ? navigate(`/home/player/tasks/${nextTaskId}`) : navigate('/home/player/tasks')}
              sx={{ mt: 1 }}
            >
              {nextTaskId !== null ? 'Następne zadanie' : 'Wróć do listy zadań'}
            </Button>
          </Paper>
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
                showAnimations: true,
                animationDurationInMs: 180,
                boardStyle: {
                  width: '100%',
                  borderRadius: 12,
                  boxShadow: '0 12px 40px rgba(15, 23, 42, 0.18)',
                },
              }}
            />
          </Box>
        ) : (
          <Alert severity="warning">Niepoprawna pozycja startowa tego etapu.</Alert>
        )}
      </Box>
    </PageLayout>
  );
}
