/**
 * MediTrack Configuration
 * -------------------------------------------------------------------------------------
 * ! IMPORTANT: Make sure you clear the browser local storage In order to see the config changes in the template.
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
 * MediTrack API Configuration
 * Centralized configuration for API endpoints and authentication
 */
window.MediTrackConfig = {
    // API Base URL - Updated to use HTTPS for secure communication
    API_BASE_URL: 'https://198.177.123.228:1337/api/',
    
    // API Endpoints
    endpoints: {
        auth: {
            login: 'auth/local',
            register: 'auth/local/register',
            forgotPassword: 'auth/forgot-password',
            resetPassword: 'auth/reset-password'
        },
        clinicReceives: 'clinicreceives',
        clinicProcessings: 'clinicprocessings',
        pharmacyRecords: 'pharmacyrecords',
        archives: 'archives'
    },
    
    // Default request headers
    defaultHeaders: {
        'Content-Type': 'application/json'
    }
};

/**
 * Secure Token Management
 * Provides methods for secure token storage and retrieval
 */
window.TokenManager = {
    TOKEN_KEY: 'meditrack_auth_token',
    
    /**
     * Store authentication token securely
     * @param {string} token - The authentication token
     */
    setToken: function(token) {
        if (!token) {
            console.warn('Attempting to store empty token');
            return;
        }
        
        try {
            // In production, consider using more secure storage like IndexedDB
            // or encrypted localStorage with proper key derivation
            localStorage.setItem(this.TOKEN_KEY, token);
        } catch (error) {
            console.error('Failed to store authentication token:', error);
        }
    },
    
    /**
     * Retrieve authentication token
     * @returns {string|null} The authentication token or null if not found
     */
    getToken: function() {
        try {
            return localStorage.getItem(this.TOKEN_KEY);
        } catch (error) {
            console.error('Failed to retrieve authentication token:', error);
            return null;
        }
    },
    
    /**
     * Remove authentication token
     */
    removeToken: function() {
        try {
            localStorage.removeItem(this.TOKEN_KEY);
        } catch (error) {
            console.error('Failed to remove authentication token:', error);
        }
    },
    
    /**
     * Check if user is authenticated
     * @returns {boolean} True if user has a valid token
     */
    isAuthenticated: function() {
        const token = this.getToken();
        return token && token.length > 0;
    },
    
    /**
     * Get authorization header for API requests
     * @returns {Object} Authorization header object
     */
    getAuthHeader: function() {
        const token = this.getToken();
        if (!token) {
            console.warn('No authentication token available');
            return {};
        }
        
        return {
            'Authorization': `Bearer ${token}`
        };
    }
};

/**
 * API Helper Functions
 * Centralized methods for making secure API calls
 */
window.ApiHelper = {
    /**
     * Make authenticated API request
     * @param {string} endpoint - The API endpoint (relative to base URL)
     * @param {Object} options - Fetch options (method, body, etc.)
     * @returns {Promise} Fetch promise
     */
    request: async function(endpoint, options = {}) {
        const url = MediTrackConfig.API_BASE_URL + endpoint;
        
        // Merge default headers with provided headers
        const headers = {
            ...MediTrackConfig.defaultHeaders,
            ...TokenManager.getAuthHeader(),
            ...(options.headers || {})
        };
        
        const config = {
            ...options,
            headers
        };
        
        try {
            const response = await fetch(url, config);
            
            // Handle authentication errors
            if (response.status === 401) {
                console.warn('Authentication failed, redirecting to login');
                TokenManager.removeToken();
                window.location.href = '/index.html';
                return;
            }
            
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },
    
    /**
     * Make GET request
     * @param {string} endpoint - The API endpoint
     * @returns {Promise} Fetch promise
     */
    get: function(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    /**
     * Make POST request
     * @param {string} endpoint - The API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Fetch promise
     */
    post: function(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * Make PUT request
     * @param {string} endpoint - The API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise} Fetch promise
     */
    put: function(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    /**
     * Make DELETE request
     * @param {string} endpoint - The API endpoint
     * @returns {Promise} Fetch promise
     */
    delete: function(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};
