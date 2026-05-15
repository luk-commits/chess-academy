import { playerStagesService } from '../services/playerStagesService';
import { useAsyncResource } from './useAsyncResource';
import type { DueStage } from '../types/playerStages';

interface UseDueStagesResult {
  stages: DueStage[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useDueStages(): UseDueStagesResult {
  const { data, loading, error, reload } = useAsyncResource(
    () => playerStagesService.fetchDue().then((r) => r.stages),
    [],
    { defaultErrorMessage: 'Nie udało się pobrać kolejki powtórek.' },
  );

  return { stages: data ?? [], loading, error, reload };
}
