import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraineeStage, TraineeStageTask } from '../../../models/trainee.models';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { PriorityChipComponent } from '../priority-chip/priority-chip.component';
import { TaskRowComponent } from '../task-row/task-row.component';

@Component({
  selector: 'app-step-card',
  standalone: true,
  imports: [CommonModule, ProgressRingComponent, PriorityChipComponent, TaskRowComponent],
  templateUrl: './step-card.component.html',
  styleUrl: './step-card.component.css'
})
export class StepCardComponent {
  @Input({ required: true }) stage!: TraineeStage;
  @Input() traineeId = 0;
  @Input() set initiallyExpanded(val: boolean) {
    this.isExpanded.set(val);
  }

  isExpanded = signal<boolean>(false);

  toggleExpand(): void {
    this.isExpanded.update(v => !v);
  }

  get displayName(): string {
    if (this.stage?.name && this.stage.name.trim()) {
      return this.stage.name.trim();
    }
    const mainTask = this.stage?.tasks?.find(t => t.isMain);
    if (mainTask?.task?.title) {
      return mainTask.task.title;
    }
    if (this.stage?.tasks && this.stage.tasks.length > 0 && this.stage.tasks[0]?.task?.title) {
      return this.stage.tasks[0].task.title;
    }
    return 'Unnamed Step';
  }

  get sortedTasks(): TraineeStageTask[] {
    if (!this.stage?.tasks) return [];
    return [...this.stage.tasks].sort((a, b) => {
      if (a.isMain && !b.isMain) return -1;
      if (!a.isMain && b.isMain) return 1;
      return (a.position ?? 0) - (b.position ?? 0);
    });
  }

  get activeTasksCount(): number {
    return this.stage?.tasks?.length ?? 0;
  }
}
