import { useMemo, useState } from 'react';
import { Alert, Box, Button, Snackbar } from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { PlayerTask } from '../../types/position';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { CoachTasksSection } from '../../components/tasks/CoachTasksSection';
import { usePlayerTasks } from '../../hooks/usePlayerTasks';
import { playerTasksService } from '../../services/playerTasksService';

export function PlayerTasksView() {
  const { tasks, loading, error, reload } = usePlayerTasks();
  const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null);

  const activeTasks = useMemo(() => tasks.filter(t => t.taskProgress?.status !== 'archived'), [tasks]);

  const completedTasks = useMemo(() => activeTasks.filter(t => t.taskProgress?.status === 'completed'), [activeTasks]);
  const inProgressTasks = useMemo(() => activeTasks.filter(t => !t.taskProgress || t.taskProgress.status === 'new' || t.taskProgress.status === 'in_progress' || t.taskProgress.status === 'interrupted'), [activeTasks]);

  const groupedByCoach = useMemo(() => {
    const groups: Record<string, PlayerTask[]> = {};
    for (const task of inProgressTasks) {
      const coach = task.coachName || 'Nieznany trener';
      if (!groups[coach]) groups[coach] = [];
      groups[coach].push(task);
    }
    return groups;
  }, [inProgressTasks]);

  const handleArchive = async (taskId: number) => {
    try {
      await playerTasksService.archiveTask(taskId);
      reload();
      setSnackbarMsg('Zadanie przeniesione do archiwum.');
    } catch {
      setSnackbarMsg('Nie udało się zarchiwizować zadania.');
    }
  };

  const handleReset = async (taskId: number) => {
    try {
      await playerTasksService.resetTask(taskId);
      reload();
      setSnackbarMsg('Progres zadania został zresetowany.');
    } catch {
      setSnackbarMsg('Nie udało się zresetować zadania.');
    }
  };

  return (
    <PageLayout>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <LoadingState />
      ) : activeTasks.length === 0 ? (
        <EmptyState message="Nie masz jeszcze żadnych zadań. Skontaktuj się z trenerem, aby otrzymać zadania." />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.entries(groupedByCoach).map(([coachName, coachTasks]) => (
            <CoachTasksSection
              key={coachName}
              coachName={coachName}
              tasks={coachTasks}
            />
          ))}

          {completedTasks.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {completedTasks.map(task => (
                  <Box key={task.id} sx={{ display: 'flex', gap: 1, alignItems: 'center', width: '100%', p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <strong>{task.title}</strong> <em>(ukończone)</em>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<ArchiveIcon />}
                      variant="outlined"
                      onClick={() => handleArchive(task.id)}
                    >
                      Archiwizuj
                    </Button>
                    <Button
                      size="small"
                      startIcon={<RestartAltIcon />}
                      variant="outlined"
                      color="warning"
                      onClick={() => handleReset(task.id)}
                    >
                      Resetuj
                    </Button>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}

      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg(null)}
        message={snackbarMsg}
      />
    </PageLayout>
  );
}
