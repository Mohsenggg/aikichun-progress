import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoadmapService } from '../../core/roadmap/roadmap.service';
import { AuthService } from '../../core/auth/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Profile, ProfileStatus } from '../../core/services/supabase-types';
import { RoadmapLevelComponent } from './components/roadmap-level.component';
import { RoadmapStepComponent } from './components/roadmap-step.component';

@Component({
    selector: 'app-roadmap',
    standalone: true,
    imports: [CommonModule, RoadmapLevelComponent, RoadmapStepComponent],
    templateUrl: './roadmap.component.html',
    styleUrl: './roadmap.component.css'
})
export class RoadmapComponent implements OnInit {
    private roadmapService = inject(RoadmapService);
    private auth = inject(AuthService);
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    roadmapData = this.roadmapService.getRoadmap();
    allSteps = this.roadmapService.getAllSteps();

    // State
    originalProfile = signal<Profile | null>(null);

    // Draft Status (Modified by user interactions)
    draftStatus = signal<ProfileStatus>({ learning: null, developed: null, skilled: null });

    isSaving = signal(false);
    errorMessage = signal('');

    // Computed
    hasChanges = computed(() => {
        const orig = this.originalProfile()?.status;
        const draft = this.draftStatus();
        if (!orig) return false;
        return orig.learning !== draft.learning || orig.developed !== draft.developed || orig.skilled !== draft.skilled;
    });

    changesCount = computed(() => {
        // Just visually showing count for debugging/user feedback
        // Real validation happens in Service
        return 0; // TODO: Implement display logic if needed
    });

    async ngOnInit() {
        const user = this.auth.currentUser();
        if (user) {
            // Fetch fresh or from cache
            const { data } = await this.supabase.getProfile(user.id);
            if (data) {
                this.originalProfile.set(data);
                // Deep copy status
                this.draftStatus.set({ ...data.status });
            }
        }
    }

    goBack() {
        this.router.navigate(['/profile']);
    }

    getVisibility(stepNumber: string) {
        // Visibility is calculated based on DRAFT status (optimistic UI)? 
        // Or Original? 
        // Requirement: "User updates progress by checking boxes. User can have only 3 opened steps ahead of their *current progress*."
        // If they check a box, does it unlock the next one immediately?
        // Let's use draftStatus for immediate feedback.
        return this.roadmapService.getVisibilityState(stepNumber, this.draftStatus());
    }

    getChecks(stepNumber: string) {
        const s = this.draftStatus();
        // Helper to see if this step is "covered" by the current learning/dev/skilled pointer
        // We need to know the index
        const stepIdx = this.getStepIdx(stepNumber);

        // Check is true if the current status index >= this step index
        // e.g. If status.learning is step 5, then step 3 learning is checked.
        const lIdx = this.getStepIdx(s.learning);
        const dIdx = this.getStepIdx(s.developed);
        const sIdx = this.getStepIdx(s.skilled);

        return {
            learning: stepIdx <= lIdx && lIdx !== -1,
            developed: stepIdx <= dIdx && dIdx !== -1,
            skilled: stepIdx <= sIdx && sIdx !== -1
        };
    }

    handleToggle(stepNumber: string, type: 'learning' | 'developed' | 'skilled') {
        const current = this.draftStatus();
        const stepIdx = this.getStepIdx(stepNumber);

        // Logic: Checking a box sets the status to THAT step (if it's an advance).
        // Unchecking? If they uncheck step 5, status drops to step 4.
        // To keep simple: Clicking a box SETS the pointer to this step.
        // If they click an already checked box (meaning it's the current pointer), maybe toggle off (step - 1)?

        // Let's implement "Set to this level".
        // If I click "Learning" on Step 5. status.learning = "SG-05".

        const newStatus = { ...current };

        // Toggling logic
        // If checking a box that is ALREADY covered by a higher step? 
        // e.g. Learning is at Step 8, I click Step 3 Learning. Nothing happens (it's already done).

        // If I click the exact current tip? e.g. Learning is Step 5. I click Step 5 Learning.
        // Provide "Uncheck" behavior -> Set to Step 4.

        const currentPointer = newStatus[type];
        if (currentPointer === stepNumber) {
            // Uncheck -> revert to previous step
            if (stepIdx > 0) {
                newStatus[type] = this.allSteps[stepIdx - 1].stepNumber;
            } else {
                newStatus[type] = null;
            }
        } else {
            // Advance (or Regression provided it's clickable)
            newStatus[type] = stepNumber;
        }

        this.draftStatus.set(newStatus);
        this.errorMessage.set('');
    }

    async saveChanges() {
        this.isSaving.set(true);
        this.errorMessage.set('');

        const oldStatus = this.originalProfile()!.status;
        const newStatus = this.draftStatus();
        const lastUpdate = this.originalProfile()!.last_update_date;

        const validation = this.roadmapService.validateUpdate(oldStatus, newStatus, lastUpdate);

        if (!validation.valid) {
            this.errorMessage.set(validation.message!);
            this.isSaving.set(false);
            return;
        }

        // Save to DB (via Service with Logging/Cache)
        const { error } = await this.supabase.updateProfile(this.originalProfile()!.id, {
            status: newStatus,
            last_update_date: new Date().toISOString()
        });

        if (error) {
            // Service already logs error, but we show UI feedback
            this.errorMessage.set(`Save Failed: ${error.message}`);
        } else {
            // Success
            // Update local state is handled by service cache, but we update our signals
            this.originalProfile.update(p => ({ ...p!, status: newStatus, last_update_date: new Date().toISOString() }));

            // Show Success Feedback
            alert('Progress Saved Successfully!');
            this.goBack();
        }

        this.isSaving.set(false);
    }

    private getStepIdx(num: string | null) {
        if (!num) return -1;
        return this.allSteps.findIndex(s => s.stepNumber === num);
    }
}
