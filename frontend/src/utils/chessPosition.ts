import { Chess } from 'chess.js';

export function isValidFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

export function boardOrientationFromFen(fen: string): 'white' | 'black' {
  const turn = fen.split(' ')[1];
  return turn === 'b' ? 'black' : 'white';
}

export function applyFirstMoveToFen(fen: string, uci: string | null): string {
  if (!uci) return fen;
  try {
    const chess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const move: { from: string; to: string; promotion?: string } = { from, to };
    if (uci.length > 4) {
      move.promotion = uci.slice(4);
    }
    const result = chess.move(move);
    if (!result) return fen;
    return chess.fen();
  } catch {
    return fen;
  }
}
