import { Component, inject, signal, ViewChildren, QueryList, ElementRef, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OtpAuthService } from '../auth/otp-auth.service';

@Component({
  selector: 'app-otp-verification',
  standalone: true,
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './otp-verification.component.html',
  styleUrl: './otp-verification.component.css'
})
export class OtpVerificationComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private otpAuth = inject(OtpAuthService);

  @Input() email = '';
  @Output() verified = new EventEmitter<void>();
  @Output() backClicked = new EventEmitter<void>();

  step = signal(1);
  isLoading = signal(false);
  errorMessage = signal('');
  countdown = signal(0);
  isShaking = signal(false);
  isSuccess = signal(false);

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  otpDigits = signal<string[]>(['', '', '', '', '', '']);

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    if (this.email) {
      this.emailForm.patchValue({ email: this.email });
      this.step.set(2);
      this.startCountdown();
      setTimeout(() => this.focusOtpInput(0), 100);
    } else {
      this.startCountdown();
    }
  }

  ngOnDestroy() {
    this.stopCountdown();
  }

  get emailValue(): string {
    return this.emailForm.value.email ?? '';
  }

  get isEmailValid(): boolean {
    return this.emailForm.valid;
  }

  get isOtpComplete(): boolean {
    return this.otpDigits().every(d => d !== '');
  }

  get otpValue(): string {
    return this.otpDigits().join('');
  }

  get countdownFormatted(): string {
    const total = this.countdown();
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  get countdownPercent(): number {
    return (this.countdown() / 60) * 100;
  }

  get isCountdownUrgent(): boolean {
    return this.countdown() > 0 && this.countdown() <= 15;
  }

  onSendOtp() {
    if (this.emailForm.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.otpAuth.sendOtp(this.emailValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set(2);
        this.startCountdown();
        setTimeout(() => this.focusOtpInput(0), 100);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send verification code. Please try again.');
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
        this.focusOtpInput(index + 1);
      }
    }
  }

  onOtpFocus(event: Event) {
    (event.target as HTMLInputElement).select();
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
        this.focusOtpInput(index - 1);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusOtpInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusOtpInput(index + 1);
    }
  }

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/\D/g, '').slice(0, 6);

    if (cleaned.length === 0) return;

    const digits = ['', '', '', '', '', ''];
    for (let i = 0; i < cleaned.length; i++) {
      digits[i] = cleaned[i];
    }
    this.otpDigits.set(digits);

    const focusIndex = Math.min(cleaned.length, 5);
    setTimeout(() => this.focusOtpInput(focusIndex), 0);
  }

  onVerifyOtp() {
    if (!this.isOtpComplete || this.isLoading() || this.countdown() === 0) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.otpAuth.verifyOtp(this.emailValue, this.otpValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        setTimeout(() => this.verified.emit(), 800);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid or expired OTP. Please try again.');
        this.triggerShake();
        this.clearOtp();
      }
    });
  }

  onResendOtp() {
    if (this.countdown() > 0 || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.otpAuth.sendOtp(this.emailValue).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.startCountdown();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to resend code. Please try again.');
      }
    });
  }

  onBack() {
    this.backClicked.emit();
  }

  clearOtp() {
    this.otpDigits.set(['', '', '', '', '', '']);
    setTimeout(() => this.focusOtpInput(0), 0);
  }

  private triggerShake() {
    this.isShaking.set(true);
    setTimeout(() => this.isShaking.set(false), 500);
  }

  private focusOtpInput(index: number) {
    const inputs = this.otpInputs?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }

  private startCountdown() {
    this.stopCountdown();
    this.countdown.set(60);
    this.countdownInterval = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        this.stopCountdown();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
}
