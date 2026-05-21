import { describe, it, expect, vi, afterEach } from 'vitest';
import { playerStagesService } from '../../../src/services/playerStagesService';

vi.mock('../../../src/services/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../../src/services/api';
const mocked = vi.mocked(apiRequest);

describe('playerStagesService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchDue calls GET /api/player/stages/due', () => {
    playerStagesService.fetchDue();
    expect(mocked).toHaveBeenCalledWith('/api/player/stages/due');
  });

  it('submitAttempt POSTs to /api/player/stages/:id/attempt with passed flag', () => {
    playerStagesService.submitAttempt(42, true);
    expect(mocked).toHaveBeenCalledWith('/api/player/stages/42/attempt', {
      method: 'POST',
      body: { passed: true },
    });
  });

  it('submitAttempt passes passed=false correctly', () => {
    playerStagesService.submitAttempt(5, false);
    expect(mocked).toHaveBeenCalledWith('/api/player/stages/5/attempt', {
      method: 'POST',
      body: { passed: false },
    });
  });
});
