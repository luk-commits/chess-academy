import { describe, it, expect, vi, afterEach } from 'vitest';
import { playerTasksService } from '../../../src/services/playerTasksService';

vi.mock('../../../src/services/api', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '../../../src/services/api';
const mocked = vi.mocked(apiRequest);

describe('playerTasksService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTasks calls GET /api/player/tasks', () => {
    playerTasksService.fetchTasks();
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks');
  });

  it('startTask POSTs to /api/player/tasks/:id/start', () => {
    playerTasksService.startTask(7);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/7/start', { method: 'POST' });
  });

  it('interruptTask POSTs to /api/player/tasks/:id/interrupt', () => {
    playerTasksService.interruptTask(3);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/3/interrupt', { method: 'POST' });
  });

  it('resumeTask POSTs to /api/player/tasks/:id/resume', () => {
    playerTasksService.resumeTask(9);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/9/resume', { method: 'POST' });
  });

  it('resetTask POSTs to /api/player/tasks/:id/reset', () => {
    playerTasksService.resetTask(2);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/2/reset', { method: 'POST' });
  });

  it('archiveTask POSTs to /api/player/tasks/:id/archive', () => {
    playerTasksService.archiveTask(11);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/11/archive', { method: 'POST' });
  });

  it('restoreTask POSTs to /api/player/tasks/:id/restore', () => {
    playerTasksService.restoreTask(4);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/4/restore', { method: 'POST' });
  });

  it('completeStage POSTs with stats payload', () => {
    const payload = {
      thinkingTimeMs: 1234,
      attemptsTotal: 5,
      errorsTotal: 1,
      wrongMoves: ['e2e5'],
      moveTimesMs: [100, 200],
      firstErrorAtPly: 0,
    };
    playerTasksService.completeStage(8, 22, payload);
    expect(mocked).toHaveBeenCalledWith('/api/player/tasks/8/stages/22/complete', {
      method: 'POST',
      body: payload,
    });
  });

  describe('setStageRepetition', () => {
    it('sends only enabled when pgn is omitted', () => {
      playerTasksService.setStageRepetition(13, true);
      expect(mocked).toHaveBeenCalledWith('/api/player/stages/13/repetition', {
        method: 'POST',
        body: { enabled: true },
      });
    });

    it('includes solutionPgn when provided', () => {
      playerTasksService.setStageRepetition(13, true, '1. e4 e5');
      expect(mocked).toHaveBeenCalledWith('/api/player/stages/13/repetition', {
        method: 'POST',
        body: { enabled: true, solutionPgn: '1. e4 e5' },
      });
    });

    it('omits solutionPgn when disabling', () => {
      playerTasksService.setStageRepetition(13, false);
      expect(mocked).toHaveBeenCalledWith('/api/player/stages/13/repetition', {
        method: 'POST',
        body: { enabled: false },
      });
    });
  });
});
