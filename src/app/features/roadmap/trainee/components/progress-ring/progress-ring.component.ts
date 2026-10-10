import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-ring.component.html',
  styleUrl: './progress-ring.component.css'
})
export class ProgressRingComponent {
  @Input() set percentage(val: number | null | undefined) {
    this._percentage.set(val ?? 0);
  }
  @Input() size = 44;
  @Input() strokeWidth = 4;
  @Input() color = 'var(--color-progress)';
  @Input() trackColor = 'rgba(var(--color-neutral-rgb), 0.22)';
  @Input() showText = true;
  @Input() textSize = '11px';

  private _percentage = signal<number>(0);
  percentageValue = this._percentage.asReadonly();

  center = computed(() => this.size / 2);
  radius = computed(() => (this.size - this.strokeWidth) / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());
  strokeDashoffset = computed(() => {
    const p = Math.min(100, Math.max(0, this._percentage()));
    return this.circumference() - (p / 100) * this.circumference();
  });
  displayPercentage = computed(() => Math.round(this._percentage()));
}
