import { tasksService } from '../services/tasksService';
import { groupsService } from '../services/groupsService';
import { useAsyncResource } from './useAsyncResource';
import type { EnrichedCoachTask, GroupAssignee } from '../types/coachTasks';

interface UseCoachTasksResult {
  tasks: EnrichedCoachTask[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function buildGroupLookup(): Promise<Map<number, GroupAssignee>> {
  return groupsService.fetchCoachGroups().then((data) => {
    const map = new Map<number, GroupAssignee>();
    for (const ind of data.individuals) {
      map.set(ind.groupId, { groupId: ind.groupId, label: ind.playerName, type: 'individual' });
    }
    for (const cls of data.classes) {
      map.set(cls.groupId, { groupId: cls.groupId, label: cls.name, type: 'class' });
    }
    return map;
  });
}

function enrichTask(task: { id: number; groupIds: number[] }, lookup: Map<number, GroupAssignee>): GroupAssignee[] {
  return (task.groupIds ?? [])
    .map((gid) => lookup.get(gid))
    .filter((a): a is GroupAssignee => a !== undefined);
}

export function useCoachTasks(): UseCoachTasksResult {
  const { data, loading, error, reload } = useAsyncResource(
    () => Promise.all([
      tasksService.fetchCoachTasks().then((r) => r.tasks),
      buildGroupLookup(),
    ]).then(([tasks, lookup]) =>
      tasks.map((t) => ({
        ...t,
        assignees: enrichTask(t, lookup),
      }))
    ),
    [],
    { defaultErrorMessage: 'Nie udało się pobrać zadań.' },
  );

  return { tasks: data ?? [], loading, error, reload };
}
