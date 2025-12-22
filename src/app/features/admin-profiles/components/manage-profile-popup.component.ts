import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile } from '../../../core/services/supabase-types';

@Component({
  selector: 'app-manage-profile-popup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './manage-profile-popup.component.html',
  styleUrl: './manage-profile-popup.component.css'
})
export class ManageProfilePopupComponent implements OnInit {
  @Input() isOpen = false;
  @Input() initialProfile: Profile | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Partial<Profile>>();

  private fb = inject(FormBuilder);

  profileForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', [Validators.required, Validators.minLength(3)]]
  });

  get isEditMode() {
    return !!this.initialProfile;
  }

  ngOnInit() {
    // Populate if editing
    if (this.initialProfile) {
      this.profileForm.patchValue({
        name: this.initialProfile.name,
        code: this.initialProfile.code
      });
      // Disable code editing? Often unique IDs shouldn't change, but users might typo. Let's allow edit.
    }
  }

  // Handle Input Changes if the component stays alive
  ngOnChanges() {
    if (this.isOpen && this.initialProfile) {
      this.profileForm.patchValue({
        name: this.initialProfile.name,
        code: this.initialProfile.code
      });
    } else if (this.isOpen && !this.initialProfile) {
      this.profileForm.reset();
    }
  }

  onCancel() {
    this.close.emit();
  }

  onSubmit() {
    if (this.profileForm.invalid) return;
    this.save.emit(this.profileForm.value as Partial<Profile>);
  }
}
