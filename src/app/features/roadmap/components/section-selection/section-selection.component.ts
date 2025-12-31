import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapGrade, RoadmapSection } from '../../../../core/roadmap/roadmap.data';

@Component({
    selector: 'app-section-selection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './section-selection.component.html',
    styleUrls: ['./section-selection.component.css']
})
export class SectionSelectionComponent {
    @Input() grade!: RoadmapGrade;
    @Output() sectionSelected = new EventEmitter<RoadmapSection>();
    @Output() back = new EventEmitter<void>();

    getIcon(sectionName: string): string {
        const name = sectionName.toUpperCase();
        if (name.includes('STRIKER')) return 'fa-bolt';
        if (name.includes('GRAPPLER')) return 'fa-link';
        if (name.includes('BLADESMAN')) return 'fa-khanda';
        if (name.includes('GROUNDER')) return 'fa-anchor';
        if (name.includes('MASTERY')) return 'fa-star';
        return 'fa-circle';
    }

    selectSection(section: RoadmapSection) {
        this.sectionSelected.emit(section);
    }
}
