import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TraineeRoadmapService } from '../../../services/trainee-roadmap.service';
import { AuthService } from '../../../../../core/auth/auth.service';
import { TraineeLevel } from '../../../models/trainee.models';
import { ProgressRingComponent } from '../../components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-trainee-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProgressRingComponent],
  templateUrl: './trainee-home.component.html',
  styleUrl: './trainee-home.component.css'
})
export class TraineeHomeComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  authService = inject(AuthService);
  traineeRoadmapService = inject(TraineeRoadmapService);

  traineeId = signal<string>('');
  activeLevelInfoModal = signal<TraineeLevel | null>(null);

  readonly isSubscriptionInactive = computed(() => this.authService.accountStatus() === 'INACTIVE');
  roadmap = this.traineeRoadmapService.roadmap;
  isLoading = this.traineeRoadmapService.isLoading;
  errorMessage = this.traineeRoadmapService.error;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const qTraineeId = params.get('traineeId');
      if (qTraineeId) {
        this.traineeId.set(qTraineeId);
      } else {
        const user = this.authService.backendUser();
        this.traineeId.set(user?.id || '');
      }

      if (this.traineeId()) {
        this.loadRoadmap();
      }
    });
  }

  loadRoadmap(): void {
    this.traineeRoadmapService.getTraineeRoadmap(this.traineeId()).subscribe();
  }

  openLevel(level: TraineeLevel): void {
    if (level.isLocked) return;
    this.router.navigate(['/trainee/level', level.id], {
      queryParams: { traineeId: this.traineeId() }
    });
  }

  levelTasksCount(level: TraineeLevel | null | undefined): number {
    if (!level?.stages) return 0;
    return level.stages.reduce((sum, s) => sum + (s.tasks?.length ?? 0), 0);
  }

  openLevelInfo(level: TraineeLevel, event: MouseEvent): void {
    event.stopPropagation();
    this.activeLevelInfoModal.set(level);
  }

  closeLevelInfo(): void {
    this.activeLevelInfoModal.set(null);
  }

  logout(): void {
    this.authService.logout();
  }
}
