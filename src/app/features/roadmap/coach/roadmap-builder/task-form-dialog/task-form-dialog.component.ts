import {
  Component, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { DialogMode, Task, CheckDefinition, CheckDefinitionRequest } from '../../../models/roadmap.models';
import { TaskService } from '../../../services/task.service';
import { RoadmapService } from '../../../services/roadmap.service';
import { CheckDefinitionService } from '../../../services/check-definition.service';

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './task-form-dialog.component.html',
  styleUrl: './task-form-dialog.component.css'
})
export class TaskFormDialogComponent implements OnChanges, OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private roadmapService = inject(RoadmapService);
  readonly checkDefService = inject(CheckDefinitionService);

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

  // ── Check Definition management ─────────────────────────────────────────────
  /** IDs selected for the current task */
  selectedCheckIds = signal<Set<number>>(new Set());

  /** Inline "add new check" panel */
  showAddCheckPanel = signal(false);
  newCheckName = signal('');
  newCheckDesc = signal('');
  isSavingCheck = signal(false);
  checkPanelError = signal<string | null>(null);

  /** Editing an existing check */
  editingCheckId = signal<number | null>(null);
  editCheckName = signal('');
  editCheckDesc = signal('');
  isUpdatingCheck = signal(false);
  editCheckError = signal<string | null>(null);

  /** Computed list of all available checks from service */
  allChecks = computed(() => this.checkDefService.checkDefinitions());

  // ────────────────────────────────────────────────────────────────────────────

  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    link: [''],
    weight: [1, [Validators.required, Validators.min(0.01)]],
    active: [true]
  });

  ngOnInit(): void {
    // Ensure check definitions are loaded
    if (this.checkDefService.checkDefinitions().length === 0) {
      this.checkDefService.loadAll();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && this.mode) {
      this.errorMessage.set(null);
      this.isSubmitting.set(false);
      this.selectedExistingTaskId.set(null);
      this.showAddCheckPanel.set(false);
      this.editingCheckId.set(null);

      if (this.mode.kind === 'editTask') {
        this.activeTab.set('create');
        this.taskForm.setValue({
          title: this.mode.task.title || '',
          description: this.mode.task.description || '',
          link: this.mode.task.link || '',
          weight: this.mode.task.weight ?? 1,
          active: this.mode.task.active ?? true
        });
        // Seed selected checks from existing task
        const existingChecks = this.mode.task.checks || [];
        this.selectedCheckIds.set(new Set(existingChecks.map(c => c.id)));
      } else {
        this.activeTab.set('create');
        this.taskForm.reset({ title: '', description: '', link: '', weight: 1, active: true });
        this.selectedCheckIds.set(new Set());
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

  close() { this.closed.emit(); }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close();
    }
  }

  // ── Check selection helpers ─────────────────────────────────────────────────
  isCheckSelected(id: number): boolean {
    return this.selectedCheckIds().has(id);
  }

  toggleCheck(id: number) {
    const s = new Set(this.selectedCheckIds());
    if (s.has(id)) { s.delete(id); } else { s.add(id); }
    this.selectedCheckIds.set(s);
  }

  // ── Add new check inline ────────────────────────────────────────────────────
  openAddCheckPanel() {
    this.showAddCheckPanel.set(true);
    this.newCheckName.set('');
    this.newCheckDesc.set('');
    this.checkPanelError.set(null);
  }

  cancelAddCheck() {
    this.showAddCheckPanel.set(false);
  }

  saveNewCheck() {
    const name = this.newCheckName().trim();
    if (!name) { this.checkPanelError.set('Check name is required.'); return; }
    this.isSavingCheck.set(true);
    this.checkPanelError.set(null);
    const desc = this.newCheckDesc().trim();
    const req: CheckDefinitionRequest = { name, description: desc ? desc : undefined };
    this.checkDefService.create(req).subscribe({
      next: (created) => {
        // Auto-select the newly created check
        const s = new Set(this.selectedCheckIds());
        s.add(created.id);
        this.selectedCheckIds.set(s);
        this.isSavingCheck.set(false);
        this.showAddCheckPanel.set(false);
        this.newCheckName.set('');
        this.newCheckDesc.set('');
      },
      error: (err) => {
        this.checkPanelError.set(err.error?.message || err.message || 'Failed to create check');
        this.isSavingCheck.set(false);
      }
    });
  }

  // ── Edit existing check ─────────────────────────────────────────────────────
  startEditCheck(check: CheckDefinition) {
    this.editingCheckId.set(check.id);
    this.editCheckName.set(check.name);
    this.editCheckDesc.set(check.description || '');
    this.editCheckError.set(null);
  }

  cancelEditCheck() { this.editingCheckId.set(null); }

  saveEditCheck() {
    const id = this.editingCheckId();
    if (!id) return;
    const name = this.editCheckName().trim();
    if (!name) { this.editCheckError.set('Name is required.'); return; }
    this.isUpdatingCheck.set(true);
    this.editCheckError.set(null);
    const desc = this.editCheckDesc().trim();
    const req: CheckDefinitionRequest = { name, description: desc ? desc : undefined };
    this.checkDefService.update(id, req).subscribe({
      next: () => {
        this.isUpdatingCheck.set(false);
        this.editingCheckId.set(null);
        this.editCheckName.set('');
        this.editCheckDesc.set('');
      },
      error: (err) => {
        this.editCheckError.set(err.error?.message || err.message || 'Failed to update');
        this.isUpdatingCheck.set(false);
      }
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  submit() {
    if (!this.mode) return;

    if (this.activeTab() === 'existing') {
      const selectedId = this.selectedExistingTaskId();
      if (!selectedId) { this.errorMessage.set('Please select a task to add.'); return; }
      this.isSubmitting.set(true);
      this.roadmapService.addTaskToStage(this.mode.stageId, { taskId: selectedId }).subscribe({
        next: () => { this.isSubmitting.set(false); this.taskSaved.emit(); this.close(); },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || err.message || 'Failed to place task in stage');
        }
      });
      return;
    }

    if (this.taskForm.invalid) { this.taskForm.markAllAsTouched(); return; }

    const formVal = this.taskForm.value;
    const checkDefinitionIds = [...this.selectedCheckIds()];
    const taskReq = {
      title: formVal.title.trim(),
      description: formVal.description?.trim() || undefined,
      link: formVal.link?.trim() || undefined,
      weight: formVal.weight != null ? Number(formVal.weight) : 1,
      active: formVal.active ?? true,
      checkDefinitionIds: checkDefinitionIds.length > 0 ? checkDefinitionIds : undefined
    };

    this.isSubmitting.set(true);

    if (this.mode.kind === 'editTask') {
      this.taskService.updateTask(this.mode.task.id, taskReq).subscribe({
        next: (updatedTask) => {
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
      const stageId = this.mode.stageId;
      this.taskService.createTask(taskReq).subscribe({
        next: (created) => {
          this.roadmapService.addTaskToStage(stageId, { taskId: created.id }).subscribe({
            next: () => { this.isSubmitting.set(false); this.taskSaved.emit(); this.close(); },
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
