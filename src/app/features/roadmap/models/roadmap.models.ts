export interface CheckDefinition {
  id: number;
  name: string;
  description?: string | null;
  assignedTaskCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PriorityStage {
  id: number;
  name: string;
  color?: string; // hex e.g. "#d92027"
  description?: string | null;
}

export interface Task {
  id: number;
  code?: string | null;
  title: string;
  description: string;
  link?: string | null;
  weight?: number | null;
  active: boolean;
  checks?: CheckDefinition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StageTask {
  id: number; // roadmap_stage_task.id (join table PK)
  taskId?: number;
  stageId: number;
  position: number;
  isMain: boolean;
  task: Task; // embedded full Task
}

export interface RoadmapStage {
  id: number;
  levelId: number;
  code?: string | null;
  name?: string | null;
  link?: string | null;
  weight: number;
  position: number;
  priorityStage: PriorityStage | null;
  tasks: StageTask[];
}

export interface Level {
  id: number;
  roadmapId: number;
  name: string;
  link?: string | null;
  weight?: number;
  position: number;
  stages: RoadmapStage[];
}

export interface Roadmap {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  levels: Level[];
}

// Request DTOs
export interface RoadmapRequest {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface LevelRequest {
  name: string;
  roadmapId: number;
  link?: string | null;
  weight?: number;
  position?: number;
}

export interface LevelReorderItem {
  id: number;
  position: number;
}

export interface PriorityStageRequest {
  name: string;
  color?: string;
  description?: string | null;
}

export interface StageRequest {
  name?: string | null;
  levelId: number;
  code?: string | null;
  link?: string | null;
  weight?: number;
  position?: number;
  priorityStageId?: number | null;
}

export interface StageReorderItem {
  id: number;
  position: number;
}

export interface StageTaskPlacement {
  taskId: number;
  position?: number;
  isMain?: boolean;
}

export interface StageTaskMoveRequest {
  targetStageId: number;
  targetPosition?: number;
}

export interface StageTaskReorderItem {
  taskId: number;
  position: number;
  id?: number;
}

export interface TaskRequest {
  title: string;
  description?: string;
  link?: string | null;
  weight?: number;
  active?: boolean;
  checkDefinitionIds?: number[];
}

export interface CheckDefinitionRequest {
  name: string;
  description?: string | null;
}

export interface TraineeCheckProgressRequest {
  completed: boolean;
}

// UI-Only State Types
export type EditTarget =
  | { kind: 'roadmap'; id: number; initialName: string; initialDescription: string }
  | { kind: 'level'; id: number; initialValue: string; initialLink?: string | null; initialWeight?: number }
  | { kind: 'stage'; id: number; initialName: string; initialCode?: string | null; initialWeight: number; initialLink?: string | null }
  | { kind: 'priorityStage'; id: number; initialName: string; initialColor: string; initialDescription?: string | null }
  | null;

export type DialogMode =
  | { kind: 'createTask'; stageId: number }
  | { kind: 'editTask'; task: Task; stageId: number }
  | { kind: 'addExistingTask'; stageId: number }
  | null;
