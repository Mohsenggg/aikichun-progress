import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoadmapService } from '../../services/roadmap.service';
import { TaskService } from '../../services/task.service';
import {
  Roadmap,
  Level,
  RoadmapStage,
  StageTask,
  PriorityStage,
  EditTarget,
  DialogMode
} from '../../models/roadmap.models';
import { TaskFormDialogComponent } from './task-form-dialog/task-form-dialog.component';

@Component({
  selector: 'app-roadmap-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskFormDialogComponent],
  templateUrl: './roadmap-builder.component.html',
  styleUrl: './roadmap-builder.component.css'
})
export class RoadmapBuilderComponent implements OnInit {
  roadmapService = inject(RoadmapService);
  taskService = inject(TaskService);

  // Signals
  roadmap = this.roadmapService.roadmap;
  priorityStages = this.roadmapService.priorityStages;
  isLoading = this.roadmapService.isLoading;
  errorMessage = this.roadmapService.error;

  // Dialog & Panels
  dialogMode = signal<DialogMode>(null);
  showPriorityPanel = signal(false);

  // Inline Editing
  editingTarget = signal<EditTarget>(null);
  inlineEditValue = signal('');
  inlineEditCode = signal('');
  inlineEditWeight = signal<number>(10);
  inlineEditColor = signal('#d92027');
  inlineEditError = signal<string | null>(null);

  // New Level Inline Input
  isAddingLevel = signal(false);
  newLevelName = signal('');
  newLevelError = signal<string | null>(null);

  // New Stage Inline Input
  addingStageLevelId = signal<number | null>(null);
  newStageCode = signal('');
  newStageName = signal('');
  newStageWeight = signal<number>(10);
  newStageError = signal<string | null>(null);

  // New Priority Stage Inline Input
  newPriorityName = signal('');
  newPriorityColor = signal('#d92027');
  newPriorityError = signal<string | null>(null);

  // Quick Edit Stage Weight Input
  editingWeightStageId = signal<number | null>(null);
  inlineStageWeightValue = signal<number>(10);
  inlineStageWeightError = signal<string | null>(null);

  ngOnInit(): void {
    this.roadmapService.loadRoadmap();
    this.roadmapService.loadPriorityStages();
  }

  dismissError(): void {
    this.roadmapService.clearError();
  }

  // --- Level Operations ---

  openAddLevel(): void {
    this.isAddingLevel.set(true);
    this.newLevelName.set('');
    this.newLevelError.set(null);
  }

  cancelAddLevel(): void {
    this.isAddingLevel.set(false);
    this.newLevelName.set('');
    this.newLevelError.set(null);
  }

  confirmAddLevel(): void {
    const name = this.newLevelName().trim();
    if (!name) {
      this.newLevelError.set('Level name is required');
      return;
    }

    const currentRoadmap = this.roadmap();
    if (!currentRoadmap) return;

    this.roadmapService.createLevel({
      name,
      roadmapId: currentRoadmap.id
    }).subscribe({
      next: () => {
        this.cancelAddLevel();
      },
      error: () => {}
    });
  }

  startEditLevel(level: Level): void {
    this.editingTarget.set({ kind: 'level', id: level.id, initialValue: level.name });
    this.inlineEditValue.set(level.name);
    this.inlineEditError.set(null);
  }

  saveEditLevel(level: Level): void {
    const val = this.inlineEditValue().trim();
    if (!val) {
      this.inlineEditError.set('Name is required');
      return;
    }
    const currentRoadmap = this.roadmap();
    if (!currentRoadmap) return;

    this.roadmapService.updateLevel(level.id, {
      name: val,
      roadmapId: currentRoadmap.id
    }).subscribe({
      next: () => this.cancelEdit(),
      error: () => {}
    });
  }

  deleteLevel(id: number): void {
    if (confirm('Are you sure you want to delete this level and all its stages and tasks?')) {
      this.roadmapService.deleteLevel(id).subscribe();
    }
  }

  moveLevelUp(index: number): void {
    if (index <= 0) return;
    this.reorderLevelsByIndex(index, index - 1);
  }

  moveLevelDown(index: number): void {
    const current = this.roadmap();
    if (!current || index >= current.levels.length - 1) return;
    this.reorderLevelsByIndex(index, index + 1);
  }

  private reorderLevelsByIndex(fromIndex: number, toIndex: number): void {
    const current = this.roadmap();
    if (!current) return;

    const previousLevels = [...current.levels];
    const newLevels = [...current.levels];
    const [moved] = newLevels.splice(fromIndex, 1);
    newLevels.splice(toIndex, 0, moved);

    const reorderedWithPositions = newLevels.map((lvl, idx) => ({
      ...lvl,
      position: idx + 1
    }));

    // Optimistic update
    this.roadmapService.roadmap.set({ ...current, levels: reorderedWithPositions });

    const payload = reorderedWithPositions.map(lvl => ({
      id: lvl.id,
      position: lvl.position
    }));

    this.roadmapService.reorderLevels(payload).subscribe({
      error: () => {
        // Rollback
        this.roadmapService.roadmap.set({ ...current, levels: previousLevels });
      }
    });
  }

  // --- Stage Operations ---

  openAddStage(levelId: number): void {
    this.addingStageLevelId.set(levelId);
    this.newStageCode.set('');
    this.newStageName.set('');
    this.newStageWeight.set(10);
    this.newStageError.set(null);
  }

  cancelAddStage(): void {
    this.addingStageLevelId.set(null);
    this.newStageCode.set('');
    this.newStageName.set('');
    this.newStageWeight.set(10);
    this.newStageError.set(null);
  }

  confirmAddStage(levelId: number): void {
    const name = this.newStageName().trim();
    if (!name) {
      this.newStageError.set('Stage name is required');
      return;
    }
    const weight = Number(this.newStageWeight());
    if (isNaN(weight) || weight <= 0) {
      this.newStageError.set('Stage weight must be greater than zero');
      return;
    }

    this.roadmapService.createStage({
      name,
      levelId,
      code: this.newStageCode().trim() || null,
      weight,
      priorityStageId: null
    }).subscribe({
      next: () => {
        this.cancelAddStage();
      },
      error: (err) => {
        this.newStageError.set(err.error?.message || err.message || 'Failed to create stage');
      }
    });
  }

  startEditStage(stage: RoadmapStage): void {
    this.editingTarget.set({
      kind: 'stage',
      id: stage.id,
      initialName: stage.name,
      initialCode: stage.code,
      initialWeight: stage.weight ?? 10
    });
    this.inlineEditValue.set(stage.name);
    this.inlineEditCode.set(stage.code || '');
    this.inlineEditWeight.set(stage.weight ?? 10);
    this.inlineEditError.set(null);
  }

  saveEditStage(stage: RoadmapStage): void {
    const val = this.inlineEditValue().trim();
    if (!val) {
      this.inlineEditError.set('Name is required');
      return;
    }
    const weight = Number(this.inlineEditWeight());
    if (isNaN(weight) || weight <= 0) {
      this.inlineEditError.set('Weight must be greater than zero');
      return;
    }

    this.roadmapService.updateStage(stage.id, {
      name: val,
      levelId: stage.levelId,
      code: this.inlineEditCode().trim() || null,
      weight,
      priorityStageId: stage.priorityStage?.id ?? null
    }).subscribe({
      next: () => this.cancelEdit(),
      error: (err) => {
        this.inlineEditError.set(err.error?.message || err.message || 'Failed to update stage');
      }
    });
  }

  deleteStage(id: number): void {
    if (confirm('Are you sure you want to delete this stage?')) {
      this.roadmapService.deleteStage(id).subscribe();
    }
  }

  startEditStageWeight(stage: RoadmapStage): void {
    this.editingWeightStageId.set(stage.id);
    this.inlineStageWeightValue.set(stage.weight ?? 10);
    this.inlineStageWeightError.set(null);
  }

  cancelEditStageWeight(): void {
    this.editingWeightStageId.set(null);
    this.inlineStageWeightValue.set(10);
    this.inlineStageWeightError.set(null);
  }

  saveStageWeight(stage: RoadmapStage): void {
    const weight = Number(this.inlineStageWeightValue());
    if (isNaN(weight) || weight <= 0) {
      this.inlineStageWeightError.set('Weight must be > 0');
      return;
    }

    this.roadmapService.updateStageWeight(stage.id, weight).subscribe({
      next: () => {
        this.cancelEditStageWeight();
      },
      error: (err) => {
        this.inlineStageWeightError.set(err.error?.message || err.message || 'Failed to update weight');
      }
    });
  }

  onPriorityStageChange(stage: RoadmapStage, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const priorityId = select.value ? Number(select.value) : null;

    this.roadmapService.updateStage(stage.id, {
      name: stage.name,
      levelId: stage.levelId,
      priorityStageId: priorityId
    }).subscribe();
  }

  moveStageUp(level: Level, index: number): void {
    if (index <= 0) return;
    this.reorderStagesByIndex(level, index, index - 1);
  }

  moveStageDown(level: Level, index: number): void {
    if (index >= level.stages.length - 1) return;
    this.reorderStagesByIndex(level, index, index + 1);
  }

  private reorderStagesByIndex(level: Level, fromIndex: number, toIndex: number): void {
    const current = this.roadmap();
    if (!current) return;

    const previousStages = [...level.stages];
    const newStages = [...level.stages];
    const [moved] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, moved);

    const reorderedWithPositions = newStages.map((stg, idx) => ({
      ...stg,
      position: idx + 1
    }));

    // Optimistic update
    const updatedLevels = current.levels.map(lvl => {
      if (lvl.id === level.id) {
        return { ...lvl, stages: reorderedWithPositions };
      }
      return lvl;
    });
    this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });

    const payload = reorderedWithPositions.map(stg => ({
      id: stg.id,
      position: stg.position
    }));

    this.roadmapService.reorderStages(payload).subscribe({
      error: () => {
        // Rollback
        const rollbackLevels = current.levels.map(lvl => {
          if (lvl.id === level.id) {
            return { ...lvl, stages: previousStages };
          }
          return lvl;
        });
        this.roadmapService.roadmap.set({ ...current, levels: rollbackLevels });
      }
    });
  }

  // --- Task Operations ---

  openAddTaskDialog(stageId: number): void {
    this.dialogMode.set({ kind: 'createTask', stageId });
  }

  openEditTaskDialog(st: StageTask, stageId: number): void {
    this.dialogMode.set({ kind: 'editTask', task: st.task, stageId });
  }

  removeTask(stageId: number, taskId: number): void {
    if (confirm('Are you sure you want to remove this task from this stage?')) {
      this.roadmapService.removeTaskFromStage(stageId, taskId).subscribe();
    }
  }

  toggleMainTask(stageId: number, st: StageTask): void {
    const taskId = st.task?.id || st.taskId;
    if (!taskId) return;

    if (st.isMain) {
      // Unset main task
      this.roadmapService.removeMainTask(stageId).subscribe();
    } else {
      // Set main task
      this.roadmapService.setMainTask(stageId, taskId).subscribe();
    }
  }

  moveTaskUp(stage: RoadmapStage, index: number): void {
    if (index <= 0) return;
    this.reorderTasksByIndex(stage, index, index - 1);
  }

  moveTaskDown(stage: RoadmapStage, index: number): void {
    if (index >= stage.tasks.length - 1) return;
    this.reorderTasksByIndex(stage, index, index + 1);
  }

  private reorderTasksByIndex(stage: RoadmapStage, fromIndex: number, toIndex: number): void {
    const current = this.roadmap();
    if (!current) return;

    const previousTasks = [...stage.tasks];
    const newTasks = [...stage.tasks];
    const [moved] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, moved);

    const reorderedWithPositions = newTasks.map((t, idx) => ({
      ...t,
      position: idx + 1
    }));

    // Optimistic update
    const updatedLevels = current.levels.map(lvl => ({
      ...lvl,
      stages: lvl.stages.map(stg => {
        if (stg.id === stage.id) {
          return { ...stg, tasks: reorderedWithPositions };
        }
        return stg;
      })
    }));
    this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });

    const payload = reorderedWithPositions.map(t => ({
      taskId: (t.task?.id || t.taskId)!,
      position: t.position
    }));

    this.roadmapService.reorderTasksInStage(stage.id, payload).subscribe({
      error: () => {
        // Rollback
        const rollbackLevels = current.levels.map(lvl => ({
          ...lvl,
          stages: lvl.stages.map(stg => {
            if (stg.id === stage.id) {
              return { ...stg, tasks: previousTasks };
            }
            return stg;
          })
        }));
        this.roadmapService.roadmap.set({ ...current, levels: rollbackLevels });
      }
    });
  }

  // --- Priority Stages Panel Operations ---

  togglePriorityPanel(): void {
    this.showPriorityPanel.update(v => !v);
  }

  closePriorityPanel(): void {
    this.showPriorityPanel.set(false);
  }

  startEditPriority(p: PriorityStage): void {
    this.editingTarget.set({
      kind: 'priorityStage',
      id: p.id,
      initialName: p.name,
      initialColor: p.color || '#d92027'
    });
    this.inlineEditValue.set(p.name);
    this.inlineEditColor.set(p.color || '#d92027');
    this.inlineEditError.set(null);
  }

  saveEditPriority(id: number): void {
    const val = this.inlineEditValue().trim();
    if (!val) {
      this.inlineEditError.set('Name is required');
      return;
    }

    this.roadmapService.updatePriorityStage(id, {
      name: val,
      color: this.inlineEditColor()
    }).subscribe({
      next: () => this.cancelEdit(),
      error: () => {}
    });
  }

  deletePriority(id: number): void {
    if (confirm('Delete this priority stage? It will be unassigned from all associated stages.')) {
      this.roadmapService.deletePriorityStage(id).subscribe();
    }
  }

  confirmAddPriority(): void {
    const name = this.newPriorityName().trim();
    if (!name) {
      this.newPriorityError.set('Name is required');
      return;
    }

    this.roadmapService.createPriorityStage({
      name,
      color: this.newPriorityColor()
    }).subscribe({
      next: () => {
        this.newPriorityName.set('');
        this.newPriorityColor.set('#d92027');
        this.newPriorityError.set(null);
      },
      error: () => {}
    });
  }

  // --- Inline Edit Helpers ---

  cancelEdit(): void {
    this.editingTarget.set(null);
    this.inlineEditValue.set('');
    this.inlineEditCode.set('');
    this.inlineEditWeight.set(10);
    this.inlineEditError.set(null);
    this.cancelEditStageWeight();
  }

  onInlineKeydown(event: KeyboardEvent, onSave: () => void): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSave();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelEdit();
    }
  }

  getPriorityColor(priorityStage: PriorityStage | null | undefined): string {
    return priorityStage?.color || 'transparent';
  }
}
