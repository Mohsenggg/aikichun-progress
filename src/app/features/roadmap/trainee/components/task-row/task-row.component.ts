import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraineeStageTask } from '../../../models/trainee.models';
import { TraineeRoadmapService } from '../../../services/trainee-roadmap.service';

@Component({
  selector: 'app-task-row',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-row.component.html',
  styleUrl: './task-row.component.css'
})
export class TaskRowComponent {
  @Input({ required: true }) stageTask!: TraineeStageTask;
  @Input() allStageTasks: TraineeStageTask[] = [];
  @Input() traineeId = 0;
  @Input() hideStepPercentage = false;
  @Input() stepCode?: string | null;

  private traineeRoadmapService = inject(TraineeRoadmapService);

  get taskPercentOfStep(): number {
    if (!this.allStageTasks || this.allStageTasks.length === 0) return 0;
    const totalWeight = this.allStageTasks.reduce((sum, t) => sum + (t.task.weight ?? 10), 0);
    const taskWeight = this.stageTask.task.weight ?? 10;
    return totalWeight > 0 ? Math.round((taskWeight / totalWeight) * 100) : 0;
  }

  get hasChecks(): boolean {
    return !!(this.stageTask?.progress?.checks && this.stageTask.progress.checks.length > 0);
  }

  onToggleCheck(checkDefinitionId: number, currentCompleted: boolean, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.traineeId) return;
    this.traineeRoadmapService.toggleCheck(
      this.traineeId,
      this.stageTask.task.id,
      checkDefinitionId,
      !currentCompleted
    );
  }

  openTaskDetails(event: MouseEvent): void {
    event.stopPropagation();
    this.traineeRoadmapService.selectTaskForDetail(this.stageTask);
  }
}
