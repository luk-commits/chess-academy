import { useEffect, useState } from 'react';
import { playerTasksService } from '../services/playerTasksService';
import type { PlayerTask } from '../types/position';

interface UsePlayerTasksResult {
  tasks: PlayerTask[];
  loading: boolean;
  error: string | null;
}

export function usePlayerTasks(): UsePlayerTasksResult {
  const [tasks, setTasks] = useState<PlayerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await playerTasksService.fetchTasks();
        if (!cancelled) setTasks(data.tasks);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Nie udało się pobrać zadań.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { tasks, loading, error };
}
