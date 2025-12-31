import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapGrade } from '../../../../core/roadmap/roadmap.data';
import { ProfileStatus } from '../../../../core/services/supabase-types';
import { RoadmapService } from '../../../../core/roadmap/roadmap.service';

@Component({
    selector: 'app-grade-selection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './grade-selection.component.html',
    styleUrls: ['./grade-selection.component.css']
})
export class GradeSelectionComponent {
    @Input() grades: RoadmapGrade[] = [];
    @Input() status!: ProfileStatus;
    @Output() gradeSelected = new EventEmitter<RoadmapGrade>();

    private roadmapService = inject(RoadmapService);

    getProgress(grade: RoadmapGrade): number {
        if (!this.status) return 0;
        return this.roadmapService.getGradeProgress(grade, this.status);
    }

    getIcon(gradeName: string): string {
        const name = gradeName.toUpperCase();
        if (name.includes('PROTECTOR')) return 'fa-user-shield';
        if (name.includes('FIGHTER')) return 'fa-hand-fist';
        if (name.includes('WARRIOR')) return 'fa-dungeon';
        if (name.includes('MASTER')) return 'fa-crown';
        return 'fa-star';
    }

    selectGrade(grade: RoadmapGrade) {
        this.gradeSelected.emit(grade);
    }
}
