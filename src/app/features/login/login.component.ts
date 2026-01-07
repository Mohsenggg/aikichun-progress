import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(3)]]
  });

  async onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const code = this.loginForm.value.code!.trim();

    try {
      const success = await this.auth.login(code);
      console.log('Login success:', success); // DEBUG
      console.log('Current Role:', this.auth.role()); // DEBUG

      if (success) {
        // Redirect logic based on role
        if (this.auth.role() === 'admin') {
          console.log('Redirecting to /admin'); // DEBUG
          this.router.navigate(['/admin']);
        } else {
          console.log('Redirecting to /roadmap'); // DEBUG
          this.router.navigate(['/roadmap']); // defaults to grade selection
        }
      } else {
        this.errorMessage.set('Invalid Code. Please try again.');
      }
    } catch (err) {
      this.errorMessage.set('Connection Error.');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }
}
