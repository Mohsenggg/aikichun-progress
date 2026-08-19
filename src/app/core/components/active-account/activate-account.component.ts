import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OtpVerificationComponent } from '../otp-verification/otp-verification.component';

@Component({
  selector: 'app-activate-account',
  standalone: true,
  imports: [OtpVerificationComponent],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css'
})
export class ActivateAccountComponent {
  @Input() email = '';
  @Output() verified = new EventEmitter<void>();
}
