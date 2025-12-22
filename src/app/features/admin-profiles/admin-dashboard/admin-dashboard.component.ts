import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Profile } from '../../../core/services/supabase-types';
import { ManageProfilePopupComponent } from '../components/manage-profile-popup.component';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ManageProfilePopupComponent],
  template: `
    <div class="min-h-screen bg-aikido-green text-white p-4 pb-20">
      <header class="flex justify-between items-center mb-8 pt-4">
        <h1 class="text-2xl font-bold uppercase tracking-wider">Profiles</h1>
        <button (click)="logout()" class="text-sm text-white/60 hover:text-white underline">Logout</button>
      </header>

      <!-- Stats / Add Section -->
      <div class="mb-6 bg-white/5 rounded-xl p-4 flex justify-between items-center">
        <div>
          <span class="block text-xs text-white/50 uppercase">Total Players</span>
          <span class="text-2xl font-bold">{{ profiles().length }}</span>
        </div>
        <button (click)="openAddPopup()" class="bg-aikido-red px-6 py-2 rounded-full font-bold shadow-lg hover:brightness-110 flex items-center gap-2">
          <span>+</span> Add New
        </button>
      </div>

      <!-- List -->
      <div class="flex flex-col gap-3">
        <div *ngFor="let p of profiles()" class="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-white/10 transition-colors">
          <div class="flex items-center gap-4">
             <!-- Avatar Placeholder -->
             <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold border border-white/10">
                {{ p.name.charAt(0) }}
             </div>
             <div>
               <h3 class="font-bold text-lg leading-tight">{{ p.name }}</h3>
               <p class="text-xs text-white/50 font-mono">{{ p.code }}</p>
             </div>
          </div>
          
          <div class="flex items-center gap-2">
             <!-- Status Dot logic? Green=Skilled, etc. Just simple text for now -->
             <span class="px-2 py-1 rounded bg-black/30 text-[10px] uppercase font-bold tracking-wider text-white/70">
                {{ getHighestStatus(p) }}
             </span>
             <button (click)="openEditPopup(p)" class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
               ⚙️
             </button>
          </div>
        </div>
      </div>

      <app-manage-profile-popup
        [isOpen]="isPopupOpen()"
        [initialProfile]="selectedProfile()"
        (close)="closePopup()"
        (save)="handleSave($event)"
      ></app-manage-profile-popup>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  profiles = signal<Profile[]>([]);
  isPopupOpen = signal(false);
  selectedProfile = signal<Profile | null>(null);

  async ngOnInit() {
    await this.fetchProfiles();
  }

  async fetchProfiles() {
    // Use Service with Logging
    const { data, error } = await this.supabase.getAllProfiles();

    if (error) {
      // Service logs it too
    }

    if (data) this.profiles.set(data);
  }

  getHighestStatus(p: Profile): string {
    if (p.status?.skilled) return 'Skilled';
    if (p.status?.developed) return 'Developed';
    if (p.status?.learning) return 'Learning';
    return 'New';
  }

  openAddPopup() {
    this.selectedProfile.set(null);
    this.isPopupOpen.set(true);
  }

  openEditPopup(p: Profile) {
    this.selectedProfile.set(p);
    this.isPopupOpen.set(true);
  }

  closePopup() {
    this.isPopupOpen.set(false);
  }

  async handleSave(formValue: Partial<Profile>) {
    if (this.selectedProfile()) {
      // Update (Use Service)
      const { error } = await this.supabase.updateProfile(this.selectedProfile()!.id, {
        name: formValue.name,
        code: formValue.code
      });

      if (error) console.error('Admin Update Error:', error);
      if (!error) await this.fetchProfiles();
    } else {
      // Create (Use Service)
      const { error } = await this.supabase.createProfile({
        name: formValue.name!,
        code: formValue.code!,
        status: { learning: null, developed: null, skilled: null }
      });

      if (error) console.error('Admin Create Error:', error);
      if (!error) await this.fetchProfiles();
    }
    this.closePopup();
  }

  logout() {
    this.auth.logout();
  }
}
