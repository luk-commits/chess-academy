import { apiRequest } from './api';
import type { AttemptResponse, DueStagesResponse } from '../types/playerStages';

export const playerStagesService = {
  fetchDue(): Promise<DueStagesResponse> {
    return apiRequest<DueStagesResponse>('/api/player/stages/due');
  },

  submitAttempt(stageId: number, passed: boolean): Promise<AttemptResponse> {
    return apiRequest<AttemptResponse, { passed: boolean }>(
      `/api/player/stages/${stageId}/attempt`,
      { method: 'POST', body: { passed } },
    );
  },
};
