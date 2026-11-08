import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TraineeRoadmapService } from '../../../services/trainee-roadmap.service';
import { TraineeStageTask } from '../../../models/trainee.models';
import { AuthService } from '../../../../../core/auth/auth.service';

@Component({
  selector: 'app-task-detail-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-detail-sheet.component.html',
  styleUrl: './task-detail-sheet.component.css'
})
export class TaskDetailSheetComponent {
  @Input() traineeId: string = '';

  traineeRoadmapService = inject(TraineeRoadmapService);
  private authService = inject(AuthService);

  readonly isSubscriptionInactive = computed(() => this.authService.accountStatus() === 'INACTIVE');
  selectedTask = this.traineeRoadmapService.selectedTaskForDetail;

  close(): void {
    this.traineeRoadmapService.selectTaskForDetail(null);
  }

  onToggleCheck(checkDefinitionId: number, currentCompleted: boolean, task: TraineeStageTask, event: MouseEvent): void {
    event.stopPropagation();
    if (this.isSubscriptionInactive()) return;
    if (!this.traineeId) return;
    this.traineeRoadmapService.toggleCheck(
      this.traineeId,
      task.task.id,
      checkDefinitionId,
      !currentCompleted
    );
  }
}
