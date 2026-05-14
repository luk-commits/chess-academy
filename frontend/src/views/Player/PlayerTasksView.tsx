import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { playerTasksService } from '../../services/playerTasksService';
import type { PlayerTask } from '../../types/position';
import { isValidFen, boardOrientationFromFen, applyFirstMoveToFen } from '../../utils/chessPosition';
import PositionCard from '../../components/PositionCard';

export function PlayerTasksView() {
  const [tasks, setTasks] = useState<PlayerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardTagsExpanded, setCardTagsExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await playerTasksService.fetchTasks();
        if (!cancelled) {
          setTasks(data.tasks);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Nie udalo sie pobrac zadan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const handleToggleTags = useCallback((id: number) => {
    setCardTagsExpanded(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const allPositions = useMemo(() => {
    const flat: Array<{ taskId: number; taskTitle: string; key: string; position: PlayerTask['stages'][0]['position'] }> = [];
    for (const task of tasks) {
      for (const stage of task.stages) {
        flat.push({ taskId: task.id, taskTitle: task.title, key: `task-${task.id}-stage-${stage.id}`, position: stage.position });
      }
    }
    return flat;
  }, [tasks]);

  const totalPositions = allPositions.length;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4, px: 2 }}>
      <Container maxWidth="lg">
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 4, mb: 3, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h4" gutterBottom>Zadania</Typography>
          {totalPositions > 0 && (
            <Typography variant="body1" color="text.secondary">
              {tasks.length} zada{tasks.length === 1 ? 'nie' : 'ń'}, {totalPositions} pozycji
            </Typography>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : totalPositions === 0 ? (
          <Paper elevation={1} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Nie masz jeszcze żadnych zadań. Skontaktuj się z trenerem, aby otrzymać zadania.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {allPositions.map(({ key, position }) => {
              const fen = applyFirstMoveToFen(position.fen, position.firstMove);
              const validFen = isValidFen(fen);
              return (
                <Grid key={key} size={{ xs: 12, md: 6, lg: 4 }}>
                  <PositionCard
                    position={position}
                    fen={fen}
                    validFen={validFen}
                    boardOrientation={boardOrientationFromFen(fen)}
                    isSelected={false}
                    tagsExpanded={!!cardTagsExpanded[position.id]}
                    onToggle={() => {}}
                    onCopy={() => {}}
                    onToggleTags={handleToggleTags}
                    hideCheckbox
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
