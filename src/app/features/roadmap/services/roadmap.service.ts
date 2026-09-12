import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Roadmap,
  PriorityStage,
  Level,
  RoadmapStage,
  StageTask,
  LevelRequest,
  LevelReorderItem,
  PriorityStageRequest,
  StageRequest,
  StageReorderItem,
  StageTaskPlacement,
  StageTaskReorderItem
} from '../models/roadmap.models';

@Injectable({
  providedIn: 'root'
})
export class RoadmapService {
  private http = inject(HttpClient);
  private base = environment.apiUrl + '/coach';

  // Reactive state
  roadmap = signal<Roadmap | null>(null);
  priorityStages = signal<PriorityStage[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

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

  // Reads
  loadRoadmap(): void {
    this.isLoading.set(true);
    this.http.get<Roadmap>(`${this.base}/roadmap?includeInactive=true`)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(err => {
          this.setError(err);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (data) => this.roadmap.set(data),
        error: () => {}
      });
  }

  loadPriorityStages(): void {
    this.http.get<PriorityStage[]>(`${this.base}/priority-stages`)
      .pipe(
        catchError(err => {
          this.setError(err);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (stages) => this.priorityStages.set(stages),
        error: () => {}
      });
  }

  // Levels
  createLevel(req: LevelRequest): Observable<Level> {
    return this.http.post<Level>(`${this.base}/levels`, req).pipe(
      tap((newLevel) => {
        const current = this.roadmap();
        if (current) {
          const levels = [...current.levels, { ...newLevel, stages: newLevel.stages || [] }];
          this.roadmap.set({ ...current, levels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  updateLevel(id: number, req: LevelRequest): Observable<Level> {
    return this.http.put<Level>(`${this.base}/levels/${id}`, req).pipe(
      tap((updated) => {
        const current = this.roadmap();
        if (current) {
          const levels = current.levels.map(lvl => lvl.id === id ? { ...lvl, name: updated.name, position: updated.position } : lvl);
          this.roadmap.set({ ...current, levels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  deleteLevel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/levels/${id}`).pipe(
      tap(() => {
        const current = this.roadmap();
        if (current) {
          const levels = current.levels.filter(lvl => lvl.id !== id);
          this.roadmap.set({ ...current, levels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  reorderLevels(items: LevelReorderItem[]): Observable<Level[]> {
    return this.http.put<Level[]>(`${this.base}/levels/reorder`, items).pipe(
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Priority Stages
  createPriorityStage(req: PriorityStageRequest): Observable<PriorityStage> {
    return this.http.post<PriorityStage>(`${this.base}/priority-stages`, req).pipe(
      tap((created) => {
        this.priorityStages.update(list => [...list, created]);
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  updatePriorityStage(id: number, req: PriorityStageRequest): Observable<PriorityStage> {
    return this.http.put<PriorityStage>(`${this.base}/priority-stages/${id}`, req).pipe(
      tap((updated) => {
        this.priorityStages.update(list => list.map(item => item.id === id ? updated : item));
        // Update priority stages in current roadmap stages as well
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.priorityStage?.id === id) {
                return { ...stage, priorityStage: updated };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  deletePriorityStage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/priority-stages/${id}`).pipe(
      tap(() => {
        this.priorityStages.update(list => list.filter(item => item.id !== id));
        // Remove priority stage reference from any stages in the current roadmap
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.priorityStage?.id === id) {
                return { ...stage, priorityStage: null };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Stages
  createStage(req: StageRequest): Observable<RoadmapStage> {
    return this.http.post<RoadmapStage>(`${this.base}/stages`, req).pipe(
      tap((newStage) => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => {
            if (level.id === req.levelId) {
              return {
                ...level,
                stages: [...level.stages, { ...newStage, tasks: newStage.tasks || [] }]
              };
            }
            return level;
          });
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  updateStage(id: number, req: StageRequest): Observable<RoadmapStage> {
    return this.http.put<RoadmapStage>(`${this.base}/stages/${id}`, req).pipe(
      tap((updated) => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === id) {
                return {
                  ...stage,
                  name: updated.name,
                  position: updated.position,
                  priorityStage: updated.priorityStage
                };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  deleteStage(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/stages/${id}`).pipe(
      tap(() => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.filter(stage => stage.id !== id)
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  reorderStages(items: StageReorderItem[]): Observable<RoadmapStage[]> {
    return this.http.put<RoadmapStage[]>(`${this.base}/stages/reorder`, items).pipe(
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  // Stage Tasks
  addTaskToStage(stageId: number, req: StageTaskPlacement): Observable<StageTask> {
    return this.http.post<StageTask>(`${this.base}/stages/${stageId}/tasks`, req).pipe(
      tap((placed) => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === stageId) {
                return {
                  ...stage,
                  tasks: [...stage.tasks, placed]
                };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  removeTaskFromStage(stageId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/stages/${stageId}/tasks/${taskId}`).pipe(
      tap(() => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === stageId) {
                return {
                  ...stage,
                  tasks: stage.tasks.filter(st => (st.task?.id !== taskId && st.taskId !== taskId))
                };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  reorderTasksInStage(stageId: number, items: StageTaskReorderItem[]): Observable<StageTask[]> {
    return this.http.put<StageTask[]>(`${this.base}/stages/${stageId}/tasks/reorder`, items).pipe(
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  setMainTask(stageId: number, taskId: number): Observable<StageTask> {
    return this.http.put<StageTask>(`${this.base}/stages/${stageId}/tasks/${taskId}/main`, {}).pipe(
      tap((response) => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === stageId) {
                return {
                  ...stage,
                  tasks: stage.tasks.map(st => ({
                    ...st,
                    isMain: (st.task?.id === taskId || st.taskId === taskId)
                  }))
                };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  removeMainTask(stageId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/stages/${stageId}/main-task`).pipe(
      tap(() => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === stageId) {
                return {
                  ...stage,
                  tasks: stage.tasks.map(st => ({
                    ...st,
                    isMain: false
                  }))
                };
              }
              return stage;
            })
          }));
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }
}
