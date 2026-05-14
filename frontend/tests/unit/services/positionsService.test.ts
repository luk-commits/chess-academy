import { describe, it, expect, vi } from 'vitest';
import { positionsService } from '../../../src/services/positionsService';

vi.mock('../../../src/services/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../../src/services/api';
const mockedApiRequest = vi.mocked(apiRequest);

describe('positionsService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls with minimal page param', () => {
    positionsService.fetchCoachPositions({ page: 1 });
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/positions?page=1');
  });

  it('adds perPage param when provided', () => {
    positionsService.fetchCoachPositions({ page: 1, perPage: 20 });
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/positions?page=1&perPage=20');
  });

  it('trims search and does not add whitespace-only search', () => {
    positionsService.fetchCoachPositions({ page: 1, search: '  ruy lopez  ' });
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/positions?page=1&search=ruy+lopez');

    mockedApiRequest.mockClear();
    positionsService.fetchCoachPositions({ page: 1, search: '   ' });
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/positions?page=1');
  });

  it('adds tags param', () => {
    positionsService.fetchCoachPositions({ page: 1, tags: 'a,b,c' });
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/positions?page=1&tags=a%2Cb%2Cc');
  });

  it('adds difficultyMin and difficultyMax including 0', () => {
    positionsService.fetchCoachPositions({ page: 1, difficultyMin: 0, difficultyMax: 3500 });
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/positions?page=1&difficultyMin=0&difficultyMax=3500');
  });

  it('returns apiRequest result unchanged', async () => {
    const expected = { items: [], page: 1, perPage: 12, total: 0, totalPages: 0, search: '' };
    mockedApiRequest.mockResolvedValue(expected);
    const result = await positionsService.fetchCoachPositions({ page: 1 });
    expect(result).toEqual(expected);
  });
});
