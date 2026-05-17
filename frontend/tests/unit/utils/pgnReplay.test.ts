import { describe, it, expect } from 'vitest';
import { buildPgnFromSans, parsePgnReplay } from '../../../src/utils/pgnReplay';

const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('parsePgnReplay', () => {
  it('returns null for invalid FEN', () => {
    expect(parsePgnReplay('not a fen', '1. e4')).toBeNull();
  });

  it('returns empty moves for empty pgn', () => {
    const r = parsePgnReplay(START_FEN, '');
    expect(r).not.toBeNull();
    expect(r!.moves).toEqual([]);
    expect(r!.startFen).toBe(START_FEN);
  });

  it('captures SAN, color and FEN after each move', () => {
    const r = parsePgnReplay(START_FEN, '1. e4 e5 2. Nf3');
    expect(r).not.toBeNull();
    expect(r!.moves).toHaveLength(3);
    expect(r!.moves[0]).toMatchObject({ san: 'e4', color: 'w' });
    expect(r!.moves[1]).toMatchObject({ san: 'e5', color: 'b' });
    expect(r!.moves[2]).toMatchObject({ san: 'Nf3', color: 'w' });
    expect(r!.moves[0].fenAfter).toContain('b KQkq');
    expect(r!.moves[1].fenAfter).toContain('w KQkq');
  });

  it('returns null for invalid PGN', () => {
    expect(parsePgnReplay(START_FEN, '1. zz9 invalid')).toBeNull();
  });
});

describe('buildPgnFromSans', () => {
  it('returns empty string for no moves', () => {
    expect(buildPgnFromSans(START_FEN, [])).toBe('');
  });

  it('builds main-line PGN starting with white to move', () => {
    expect(buildPgnFromSans(START_FEN, ['e4', 'e5', 'Nf3', 'Nc6'])).toBe('1. e4 e5 2. Nf3 Nc6');
  });

  it('prefixes black-to-move start with ... ellipsis', () => {
    const blackToMove = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    expect(buildPgnFromSans(blackToMove, ['Nc6', 'Nf3'])).toBe('1... Nc6 2. Nf3');
  });

  it('respects starting full move number from FEN', () => {
    const midGame = 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2';
    expect(buildPgnFromSans(midGame, ['Nc6', 'Bb5'])).toBe('2... Nc6 3. Bb5');
  });
});
