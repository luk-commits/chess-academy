import { apiRequest } from './api';
import type { CreateTaskPayload, TaskResponse } from '../types/position';

export const tasksService = {
  createTask(payload: CreateTaskPayload): Promise<TaskResponse> {
    return apiRequest<TaskResponse, CreateTaskPayload>('/api/coach/tasks', {
      method: 'POST',
      body: payload,
    });
  },
};
