import { describe, it, expect } from 'vitest';
import { buildPgnRuntime } from '../../../src/utils/pgnRuntime';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('buildPgnRuntime', () => {
  it('returns null for invalid FEN', () => {
    expect(buildPgnRuntime('not a fen', '1. e4')).toBeNull();
  });

  it('returns runtime with empty expected when pgn has no moves', () => {
    const rt = buildPgnRuntime(START_FEN, '');
    expect(rt).not.toBeNull();
    expect(rt!.expected).toEqual([]);
    expect(rt!.currentFen).toBe(START_FEN);
    expect(rt!.introFen).toBeNull();
  });

  it('treats first move as intro and exposes remaining moves as expected UCI', () => {
    const rt = buildPgnRuntime(START_FEN, '1. e4 e5 2. Nf3 Nc6');
    expect(rt).not.toBeNull();
    expect(rt!.expected).toEqual(['e7e5', 'g1f3', 'b8c6']);
    expect(rt!.introFen).not.toBeNull();
    expect(rt!.introFen).toContain('b KQkq');
    expect(rt!.startFen).toBe(rt!.introFen);
  });

  it('orients board to the side that moves after the intro', () => {
    const rt = buildPgnRuntime(START_FEN, '1. e4 e5');
    expect(rt!.orientation).toBe('black');
  });

  it('returns null when PGN is invalid', () => {
    const rt = buildPgnRuntime(START_FEN, '1. zz9');
    expect(rt).toBeNull();
  });
});
