import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistrationService } from '../../core/services/registration.service';
import { ProgressIndicatorComponent } from './components/progress-indicator.component';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProgressIndicatorComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private registrationService = inject(RegistrationService);
  private router = inject(Router);

  step = signal(1);
  totalSteps = 4;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  profilePhotoFile: File | null = null;
  idPhotoFile: File | null = null;
  profilePhotoError = signal('');
  idPhotoError = signal('');

  countryCodes = [
    { value: '+20', label: '🇪🇬 +20', country: 'Egypt' },
    { value: '+1', label: '🇺🇸 +1', country: 'USA' },
    { value: '+44', label: '🇬🇧 +44', country: 'UK' },
    { value: '+966', label: '🇸🇦 +966', country: 'Saudi Arabia' },
    { value: '+971', label: '🇦🇪 +971', country: 'UAE' },
    { value: '+49', label: '🇩🇪 +49', country: 'Germany' },
    { value: '+33', label: '🇫🇷 +33', country: 'France' },
  ];

  branchOptions = [
    { value: 'SIX_OF_OCTOBER', label: '6th of October' },
    { value: 'N90_TAGAMO3', label: 'N90 Tagamoa3' },
    { value: 'TAHRIR_DOWNTOWN', label: 'Tahrir Downtown' },
  ];

  monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
  yearOptions = Array.from({ length: 8 }, (_, i) => ({ value: 2024 + i, label: String(2024 + i) }));

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]],
    dateOfBirth: ['', Validators.required],
    profession: ['', Validators.required],
    branch: ['', Validators.required],
    phoneCountryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    emergencyPhoneCountryCode: ['+20', Validators.required],
    phoneNumberEmergency: ['', [Validators.required, Validators.pattern(/^\d{7,15}$/)]],
    hasCondition: [false],
    medicalNotes: [''],
    subStartMonth: ['', Validators.required],
    subStartYear: ['', Validators.required],
  });

  get step1Valid() {
    const c = this.form.controls;
    return c.fullName.valid && c.email.valid && c.password.valid;
  }

  get step2Valid() {
    const c = this.form.controls;
    return c.dateOfBirth.valid && c.profession.valid && c.branch.valid;
  }

  get step3Valid() {
    const c = this.form.controls;
    return c.phoneNumber.valid && c.phoneNumberEmergency.valid;
  }

  get step4Valid() {
    const c = this.form.controls;
    return c.subStartMonth.valid && c.subStartYear.valid;
  }

  get isCurrentStepValid(): boolean {
    switch (this.step()) {
      case 1: return this.step1Valid;
      case 2: return this.step2Valid;
      case 3: return this.step3Valid;
      case 4: return this.step4Valid;
      default: return false;
    }
  }

  get isFirstStep() { return this.step() === 1; }
  get isLastStep() { return this.step() === this.totalSteps; }

  get passwordControl(): AbstractControl | null {
    return this.form.get('password');
  }

  get passwordErrors(): string[] {
    const ctrl = this.passwordControl;
    if (!ctrl || !ctrl.errors || !ctrl.touched) return [];
    const e = ctrl.errors as ValidationErrors;
    const msgs: string[] = [];
    if (e['required']) msgs.push('Password is required');
    if (e['minlength']) msgs.push('At least 8 characters');
    if (e['pattern']) msgs.push('Must include 1 uppercase letter and 1 digit');
    return msgs;
  }

  nextStep() {
    if (this.step() < this.totalSteps && this.isCurrentStepValid) {
      this.step.update(s => s + 1);
    }
  }

  prevStep() {
    if (this.step() > 1) {
      this.step.update(s => s - 1);
    }
  }

  private validateFileSize(file: File): boolean {
    if (file.size > MAX_FILE_SIZE) {
      return false;
    }
    return true;
  }

  onProfilePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.profilePhotoError.set('');

    if (file && !this.validateFileSize(file)) {
      this.profilePhotoError.set('File must be under 5 MB');
      input.value = '';
      this.profilePhotoFile = null;
      return;
    }
    this.profilePhotoFile = file;
  }

  onIdPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.idPhotoError.set('');

    if (file && !this.validateFileSize(file)) {
      this.idPhotoError.set('File must be under 5 MB');
      input.value = '';
      this.idPhotoFile = null;
      return;
    }
    this.idPhotoFile = file;
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const v = this.form.value;
    const fullPhone = `${v.phoneCountryCode}${v.phoneNumber}`;
    const fullEmergencyPhone = `${v.emergencyPhoneCountryCode}${v.phoneNumberEmergency}`;

    this.registrationService.register(
      {
        fullName: v.fullName!,
        email: v.email!,
        password: v.password!,
        dateOfBirth: v.dateOfBirth!,
        profession: v.profession!,
        branch: v.branch!,
        phoneNumber: fullPhone,
        phoneNumberEmergency: fullEmergencyPhone,
        hasChronicConditionOrInjury: v.hasCondition ?? false,
        medicalNotes: v.medicalNotes || undefined,
        subscriptionStartMonth: v.subStartMonth!,
        subscriptionStartYear: v.subStartYear!,
      },
      this.profilePhotoFile,
      this.idPhotoFile
    ).subscribe({
      next: () => {
        this.successMessage.set('Registration successful! Redirecting to login...');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
