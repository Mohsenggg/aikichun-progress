import { ROADMAP_DATA, RoadmapLevel, RoadmapStep, RoadmapGrade, DbRoadmapStep } from './roadmap.data';
import { ProfileStatus } from '../services/supabase-types';
import { differenceInDays } from 'date-fns';
import { SupabaseService } from '../services/supabase.service';
import { Injectable, signal, computed, inject } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class RoadmapService {
    private supabase = inject(SupabaseService);

    private _roadmap = signal<RoadmapGrade[]>(ROADMAP_DATA);
    readonly roadmap = this._roadmap.asReadonly();

    // Flattened steps for easier calculation (Grade -> Section -> Level -> Step)
    readonly allSteps = computed(() =>
        this._roadmap().flatMap(grade =>
            grade.sections.flatMap(section =>
                section.levels.flatMap(level => level.steps)
            )
        )
    );

    constructor() {
        // Automatically load from DB on init
        this.loadRoadmap().catch(err => console.error('Failed to load roadmap:', err));
    }

    async loadRoadmap() {
        const { data, error } = await this.supabase.client
            .from('roadmap_steps') // Assuming table name is roadmap_steps
            .select('*')
            .order('gradeNumber', { ascending: true })
            .order('sectionNumber', { ascending: true })
            .order('levelNumber', { ascending: true })
            .order('stepNumber', { ascending: true });

        if (error) {
            console.error('Error fetching roadmap:', error);
            return;
        }

        if (data && data.length > 0) {
            const hierarchicalData = this.transformDbToRoadmap(data as DbRoadmapStep[]);
            this._roadmap.set(hierarchicalData);
        }
    }

    private transformDbToRoadmap(dbSteps: DbRoadmapStep[]): RoadmapGrade[] {
        const gradesMap = new Map<number, RoadmapGrade>();

        dbSteps.forEach(db => {
            // 1. Get or Create Grade
            if (!gradesMap.has(db.gradeNumber)) {
                gradesMap.set(db.gradeNumber, {
                    grade: db.gradeNumber,
                    "grade-name": db.gradeName,
                    sections: []
                });
            }
            const grade = gradesMap.get(db.gradeNumber)!;

            // 2. Get or Create Section
            let section = grade.sections.find(s => s.section === db.sectionNumber);
            if (!section) {
                section = {
                    section: db.sectionNumber,
                    "section-name": db.sectionName,
                    levels: []
                };
                grade.sections.push(section);
                // Keep sections sorted by number
                grade.sections.sort((a, b) => a.section - b.section);
            }

            // 3. Get or Create Level
            let level = section.levels.find(l => l.level === db.levelNumber);
            if (!level) {
                level = {
                    level: db.levelNumber,
                    name: db.levelName,
                    steps: []
                };
                section.levels.push(level);
                // Keep levels sorted by number
                section.levels.sort((a, b) => a.level - b.level);
            }

            // 4. Add Step
            level.steps.push({
                stepNumber: db.stepNumber,
                stepName: db.stepName,
                stepDetails: db.stepDetails,
                percentage: db.spercentages
            });
        });

        // Convert Map to Array and sort by grade number
        return Array.from(gradesMap.values()).sort((a, b) => a.grade - b.grade);
    }

    getRoadmap() {
        return this._roadmap();
    }

    getAllSteps() {
        return this.allSteps();
    }

    /**
     * Calculates which steps are "Opened" based on the user's current progress.
     * Rule: User can access 3 opened steps ahead of their current progress.
     */
    getVisibilityState(stepNumber: string, status: ProfileStatus): 'opened' | 'locked' {
        const currentIndex = this.getMaxProgressIndex(status);
        const visibleLimit = currentIndex + 3;

        const allSteps = this.allSteps();
        const stepIndex = allSteps.findIndex(s => s.stepNumber === stepNumber);
        if (stepIndex === -1) return 'locked'; // Data mismatch

        return stepIndex <= visibleLimit ? 'opened' : 'locked';
    }

    /**
     * Validates if the user can save the update.
     */
    validateUpdate(
        oldStatus: ProfileStatus,
        newStatus: ProfileStatus,
        lastUpdateDate: string | null,
        currentUpdatesCount: number = 0
    ): { valid: boolean; message?: string; nextUpdateCount?: number } {

        // 1. New Rate Limit Rule (3 Updates / 5 Days Cycle)
        let nextUpdateCount = currentUpdatesCount + 1;

        if (currentUpdatesCount >= 50) {
            // User has used their 3 updates. Check if 5 days have passed since the LAST update.
            if (lastUpdateDate) {
                const daysDiff = differenceInDays(new Date(), new Date(lastUpdateDate));
                if (daysDiff < 5) {
                    return { valid: false, message: `You have used your 3 updates. Please wait ${5 - daysDiff} more days for the cycle to reset.` };
                } else {
                    // 5 Days passed! Cycle resets.
                    // This update counts as the FIRST of the new cycle.
                    nextUpdateCount = 1;
                }
            }
        }

        // 2. Quantity Rule (Max 2 Checkboxes)
        // ... (Existing logic remains)
        let changes = 0;
        // logic...
        const distLearning = this.getStepDistance(oldStatus.learning, newStatus.learning);
        const distDeveloped = this.getStepDistance(oldStatus.developed, newStatus.developed);
        const distSkilled = this.getStepDistance(oldStatus.skilled, newStatus.skilled);

        const totalChecks = distLearning + distDeveloped + distSkilled;

        if (totalChecks > 2) {
            return { valid: false, message: `You can only check 2 boxes per update. You tried to check ${totalChecks}.` };
        }

        return { valid: true, nextUpdateCount };
    }

    private getMaxProgressIndex(status: ProfileStatus): number {
        const idxL = this.getStepIndex(status.learning);
        const idxD = this.getStepIndex(status.developed);
        const idxS = this.getStepIndex(status.skilled);
        return Math.max(idxL, idxD, idxS, -1);
    }

    private getStepIndex(stepNumber: string | null): number {
        if (!stepNumber) return -1;
        return this.allSteps().findIndex(s => s.stepNumber === stepNumber);
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

    /**
     * Calculates the progress percentage for a specific grade.
     */
    getGradeProgress(grade: RoadmapGrade, status: ProfileStatus): number {
        // 1. Get all steps in this grade
        const gradeSteps = grade.sections.flatMap(s => s.levels.flatMap(l => l.steps));
        if (gradeSteps.length === 0) return 0;

        // 2. Get current user progress index
        const currentIndex = this.getMaxProgressIndex(status);

        // 3. Count how many steps in this Grade are <= currentIndex
        // We know logical order is preserved in allSteps.
        // We need to map grade steps to their global indices.
        let completedCount = 0;

        gradeSteps.forEach(step => {
            const globalIndex = this.getStepIndex(step.stepNumber);
            if (globalIndex !== -1 && globalIndex <= currentIndex) {
                completedCount++;
            }
        });

        return Math.round((completedCount / gradeSteps.length) * 100);
    }
}
