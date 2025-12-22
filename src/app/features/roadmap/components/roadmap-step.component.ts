import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoadmapStep } from '../../../core/roadmap/roadmap.data';

@Component({
    selector: 'app-roadmap-step',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './roadmap-step.component.html',
    styleUrl: './roadmap-step.component.css'
})
export class RoadmapStepComponent {
    @Input({ required: true }) step!: RoadmapStep;
    @Input() isLocked = false;

    @Input() checks = { learning: false, developed: false, skilled: false };

    @Output() toggleCheck = new EventEmitter<'learning' | 'developed' | 'skilled'>();

    toggle(type: 'learning' | 'developed' | 'skilled') {
        if (this.isLocked) return;
        this.toggleCheck.emit(type);
    }

    isCompleted() {
        return this.checks.skilled;
    }
}
