/**
 * MediTrack Supabase Configuration
 * -------------------------------------------------------------------------------------
 * Migration from Strapi to Supabase
 */

'use strict';

// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

/**
 * Supabase Configuration
 */
window.SupabaseConfig = {
    url: 'https://ozpustbeoojyiprvusve.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cHVzdGJlb29qeWlwcnZ1c3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTk5MTEsImV4cCI6MjA3MTE5NTkxMX0.aQVracY0MDkekan4oovbJKpfkiZZ7D11w15xElWcRso',
    
    // Table names mapping from Strapi collections
    tables: {
        clinicReceives: 'clinic_receives',
        clinicProcessings: 'clinic_processings', 
        pharmacyRecords: 'pharmacy_records',
        archives: 'archives',
        users: 'auth.users' // Supabase auth users table
    }
};

// Initialize Supabase client
window.supabase = createClient(SupabaseConfig.url, SupabaseConfig.anonKey);

/**
 * Supabase API Helper
 * Replaces the previous ApiHelper with Supabase-specific methods
 */
window.SupabaseHelper = {
    /**
     * Get current user
     */
    getCurrentUser: async function() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    /**
     * Login user
     */
    login: async function(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    },

    /**
     * Register user
     */
    register: async function(email, password, metadata = {}) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        if (error) throw error;
        return data;
    },

    /**
     * Logout user
     */
    logout: async function() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Reset password
     */
    resetPassword: async function(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
    },

    /**
     * Get records from table
     */
    get: async function(tableName, options = {}) {
        let query = supabase.from(tableName).select(options.select || '*');
        
        // Add filters
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query.filter(filter.column, filter.operator, filter.value);
            });
        }
        
        // Add ordering
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
        }
        
        // Add pagination
        if (options.range) {
            query = query.range(options.range.from, options.range.to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Insert record
     */
    insert: async function(tableName, data) {
        const { data: result, error } = await supabase
            .from(tableName)
            .insert(data)
            .select();
        if (error) throw error;
        return result;
    },

    /**
     * Update record
     */
    update: async function(tableName, id, data) {
        const { data: result, error } = await supabase
            .from(tableName)
            .update(data)
            .eq('id', id)
            .select();
        if (error) throw error;
        return result;
    },

    /**
     * Delete record
     */
    delete: async function(tableName, id) {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /**
     * Count records
     */
    count: async function(tableName, options = {}) {
        let query = supabase.from(tableName).select('*', { count: 'exact', head: true });
        
        // Add filters
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query.filter(filter.column, filter.operator, filter.value);
            });
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count;
    }
};

/**
 * Validation Helper
 */
window.ValidationHelper = {
    validateConnection: async function() {
        try {
            const { data, error } = await supabase.from('clinic_receives').select('id').limit(1);
            if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is ok for initial setup
                throw error;
            }
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    validateAuth: async function() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            return { success: !error, user, error };
        } catch (error) {
            return { success: false, error };
        }
    }
};
