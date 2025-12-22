import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapLevel } from '../../../core/roadmap/roadmap.data';

@Component({
    selector: 'app-roadmap-level',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="mb-8 mt-12">
        <div class="flex items-center gap-2 mb-4">
            <span class="text-2xl font-bold text-white">→ Level {{ level.name }}</span>
        </div>
        
        <!-- Stats Pill -->
        <div class="bg-aikido-red inline-block px-4 py-2 rounded-full text-xs font-bold shadow mb-6">
            Expected Hours: 50 | Steps: {{ level.steps.length }}
        </div>
        
        <ng-content></ng-content>
    </div>
  `
})
export class RoadmapLevelComponent {
    @Input({ required: true }) level!: RoadmapLevel;
}
