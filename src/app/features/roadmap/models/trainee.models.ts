export type AccessMode = 'OPEN' | 'PROGRESSIVE';

export type TaskProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface CheckDefinitionItem {
  id: number;
  name: string;
  description?: string | null;
}

export interface TraineeTaskItem {
  id: number;
  code?: string | null;
  title: string;
  description: string;
  link?: string | null;
  weight?: number | null;
  active: boolean;
  checks: CheckDefinitionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TraineeCheckProgressItem {
  checkDefinitionId: number;
  name: string;
  description?: string | null;
  completed: boolean;
  completedAt?: string | null;
}

export interface TraineeTaskProgress {
  id?: number | null;
  traineeId: number;
  taskId: number;
  stageId?: number | null;
  taskTitle?: string | null;
  completedChecksCount: number;
  totalChecksCount: number;
  progressPercentage: number;
  status: TaskProgressStatus;
  checks: TraineeCheckProgressItem[];
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
}

export interface TraineeStageTask {
  id: number;
  stageId: number;
  position: number;
  isMain: boolean;
  task: TraineeTaskItem;
  progress: TraineeTaskProgress;
}

export interface PriorityStageInfo {
  id: number;
  name: string;
  color?: string | null;
  description?: string | null;
}

export interface TraineeStage {
  id: number;
  levelId: number;
  priorityStage?: PriorityStageInfo | null;
  code?: string | null;
  name?: string | null;
  link?: string | null;
  weight: number;
  position: number;
  progressPercentage: number;
  percentageOfLevel: number;
  tasks: TraineeStageTask[];
}

export interface TraineeLevel {
  id: number;
  roadmapId: number;
  name: string;
  description?: string | null;
  link?: string | null;
  weight: number;
  position: number;
  progressPercentage: number;
  stepsCount: number;
  isLocked: boolean;
  stages: TraineeStage[];
}

export interface TraineeRoadmapProgressSummary {
  traineeId: number;
  roadmapId: number;
  overallProgressPercentage: number;
  totalCurriculumWeight?: number;
  earnedWeightedPoints?: number;
  totalTasksCount: number;
  completedTasksCount: number;
  inProgressTasksCount: number;
}

export interface TraineeRoadmapHierarchy {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  accessMode: AccessMode;
  levels: TraineeLevel[];
  progressSummary: TraineeRoadmapProgressSummary;
}

export interface TraineeCheckToggleRequest {
  completed: boolean;
}
