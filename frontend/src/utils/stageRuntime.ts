import type { PlayerTaskStage } from '../types/position';
import {
  applyFirstMoveToFen,
  boardOrientationFromFen,
  isValidFen,
} from './chessPosition';

export interface StageRuntime {
  introFen: string | null;
  expected: string[];
  expectedIndex: number;
  orientation: 'white' | 'black';
  currentFen: string;
  errored: boolean;
}

export function buildStageRuntime(stage: PlayerTaskStage): StageRuntime | null {
  const baseFen = stage.position.fen;
  if (!isValidFen(baseFen)) return null;
  const moves = stage.position.moves ?? (stage.position.firstMove ? [stage.position.firstMove] : []);
  if (moves.length === 0) {
    return {
      introFen: null,
      expected: [],
      expectedIndex: 0,
      orientation: boardOrientationFromFen(baseFen),
      currentFen: baseFen,
      errored: false,
    };
  }
  const startFen = applyFirstMoveToFen(baseFen, moves[0]);
  return {
    introFen: startFen,
    expected: moves.slice(1),
    expectedIndex: 0,
    orientation: boardOrientationFromFen(startFen),
    currentFen: baseFen,
    errored: false,
  };
}
