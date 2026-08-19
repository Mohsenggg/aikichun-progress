import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ActivateAccountComponent } from '../../core/components/active-account/activate-account.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ActivateAccountComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');
  showActivatePopup = signal(false);
  activateEmail = signal('');
  showPassword = signal(false);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    try {
      const response = await this.auth.loginWithEmail(email!, password!);

      if (response.user.accountStatus === 'PENDING_VERIFICATION') {
        this.activateEmail.set(response.user.email);
        this.showActivatePopup.set(true);
        this.isLoading.set(false);
        return;
      }

      if (this.auth.role() === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/roadmap']);
      }
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || 'Invalid email or password.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onAccountVerified() {
    this.showActivatePopup.set(false);
    if (this.auth.role() === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/roadmap']);
    }
  }
}
