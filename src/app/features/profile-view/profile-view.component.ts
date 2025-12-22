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
  template: `
    <div class="min-h-screen bg-aikido-green text-white flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      
      <!-- Greeting -->
      <div class="mb-12 z-10">
        <div class="w-32 h-32 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center text-4xl font-bold border-4 border-white/5">
           {{ profile()?.name?.charAt(0) }}
        </div>
        <h1 class="text-3xl font-bold mb-1">Hi, {{ profile()?.name }}</h1>
        <p class="text-white/50 text-sm font-mono tracking-widest">{{ profile()?.code }}</p>
      </div>

      <!-- Main Status Display (Abstract visual) -->
      <div class="relative w-64 h-64 mb-16 z-10 flex items-center justify-center">
         <!-- Outer Ring -->
         <div class="absolute inset-0 border-8 border-white/5 rounded-full"></div>
         <!-- Inner Logic would be dynamic CSS based on progress. -->
         <div class="absolute inset-0 border-8 border-t-aikido-red border-r-aikido-red border-b-transparent border-l-transparent rounded-full rotate-45"></div>
         
         <div class="text-center">
           <span class="block text-4xl font-bold">{{ progressPercentage() }}%</span>
           <span class="text-xs uppercase tracking-widest text-white/50">Skilled</span>
         </div>
      </div>

      <!-- Action -->
      <button (click)="goToRoadmap()" class="w-full max-w-xs h-16 rounded-full bg-aikido-red text-white font-bold text-xl uppercase tracking-wider shadow-xl hover:scale-105 transition-transform z-10 flex items-center justify-center gap-2">
        <span>Update Progress</span>
        <span>→</span>
      </button>

      <button (click)="logout()" class="mt-8 text-white/30 text-sm hover:text-white transition-colors z-10">Sign Out</button>

      <!-- Decor for visual interest -->
      <div class="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div class="absolute top-10 right-10 w-64 h-64 bg-aikido-red blur-[100px] rounded-full"></div>
         <div class="absolute bottom-10 left-10 w-64 h-64 bg-blue-900 blur-[100px] rounded-full"></div>
      </div>
    </div>
  `
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
