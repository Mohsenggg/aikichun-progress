import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-[#1a2f23] text-white p-8">
      <h1 class="text-2xl font-bold mb-4">User & Subscription Management</h1>
      <p class="text-white/70 mb-4">Workstream 6 will implement full user listing and subscription management.</p>
      <a routerLink="/home" class="text-emerald-400 hover:underline">← Back to Home</a>
    </div>
  `
})
export class UserListComponent {}

