import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapLevel } from '../../../core/roadmap/roadmap.data';

@Component({
    selector: 'app-roadmap-level',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './roadmap-level.component.html',
    styleUrl: './roadmap-level.component.css'
})
export class RoadmapLevelComponent {
    @Input({ required: true }) level!: RoadmapLevel;
}
