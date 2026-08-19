import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SendOtpRequest, VerifyOtpRequest } from '../models/auth.models';
import {environment} from '../../../environments/environment';

const API_BASE_URL = `${environment.backendApiUrl}/api/v1/auth`;

@Injectable({
  providedIn: 'root'
})
export class OtpAuthService {
  private http = inject(HttpClient);

  sendOtp(email: string): Observable<unknown> {
    const body: SendOtpRequest = { email };
    return this.http.post(`${API_BASE_URL}/send-otp`, body);
  }

  verifyOtp(email: string, otp: string): Observable<unknown> {
    const body: VerifyOtpRequest = { email, otp };
    return this.http.post(`${API_BASE_URL}/verify-otp`, body);
  }
}
