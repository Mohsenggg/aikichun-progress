import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  TraineeRoadmapHierarchy,
  TraineeTaskProgress,
  TraineeStageTask,
  PriorityStageInfo,
  TraineeCheckToggleRequest
} from '../models/trainee.models';

@Injectable({
  providedIn: 'root'
})
export class TraineeRoadmapService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/trainee';

  // Signals
  roadmap = signal<TraineeRoadmapHierarchy | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedTaskForDetail = signal<TraineeStageTask | null>(null);
  activePriorityPopup = signal<{ info: PriorityStageInfo; x: number; y: number } | null>(null);

  private errorTimeout: any = null;

  setError(err: unknown) {
    let msg = 'An unexpected error occurred';
    if (err instanceof HttpErrorResponse) {
      msg = err.error?.message || err.message || `Server error (${err.status})`;
    } else if (typeof err === 'string') {
      msg = err;
    } else if (err && typeof (err as any).message === 'string') {
      msg = (err as any).message;
    }
    this.error.set(msg);

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
    this.errorTimeout = setTimeout(() => {
      this.error.set(null);
      this.errorTimeout = null;
    }, 5000);
  }

  clearError() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }
    this.error.set(null);
  }

  getTraineeRoadmap(traineeId: number): Observable<TraineeRoadmapHierarchy> {
    this.isLoading.set(true);
    return this.http.get<TraineeRoadmapHierarchy>(`${this.base}/${traineeId}/roadmap`).pipe(
      tap(data => {
        this.roadmap.set(data);
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      }),
      finalize(() => this.isLoading.set(false))
    );
  }

  toggleCheck(traineeId: number, taskId: number, checkDefId: number, completed: boolean): void {
    const currentRoadmap = this.roadmap();
    if (!currentRoadmap) return;

    // 1. Deep clone state snapshot for potential rollback
    const snapshot = JSON.parse(JSON.stringify(currentRoadmap)) as TraineeRoadmapHierarchy;

    // 2. Optimistically update local signal state
    const optimisticallyUpdated = this.applyLocalCheckToggle(currentRoadmap, taskId, checkDefId, completed);
    const recalculated = this.recalculateHierarchy(optimisticallyUpdated);
    this.roadmap.set(recalculated);

    // Update selectedTaskForDetail if open
    const currentSelected = this.selectedTaskForDetail();
    if (currentSelected && currentSelected.task.id === taskId) {
      const updatedTask = this.findStageTask(recalculated, taskId);
      if (updatedTask) {
        this.selectedTaskForDetail.set(updatedTask);
      }
    }

    // 3. Background server sync
    const payload: TraineeCheckToggleRequest = { completed };
    this.http.put<TraineeTaskProgress>(
      `${this.base}/${traineeId}/tasks/${taskId}/checks/${checkDefId}`,
      payload
    ).subscribe({
      next: (serverProgress) => {
        // Silently reconcile server progress
        this.reconcileServerProgress(taskId, serverProgress);
      },
      error: (err) => {
        // Rollback state on error
        this.roadmap.set(snapshot);
        if (currentSelected && currentSelected.task.id === taskId) {
          const originalTask = this.findStageTask(snapshot, taskId);
          if (originalTask) {
            this.selectedTaskForDetail.set(originalTask);
          }
        }
        this.setError('Failed to save check progress. Changes reverted.');
      }
    });
  }

  selectTaskForDetail(task: TraineeStageTask | null): void {
    this.selectedTaskForDetail.set(task);
  }

  showPriorityPopup(info: PriorityStageInfo, x: number, y: number): void {
    this.activePriorityPopup.set({ info, x, y });
  }

  closePriorityPopup(): void {
    this.activePriorityPopup.set(null);
  }

  private applyLocalCheckToggle(
    roadmap: TraineeRoadmapHierarchy,
    taskId: number,
    checkDefId: number,
    completed: boolean
  ): TraineeRoadmapHierarchy {
    const levels = roadmap.levels.map(lvl => ({
      ...lvl,
      stages: lvl.stages.map(stg => ({
        ...stg,
        tasks: stg.tasks.map(st => {
          if (st.task.id !== taskId) return st;

          const updatedChecks = st.progress.checks.map(chk =>
            chk.checkDefinitionId === checkDefId
              ? { ...chk, completed, completedAt: completed ? new Date().toISOString() : null }
              : chk
          );

          const total = updatedChecks.length;
          const completedCount = updatedChecks.filter(c => c.completed).length;
          const progressPercentage = total > 0 ? Math.round((completedCount / total) * 10000) / 100 : 0;
          const status = completedCount === 0
            ? 'NOT_STARTED'
            : completedCount === total
              ? 'COMPLETED'
              : 'IN_PROGRESS';

          return {
            ...st,
            progress: {
              ...st.progress,
              completedChecksCount: completedCount,
              totalChecksCount: total,
              progressPercentage,
              status: status as any,
              checks: updatedChecks
            }
          };
        })
      }))
    }));

    return { ...roadmap, levels };
  }

  private recalculateHierarchy(roadmap: TraineeRoadmapHierarchy): TraineeRoadmapHierarchy {
    let totalRoadmapWeight = 0;
    let earnedRoadmapPoints = 0;
    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let inProgressTasksCount = 0;

    const levels = roadmap.levels.map(level => {
      let totalStageWeight = 0;
      let earnedStagePoints = 0;

      const stages = level.stages.map(stage => {
        const stageWeight = stage.weight ?? 10;
        totalStageWeight += stageWeight;

        let totalTaskWeightWithChecks = 0;
        let earnedTaskPoints = 0;

        stage.tasks.forEach(st => {
          const task = st.task;
          if (!task || !task.active) return;

          totalTasksCount++;
          const totalChecks = st.progress.totalChecksCount;
          const completedChecks = st.progress.completedChecksCount;
          const taskWeight = task.weight ?? 10;

          if (totalChecks > 0) {
            totalTaskWeightWithChecks += taskWeight;
            const taskFraction = completedChecks / totalChecks;
            earnedTaskPoints += taskWeight * taskFraction;

            if (completedChecks === totalChecks) {
              completedTasksCount++;
            } else if (completedChecks > 0) {
              inProgressTasksCount++;
            }
          }
        });

        const stepProgress = totalTaskWeightWithChecks > 0
          ? Math.round((earnedTaskPoints / totalTaskWeightWithChecks) * 10000) / 100
          : 0;

        return { ...stage, progressPercentage: stepProgress };
      });

      const updatedStages = stages.map(stage => {
        const stageWeight = stage.weight ?? 10;
        const percentageOfLevel = totalStageWeight > 0
          ? Math.round((stageWeight / totalStageWeight) * 10000) / 100
          : 0;
        earnedStagePoints += stageWeight * (stage.progressPercentage / 100);
        return { ...stage, percentageOfLevel };
      });

      const levelProgress = totalStageWeight > 0
        ? Math.round((earnedStagePoints / totalStageWeight) * 10000) / 100
        : 0;

      const levelWeight = level.weight ?? 10;
      totalRoadmapWeight += levelWeight;
      earnedRoadmapPoints += levelWeight * (levelProgress / 100);

      return {
        ...level,
        progressPercentage: levelProgress,
        stepsCount: updatedStages.length,
        stages: updatedStages
      };
    });

    const overallProgress = totalRoadmapWeight > 0
      ? Math.round((earnedRoadmapPoints / totalRoadmapWeight) * 10000) / 100
      : 0;

    return {
      ...roadmap,
      levels,
      progressSummary: {
        ...roadmap.progressSummary,
        overallProgressPercentage: overallProgress,
        totalTasksCount,
        completedTasksCount,
        inProgressTasksCount
      }
    };
  }

  private reconcileServerProgress(taskId: number, serverProgress: TraineeTaskProgress): void {
    const current = this.roadmap();
    if (!current) return;

    const levels = current.levels.map(lvl => ({
      ...lvl,
      stages: lvl.stages.map(stg => ({
        ...stg,
        tasks: stg.tasks.map(st => st.task.id === taskId ? { ...st, progress: serverProgress } : st)
      }))
    }));

    this.roadmap.set(this.recalculateHierarchy({ ...current, levels }));
  }

  private findStageTask(roadmap: TraineeRoadmapHierarchy, taskId: number): TraineeStageTask | null {
    for (const lvl of roadmap.levels) {
      for (const stg of lvl.stages) {
        for (const st of stg.tasks) {
          if (st.task.id === taskId) return st;
        }
      }
    }
    return null;
  }
}
