import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, PublicUserDto, AccountStatus } from '../models/auth.models';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'moderator' | 'user' | 'guest';

const TOKEN_KEY = 'aikichun_token';
const USER_KEY = 'aikichun_user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private apiUrl = `${environment.apiUrl}/auth`;
    private userApiUrl = `${environment.apiUrl}/user`;

    private _backendUser = signal<PublicUserDto | null>(null);
    private _role = signal<UserRole>('guest');
    private _token = signal<string | null>(null);

    readonly backendUser = this._backendUser.asReadonly();
    readonly role = this._role.asReadonly();
    readonly accountStatus = computed(() => this._backendUser()?.accountStatus ?? null);
    readonly currentUser = computed(() => {
        const u = this._backendUser();
        return u ? { id: u.id, name: u.fullName, email: u.email } : null;
    });

    readonly isLoggedIn = computed(() => this._role() !== 'guest');
    readonly isAdmin = computed(() => this._role() === 'admin');
    readonly isModerator = computed(() => this._role() === 'moderator');
    readonly isTrainee = computed(() => this._role() === 'user');
    readonly currentUserUUID = computed(() => this._backendUser()?.id ?? '');

    constructor() {
        this.restoreSession();
    }

    async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
        const response = await firstValueFrom(
            this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
        );

        if (response.token) {
            this.setSession(response);
        }
        return response;
    }

    async getProfile(): Promise<any> {
        return firstValueFrom(
            this.http.get(`${this.userApiUrl}/me`)
        );
    }

    async updateProfile(data: Record<string, any>): Promise<any> {
        return firstValueFrom(
            this.http.put(`${this.userApiUrl}/profile`, data)
        );
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<any> {
        return firstValueFrom(
            this.http.put(`${this.userApiUrl}/password`, { currentPassword, newPassword })
        );
    }

    async updatePhoto(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('profilePhoto', file);
        return firstValueFrom(
            this.http.put(`${this.userApiUrl}/photo`, formData)
        );
    }

    async forgotPassword(email: string): Promise<any> {
        return firstValueFrom(
            this.http.post(`${this.apiUrl}/forgot-password`, { email })
        );
    }

    async resetPassword(email: string, otp: string, newPassword: string): Promise<any> {
        return firstValueFrom(
            this.http.post(`${this.apiUrl}/reset-password`, { email, otp, newPassword })
        );
    }

    getToken(): string | null {
        return this._token();
    }

    async logout(): Promise<void> {
        const token = this._token();
        if (token) {
            try {
                await firstValueFrom(
                    this.http.post(`${this.apiUrl}/logout`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                );
            } catch { /* backend may have already invalidated — proceed anyway */ }
        }
        this.clearSession();
    }

    setSession(response: AuthResponse) {
        this._token.set(response.token);
        this._backendUser.set(response.user);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        this._role.set(this.mapBackendRole(response.user.role));
    }

    private clearSession() {
        this._backendUser.set(null);
        this._role.set('guest');
        this._token.set(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('aikichun_code');
        this.router.navigate(['/login']);
    }

    private restoreSession() {
        // Clean up legacy code storage if present
        localStorage.removeItem('aikichun_code');

        const token = localStorage.getItem(TOKEN_KEY);
        const userJson = localStorage.getItem(USER_KEY);

        if (token && userJson) {
            try {
                const user: PublicUserDto = JSON.parse(userJson);
                this._token.set(token);
                this._backendUser.set(user);
                this._role.set(this.mapBackendRole(user.role));
                return;
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }
    }

    private mapBackendRole(roleStr?: string | null): UserRole {
        const role = (roleStr || '').toUpperCase();
        if (role === 'ADMIN') return 'admin';
        if (role === 'MODERATOR') return 'moderator';
        return 'user';
    }
}
