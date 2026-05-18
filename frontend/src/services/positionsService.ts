import { apiRequest } from './api';
import type { PositionsResponse } from '../types/position';

interface FetchPositionsParams {
  page: number;
  perPage?: number;
  search?: string;
  tags?: string;
  difficultyMin?: number;
  difficultyMax?: number;
  onlyNew?: boolean;
}

export const positionsService = {
  fetchCoachPositions(params: FetchPositionsParams): Promise<PositionsResponse> {
    const query = new URLSearchParams();
    query.set('page', String(params.page));

    if (params.perPage !== undefined) {
      query.set('perPage', String(params.perPage));
    }

    if (params.search && params.search.trim() !== '') {
      query.set('search', params.search.trim());
    }

    if (params.tags) {
      query.set('tags', params.tags);
    }

    if (params.difficultyMin !== undefined) {
      query.set('difficultyMin', String(params.difficultyMin));
    }

    if (params.difficultyMax !== undefined) {
      query.set('difficultyMax', String(params.difficultyMax));
    }

    if (params.onlyNew) {
      query.set('onlyNew', '1');
    }

    return apiRequest<PositionsResponse>(`/api/coach/positions?${query.toString()}`);
  },
};
