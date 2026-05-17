import { Chess } from 'chess.js';
import { isValidFen } from './chessPosition';

export interface ReplayMove {
  san: string;
  fenAfter: string;
  color: 'w' | 'b';
}

export interface PgnReplay {
  startFen: string;
  moves: ReplayMove[];
}

export function buildPgnFromSans(baseFen: string, sans: string[]): string {
  if (sans.length === 0) return '';
  const parts = baseFen.split(' ');
  let turn: 'w' | 'b' = parts[1] === 'b' ? 'b' : 'w';
  let moveNum = parseInt(parts[5] ?? '1', 10);
  if (!Number.isFinite(moveNum) || moveNum < 1) moveNum = 1;

  const tokens: string[] = [];
  let isFirst = true;
  for (const san of sans) {
    if (turn === 'w') {
      tokens.push(`${moveNum}.`);
      tokens.push(san);
    } else {
      if (isFirst) {
        tokens.push(`${moveNum}...`);
      }
      tokens.push(san);
      moveNum++;
    }
    turn = turn === 'w' ? 'b' : 'w';
    isFirst = false;
  }
  return tokens.join(' ');
}

export function parsePgnReplay(baseFen: string, solutionPgn: string): PgnReplay | null {
  if (!isValidFen(baseFen)) return null;

  const wrapped = `[SetUp "1"]\n[FEN "${baseFen}"]\n\n${solutionPgn.trim()}`;
  let verboseHistory;
  try {
    const probe = new Chess();
    probe.loadPgn(wrapped);
    verboseHistory = probe.history({ verbose: true });
  } catch {
    return null;
  }

  const replay = new Chess(baseFen);
  const moves: ReplayMove[] = [];
  for (const m of verboseHistory) {
    const move: { from: string; to: string; promotion?: string } = { from: m.from, to: m.to };
    if (m.promotion) move.promotion = m.promotion;
    const applied = replay.move(move);
    if (!applied) return null;
    moves.push({ san: applied.san, fenAfter: replay.fen(), color: applied.color });
  }

  return { startFen: baseFen, moves };
}
