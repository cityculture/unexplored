import { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from './supabaseClient';

export interface UserProfile {
    id: string;
    user_id: string | null;
    phone: string;
    email: string | null;
    name: string;
    created_at: string;
    updated_at: string;
}

/**
 * Create or update user profile
 * For guests: uses phone as identifier
 * For authenticated users: links to auth.users.id
 */
export async function createOrUpdateUserProfile(data: {
    phone: string;
    name: string;
    email?: string | null;
    user_id?: string | null;
}): Promise<UserProfile | null> {
    const supabase: SupabaseClient = createServerClient();

    // Check if profile exists by phone
    const { data: existingProfile } = await supabase
        .from('user_profile')
        .select('*')
        .eq('phone', data.phone)
        .single();

    if (existingProfile) {
        // Update existing profile
        const { data: updatedProfile, error } = await supabase
            .from('user_profile')
            .update({
                name: data.name,
                email: data.email || (existingProfile as UserProfile).email,
                user_id: data.user_id || (existingProfile as UserProfile).user_id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', (existingProfile as UserProfile).id)
            .select()
            .single();

        if (error) {
            console.error('Error updating user profile:', error);
            return null;
        }

        return updatedProfile as UserProfile;
    } else {
        // Create new profile
        const { data: newProfile, error } = await supabase
            .from('user_profile')
            .insert({
                phone: data.phone,
                name: data.name,
                email: data.email || null,
                user_id: data.user_id || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user profile:', error);
            return null;
        }

        return newProfile as UserProfile;
    }
}

/**
 * Get user profile by phone
 */
export async function getUserProfileByPhone(phone: string): Promise<UserProfile | null> {
    const supabase: SupabaseClient = createServerClient();

    const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('phone', phone)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data as UserProfile;
}

/**
 * Get user profile by user_id (for authenticated users)
 */
export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
    const supabase: SupabaseClient = createServerClient();

    const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        console.error('Error fetching user profile:', error);
        return null;
    }

    return data as UserProfile;
}
