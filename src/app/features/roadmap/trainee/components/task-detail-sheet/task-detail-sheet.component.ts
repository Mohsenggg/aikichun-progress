import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraineeRoadmapService } from '../../../services/trainee-roadmap.service';
import { TraineeStageTask } from '../../../models/trainee.models';

@Component({
  selector: 'app-task-detail-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail-sheet.component.html',
  styleUrl: './task-detail-sheet.component.css'
})
export class TaskDetailSheetComponent {
  @Input() traineeId = 0;

  traineeRoadmapService = inject(TraineeRoadmapService);
  selectedTask = this.traineeRoadmapService.selectedTaskForDetail;

  close(): void {
    this.traineeRoadmapService.selectTaskForDetail(null);
  }

  onToggleCheck(checkDefinitionId: number, currentCompleted: boolean, task: TraineeStageTask, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.traineeId) return;
    this.traineeRoadmapService.toggleCheck(
      this.traineeId,
      task.task.id,
      checkDefinitionId,
      !currentCompleted
    );
  }
}
