import { Injectable } from '@angular/core';
import { ROADMAP_DATA, RoadmapLevel, RoadmapStep } from './roadmap.data';
import { ProfileStatus } from '../services/supabase-types';
import { differenceInDays } from 'date-fns';

@Injectable({
    providedIn: 'root'
})
export class RoadmapService {
    readonly roadmap = ROADMAP_DATA;

    // Flattened steps for easier calculation
    private readonly allSteps = this.roadmap.flatMap(l => l.steps);

    getRoadmap() {
        return this.roadmap;
    }

    getAllSteps() {
        return this.allSteps;
    }

    /**
     * Calculates which steps are "Opened" based on the user's current progress.
     * Rule: User can access 3 opened steps ahead of their current progress.
     */
    getVisibilityState(stepNumber: string, status: ProfileStatus): 'opened' | 'locked' {
        const currentIndex = this.getMaxProgressIndex(status);
        const visibleLimit = currentIndex + 3;

        const stepIndex = this.allSteps.findIndex(s => s.stepNumber === stepNumber);
        if (stepIndex === -1) return 'locked'; // Data mismatch

        return stepIndex <= visibleLimit ? 'opened' : 'locked';
    }

    /**
     * Validates if the user can save the update.
     */
    validateUpdate(
        oldStatus: ProfileStatus,
        newStatus: ProfileStatus,
        lastUpdateDate: string | null
    ): { valid: boolean; message?: string } {

        // 1. Time Rule (5 Days)
        if (lastUpdateDate) {
            const daysDiff = differenceInDays(new Date(), new Date(lastUpdateDate));
            if (daysDiff < 5) {
                return { valid: false, message: `You can only update once every 5 days. Wait ${5 - daysDiff} more days.` };
            }
        }

        // 2. Quantity Rule (Max 2 Checkboxes)
        let changes = 0;
        if (oldStatus.learning !== newStatus.learning) changes++;
        if (oldStatus.developed !== newStatus.developed) changes++;
        if (oldStatus.skilled !== newStatus.skilled) changes++;
        // Note: This logic assumes simple change counting. 
        // Real strict "Checkbox counting" might need to diff the exact step jumps if checking multiple steps at once is allowed?
        // User Requirement: "Can check only 2 checkboxes per update".
        // Since status only stores the "Latest" step ID for each category,
        // we need to count how many visual checkboxes changed.
        // If user moves Learning from Step 1 to Step 3, they technically checked Step 2 and Step 3.
        // So we should calculate the STEP DISTANCE.

        const distLearning = this.getStepDistance(oldStatus.learning, newStatus.learning);
        const distDeveloped = this.getStepDistance(oldStatus.developed, newStatus.developed);
        const distSkilled = this.getStepDistance(oldStatus.skilled, newStatus.skilled);

        const totalChecks = distLearning + distDeveloped + distSkilled;

        if (totalChecks > 2) {
            return { valid: false, message: `You can only check 2 boxes per update. You tried to check ${totalChecks}.` };
        }

        return { valid: true };
    }

    private getMaxProgressIndex(status: ProfileStatus): number {
        const idxL = this.getStepIndex(status.learning);
        const idxD = this.getStepIndex(status.developed);
        const idxS = this.getStepIndex(status.skilled);
        return Math.max(idxL, idxD, idxS, -1);
    }

    private getStepIndex(stepNumber: string | null): number {
        if (!stepNumber) return -1;
        return this.allSteps.findIndex(s => s.stepNumber === stepNumber);
    }

    private getStepDistance(oldStep: string | null, newStep: string | null): number {
        const oldIdx = this.getStepIndex(oldStep);
        const newIdx = this.getStepIndex(newStep);
        // Only count forward progress
        if (newIdx > oldIdx) {
            return newIdx - oldIdx;
        }
        return 0; // Negative or same doesn't count as "Checking a box" (unchecking is free?)
    }
}
