import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Profile } from './supabase-types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    // Use 'any' generic to prevent strict schema inference failures in build
    private supabase: SupabaseClient<any>;

    // Generic Cache for Profiles
    private profileCache = new Map<string, Profile>();

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: {
                persistSession: false, // Disable persistence to avoid NavigatorLock issues in dev
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
    }

    get client() {
        return this.supabase;
    }

    // --- Logging Helper ---
    private log(action: string, details: any) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`%c[DB ${action}] ${timestamp}:`, 'color: #d92027; font-weight: bold;', details);
    }

    // --- Data Methods with Caching ---

    async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
        // 1. Check Cache
        if (this.profileCache.has(userId)) {
            this.log('CACHE HIT', `Profile ${userId} retrieved from memory.`);
            return { data: this.profileCache.get(userId)!, error: null };
        }

        // 2. Fetch DB
        this.log('DB FETCH', `Fetching Profile ${userId} from Supabase...`);
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('DB Error:', error);
            return { data: null, error };
        }

        // 3. Update Cache
        if (data) {
            this.profileCache.set(userId, data);
            this.log('CACHE SET', `Profile ${userId} cached.`);
        }

        return { data, error: null };
    }

    async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ error: any }> {
        this.log('DB UPDATE', { userId, updates });

        const { error } = await this.supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) {
            console.error('DB Update Error:', error);
            return { error };
        }

        // Update Cache Optimistically (or re-fetch if precise)
        // Optimistic update for speed
        if (this.profileCache.has(userId)) {
            const current = this.profileCache.get(userId)!;
            this.profileCache.set(userId, { ...current, ...updates } as Profile);
            this.log('CACHE UPDATE', `Profile ${userId} updated in memory.`);
        }

        return { error: null };
    }

    async createProfile(profileData: Partial<Profile>): Promise<{ error: any }> {
        this.log('DB INSERT', { profileData });
        const { error } = await this.supabase
            .from('profiles')
            .insert(profileData);

        if (error) {
            console.error('DB Insert Error:', error);
            return { error };
        }

        // No cache update needed here necessarily as Admin usually re-fetches list, 
        // but could add if we knew the ID. 
        this.log('DB INSERT SUCCESS', 'Profile created');
        return { error: null };
    }

    // Admin Method - No persistent cache for list to ensure freshness, but logged
    async getAllProfiles(): Promise<{ data: Profile[] | null; error: any }> {
        this.log('DB FETCH ALL', 'Fetching all profiles for Admin...');
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('DB Fetch All Error:', error);

        // Optional: Populate cache with results?
        // data?.forEach(p => this.profileCache.set(p.id, p));

        return { data, error };
    }

    // Explicit Cache Setter for AuthService to preload
    setProfileCache(profile: Profile) {
        this.profileCache.set(profile.id, profile);
        this.log('CACHE SET (Manual)', `Profile ${profile.id} cached.`);
    }

    clearCache() {
        this.profileCache.clear();
        this.log('CACHE CLEAR', 'All cache cleared.');
    }
}
