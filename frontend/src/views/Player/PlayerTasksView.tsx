import { useEffect, useMemo, useState } from 'react';
import { Alert, Paper, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { playerTasksService } from '../../services/playerTasksService';
import type { PlayerTask } from '../../types/position';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { PositionGrid } from '../../components/positions/PositionGrid';
import { useCardTagsExpanded } from '../../hooks/useCardTagsExpanded';

export function PlayerTasksView() {
  const [tasks, setTasks] = useState<PlayerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { expanded: cardTagsExpanded, toggle: handleToggleTags } = useCardTagsExpanded();

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

  const allPositions = useMemo(() => {
    const flat: Array<{ taskId: number; key: string; position: PlayerTask['stages'][0]['position'] }> = [];
    for (const task of tasks) {
      for (const stage of task.stages) {
        flat.push({ taskId: task.id, key: `task-${task.id}-stage-${stage.id}`, position: stage.position });
      }
    }
    return flat;
  }, [tasks]);

  const totalPositions = allPositions.length;

  return (
    <PageLayout>
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
        <LoadingState />
      ) : totalPositions === 0 ? (
        <EmptyState message="Nie masz jeszcze żadnych zadań. Skontaktuj się z trenerem, aby otrzymać zadania." />
      ) : (
        <PositionGrid
          positions={allPositions.map(p => p.position)}
          cardTagsExpanded={cardTagsExpanded}
          onToggleTags={handleToggleTags}
          hideCheckbox
          keyPrefix="player"
        />
      )}
    </PageLayout>
  );
}
