import { apiRequest } from './api';
export const positionsService = {
    fetchCoachPositions(params) {
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
        return apiRequest(`/api/coach/positions?${query.toString()}`);
    },
};
