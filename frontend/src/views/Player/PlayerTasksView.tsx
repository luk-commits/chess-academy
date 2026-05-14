import { useMemo } from 'react';
import { Alert, Box } from '@mui/material';
import type { PlayerTask } from '../../types/position';
import { PageLayout } from '../../components/layout/PageLayout';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { CoachTasksSection } from '../../components/tasks/CoachTasksSection';
import { usePlayerTasks } from '../../hooks/usePlayerTasks';

export function PlayerTasksView() {
  const { tasks, loading, error } = usePlayerTasks();

  const groupedByCoach = useMemo(() => {
    const groups: Record<string, PlayerTask[]> = {};
    for (const task of tasks) {
      const coach = task.coachName || 'Nieznany trener';
      if (!groups[coach]) groups[coach] = [];
      groups[coach].push(task);
    }
    return groups;
  }, [tasks]);

  return (
    <PageLayout>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <LoadingState />
      ) : tasks.length === 0 ? (
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
        </Box>
      )}
    </PageLayout>
  );
}
