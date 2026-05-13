import { apiRequest } from './api';
import type { GroupsResponse } from '../types/position';

export const groupsService = {
  fetchCoachGroups(): Promise<GroupsResponse> {
    return apiRequest<GroupsResponse>('/api/coach/groups');
  },
};
