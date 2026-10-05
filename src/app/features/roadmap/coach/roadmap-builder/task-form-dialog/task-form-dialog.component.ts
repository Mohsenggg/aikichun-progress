import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogMode, Task } from '../../../models/roadmap.models';
import { TaskService } from '../../../services/task.service';
import { RoadmapService } from '../../../services/roadmap.service';

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form-dialog.component.html',
  styleUrl: './task-form-dialog.component.css'
})
export class TaskFormDialogComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private roadmapService = inject(RoadmapService);

  @Input() mode: DialogMode = null;
  @Output() closed = new EventEmitter<void>();
  @Output() taskSaved = new EventEmitter<void>();

  activeTab = signal<'create' | 'existing'>('create');
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  // Existing task search state
  searchQuery = signal('');
  searchResults = signal<Task[]>([]);
  selectedExistingTaskId = signal<number | null>(null);
  isSearching = signal(false);

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    link: [''],
    active: [true]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && this.mode) {
      this.errorMessage.set(null);
      this.isSubmitting.set(false);
      this.selectedExistingTaskId.set(null);

      if (this.mode.kind === 'editTask') {
        this.activeTab.set('create');
        this.taskForm.setValue({
          title: this.mode.task.title || '',
          description: this.mode.task.description || '',
          link: this.mode.task.link || '',
          active: this.mode.task.active ?? true
        });
      } else {
        this.activeTab.set('create');
        this.taskForm.reset({
          title: '',
          description: '',
          link: '',
          active: true
        });
        if (this.mode.kind === 'addExistingTask') {
          this.activeTab.set('existing');
          this.fetchExistingTasks();
        }
      }
    }
  }

  setTab(tab: 'create' | 'existing') {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    if (tab === 'existing' && this.searchResults().length === 0) {
      this.fetchExistingTasks();
    }
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
    this.fetchExistingTasks(query);
  }

  fetchExistingTasks(query = '') {
    this.isSearching.set(true);
    this.taskService.listTasks(query).subscribe({
      next: (tasks) => {
        this.searchResults.set(tasks);
        this.isSearching.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to search tasks: ' + (err.error?.message || err.message));
        this.isSearching.set(false);
      }
    });
  }

  selectExistingTask(taskId: number) {
    this.selectedExistingTaskId.set(taskId);
  }

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close();
    }
  }

  submit() {
    if (!this.mode) return;

    if (this.activeTab() === 'existing') {
      const selectedId = this.selectedExistingTaskId();
      if (!selectedId) {
        this.errorMessage.set('Please select a task to add.');
        return;
      }
      this.isSubmitting.set(true);
      this.roadmapService.addTaskToStage(this.mode.stageId, { taskId: selectedId }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.taskSaved.emit();
          this.close();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || err.message || 'Failed to place task in stage');
        }
      });
      return;
    }

    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const formVal = this.taskForm.value;
    const taskReq = {
      title: formVal.title.trim(),
      description: formVal.description?.trim() || undefined,
      link: formVal.link?.trim() || undefined,
      active: formVal.active ?? true
    };

    this.isSubmitting.set(true);

    if (this.mode.kind === 'editTask') {
      this.taskService.updateTask(this.mode.task.id, taskReq).subscribe({
        next: (updatedTask) => {
          // Update task in roadmap signal
          const current = this.roadmapService.roadmap();
          if (current) {
            const updatedLevels = current.levels.map(level => ({
              ...level,
              stages: level.stages.map(stage => ({
                ...stage,
                tasks: stage.tasks.map(st => {
                  if (st.task?.id === updatedTask.id || st.taskId === updatedTask.id) {
                    return { ...st, task: updatedTask };
                  }
                  return st;
                })
              }))
            }));
            this.roadmapService.roadmap.set({ ...current, levels: updatedLevels });
          }
          this.isSubmitting.set(false);
          this.taskSaved.emit();
          this.close();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || err.message || 'Failed to update task');
        }
      });
    } else {
      // Create new task, then place it in current stage
      const stageId = this.mode.stageId;
      this.taskService.createTask(taskReq).subscribe({
        next: (created) => {
          this.roadmapService.addTaskToStage(stageId, { taskId: created.id }).subscribe({
            next: () => {
              this.isSubmitting.set(false);
              this.taskSaved.emit();
              this.close();
            },
            error: (err) => {
              this.isSubmitting.set(false);
              this.errorMessage.set(err.error?.message || err.message || 'Task created but failed to add to stage');
            }
          });
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || err.message || 'Failed to create task');
        }
      });
    }
  }
}
