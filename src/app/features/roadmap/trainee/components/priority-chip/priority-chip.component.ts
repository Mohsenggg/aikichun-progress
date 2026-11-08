import { Component, Input, signal, HostListener, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriorityStageInfo } from '../../../models/trainee.models';

@Component({
  selector: 'app-priority-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './priority-chip.component.html',
  styleUrl: './priority-chip.component.css'
})
export class PriorityChipComponent {
  @Input() priority: PriorityStageInfo | null = null;

  showPopup = signal<boolean>(false);
  private elementRef = inject(ElementRef);

  togglePopup(event: MouseEvent): void {
    event.stopPropagation();
    if (this.priority) {
      this.showPopup.update(v => !v);
    }
  }

  closePopup(): void {
    this.showPopup.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showPopup.set(false);
    }
  }
}
