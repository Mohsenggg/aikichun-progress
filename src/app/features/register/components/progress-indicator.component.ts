import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-indicator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-indicator.component.html',
  styleUrl: './progress-indicator.component.css'
})
export class ProgressIndicatorComponent {
  @Input() currentStep = 1;
  @Input() totalSteps = 4;
  @Input() stepLabels: string[] = ['Account', 'Personal', 'Contact', 'Membership'];

  get steps(): number[] {
    return Array.from({ length: this.totalSteps }, (_, i) => i + 1);
  }

  isCompleted(step: number): boolean {
    return step < this.currentStep;
  }

  isActive(step: number): boolean {
    return step === this.currentStep;
  }
}
