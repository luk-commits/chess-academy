import type { PositionItem } from './position';

export interface StageProgress {
  repetitions: number;
  intervalDays: number;
  lastResult: 'pass' | 'fail' | null;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  attemptsTotal: number;
}

export interface DueStage {
  id: number;
  title: string;
  sortOrder: number;
  solutionPgn: string;
  task: {
    id: number;
    title: string;
    coachName: string;
  };
  position: PositionItem;
  progress: StageProgress | null;
}

export interface DueStagesResponse {
  stages: DueStage[];
}

export interface AttemptResponse {
  progress: StageProgress & { stageId: number };
}
