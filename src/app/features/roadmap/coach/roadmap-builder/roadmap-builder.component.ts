import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
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
  imports: [CommonModule, FormsModule, DragDropModule, TaskFormDialogComponent],
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
  inlineEditDescription = signal('');
  inlineEditCode = signal('');
  inlineEditLink = signal('');
  inlineEditWeight = signal<number>(10);
  inlineEditColor = signal('#d92027');
  inlineEditError = signal<string | null>(null);

  // New Level Inline Input
  isAddingLevel = signal(false);
  newLevelName = signal('');
  newLevelLink = signal('');
  newLevelError = signal<string | null>(null);

  // New Stage (Step) Inline Input
  addingStageLevelId = signal<number | null>(null);
  newStageCode = signal('');
  newStageName = signal('');
  newStageLink = signal('');
  newStageWeight = signal<number>(10);
  newStageError = signal<string | null>(null);

  // New Priority Stage Inline Input
  newPriorityName = signal('');
  newPriorityColor = signal('#d92027');
  newPriorityDesc = signal('');
  newPriorityError = signal<string | null>(null);

  // Quick Edit Stage Weight Input
  editingWeightStageId = signal<number | null>(null);
  inlineStageWeightValue = signal<number>(10);
  inlineStageWeightError = signal<string | null>(null);

  // Drag Drop Connected List IDs
  allLevelDropListIds = computed(() => {
    const current = this.roadmap();
    if (!current || !current.levels) return [];
    return current.levels.map(l => 'level-steps-' + l.id);
  });

  allStageDropListIds = computed(() => {
    const current = this.roadmap();
    if (!current || !current.levels) return [];
    return current.levels.flatMap(l => l.stages || []).map(s => 'stage-tasks-' + s.id);
  });

  ngOnInit(): void {
    this.roadmapService.loadRoadmap();
    this.roadmapService.loadPriorityStages();
  }

  dismissError(): void {
    this.roadmapService.clearError();
  }

  // --- Roadmap Meta Operations ---

  startEditRoadmap(): void {
    const r = this.roadmap();
    if (!r) return;
    this.editingTarget.set({
      kind: 'roadmap',
      id: r.id,
      initialName: r.name,
      initialDescription: r.description || ''
    });
    this.inlineEditValue.set(r.name);
    this.inlineEditDescription.set(r.description || '');
    this.inlineEditError.set(null);
  }

  saveEditRoadmap(): void {
    const name = this.inlineEditValue().trim();
    if (!name) {
      this.inlineEditError.set('Roadmap name is required');
      return;
    }
    const r = this.roadmap();
    if (!r) return;

    this.roadmapService.updateRoadmap(r.id, {
      name,
      description: this.inlineEditDescription().trim() || undefined
    }).subscribe({
      next: () => this.cancelEdit(),
      error: () => {}
    });
  }

  // --- Level Operations ---

  openAddLevel(): void {
    this.isAddingLevel.set(true);
    this.newLevelName.set('');
    this.newLevelLink.set('');
    this.newLevelError.set(null);
  }

  cancelAddLevel(): void {
    this.isAddingLevel.set(false);
    this.newLevelName.set('');
    this.newLevelLink.set('');
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
      roadmapId: currentRoadmap.id,
      link: this.newLevelLink().trim() || null
    }).subscribe({
      next: () => {
        this.cancelAddLevel();
      },
      error: () => {}
    });
  }

  startEditLevel(level: Level): void {
    this.editingTarget.set({
      kind: 'level',
      id: level.id,
      initialValue: level.name,
      initialLink: level.link
    });
    this.inlineEditValue.set(level.name);
    this.inlineEditLink.set(level.link || '');
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
      roadmapId: currentRoadmap.id,
      link: this.inlineEditLink().trim() || null
    }).subscribe({
      next: () => this.cancelEdit(),
      error: () => {}
    });
  }

  deleteLevel(id: number): void {
    if (confirm('Are you sure you want to delete this level and all its steps and tasks?')) {
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

  // --- Step (Stage) Operations ---

  openAddStage(levelId: number): void {
    this.addingStageLevelId.set(levelId);
    this.newStageCode.set('');
    this.newStageName.set('');
    this.newStageLink.set('');
    this.newStageWeight.set(10);
    this.newStageError.set(null);
  }

  cancelAddStage(): void {
    this.addingStageLevelId.set(null);
    this.newStageCode.set('');
    this.newStageName.set('');
    this.newStageLink.set('');
    this.newStageWeight.set(10);
    this.newStageError.set(null);
  }

  confirmAddStage(levelId: number): void {
    // Step name is optional!
    const name = this.newStageName().trim() || null;
    const weight = Number(this.newStageWeight());
    if (isNaN(weight) || weight <= 0) {
      this.newStageError.set('Step weight must be greater than zero');
      return;
    }

    this.roadmapService.createStage({
      name,
      levelId,
      code: this.newStageCode().trim() || null,
      link: this.newStageLink().trim() || null,
      weight,
      priorityStageId: null
    }).subscribe({
      next: () => {
        this.cancelAddStage();
      },
      error: (err) => {
        this.newStageError.set(err.error?.message || err.message || 'Failed to create step');
      }
    });
  }

  startEditStage(stage: RoadmapStage): void {
    this.editingTarget.set({
      kind: 'stage',
      id: stage.id,
      initialName: stage.name || '',
      initialCode: stage.code,
      initialWeight: stage.weight ?? 10,
      initialLink: stage.link
    });
    this.inlineEditValue.set(stage.name || '');
    this.inlineEditCode.set(stage.code || '');
    this.inlineEditLink.set(stage.link || '');
    this.inlineEditWeight.set(stage.weight ?? 10);
    this.inlineEditError.set(null);
  }

  saveEditStage(stage: RoadmapStage): void {
    // Step name is optional!
    const val = this.inlineEditValue().trim() || null;
    const weight = Number(this.inlineEditWeight());
    if (isNaN(weight) || weight <= 0) {
      this.inlineEditError.set('Weight must be greater than zero');
      return;
    }

    this.roadmapService.updateStage(stage.id, {
      name: val,
      levelId: stage.levelId,
      code: this.inlineEditCode().trim() || null,
      link: this.inlineEditLink().trim() || null,
      weight,
      priorityStageId: stage.priorityStage?.id ?? null
    }).subscribe({
      next: () => this.cancelEdit(),
      error: (err) => {
        this.inlineEditError.set(err.error?.message || err.message || 'Failed to update step');
      }
    });
  }

  deleteStage(id: number): void {
    if (confirm('Are you sure you want to delete this step?')) {
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

  onPriorityStageChange(stage: RoadmapStage, newPriorityId: number | null): void {
    const priorityId = (newPriorityId !== null && newPriorityId !== undefined && (newPriorityId as any) !== '')
      ? Number(newPriorityId)
      : null;

    this.roadmapService.updateStage(stage.id, {
      name: stage.name,
      levelId: stage.levelId,
      code: stage.code,
      link: stage.link,
      weight: stage.weight,
      priorityStageId: priorityId
    }).subscribe();
  }

  // --- Step Drag & Drop (Within Level + Cross-Level) ---

  onStepDrop(event: CdkDragDrop<RoadmapStage[]>, targetLevel: Level): void {
    const current = this.roadmap();
    if (!current) return;

    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;

      const updatedStages = [...targetLevel.stages];
      moveItemInArray(updatedStages, event.previousIndex, event.currentIndex);

      const reorderedStages = updatedStages.map((stg, idx) => ({
        ...stg,
        position: idx + 1
      }));

      // Optimistic update
      const updatedLevels = current.levels.map(lvl => {
        if (lvl.id === targetLevel.id) {
          return { ...lvl, stages: reorderedStages };
        }
        return lvl;
      });
      this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });

      const payload = reorderedStages.map(stg => ({
        id: stg.id,
        position: stg.position
      }));

      this.roadmapService.reorderStages(payload).subscribe({
        error: () => this.roadmapService.loadRoadmap()
      });
    } else {
      // Cross-Level Move
      const sourceLevelId = Number(event.previousContainer.id.replace('level-steps-', ''));
      const sourceLevel = current.levels.find(l => l.id === sourceLevelId);
      if (!sourceLevel) return;

      const sourceStages = [...sourceLevel.stages];
      const targetStages = [...targetLevel.stages];
      const draggedStage = sourceStages[event.previousIndex];

      transferArrayItem(
        sourceStages,
        targetStages,
        event.previousIndex,
        event.currentIndex
      );

      const reorderedSource = sourceStages.map((s, idx) => ({ ...s, position: idx + 1 }));
      const reorderedTarget = targetStages.map((s, idx) => ({
        ...s,
        levelId: targetLevel.id,
        position: idx + 1
      }));

      // Optimistic update
      const updatedLevels = current.levels.map(lvl => {
        if (lvl.id === sourceLevel.id) return { ...lvl, stages: reorderedSource };
        if (lvl.id === targetLevel.id) return { ...lvl, stages: reorderedTarget };
        return lvl;
      });
      this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });

      // Update backend: update stage's levelId and position, then reorder target and source
      this.roadmapService.updateStage(draggedStage.id, {
        name: draggedStage.name,
        levelId: targetLevel.id,
        code: draggedStage.code,
        link: draggedStage.link,
        weight: draggedStage.weight,
        position: event.currentIndex + 1,
        priorityStageId: draggedStage.priorityStage?.id ?? null
      }).subscribe({
        next: () => {
          if (reorderedTarget.length > 1) {
            this.roadmapService.reorderStages(reorderedTarget.map(s => ({ id: s.id, position: s.position }))).subscribe();
          }
          if (reorderedSource.length > 0) {
            this.roadmapService.reorderStages(reorderedSource.map(s => ({ id: s.id, position: s.position }))).subscribe();
          }
        },
        error: () => this.roadmapService.loadRoadmap()
      });
    }
  }

  // --- Task Operations ---

  openAddTaskDialog(stageId: number): void {
    this.dialogMode.set({ kind: 'createTask', stageId });
  }

  openEditTaskDialog(st: StageTask, stageId: number): void {
    this.dialogMode.set({ kind: 'editTask', task: st.task, stageId });
  }

  removeTask(stageId: number, taskId: number): void {
    if (confirm('Are you sure you want to remove this task from this step?')) {
      this.roadmapService.removeTaskFromStage(stageId, taskId).subscribe();
    }
  }

  toggleMainTask(stageId: number, st: StageTask): void {
    const taskId = st.task?.id || st.taskId;
    if (!taskId) return;

    if (st.isMain) {
      this.roadmapService.removeMainTask(stageId).subscribe();
    } else {
      this.roadmapService.setMainTask(stageId, taskId).subscribe();
    }
  }

  // --- Task Drag & Drop (Within Step + Cross-Step) ---

  onTaskDrop(event: CdkDragDrop<StageTask[]>, targetStage: RoadmapStage): void {
    const current = this.roadmap();
    if (!current) return;

    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;

      const updatedTasks = [...targetStage.tasks];
      moveItemInArray(updatedTasks, event.previousIndex, event.currentIndex);

      const reorderedTasks = updatedTasks.map((t, idx) => ({
        ...t,
        position: idx + 1
      }));

      // Optimistic update
      const updatedLevels = current.levels.map(lvl => ({
        ...lvl,
        stages: lvl.stages.map(stg => {
          if (stg.id === targetStage.id) {
            return { ...stg, tasks: reorderedTasks };
          }
          return stg;
        })
      }));
      this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });

      const payload = reorderedTasks.map(t => ({
        taskId: (t.task?.id || t.taskId)!,
        position: t.position
      }));

      this.roadmapService.reorderTasksInStage(targetStage.id, payload).subscribe({
        error: () => this.roadmapService.loadRoadmap()
      });
    } else {
      // Cross-Step Move
      const sourceStageId = Number(event.previousContainer.id.replace('stage-tasks-', ''));
      const draggedItem = event.previousContainer.data[event.previousIndex];
      const taskId = (draggedItem.task?.id || draggedItem.taskId)!;

      const sourceTasks = [...event.previousContainer.data];
      const targetTasks = [...targetStage.tasks];

      transferArrayItem(
        sourceTasks,
        targetTasks,
        event.previousIndex,
        event.currentIndex
      );

      const reorderedSource = sourceTasks.map((t, idx) => ({ ...t, position: idx + 1 }));
      const reorderedTarget = targetTasks.map((t, idx) => ({
        ...t,
        stageId: targetStage.id,
        position: idx + 1,
        isMain: false
      }));

      // Optimistic update
      const updatedLevels = current.levels.map(lvl => ({
        ...lvl,
        stages: lvl.stages.map(stg => {
          if (stg.id === sourceStageId) return { ...stg, tasks: reorderedSource };
          if (stg.id === targetStage.id) return { ...stg, tasks: reorderedTarget };
          return stg;
        })
      }));
      this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });

      this.roadmapService.moveTaskToStage(sourceStageId, taskId, {
        targetStageId: targetStage.id,
        targetPosition: event.currentIndex + 1
      }).subscribe({
        next: () => {
          if (reorderedTarget.length > 1) {
            this.roadmapService.reorderTasksInStage(
              targetStage.id,
              reorderedTarget.map(t => ({ taskId: (t.task?.id || t.taskId)!, position: t.position }))
            ).subscribe();
          }
          if (reorderedSource.length > 0) {
            this.roadmapService.reorderTasksInStage(
              sourceStageId,
              reorderedSource.map(t => ({ taskId: (t.task?.id || t.taskId)!, position: t.position }))
            ).subscribe();
          }
        },
        error: () => this.roadmapService.loadRoadmap()
      });
    }
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
      initialColor: p.color || '#d92027',
      initialDescription: p.description
    });
    this.inlineEditValue.set(p.name);
    this.inlineEditColor.set(p.color || '#d92027');
    this.inlineEditDescription.set(p.description || '');
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
      color: this.inlineEditColor(),
      description: this.inlineEditDescription().trim() || null
    }).subscribe({
      next: () => this.cancelEdit(),
      error: () => {}
    });
  }

  deletePriority(id: number): void {
    if (confirm('Delete this priority tag? It will be unassigned from all associated steps.')) {
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
      color: this.newPriorityColor(),
      description: this.newPriorityDesc().trim() || null
    }).subscribe({
      next: () => {
        this.newPriorityName.set('');
        this.newPriorityColor.set('#d92027');
        this.newPriorityDesc.set('');
        this.newPriorityError.set(null);
      },
      error: () => {}
    });
  }

  // --- Inline Edit Helpers ---

  cancelEdit(): void {
    this.editingTarget.set(null);
    this.inlineEditValue.set('');
    this.inlineEditDescription.set('');
    this.inlineEditCode.set('');
    this.inlineEditLink.set('');
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
