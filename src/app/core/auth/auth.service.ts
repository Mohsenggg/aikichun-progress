import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { Profile } from '../services/supabase-types';

export type UserRole = 'admin' | 'user' | 'guest';

// Hardcoded Admin Code as per requirements
const ADMIN_CODE = 'ADMIN123';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private _currentUser = signal<Profile | null>(null);
    private _role = signal<UserRole>('guest');

    readonly currentUser = this._currentUser.asReadonly();
    readonly role = this._role.asReadonly();

    readonly isLoggedIn = computed(() => this._role() !== 'guest');
    readonly isAdmin = computed(() => this._role() === 'admin');

    constructor(private supabase: SupabaseService, private router: Router) {
        // Attempt to restore session from localStorage if needed (optional for PWA)
        const storedCode = localStorage.getItem('aikichun_code');
        if (storedCode) {
            this.login(storedCode).catch(() => localStorage.removeItem('aikichun_code'));
        }
    }

    async login(code: string): Promise<boolean> {
        // 1. Check Admin
        if (code === ADMIN_CODE) {
            this._role.set('admin');
            this._currentUser.set({ id: 'admin', code: ADMIN_CODE, name: 'Admin', status: { learning: null, developed: null, skilled: null }, last_update_date: null, created_at: '' });
            localStorage.setItem('aikichun_code', code);
            return true;
        }

        // 2. Check User via Supabase (using Service with logging)
        // We use the raw client here just for the initial query by CODE, as our getProfile is by ID.
        // OR we can make a query. But since we don't have ID yet, we must query by code.

        const { data, error } = await this.supabase.client
            .from('profiles')
            .select('*')
            .eq('code', code)
            .single();

        if (error || !data) {
            return false;
        }

        // CACHE IT!
        this.supabase.setProfileCache(data);

        this._currentUser.set(data);
        this._role.set('user');
        localStorage.setItem('aikichun_code', code);
        return true;
    }

    logout() {
        this.supabase.clearCache();
        this._currentUser.set(null);
        this._role.set('guest');
        localStorage.removeItem('aikichun_code');
        this.router.navigate(['/login']);
    }
}
