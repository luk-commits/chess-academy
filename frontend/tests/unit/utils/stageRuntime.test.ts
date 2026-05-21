import { describe, it, expect } from 'vitest';
import { buildStageRuntime } from '../../../src/utils/stageRuntime';
import type { PlayerTaskStage } from '../../../src/types/position';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function makeStage(overrides: Partial<PlayerTaskStage['position']> = {}): PlayerTaskStage {
  return {
    id: 1,
    title: 'Stage',
    position: {
      id: 100,
      fen: START_FEN,
      firstMove: null,
      ...overrides,
    },
    progress: null,
  } as PlayerTaskStage;
}

describe('buildStageRuntime', () => {
  it('returns null for invalid FEN', () => {
    const stage = makeStage({ fen: 'not a fen' });
    expect(buildStageRuntime(stage)).toBeNull();
  });

  it('returns runtime without intro when no moves and no firstMove', () => {
    const stage = makeStage();
    const rt = buildStageRuntime(stage);
    expect(rt).not.toBeNull();
    expect(rt!.introFen).toBeNull();
    expect(rt!.expected).toEqual([]);
    expect(rt!.currentFen).toBe(START_FEN);
    expect(rt!.expectedIndex).toBe(0);
    expect(rt!.errored).toBe(false);
  });

  it('treats first move as intro and remaining as expected', () => {
    const stage = makeStage({ moves: ['e2e4', 'e7e5', 'g1f3'] });
    const rt = buildStageRuntime(stage);
    expect(rt).not.toBeNull();
    expect(rt!.expected).toEqual(['e7e5', 'g1f3']);
    expect(rt!.introFen).not.toBeNull();
    expect(rt!.introFen).toContain('b KQkq');
    expect(rt!.currentFen).toBe(START_FEN);
  });

  it('falls back to firstMove when moves array is empty', () => {
    const stage = makeStage({ firstMove: 'e2e4' });
    const rt = buildStageRuntime(stage);
    expect(rt).not.toBeNull();
    expect(rt!.expected).toEqual([]);
    expect(rt!.introFen).not.toBeNull();
  });

  it('orients board to side moving after intro', () => {
    const stage = makeStage({ moves: ['e2e4', 'e7e5'] });
    const rt = buildStageRuntime(stage);
    expect(rt!.orientation).toBe('black');
  });

  it('orients board from base FEN when no moves', () => {
    const stage = makeStage();
    const rt = buildStageRuntime(stage);
    expect(rt!.orientation).toBe('white');
  });
});
