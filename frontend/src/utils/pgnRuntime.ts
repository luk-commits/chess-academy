import { Chess } from 'chess.js';
import type { Move } from 'chess.js';
import { boardOrientationFromFen, isValidFen } from './chessPosition';

export interface PgnRuntime {
  introFen: string | null;
  startFen: string;
  expected: string[];
  expectedIndex: number;
  orientation: 'white' | 'black';
  currentFen: string;
  errored: boolean;
}

function moveToUci(move: Move): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

export function buildPgnRuntime(baseFen: string, solutionPgn: string): PgnRuntime | null {
  if (!isValidFen(baseFen)) return null;

  const wrapped = `[SetUp "1"]\n[FEN "${baseFen}"]\n\n${solutionPgn.trim()}`;
  let history: Move[];
  try {
    const probe = new Chess();
    probe.loadPgn(wrapped);
    history = probe.history({ verbose: true });
  } catch {
    return null;
  }

  if (history.length === 0) {
    return {
      introFen: null,
      startFen: baseFen,
      expected: [],
      expectedIndex: 0,
      orientation: boardOrientationFromFen(baseFen),
      currentFen: baseFen,
      errored: false,
    };
  }

  const moves = history.map(moveToUci);

  const intro = new Chess(baseFen);
  const first = history[0];
  const introMove: { from: string; to: string; promotion?: string } = { from: first.from, to: first.to };
  if (first.promotion) introMove.promotion = first.promotion;
  intro.move(introMove);
  const introFen = intro.fen();

  return {
    introFen,
    startFen: introFen,
    expected: moves.slice(1),
    expectedIndex: 0,
    orientation: boardOrientationFromFen(introFen),
    currentFen: baseFen,
    errored: false,
  };
}
