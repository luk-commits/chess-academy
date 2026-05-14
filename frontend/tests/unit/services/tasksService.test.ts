import { describe, it, expect, vi } from 'vitest';
import { tasksService } from '../../../src/services/tasksService';

vi.mock('../../../src/services/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../../src/services/api';
const mockedApiRequest = vi.mocked(apiRequest);

describe('tasksService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiRequest POST /api/coach/tasks with payload and returns result', async () => {
    const payload = { positionIds: [1, 2], groupIds: [3], publishDefault: true };
    const expected = { task: { id: 1, title: '', description: '', status: '', stages: [], groupIds: [3] } };
    mockedApiRequest.mockResolvedValue(expected);
    const result = await tasksService.createTask(payload);
    expect(mockedApiRequest).toHaveBeenCalledWith('/api/coach/tasks', {
      method: 'POST',
      body: payload,
    });
    expect(result).toEqual(expected);
  });
});
