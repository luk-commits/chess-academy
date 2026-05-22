export type TaskStatus = 'draft' | 'published' | 'archived';
export type StageStatus = 'draft' | 'in_progress' | 'published';

export interface CoachStageSummary {
  id: number;
  title: string;
  sortOrder: number;
  status: StageStatus;
  positionId: number | null;
  hasSolutionPgn: boolean;
}

export interface CoachTask {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  stages: CoachStageSummary[];
  groupIds: number[];
}

export interface GroupAssignee {
  groupId: number;
  label: string;
  type: 'class' | 'individual';
}

export interface EnrichedCoachTask extends CoachTask {
  assignees: GroupAssignee[];
}

export interface CoachTasksResponse {
  tasks: CoachTask[];
}

export interface CoachStageDetail {
  id: number;
  taskId: number;
  taskTitle?: string;
  title: string;
  sortOrder: number;
  status: StageStatus;
  solutionPgn: string | null;
  positionId: number | null;
  positionFen?: string | null;
}

export interface CoachStageResponse {
  stage: CoachStageDetail;
}

export interface CoachTaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface CoachStageUpdate {
  title?: string;
  solutionPgn?: string;
  status?: StageStatus;
}

export interface CoachTaskUpdateResponse {
  task: {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
  };
}
