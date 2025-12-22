import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-aikido-green p-4 relative overflow-hidden">
      <!-- Background/Logo Placeholder -->
      <div class="mb-12 flex flex-col items-center">
        <!-- Logo Image Placeholder -->
        <div class="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center mb-4 relative">
             <!-- Real image would go here. Using text/icon placeholder -->
             <span class="text-4xl font-bold tracking-widest text-white">AIKICHUN</span>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="w-full max-w-xs flex flex-col gap-6 z-10">
        <input 
          type="text" 
          formControlName="code" 
          placeholder="Type Your Code" 
          class="w-full h-14 rounded-full bg-white text-center text-black text-lg focus:outline-none focus:ring-2 focus:ring-aikido-red shadow-lg transition-transform"
        />

        <button 
          type="submit" 
          [disabled]="isLoading() || loginForm.invalid"
          class="w-full h-14 rounded-full bg-aikido-red text-white font-bold text-xl uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {{ isLoading() ? 'Checking...' : 'Enter' }}
        </button>
        
        <p *ngIf="errorMessage()" class="text-red-400 text-center font-semibold animate-pulse">
            {{ errorMessage() }}
        </p>
      </form>

      <!-- Footer Socials -->
      <div class="absolute bottom-8 flex gap-6 z-10">
        <div class="w-10 h-10 bg-red-600 rounded flex items-center justify-center text-white font-bold">Y</div>
        <div class="w-10 h-10 bg-black rounded flex items-center justify-center text-white font-bold">Tk</div>
        <div class="w-10 h-10 bg-pink-600 rounded flex items-center justify-center text-white font-bold">Ig</div>
        <div class="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold">Fb</div>
      </div>
    </div>
  `,
    styles: []
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
            if (success) {
                // Redirect logic based on role
                if (this.auth.role() === 'admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/profile']); // or /roadmap
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
