import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OtpVerificationComponent } from './otp-verification.component';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [CommonModule, OtpVerificationComponent],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent {
  @Input() email = '';
  @Output() verified = new EventEmitter<void>();
}
