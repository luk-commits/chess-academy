import { describe, it, expect } from 'vitest';
import { isValidFen, boardOrientationFromFen, applyFirstMoveToFen } from '../../../src/utils/chessPosition';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('isValidFen', () => {
  it('returns true for start FEN', () => {
    expect(isValidFen(START_FEN)).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isValidFen('')).toBe(false);
  });

  it('returns false for invalid FEN', () => {
    expect(isValidFen('not a fen')).toBe(false);
  });
});

describe('boardOrientationFromFen', () => {
  it('returns white when second field is w', () => {
    expect(boardOrientationFromFen(START_FEN)).toBe('white');
  });

  it('returns black when second field is b', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
    expect(boardOrientationFromFen(fen)).toBe('black');
  });

  it('returns white for fen without second field', () => {
    expect(boardOrientationFromFen('invalid')).toBe('white');
  });
});

describe('applyFirstMoveToFen', () => {
  it('returns original FEN when uci is null', () => {
    expect(applyFirstMoveToFen(START_FEN, null)).toBe(START_FEN);
  });

  it('applies e2e4 and changes FEN (black to move)', () => {
    const result = applyFirstMoveToFen(START_FEN, 'e2e4');
    expect(result).not.toBe(START_FEN);
    expect(result).toContain(' b ');
  });

  it('applies e7e8q promotion', () => {
    const fen = 'rnbqkbnr/ppppPppp/8/8/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1';
    const result = applyFirstMoveToFen(fen, 'e7e8q');
    expect(result).toContain('Q');
  });

  it('returns original FEN for impossible move', () => {
    const result = applyFirstMoveToFen(START_FEN, 'e2e5');
    expect(result).toBe(START_FEN);
  });

  it('returns original FEN for invalid input fen', () => {
    const result = applyFirstMoveToFen('garbage', 'e2e4');
    expect(result).toBe('garbage');
  });
});
