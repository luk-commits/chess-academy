import { tasksService } from '../services/tasksService';
import { useAsyncResource } from './useAsyncResource';
import type { CoachTask } from '../types/coachTasks';

interface UseCoachTasksResult {
  tasks: CoachTask[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useCoachTasks(): UseCoachTasksResult {
  const { data, loading, error, reload } = useAsyncResource(
    () => tasksService.fetchCoachTasks().then((r) => r.tasks),
    [],
    { defaultErrorMessage: 'Nie udało się pobrać zadań.' },
  );

  return { tasks: data ?? [], loading, error, reload };
}
