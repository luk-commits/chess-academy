export interface PositionItem {
  id: number;
  fen: string;
  firstMove: string | null;
  moves?: string[];
  opening: string;
  themeTags: string[];
  rating: number | null;
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

export interface PlayerTaskStage {
  id: number;
  title: string;
  sortOrder: number;
  position: PositionItem;
}

export interface PlayerTask {
  id: number;
  title: string;
  description: string;
  coachName: string;
  isIndividual: boolean;
  stages: PlayerTaskStage[];
}

export interface PlayerTasksResponse {
  tasks: PlayerTask[];
}
