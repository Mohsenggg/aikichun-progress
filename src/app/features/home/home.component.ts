import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TraineeRoadmapService } from '../roadmap/services/trainee-roadmap.service';
import { ProgressRingComponent } from '../roadmap/trainee/components/progress-ring/progress-ring.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProgressRingComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  auth = inject(AuthService);
  traineeRoadmapService = inject(TraineeRoadmapService);

  readonly user = this.auth.backendUser;
  readonly role = this.auth.role;
  readonly isAdmin = this.auth.isAdmin;
  readonly isModerator = this.auth.isModerator;
  readonly isTrainee = this.auth.isTrainee;
  readonly isInactive = computed(() => this.auth.accountStatus() === 'INACTIVE');

  readonly roadmap = this.traineeRoadmapService.roadmap;
  readonly overallProgress = computed(() =>
    this.roadmap()?.progressSummary?.overallProgressPercentage ?? 0
  );
  readonly totalTasks = computed(() =>
    this.roadmap()?.progressSummary?.totalTasksCount ?? 0
  );
  readonly completedTasks = computed(() =>
    this.roadmap()?.progressSummary?.completedTasksCount ?? 0
  );

  ngOnInit(): void {
    if (this.isTrainee()) {
      this.traineeRoadmapService.getTraineeRoadmap().subscribe();
    }
  }

  getRoleBadgeLabel(): string {
    const r = this.role();
    if (r === 'admin') return 'ADMINISTRATOR';
    if (r === 'moderator') return 'MODERATOR';
    return 'TRAINEE MEMBER';
  }
}
