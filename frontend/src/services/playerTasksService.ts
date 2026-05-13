import { apiRequest } from './api';
import type { PlayerTasksResponse } from '../types/position';

export const playerTasksService = {
  fetchTasks(): Promise<PlayerTasksResponse> {
    return apiRequest<PlayerTasksResponse>('/api/player/tasks');
  },
};
