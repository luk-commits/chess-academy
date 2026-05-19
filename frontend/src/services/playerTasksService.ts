import { apiRequest } from './api';
import type { PlayerTasksResponse, StageCompletePayload, StageRepetitionPayload } from '../types/position';

export const playerTasksService = {
  fetchTasks(): Promise<PlayerTasksResponse> {
    return apiRequest<PlayerTasksResponse>('/api/player/tasks');
  },

  startTask(taskId: number): Promise<{ taskProgress: unknown }> {
    return apiRequest(`/api/player/tasks/${taskId}/start`, { method: 'POST' });
  },

  interruptTask(taskId: number): Promise<{ taskProgress: unknown }> {
    return apiRequest(`/api/player/tasks/${taskId}/interrupt`, { method: 'POST' });
  },

  resumeTask(taskId: number): Promise<{ taskProgress: unknown }> {
    return apiRequest(`/api/player/tasks/${taskId}/resume`, { method: 'POST' });
  },

  resetTask(taskId: number): Promise<{ ok: boolean }> {
    return apiRequest(`/api/player/tasks/${taskId}/reset`, { method: 'POST' });
  },

  archiveTask(taskId: number): Promise<{ taskProgress: unknown }> {
    return apiRequest(`/api/player/tasks/${taskId}/archive`, { method: 'POST' });
  },

  restoreTask(taskId: number): Promise<{ ok: boolean }> {
    return apiRequest(`/api/player/tasks/${taskId}/restore`, { method: 'POST' });
  },

  completeStage(taskId: number, stageId: number, payload: StageCompletePayload): Promise<unknown> {
    return apiRequest(`/api/player/tasks/${taskId}/stages/${stageId}/complete`, {
      method: 'POST',
      body: payload,
    });
  },

  setStageRepetition(stageId: number, enabled: boolean, solutionPgn?: string): Promise<unknown> {
    const body: StageRepetitionPayload = { enabled };
    if (solutionPgn !== undefined) body.solutionPgn = solutionPgn;
    return apiRequest<unknown, StageRepetitionPayload>(
      `/api/player/stages/${stageId}/repetition`,
      { method: 'POST', body },
    );
  },
};
