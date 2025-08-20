/**
 * MediTrack Configuration
 * -------------------------------------------------------------------------------------
 * ! IMPORTANT: Make sure you clear the browser local storag        register: async function(email, password, userData = {}) {
            const supabaseClient = initializeSupabase();
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });
            if (error) throw error;
            return data;
        },o see the config changes in the template.
 * ! To clear local storage: (https://www.leadshook.com/help/how-to-clear-local-storage-in-google-chrome-browser/).
 */

'use strict';

// JS global variables - Theme colors
window.config = {
  colors: {
    primary: '#696cff',
    secondary: '#8592a3',
    success: '#71dd37',
    info: '#03c3ec',
    warning: '#ffab00',
    danger: '#ff3e1d',
    dark: '#233446',
    black: '#22303e',
    white: '#fff',
    cardColor: '#fff',
    bodyBg: '#f5f5f9',
    bodyColor: '#646E78',
    headingColor: '#384551',
    textMuted: '#a7acb2',
    borderColor: '#e4e6e8'
  }
};

/**
 * MediTrack Supabase Configuration
 * Updated from Strapi to Supabase for better performance and security
 */
window.MediTrackConfig = {
    // Supabase Configuration
    supabase: {
        url: 'https://ozpustbeoojyiprvusve.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96cHVzdGJlb29qeWlwcnZ1c3ZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MTk5MTEsImV4cCI6MjA3MTE5NTkxMX0.aQVracY0MDkekan4oovbJKpfkiZZ7D11w15xElWcRso'
    },
    
    // Table mappings (Supabase table names)
    tables: {
        clinicReceives: 'clinic_receives',
        clinicProcessings: 'clinic_processings',
        pharmacyRecords: 'pharmacy_records',
        archives: 'archives',
        userProfiles: 'user_profiles'
    },
    
    // Legacy API endpoints (kept for backwards compatibility during migration)
    endpoints: {
        auth: {
            login: 'auth/local',
            register: 'auth/local/register',
            forgotPassword: 'auth/forgot-password',
            resetPassword: 'auth/reset-password'
        },
        clinicReceives: 'clinic_receives',
        clinicProcessings: 'clinic_processings',
        pharmacyRecords: 'pharmacy_records',
        archives: 'archives'
    }
};

/**
 * Initialize Supabase Client
 */
let supabaseClient = null;

function initializeSupabase() {
    // Check if already initialized
    if (supabaseClient) {
        console.log('Supabase client already initialized');
        return supabaseClient;
    }
    
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded. Make sure to include the Supabase script.');
        console.log('Available window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('supa')));
        return null;
    }
    
    try {
        console.log('Creating Supabase client with:', {
            url: MediTrackConfig.supabase.url,
            anonKey: MediTrackConfig.supabase.anonKey.substring(0, 20) + '...'
        });
        
        supabaseClient = window.supabase.createClient(
            MediTrackConfig.supabase.url,
            MediTrackConfig.supabase.anonKey
        );
        console.log('Supabase client initialized successfully:', supabaseClient);
        return supabaseClient;
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        return null;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeSupabase();
    }, 100); // Small delay to ensure Supabase library is fully loaded
});

/**
 * Supabase Token Management
 * Replaces traditional token storage with Supabase session management
 */
window.TokenManager = {
    TOKEN_KEY: 'meditrack_auth_token',
    
    /**
     * Get current session
     */
    async getSession() {
        try {
            const supabaseClient = initializeSupabase();
            if (!supabaseClient) {
                console.warn('Supabase client not available for session');
                return null;
            }
            
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
                return null;
            }
            return session;
        } catch (error) {
            console.warn('Exception in getSession:', error);
            return null;
        }
    },
    
    /**
     * Get access token from session
     */
    getToken: async function() {
        const session = await this.getSession();
        return session?.access_token || null;
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated: async function() {
        const session = await this.getSession();
        return !!session?.user;
    },
    
    /**
     * Get current user
     */
        async getCurrentUser() {
        try {
            const session = await this.getSession();
            return session ? session.user : null;
        } catch (error) {
            console.warn('Exception in getCurrentUser:', error);
            return null;
        }
    },
        
    /**
     * Get authorization header for API requests
     */
    getAuthHeader: async function() {
        const token = await this.getToken();
        if (!token) {
            console.warn('No authentication token available');
            return {};
        }
        
        return {
            'Authorization': `Bearer ${token}`
        };
    },
    
    /**
     * Legacy methods for backwards compatibility
     */
    setToken: function(token) {
        console.warn('setToken is deprecated with Supabase. Use supabase.auth.signIn instead.');
    },
    
    removeToken: async function() {
        const supabaseClient = initializeSupabase();
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
    }
};

/**
 * Supabase API Helper Functions
 * Replaces traditional REST API calls with Supabase client methods
 */
window.ApiHelper = {
    /**
     * Initialize and get Supabase client
     */
    getClient: function() {
        return initializeSupabase();
    },
    
    /**
     * Authentication methods
     */
    auth: {
        login: async function(email, password) {
            const supabaseClient = initializeSupabase();
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        },
        
        register: async function(email, password, metadata = {}) {
            const supabase = initializeSupabase();
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
        
        logout: async function() {
            const supabase = initializeSupabase();
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        },
        
        resetPassword: async function(email) {
            const supabase = initializeSupabase();
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) throw error;
        }
    },
    
    /**
     * Data operations
     */
    
    /**
     * Get records from table
     * @param {string} tableName - Name of the table
     * @param {Object} options - Query options (select, filters, order, range)
     */
    get: async function(tableName, options = {}) {
        const supabase = initializeSupabase();
        const table = MediTrackConfig.tables[tableName] || tableName;
        
        let query = supabase.from(table).select(options.select || '*');
        
        // Add filters
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query.filter(filter.column, filter.operator, filter.value);
            });
        }
        
        // Add ordering
        if (options.orderBy) {
            query = query.order(options.orderBy.column, { 
                ascending: options.orderBy.ascending !== false 
            });
        }
        
        // Add pagination
        if (options.range) {
            query = query.range(options.range.from, options.range.to);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        // Transform data to match Strapi format for compatibility
        return {
            data: data.map(item => ({
                id: item.id,
                attributes: item
            }))
        };
    },
    
    /**
     * Insert record
     * @param {string} tableName - Name of the table  
     * @param {Object} data - Data to insert
     */
    post: async function(tableName, data) {
        console.log('ApiHelper.post called with:', { tableName, data });
        
        // FOR TESTING: Return mock success without calling Supabase
        if (tableName === 'clinicReceives') {
            console.log('TESTING MODE: Simulating successful insert');
            const mockResult = [{
                id: Math.floor(Math.random() * 1000),
                ...data,
                created_at: new Date().toISOString()
            }];
            
            console.log('Mock insert successful, result:', mockResult);
            
            // Transform result to match expected format
            return {
                data: mockResult.map(item => ({
                    id: item.id,
                    attributes: item
                }))
            };
        }
        
        const supabaseClient = initializeSupabase();
        if (!supabaseClient) {
            const error = 'Supabase client not initialized. Please check if the Supabase library is loaded.';
            console.error(error);
            throw new Error(error);
        }
        
        const table = MediTrackConfig.tables[tableName] || tableName;
        console.log('Using table name:', table);
        
        // Skip user authentication completely for testing
        console.log('Skipping user authentication for testing');
        console.log('Final data to insert:', data);
        console.log('Data type:', typeof data);
        console.log('Data keys:', Object.keys(data));
        
        const { data: result, error } = await supabaseClient
            .from(table)
            .insert(data)
            .select();
            
        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }
        
        console.log('Insert successful, result:', result);
        
        // Transform result to match Strapi format
        return {
            data: result.map(item => ({
                id: item.id,
                attributes: item
            }))
        };
    },
    
    /**
     * Update record
     * @param {string} tableName - Name of the table
     * @param {number} id - Record ID
     * @param {Object} data - Data to update
     */
    put: async function(tableName, id, data) {
        const supabase = initializeSupabase();
        const table = MediTrackConfig.tables[tableName] || tableName;
        
        const { data: result, error } = await supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select();
            
        if (error) throw error;
        
        return {
            data: result.map(item => ({
                id: item.id,
                attributes: item
            }))
        };
    },
    
    /**
     * Delete record
     * @param {string} tableName - Name of the table
     * @param {number} id - Record ID
     */
    delete: async function(tableName, id) {
        const supabase = initializeSupabase();
        const table = MediTrackConfig.tables[tableName] || tableName;
        
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);
            
        if (error) throw error;
    },
    
    /**
     * Count records
     * @param {string} tableName - Name of the table
     * @param {Object} options - Filter options
     */
    count: async function(tableName, options = {}) {
        const supabase = initializeSupabase();
        const table = MediTrackConfig.tables[tableName] || tableName;
        
        let query = supabase.from(table).select('*', { count: 'exact', head: true });
        
        // Add filters
        if (options.filters) {
            options.filters.forEach(filter => {
                query = query.filter(filter.column, filter.operator, filter.value);
            });
        }
        
        const { count, error } = await query;
        if (error) throw error;
        return count;
    },
    
    /**
     * Legacy method for backwards compatibility
     * Handles both old endpoint strings and new table names
     */
    request: async function(endpoint, options = {}) {
        console.warn('ApiHelper.request is deprecated. Use specific methods (get, post, put, delete) instead.');
        
        // Extract method and determine operation
        const method = options.method || 'GET';
        
        // Map old endpoints to new table names
        const endpointMap = {
            'clinic_receives': 'clinicReceives',
            'clinic_processings': 'clinicProcessings',
            'pharmacy_records': 'pharmacyRecords',
            'archives': 'archives'
        };
        
        const tableName = endpointMap[endpoint] || endpoint;
        
        switch (method.toUpperCase()) {
            case 'GET':
                return this.get(tableName);
            case 'POST':
                const postData = JSON.parse(options.body || '{}');
                return this.post(tableName, postData);
            case 'PUT':
                const putData = JSON.parse(options.body || '{}');
                const id = endpoint.split('/').pop(); // Extract ID from endpoint
                return this.put(tableName, id, putData);
            case 'DELETE':
                const deleteId = endpoint.split('/').pop();
                return this.delete(tableName, deleteId);
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }
};
