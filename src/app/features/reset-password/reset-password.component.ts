import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { OtpAuthService } from '../../core/auth/otp-auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private otpAuth = inject(OtpAuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  isSuccess = signal(false);
  showPassword = signal(false);
  step = signal(1);

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  get otpValue(): string {
    return this.otpDigits().join('');
  }

  get isOtpComplete(): boolean {
    return this.otpDigits().every(d => d !== '');
  }

  onSendOtp() {
    if (this.emailForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.otpAuth.sendOtp(this.emailForm.value.email!).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set(2);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send code. Please try again.');
      }
    });
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^\d*$/.test(value)) {
      input.value = '';
      return;
    }

    const digits = [...this.otpDigits()];

    if (value.length === 1) {
      digits[index] = value;
      this.otpDigits.set(digits);
      if (index < 5) {
        const inputs = document.querySelectorAll('.otp-box');
        (inputs[index + 1] as HTMLInputElement)?.focus();
      }
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number) {
    const digits = [...this.otpDigits()];

    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) {
        digits[index] = '';
        this.otpDigits.set(digits);
      } else if (index > 0) {
        digits[index - 1] = '';
        this.otpDigits.set(digits);
        const inputs = document.querySelectorAll('.otp-box');
        (inputs[index - 1] as HTMLInputElement)?.focus();
      }
    }
  }

  onVerifyOtp() {
    if (!this.isOtpComplete || this.isLoading()) return;
    this.step.set(3);
  }

  async onResetPassword() {
    if (this.resetForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.auth.resetPassword(
        this.emailForm.value.email!,
        this.otpValue,
        this.resetForm.value.newPassword!
      );
      this.isSuccess.set(true);
      setTimeout(() => this.router.navigate(['/login']), 2000);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Failed to reset password. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
