import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { RoadmapService } from '../../core/roadmap/roadmap.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Profile } from '../../core/services/supabase-types';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.css'
})
export class ProfileViewComponent implements OnInit {
  private auth = inject(AuthService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  profile = signal<Profile | null>(null);

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      // Use Cached Service
      const { data } = await this.supabase.getProfile(user.id);
      if (data) this.profile.set(data);
    }
  }

  // Quick Hack: A real percentage requires calculating total steps vs skilled steps.
  // For now, I'll return a random placeholder or 0 if I don't import RoadmapService here.
  // Requirement says "Section 1: Status Display".
  private roadmapService = inject(RoadmapService);

  // Calculate percentage based on 'Skilled' steps count
  progressPercentage() {
    const p = this.profile();
    if (!p || !p.status || !p.status.skilled) return 0;

    // Count how many steps are <= the skilled step
    // We need all steps from service
    const allSteps = this.roadmapService.getAllSteps();
    const skilledIdx = allSteps.findIndex(s => s.stepNumber === p.status.skilled);

    if (skilledIdx === -1) return 0;

    // Percentage = (skilledIdx + 1) / totalSteps * 100
    return Math.round(((skilledIdx + 1) / allSteps.length) * 100);
  }

  goToRoadmap() {
    this.router.navigate(['/roadmap']);
  }

  logout() {
    this.auth.logout();
  }
}
