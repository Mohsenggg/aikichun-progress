import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TraineeRoadmapService } from '../../../services/trainee-roadmap.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { TraineeLevel, TraineeStage } from '../../../models/trainee.models';
import { ProgressRingComponent } from '../../components/progress-ring/progress-ring.component';
import { StepCardComponent } from '../../components/step-card/step-card.component';
import { TaskDetailSheetComponent } from '../../components/task-detail-sheet/task-detail-sheet.component';

@Component({
  selector: 'app-level-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProgressRingComponent,
    StepCardComponent,
    TaskDetailSheetComponent
  ],
  templateUrl: './level-detail.component.html',
  styleUrl: './level-detail.component.css'
})
export class LevelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  traineeRoadmapService = inject(TraineeRoadmapService);

  levelId = signal<number>(0);
  traineeId = signal<number>(1);
  activeLevelInfoModal = signal<TraineeLevel | null>(null);

  roadmap = this.traineeRoadmapService.roadmap;
  isLoading = this.traineeRoadmapService.isLoading;
  errorMessage = this.traineeRoadmapService.error;

  currentLevel = computed<TraineeLevel | null>(() => {
    const rm = this.roadmap();
    const id = this.levelId();
    if (!rm || !id) return null;
    return rm.levels.find(l => l.id === id) || null;
  });

  levelTasksCount(level: TraineeLevel | null | undefined): number {
    if (!level?.stages) return 0;
    return level.stages.reduce((sum, s) => sum + (s.tasks?.length ?? 0), 0);
  }

  ngOnInit(): void {
    // 1. Resolve trainee ID
    this.route.queryParamMap.subscribe(params => {
      const qTraineeId = params.get('traineeId');
      if (qTraineeId && !isNaN(Number(qTraineeId))) {
        this.traineeId.set(Number(qTraineeId));
      } else {
        const user = this.authService.currentUser();
        if (user?.id && !isNaN(Number(user.id))) {
          this.traineeId.set(Number(user.id));
        } else {
          this.traineeId.set(1);
        }
      }
    });

    // 2. Resolve level ID
    this.route.paramMap.subscribe(params => {
      const id = params.get('levelId');
      if (id) {
        this.levelId.set(Number(id));
      }
    });

    // 3. Ensure roadmap is loaded
    if (!this.roadmap()) {
      this.traineeRoadmapService.getTraineeRoadmap(this.traineeId()).subscribe();
    }
  }

  goBack(): void {
    this.router.navigate(['/trainee'], {
      queryParams: { traineeId: this.traineeId() }
    });
  }

  openLevelInfo(level: TraineeLevel, event: MouseEvent): void {
    event.stopPropagation();
    this.activeLevelInfoModal.set(level);
  }

  closeLevelInfo(): void {
    this.activeLevelInfoModal.set(null);
  }
}
