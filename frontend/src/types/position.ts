export interface PositionItem {
  id: number;
  fen: string;
  firstMove: string | null;
  moves?: string[];
  opening: string;
  themeTags: string[];
  difficulty: number | null;
}

export interface PositionsResponse {
  items: PositionItem[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  search: string;
  selectablePositionIds: number[];
}

export interface IndividualGroup {
  groupId: number;
  playerId: number;
  playerName: string;
}

export interface ClassGroup {
  groupId: number;
  name: string;
}

export interface GroupsResponse {
  individuals: IndividualGroup[];
  classes: ClassGroup[];
}

export interface CreateTaskPayload {
  title?: string;
  description?: string;
  positionIds: number[];
  groupIds: number[];
  publishDefault?: boolean;
  openingName?: string;
}

export interface TaskStageData {
  id: number;
  title: string;
  sortOrder: number;
  positionId: number;
}

export interface TaskResponse {
  task: {
    id: number;
    title: string;
    description: string;
    status: string;
    stages: TaskStageData[];
    groupIds: number[];
  };
}

export type PlayerTaskProgressStatus = 'new' | 'in_progress' | 'interrupted' | 'completed' | 'archived';

export interface PlayerTaskProgressSummary {
  status: PlayerTaskProgressStatus;
  currentStageId: number | null;
  startedAt: string | null;
  lastActivityAt: string | null;
  interruptedAt: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  totalTimeMs: number;
  attemptsTotal: number;
  errorsTotal: number;
}

export type PlayerTaskStageProgressStatus = 'new' | 'in_progress' | 'completed';

export interface PlayerTaskStageProgressSummary {
  status: PlayerTaskStageProgressStatus;
  attemptsTotal: number;
  errorsTotal: number;
  wrongMoves: string[];
  thinkingTimeMs: number;
  avgMoveTimeMs: number;
  longestMoveTimeMs: number;
  firstErrorAtPly: number | null;
  completedAt: string | null;
  inRepetition: boolean;
  addedToRepetitionAt: string | null;
}

export interface PlayerTaskStage {
  id: number;
  title: string;
  sortOrder: number;
  progress: PlayerTaskStageProgressSummary | null;
  position: PositionItem;
}

export interface PlayerTask {
  id: number;
  title: string;
  description: string;
  coachName: string;
  isIndividual: boolean;
  taskProgress: PlayerTaskProgressSummary | null;
  stages: PlayerTaskStage[];
}

export interface PlayerTasksResponse {
  tasks: PlayerTask[];
}

export interface StageCompletePayload {
  thinkingTimeMs: number;
  attemptsTotal: number;
  errorsTotal: number;
  wrongMoves: string[];
  moveTimesMs: number[];
  firstErrorAtPly: number | null;
}

export interface StageRepetitionPayload {
  enabled: boolean;
  solutionPgn?: string;
}
