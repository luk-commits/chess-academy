import { apiRequest } from './api';
import type { CreateTaskPayload, TaskResponse } from '../types/position';
import type {
  CoachStageResponse,
  CoachStageUpdate,
  CoachTaskUpdate,
  CoachTaskUpdateResponse,
  CoachTasksResponse,
} from '../types/coachTasks';

export const tasksService = {
  createTask(payload: CreateTaskPayload): Promise<TaskResponse> {
    return apiRequest<TaskResponse, CreateTaskPayload>('/api/coach/tasks', {
      method: 'POST',
      body: payload,
    });
  },

  fetchCoachTasks(): Promise<CoachTasksResponse> {
    return apiRequest<CoachTasksResponse>('/api/coach/tasks');
  },

  updateCoachTask(taskId: number, update: CoachTaskUpdate): Promise<CoachTaskUpdateResponse> {
    return apiRequest<CoachTaskUpdateResponse, CoachTaskUpdate>(`/api/coach/tasks/${taskId}`, {
      method: 'PATCH',
      body: update,
    });
  },

  fetchCoachStage(stageId: number): Promise<CoachStageResponse> {
    return apiRequest<CoachStageResponse>(`/api/coach/stages/${stageId}`);
  },

  updateCoachStage(stageId: number, update: CoachStageUpdate): Promise<CoachStageResponse> {
    return apiRequest<CoachStageResponse, CoachStageUpdate>(`/api/coach/stages/${stageId}`, {
      method: 'PATCH',
      body: update,
    });
  },
};
