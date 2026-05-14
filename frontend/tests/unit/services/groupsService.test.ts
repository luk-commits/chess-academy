import { describe, it, expect, vi } from 'vitest';
import { groupsService } from '../../../src/services/groupsService';

vi.mock('../../../src/services/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../../src/services/api';
const mockedApiRequest = vi.mocked(apiRequest);

describe('groupsService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiRequest GET /api/coach/groups without options and returns result', async () => {
    const expected = { individuals: [], classes: [] };
    mockedApiRequest.mockResolvedValue(expected);
    const result = await groupsService.fetchCoachGroups();
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/groups');
    expect(result).toEqual(expected);
  });
});
