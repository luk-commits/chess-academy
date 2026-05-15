import { playerTasksService } from '../services/playerTasksService';
import type { PlayerTask } from '../types/position';
import { useAsyncResource } from './useAsyncResource';

interface UsePlayerTasksResult {
  tasks: PlayerTask[];
  loading: boolean;
  error: string | null;
}

export function usePlayerTasks(): UsePlayerTasksResult {
  const { data, loading, error } = useAsyncResource(
    () => playerTasksService.fetchTasks().then((d) => d.tasks),
    [],
    { defaultErrorMessage: 'Nie udało się pobrać zadań.' },
  );

  return { tasks: data ?? [], loading, error };
}
