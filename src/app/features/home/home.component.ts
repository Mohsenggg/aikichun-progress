import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#1a2f23] text-white p-8 flex flex-col items-center justify-center">
      <h1 class="text-3xl font-bold mb-4">Welcome to Aikichun</h1>
      <p class="text-white/70 mb-6">Signed in as: {{ auth.backendUser()?.fullName }} ({{ auth.role() }})</p>
      <div class="flex flex-wrap gap-4 justify-center">
        @if (auth.isAdmin()) {
          <a routerLink="/coach/roadmap" class="btn bg-[#d92027] text-white px-4 py-2 rounded font-semibold hover:opacity-90">Coach Roadmap Builder</a>
        }
        @if (auth.isAdmin() || auth.isModerator()) {
          <a routerLink="/admin/users" class="btn bg-[#2a3d30] border border-white/20 text-white px-4 py-2 rounded font-semibold hover:bg-white/10">User Management</a>
        }
        @if (auth.isTrainee()) {
          <a routerLink="/trainee" class="btn bg-[#22c55e] text-white px-4 py-2 rounded font-semibold hover:opacity-90">My Progress</a>
        }
        <button (click)="auth.logout()" class="btn border border-white/20 text-white/70 px-4 py-2 rounded hover:text-white hover:bg-white/10">Logout</button>
      </div>
    </div>
  `
})
export class HomeComponent {
  auth = inject(AuthService);
}

