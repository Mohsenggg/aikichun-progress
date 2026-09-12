export interface PriorityStage {
  id: number;
  name: string;
  color?: string; // hex e.g. "#d92027"
}

export interface Task {
  id: number;
  title: string;
  description: string;
  active: boolean;
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
  name: string;
  weight: number;
  position: number;
  priorityStage: PriorityStage | null;
  tasks: StageTask[];
}

export interface Level {
  id: number;
  roadmapId: number;
  name: string;
  position: number;
  stages: RoadmapStage[];
}

export interface Roadmap {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  levels: Level[];
}

// Request DTOs
export interface LevelRequest {
  name: string;
  roadmapId: number;
}

export interface LevelReorderItem {
  id: number;
  position: number;
}

export interface PriorityStageRequest {
  name: string;
  color?: string;
}

export interface StageRequest {
  name: string;
  levelId: number;
  code?: string | null;
  weight?: number;
  priorityStageId?: number | null;
}

export interface StageReorderItem {
  id: number;
  position: number;
}

export interface StageTaskPlacement {
  taskId: number;
}

export interface StageTaskReorderItem {
  taskId: number;
  position: number;
  id?: number;
}

export interface TaskRequest {
  title: string;
  description?: string;
  active?: boolean;
}

// UI-Only State Types
export type EditTarget =
  | { kind: 'level'; id: number; initialValue: string }
  | { kind: 'stage'; id: number; initialName: string; initialCode?: string | null; initialWeight: number }
  | { kind: 'priorityStage'; id: number; initialName: string; initialColor: string }
  | null;

export type DialogMode =
  | { kind: 'createTask'; stageId: number }
  | { kind: 'editTask'; task: Task; stageId: number }
  | { kind: 'addExistingTask'; stageId: number }
  | null;
