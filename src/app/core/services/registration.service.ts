import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterPayload } from '../models/registration-types';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.backendApiUrl}/api/v1/auth/register`;

  register(payload: RegisterPayload, profilePhoto: File | null, idPhoto: File | null): Observable<unknown> {
    const fd = new FormData();
    fd.append('fullName', payload.fullName);
    fd.append('email', payload.email);
    fd.append('password', payload.password);
    fd.append('dateOfBirth', payload.dateOfBirth);
    fd.append('profession', payload.profession);
    fd.append('branch', payload.branch);
    fd.append('phoneNumber', payload.phoneNumber);
    fd.append('phoneNumberEmergency', payload.phoneNumberEmergency);
    fd.append('hasChronicConditionOrInjury', String(payload.hasChronicConditionOrInjury));

    if (payload.hasChronicConditionOrInjury && payload.medicalNotes) {
      fd.append('MedicalNotes', payload.medicalNotes);
    }

    fd.append('subscriptionStartMonth', payload.subscriptionStartMonth);
    fd.append('subscriptionStartYear', payload.subscriptionStartYear);

    if (profilePhoto) {
      fd.append('profilePhoto', profilePhoto);
    }
    if (idPhoto) {
      fd.append('idPhoto', idPhoto);
    }

    return this.http.post(this.apiUrl, fd);
  }
}
