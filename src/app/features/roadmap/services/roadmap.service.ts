import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Roadmap,
  RoadmapRequest,
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
  StageTaskMoveRequest,
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
        next: (data) => {
          if (data && data.levels) {
            data.levels = data.levels.map(level => ({
              ...level,
              stages: (level.stages || []).map(stage => ({
                ...stage,
                tasks: (stage.tasks || []).map(st => ({
                  ...st,
                  isMain: Boolean(st.isMain ?? (st as any).main ?? false)
                }))
              }))
            }));
          }
          this.roadmap.set(data);
        },
        error: () => {}
      });
  }

  updateRoadmap(id: number, req: RoadmapRequest): Observable<Roadmap> {
    return this.http.put<Roadmap>(`${this.base}/roadmap/${id}`, req).pipe(
      tap((updated) => {
        const current = this.roadmap();
        if (current) {
          this.roadmap.set({ ...current, name: updated.name, description: updated.description, isActive: updated.isActive });
        } else {
          this.roadmap.set(updated);
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
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
          const levels = current.levels.map(lvl => lvl.id === id ? { ...lvl, name: updated.name, link: updated.link, position: updated.position } : lvl);
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
          const sourceLevel = current.levels.find(lvl => lvl.stages.some(s => s.id === id));
          const targetLevelId = req.levelId;

          let updatedLevels = current.levels;
          if (sourceLevel && targetLevelId && sourceLevel.id !== targetLevelId) {
            // Moved to a different level
            const stageToMove = sourceLevel.stages.find(s => s.id === id);
            const preservedTasks = stageToMove?.tasks || updated.tasks || [];
            const updatedStageObj: RoadmapStage = {
              ...stageToMove!,
              ...updated,
              levelId: targetLevelId,
              tasks: preservedTasks
            };

            updatedLevels = current.levels.map(lvl => {
              if (lvl.id === sourceLevel.id) {
                return { ...lvl, stages: lvl.stages.filter(s => s.id !== id) };
              }
              if (lvl.id === targetLevelId) {
                return { ...lvl, stages: [...lvl.stages, updatedStageObj] };
              }
              return lvl;
            });
          } else {
            updatedLevels = current.levels.map(level => ({
              ...level,
              stages: level.stages.map(stage => {
                if (stage.id === id) {
                  return {
                    ...stage,
                    name: updated.name,
                    code: updated.code,
                    link: updated.link,
                    weight: updated.weight,
                    position: updated.position,
                    priorityStage: updated.priorityStage,
                    tasks: stage.tasks || updated.tasks || []
                  };
                }
                return stage;
              })
            }));
          }
          this.roadmap.set({ ...current, levels: updatedLevels });
        }
      }),
      catchError(err => {
        this.setError(err);
        return throwError(() => err);
      })
    );
  }

  updateStageWeight(id: number, weight: number): Observable<RoadmapStage> {
    return this.http.patch<RoadmapStage>(`${this.base}/stages/${id}/weight`, { weight }).pipe(
      tap((updated) => {
        const current = this.roadmap();
        if (current) {
          const updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === id) {
                return {
                  ...stage,
                  weight: updated.weight
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

  moveTaskToStage(sourceStageId: number, taskId: number, req: StageTaskMoveRequest): Observable<StageTask> {
    return this.http.put<StageTask>(`${this.base}/stages/${sourceStageId}/tasks/${taskId}/move`, req).pipe(
      tap((moved) => {
        const current = this.roadmap();
        if (current) {
          let movedTaskRef: StageTask | undefined;
          let updatedLevels = current.levels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === sourceStageId && sourceStageId !== req.targetStageId) {
                const found = stage.tasks.find(st => (st.task?.id === taskId || st.taskId === taskId));
                if (found) movedTaskRef = found;
                return {
                  ...stage,
                  tasks: stage.tasks.filter(st => (st.task?.id !== taskId && st.taskId !== taskId))
                };
              }
              return stage;
            })
          }));

          const itemToAdd: StageTask = {
            ...(movedTaskRef || {}),
            ...(moved || {}),
            stageId: req.targetStageId,
            position: moved?.position || req.targetPosition || 1,
            isMain: Boolean(moved?.isMain ?? (moved as any)?.main ?? false),
            task: (moved && moved.task) ? moved.task : movedTaskRef?.task!
          };

          updatedLevels = updatedLevels.map(level => ({
            ...level,
            stages: level.stages.map(stage => {
              if (stage.id === req.targetStageId) {
                const targetTasks = stage.tasks || [];
                const alreadyExists = targetTasks.some(st =>
                  (st.task?.id === taskId || st.taskId === taskId || (moved && st.id === moved.id))
                );

                if (alreadyExists) {
                  // Task already present (optimistic update from drag-and-drop). Update in place without duplicating!
                  return {
                    ...stage,
                    tasks: targetTasks.map(st => {
                      if (st.task?.id === taskId || st.taskId === taskId || (moved && st.id === moved.id)) {
                        return {
                          ...st,
                          ...itemToAdd,
                          task: st.task || itemToAdd.task
                        };
                      }
                      return st;
                    })
                  };
                } else {
                  // Task not yet in target stage, insert it
                  const tasks = [...targetTasks];
                  const insertIdx = req.targetPosition ? Math.max(0, Math.min(req.targetPosition - 1, tasks.length)) : tasks.length;
                  tasks.splice(insertIdx, 0, itemToAdd);
                  return { ...stage, tasks };
                }
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
