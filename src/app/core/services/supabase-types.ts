export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface ProfileStatus {
    learning: string | null
    developed: string | null
    skilled: string | null
}

// Explicit definition to avoid inference issues
export interface Profile {
    id: string
    code: string
    name: string
    status: ProfileStatus
    last_update_date: string | null
    updates_count?: number
    created_at: string
}

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile
                Insert: {
                    id?: string
                    code: string
                    name: string
                    status?: ProfileStatus
                    last_update_date?: string | null
                    updates_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    code?: string
                    name?: string
                    status?: ProfileStatus
                    last_update_date?: string | null
                    updates_count?: number
                    created_at?: string
                }
            }
        }
    }
}
