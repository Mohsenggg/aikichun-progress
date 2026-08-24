import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../services/supabase.service';
import { Profile } from '../services/supabase-types';
import { AuthResponse, PublicUserDto, AccountStatus } from '../models/auth.models';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'user' | 'guest';

const ADMIN_CODE = 'ADMIN123';
const TOKEN_KEY = 'aikichun_token';
const USER_KEY = 'aikichun_user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private supabase = inject(SupabaseService);
    private router = inject(Router);

    private apiUrl = `${environment.backendApiUrl}/api/v1/auth`;
    private userApiUrl = `${environment.backendApiUrl}/api/v1/user`;

    private _currentUser = signal<Profile | null>(null);
    private _backendUser = signal<PublicUserDto | null>(null);
    private _role = signal<UserRole>('guest');
    private _token = signal<string | null>(null);

    readonly currentUser = this._currentUser.asReadonly();
    readonly backendUser = this._backendUser.asReadonly();
    readonly role = this._role.asReadonly();
    readonly accountStatus = computed(() => this._backendUser()?.accountStatus ?? null);

    readonly isLoggedIn = computed(() => this._role() !== 'guest');
    readonly isAdmin = computed(() => this._role() === 'admin');

    constructor() {
        this.restoreSession();
    }

    async loginWithEmail(email: string, password: string): Promise<AuthResponse> {
        const response = await firstValueFrom(
            this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
        );

        this.setSession(response);
        return response;
    }

    async login(code: string): Promise<boolean> {
        if (code === ADMIN_CODE) {
            this._role.set('admin');
            this._currentUser.set({ id: 'admin', code: ADMIN_CODE, name: 'Admin', status: { learning: null, developed: null, skilled: null }, last_update_date: null, created_at: '' });
            localStorage.setItem('aikichun_code', code);
            return true;
        }

        const { data, error } = await this.supabase.client
            .from('profiles')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !data) {
            return false;
        }

        this.supabase.setProfileCache(data);
        this._currentUser.set(data);
        this._role.set('user');
        localStorage.setItem('aikichun_code', code);
        return true;
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

    private setSession(response: AuthResponse) {
        this._token.set(response.token);
        this._backendUser.set(response.user);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));

        if (response.user.role === 'ADMIN') {
            this._role.set('admin');
        } else {
            this._role.set('user');
        }
    }

    private clearSession() {
        this.supabase.clearCache();
        this._currentUser.set(null);
        this._backendUser.set(null);
        this._role.set('guest');
        this._token.set(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('aikichun_code');
        this.router.navigate(['/login']);
    }

    private restoreSession() {
        const token = localStorage.getItem(TOKEN_KEY);
        const userJson = localStorage.getItem(USER_KEY);

        if (token && userJson) {
            try {
                const user: PublicUserDto = JSON.parse(userJson);
                this._token.set(token);
                this._backendUser.set(user);
                this._role.set(user.role === 'ADMIN' ? 'admin' : 'user');
                return;
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }

        const storedCode = localStorage.getItem('aikichun_code');
        if (storedCode) {
            this.login(storedCode).catch(() => localStorage.removeItem('aikichun_code'));
        }
    }
}
