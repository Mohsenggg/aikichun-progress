import { Component, EventEmitter, Input, Output, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { RoadmapService } from '../../core/roadmap/roadmap.service';
import { Profile } from '../../core/services/supabase-types';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './profile.component.html',
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
    @Input() isOpen = false;
    @Output() close = new EventEmitter<void>();

    private auth = inject(AuthService);
    private supabase = inject(SupabaseService);
    private roadmapService = inject(RoadmapService);

    backendUser = this.auth.backendUser;
    profile = signal<Profile | null>(null);

    userName = computed(() =>
        this.profile()?.name || this.backendUser()?.fullName || 'Player'
    );

    initials = computed(() => {
        const name = this.userName();
        if (!name) return 'P';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    });

    email = computed(() => this.backendUser()?.email ?? '');
    role = computed(() => this.backendUser()?.role ?? '');
    accountStatus = computed(() => this.backendUser()?.accountStatus ?? '');

    totalSteps = computed(() => this.roadmapService.allSteps().length);

    learningProgress = computed(() => {
        const status = this.profile()?.status;
        const steps = this.roadmapService.allSteps();
        if (!status || steps.length === 0) return 0;
        const idx = status.learning
            ? steps.findIndex(s => s.stepNumber === status.learning)
            : -1;
        return idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 0;
    });

    developedProgress = computed(() => {
        const status = this.profile()?.status;
        const steps = this.roadmapService.allSteps();
        if (!status || steps.length === 0) return 0;
        const idx = status.developed
            ? steps.findIndex(s => s.stepNumber === status.developed)
            : -1;
        return idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 0;
    });

    skilledProgress = computed(() => {
        const status = this.profile()?.status;
        const steps = this.roadmapService.allSteps();
        if (!status || steps.length === 0) return 0;
        const idx = status.skilled
            ? steps.findIndex(s => s.stepNumber === status.skilled)
            : -1;
        return idx >= 0 ? Math.round(((idx + 1) / steps.length) * 100) : 0;
    });

    lastUpdateFormatted = computed(() => {
        const d = this.profile()?.last_update_date;
        if (!d) return 'Never';
        return new Date(d).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    });

    updatesUsed = computed(() => this.profile()?.updates_count || 0);

    async ngOnInit() {
        const user = this.auth.currentUser();
        if (user) {
            const { data } = await this.supabase.getProfile(user.id);
            if (data) this.profile.set(data);
        }
    }

    onClose() { this.close.emit(); }
    logout() { this.auth.logout(); }
}