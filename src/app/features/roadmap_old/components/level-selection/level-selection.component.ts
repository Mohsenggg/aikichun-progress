import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapSection, RoadmapLevel } from '../../../../core/roadmap/roadmap.data';

@Component({
    selector: 'app-level-selection',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './level-selection.component.html',
    styleUrls: ['./level-selection.component.css']
})
export class LevelSelectionComponent {
    @Input() section!: RoadmapSection;
    @Output() levelSelected = new EventEmitter<RoadmapLevel>();
    @Output() back = new EventEmitter<void>();

    selectLevel(level: RoadmapLevel) {
        if (level.steps.length === 0) return;
        this.levelSelected.emit(level);
    }
}
