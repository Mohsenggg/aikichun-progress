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
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
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
