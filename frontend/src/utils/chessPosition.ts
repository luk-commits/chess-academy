import { Chess } from 'chess.js';

export interface UciMove {
  from: string;
  to: string;
  promotion?: string;
}

export function uciToMove(uci: string): UciMove {
  const move: UciMove = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) move.promotion = uci.slice(4);
  return move;
}

export function pieceColor(piece: string): 'w' | 'b' {
  return piece[0] === 'w' ? 'w' : 'b';
}

export function fenTurn(fen: string): 'w' | 'b' {
  return fen.split(' ')[1] === 'b' ? 'b' : 'w';
}

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

export function isUciCheckmate(fen: string, uci: string): boolean {
  try {
    const chess = new Chess(fen);
    const result = chess.move(uciToMove(uci));
    return result !== null && chess.isCheckmate();
  } catch {
    return false;
  }
}

export function applyFirstMoveToFen(fen: string, uci: string | null): string {
  if (!uci) return fen;
  try {
    const chess = new Chess(fen);
    const result = chess.move(uciToMove(uci));
    if (!result) return fen;
    return chess.fen();
  } catch {
    return fen;
  }
}
