import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RoadmapService } from '../../core/roadmap/roadmap.service';
import { AuthService } from '../../core/auth/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Profile, ProfileStatus } from '../../core/services/supabase-types';
import { RoadmapGrade, RoadmapSection, RoadmapLevel } from '../../core/roadmap/roadmap.data';

import { GradeSelectionComponent } from './components/grade-selection/grade-selection.component';
import { SectionSelectionComponent } from './components/section-selection/section-selection.component';
import { LevelSelectionComponent } from './components/level-selection/level-selection.component';
import { RoadmapLevelComponent } from './components/roadmap-level.component';
import { RoadmapStepComponent } from './components/roadmap-step.component';

type ViewState = 'GRADES' | 'SECTIONS' | 'LEVELS' | 'STEPS';

@Component({
    selector: 'app-roadmap',
    standalone: true,
    imports: [
        CommonModule,
        GradeSelectionComponent,
        SectionSelectionComponent,
        LevelSelectionComponent,
        RoadmapLevelComponent,
        RoadmapStepComponent
    ],
    templateUrl: './roadmap.component.html',
    styleUrl: './roadmap.component.css'
})
export class RoadmapComponent implements OnInit {
    private roadmapService = inject(RoadmapService);
    private auth = inject(AuthService);
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    roadmapData = this.roadmapService.roadmap;
    allSteps = this.roadmapService.allSteps;

    // Navigation State
    currentView = signal<ViewState>('GRADES');
    selectedGrade = signal<RoadmapGrade | null>(null);
    selectedSection = signal<RoadmapSection | null>(null);
    selectedLevel = signal<RoadmapLevel | null>(null);

    // Profile State
    originalProfile = signal<Profile | null>(null);
    draftStatus = signal<ProfileStatus>({ learning: null, developed: null, skilled: null });
    isSaving = signal(false);
    errorMessage = signal('');
    userName = computed(() => this.originalProfile()?.name || 'Player');

    // Computed
    hasChanges = computed(() => {
        const orig = this.originalProfile()?.status;
        const draft = this.draftStatus();
        if (!orig) return false;
        return orig.learning !== draft.learning || orig.developed !== draft.developed || orig.skilled !== draft.skilled;
    });

    async ngOnInit() {
        const user = this.auth.currentUser();
        if (user) {
            const { data } = await this.supabase.getProfile(user.id);
            if (data) {
                this.originalProfile.set(data);
                this.draftStatus.set({ ...data.status });
            }
        }
    }

    // Navigation Methods
    selectGrade(grade: RoadmapGrade) {
        this.selectedGrade.set(grade);
        this.currentView.set('SECTIONS');
    }

    selectSection(section: RoadmapSection) {
        this.selectedSection.set(section);
        this.currentView.set('LEVELS');
    }

    selectLevel(level: RoadmapLevel) {
        this.selectedLevel.set(level);
        this.currentView.set('STEPS');
    }

    goBackToGrades() {
        this.selectedGrade.set(null);
        this.currentView.set('GRADES');
    }

    goBackToSections() {
        this.selectedSection.set(null);
        this.currentView.set('SECTIONS');
    }

    goBackToLevels() {
        this.selectedLevel.set(null);
        this.currentView.set('LEVELS');
    }



    // Progress Logic
    getVisibility(stepNumber: string) {
        return this.roadmapService.getVisibilityState(stepNumber, this.originalProfile()?.status || { learning: null, developed: null, skilled: null });
    }

    getChecks(stepNumber: string) {
        const s = this.draftStatus();
        const stepIdx = this.getStepIdx(stepNumber);
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
        const newStatus = { ...current };
        const currentPointer = newStatus[type];

        if (currentPointer === stepNumber) {
            // Uncheck -> revert to previous step
            if (stepIdx > 0) {
                newStatus[type] = this.allSteps()[stepIdx - 1].stepNumber;
            } else {
                newStatus[type] = null;
            }
        } else {
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
        const currentCount = this.originalProfile()!.updates_count || 0;

        const validation = this.roadmapService.validateUpdate(oldStatus, newStatus, lastUpdate, currentCount);

        if (!validation.valid) {
            this.errorMessage.set(validation.message!);
            this.isSaving.set(false);
            return;
        }

        const { error } = await this.supabase.updateProfile(this.originalProfile()!.id, {
            status: newStatus,
            last_update_date: new Date().toISOString(),
            updates_count: validation.nextUpdateCount
        });

        if (error) {
            this.errorMessage.set(`Save Failed: ${error.message}`);
        } else {
            this.originalProfile.update(p => ({
                ...p!,
                status: newStatus,
                last_update_date: new Date().toISOString(),
                updates_count: validation.nextUpdateCount
            }));
            alert('Progress Saved Successfully!');
            // Stay on current view or go back? Usually stay to let them continue or leave explicitly.
        }
        this.isSaving.set(false);
    }

    logout() {
        this.auth.logout();
    }

    private getStepIdx(num: string | null) {
        if (!num) return -1;
        return this.allSteps().findIndex(s => s.stepNumber === num);
    }
}
