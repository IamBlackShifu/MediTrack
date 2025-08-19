/**
 * MediTrack Authentication Module
 * Handles user authentication, session management, and role-based access
 * 
 * @author MediTrack Development Team
 * @version 1.0.0
 * @since 2025-08-19
 */

/**
 * Authentication Manager
 * Provides comprehensive authentication functionality
 */
window.AuthManager = {
    /**
     * Configuration for authentication
     */
    config: {
        loginEndpoint: '/auth/local',
        registerEndpoint: '/auth/local/register',
        logoutEndpoint: '/auth/logout',
        profileEndpoint: '/users/me',
        sessionTimeout: 3600000, // 1 hour in milliseconds
        refreshThreshold: 300000, // 5 minutes before expiry
        storage: {
            tokenKey: 'meditrack_token',
            userKey: 'meditrack_user',
            expiryKey: 'meditrack_expiry'
        }
    },

    /**
     * Current user session data
     */
    currentUser: null,
    sessionTimer: null,
    refreshTimer: null,

    /**
     * Initializes the authentication manager
     */
    init: function() {
        this.checkExistingSession();
        this.setupSessionMonitoring();
        this.setupFormValidation();
        
        // Bind authentication forms if they exist
        this.bindLoginForm();
        this.bindRegisterForm();
        this.bindLogoutButtons();
        
        console.log('AuthManager: Initialized successfully');
    },

    /**
     * Logs in a user with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @param {boolean} rememberMe - Whether to persist session
     * @returns {Promise<Object>} Login result
     */
    login: async function(email, password, rememberMe = false) {
        try {
            // Show loading state
            const loadingId = LoadingManager.showSpinner('body', {
                message: 'Authenticating...',
                overlay: true
            });

            // Validate input
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Prepare login data
            const loginData = {
                identifier: email.toLowerCase().trim(),
                password: password
            };

            // Make API call
            const response = await ApiHelper.post(this.config.loginEndpoint, loginData);

            if (!response.success) {
                throw new Error(response.error?.message || 'Login failed');
            }

            // Extract user data and token
            const { jwt, user } = response.data;

            if (!jwt || !user) {
                throw new Error('Invalid response from server');
            }

            // Store authentication data
            const expiryTime = Date.now() + this.config.sessionTimeout;
            await this.storeAuthData(jwt, user, expiryTime, rememberMe);

            // Set current user
            this.currentUser = user;

            // Setup session monitoring
            this.setupSessionMonitoring();

            // Hide loading state
            LoadingManager.hideSpinner(loadingId);

            // Show success notification
            NotificationManager.success('Login successful! Welcome back.');

            // Redirect based on user role
            this.handleSuccessfulLogin(user);

            return {
                success: true,
                user: user,
                message: 'Login successful'
            };

        } catch (error) {
            LoadingManager.hideSpinner(loadingId);
            
            const errorMessage = error.message || 'Login failed. Please try again.';
            NotificationManager.error(errorMessage);

            // Log error for debugging
            console.error('AuthManager Login Error:', error);

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Registers a new user
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} Registration result
     */
    register: async function(userData) {
        try {
            // Show loading state
            const loadingId = LoadingManager.showSpinner('body', {
                message: 'Creating account...',
                overlay: true
            });

            // Validate registration data
            const validation = this.validateRegistrationData(userData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Prepare registration data
            const registrationData = {
                username: userData.email.toLowerCase().trim(),
                email: userData.email.toLowerCase().trim(),
                password: userData.password,
                firstName: userData.firstName?.trim(),
                lastName: userData.lastName?.trim(),
                phone: userData.phone?.trim(),
                role: userData.role || 'user',
                organization: userData.organization?.trim()
            };

            // Make API call
            const response = await ApiHelper.post(this.config.registerEndpoint, registrationData);

            if (!response.success) {
                throw new Error(response.error?.message || 'Registration failed');
            }

            // Extract user data and token
            const { jwt, user } = response.data;

            if (!jwt || !user) {
                throw new Error('Invalid response from server');
            }

            // Store authentication data
            const expiryTime = Date.now() + this.config.sessionTimeout;
            await this.storeAuthData(jwt, user, expiryTime, false);

            // Set current user
            this.currentUser = user;

            // Setup session monitoring
            this.setupSessionMonitoring();

            // Hide loading state
            LoadingManager.hideSpinner(loadingId);

            // Show success notification
            NotificationManager.success('Account created successfully! Welcome to MediTrack.');

            // Redirect to appropriate dashboard
            this.handleSuccessfulLogin(user);

            return {
                success: true,
                user: user,
                message: 'Registration successful'
            };

        } catch (error) {
            LoadingManager.hideSpinner(loadingId);
            
            const errorMessage = error.message || 'Registration failed. Please try again.';
            NotificationManager.error(errorMessage);

            // Log error for debugging
            console.error('AuthManager Registration Error:', error);

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Logs out the current user
     * @param {boolean} showConfirmation - Whether to show logout confirmation
     * @returns {Promise<void>}
     */
    logout: async function(showConfirmation = true) {
        try {
            // Show confirmation if requested
            if (showConfirmation) {
                const confirmed = await ModalManager.confirm(
                    'Confirm Logout',
                    'Are you sure you want to log out of your MediTrack account?',
                    {
                        confirmText: 'Logout',
                        confirmStyle: 'btn-danger',
                        cancelText: 'Cancel'
                    }
                );

                if (!confirmed) {
                    return;
                }
            }

            // Show loading state
            const loadingId = LoadingManager.showSpinner('body', {
                message: 'Logging out...',
                overlay: true
            });

            // Clear session timers
            this.clearSessionTimers();

            // Call logout endpoint if available
            try {
                await ApiHelper.post(this.config.logoutEndpoint, {});
            } catch (error) {
                console.warn('AuthManager: Logout endpoint call failed:', error);
                // Continue with client-side logout even if server call fails
            }

            // Clear authentication data
            await this.clearAuthData();

            // Reset current user
            this.currentUser = null;

            // Hide loading state
            LoadingManager.hideSpinner(loadingId);

            // Show success notification
            NotificationManager.success('Logged out successfully');

            // Redirect to login page
            setTimeout(() => {
                window.location.href = '/pages/auth-register.html';
            }, 1000);

        } catch (error) {
            LoadingManager.hideSpinner(loadingId);
            
            const errorMessage = error.message || 'Logout failed. Please try again.';
            NotificationManager.error(errorMessage);

            console.error('AuthManager Logout Error:', error);
        }
    },

    /**
     * Checks if user is currently authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated: function() {
        const token = TokenManager.getToken();
        const expiry = localStorage.getItem(this.config.storage.expiryKey);
        
        if (!token || !expiry) {
            return false;
        }

        // Check if token has expired
        if (Date.now() > parseInt(expiry)) {
            this.clearAuthData();
            return false;
        }

        return true;
    },

    /**
     * Gets the current user profile
     * @param {boolean} forceRefresh - Whether to force refresh from server
     * @returns {Promise<Object|null>} User profile or null
     */
    getCurrentUser: async function(forceRefresh = false) {
        if (this.currentUser && !forceRefresh) {
            return this.currentUser;
        }

        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            const response = await ApiHelper.get(this.config.profileEndpoint);
            
            if (response.success && response.data) {
                this.currentUser = response.data;
                
                // Update stored user data
                localStorage.setItem(this.config.storage.userKey, JSON.stringify(response.data));
                
                return this.currentUser;
            }
        } catch (error) {
            console.error('AuthManager: Failed to fetch current user:', error);
        }

        return null;
    },

    /**
     * Checks user role and permissions
     * @param {string|Array} requiredRoles - Required role(s)
     * @returns {boolean} Whether user has required role
     */
    hasRole: function(requiredRoles) {
        if (!this.currentUser) {
            return false;
        }

        const userRole = this.currentUser.role?.type || this.currentUser.role;
        
        if (Array.isArray(requiredRoles)) {
            return requiredRoles.includes(userRole);
        }

        return userRole === requiredRoles;
    },

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} Whether email is valid
     */
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validates password strength
     * @param {string} password - Password to validate
     * @returns {Object} Validation result
     */
    validatePassword: function(password) {
        const result = {
            isValid: true,
            errors: [],
            strength: 'weak'
        };

        if (!password) {
            result.isValid = false;
            result.errors.push('Password is required');
            return result;
        }

        if (password.length < 8) {
            result.isValid = false;
            result.errors.push('Password must be at least 8 characters long');
        }

        if (!/(?=.*[a-z])/.test(password)) {
            result.isValid = false;
            result.errors.push('Password must contain at least one lowercase letter');
        }

        if (!/(?=.*[A-Z])/.test(password)) {
            result.isValid = false;
            result.errors.push('Password must contain at least one uppercase letter');
        }

        if (!/(?=.*\d)/.test(password)) {
            result.isValid = false;
            result.errors.push('Password must contain at least one number');
        }

        // Calculate strength
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/(?=.*[a-z])/.test(password)) strength++;
        if (/(?=.*[A-Z])/.test(password)) strength++;
        if (/(?=.*\d)/.test(password)) strength++;
        if (/(?=.*[!@#$%^&*])/.test(password)) strength++;

        if (strength >= 4) {
            result.strength = 'strong';
        } else if (strength >= 3) {
            result.strength = 'medium';
        }

        return result;
    },

    /**
     * Validates registration data
     * @param {Object} userData - User data to validate
     * @returns {Object} Validation result
     */
    validateRegistrationData: function(userData) {
        const result = {
            isValid: true,
            errors: []
        };

        // Required fields
        if (!userData.email) {
            result.errors.push('Email is required');
        } else if (!this.isValidEmail(userData.email)) {
            result.errors.push('Please enter a valid email address');
        }

        if (!userData.password) {
            result.errors.push('Password is required');
        } else {
            const passwordValidation = this.validatePassword(userData.password);
            if (!passwordValidation.isValid) {
                result.errors.push(...passwordValidation.errors);
            }
        }

        if (userData.password !== userData.confirmPassword) {
            result.errors.push('Passwords do not match');
        }

        if (!userData.firstName || userData.firstName.trim().length < 2) {
            result.errors.push('First name must be at least 2 characters long');
        }

        if (!userData.lastName || userData.lastName.trim().length < 2) {
            result.errors.push('Last name must be at least 2 characters long');
        }

        if (userData.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(userData.phone)) {
            result.errors.push('Please enter a valid phone number');
        }

        result.isValid = result.errors.length === 0;
        return result;
    },

    /**
     * Stores authentication data securely
     * @private
     */
    storeAuthData: async function(token, user, expiryTime, persistent = false) {
        try {
            // Store token securely
            await TokenManager.storeToken(token, persistent);
            
            // Store user data
            const storage = persistent ? localStorage : sessionStorage;
            storage.setItem(this.config.storage.userKey, JSON.stringify(user));
            storage.setItem(this.config.storage.expiryKey, expiryTime.toString());
            
        } catch (error) {
            console.error('AuthManager: Failed to store auth data:', error);
            throw new Error('Failed to store authentication data');
        }
    },

    /**
     * Clears authentication data
     * @private
     */
    clearAuthData: async function() {
        try {
            // Clear token
            await TokenManager.clearToken();
            
            // Clear user data from both storages
            localStorage.removeItem(this.config.storage.userKey);
            localStorage.removeItem(this.config.storage.expiryKey);
            sessionStorage.removeItem(this.config.storage.userKey);
            sessionStorage.removeItem(this.config.storage.expiryKey);
            
        } catch (error) {
            console.error('AuthManager: Failed to clear auth data:', error);
        }
    },

    /**
     * Checks for existing session on page load
     * @private
     */
    checkExistingSession: function() {
        if (this.isAuthenticated()) {
            // Try to get user from storage
            const userJson = localStorage.getItem(this.config.storage.userKey) || 
                            sessionStorage.getItem(this.config.storage.userKey);
            
            if (userJson) {
                try {
                    this.currentUser = JSON.parse(userJson);
                    console.log('AuthManager: Existing session found for user:', this.currentUser.email);
                } catch (error) {
                    console.error('AuthManager: Failed to parse stored user data:', error);
                    this.clearAuthData();
                }
            }
        }
    },

    /**
     * Sets up session monitoring and auto-refresh
     * @private
     */
    setupSessionMonitoring: function() {
        // Clear existing timers
        this.clearSessionTimers();

        if (!this.isAuthenticated()) {
            return;
        }

        const expiryTime = parseInt(localStorage.getItem(this.config.storage.expiryKey) || 
                                   sessionStorage.getItem(this.config.storage.expiryKey));
        
        if (!expiryTime) {
            return;
        }

        const timeUntilExpiry = expiryTime - Date.now();
        const timeUntilRefresh = Math.max(0, timeUntilExpiry - this.config.refreshThreshold);

        // Set refresh timer
        if (timeUntilRefresh > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshSession();
            }, timeUntilRefresh);
        }

        // Set session expiry timer
        if (timeUntilExpiry > 0) {
            this.sessionTimer = setTimeout(() => {
                this.handleSessionExpiry();
            }, timeUntilExpiry);
        }
    },

    /**
     * Refreshes the user session
     * @private
     */
    refreshSession: async function() {
        try {
            const user = await this.getCurrentUser(true);
            
            if (user) {
                // Extend session
                const newExpiryTime = Date.now() + this.config.sessionTimeout;
                const storage = localStorage.getItem(this.config.storage.userKey) ? localStorage : sessionStorage;
                storage.setItem(this.config.storage.expiryKey, newExpiryTime.toString());
                
                // Setup monitoring again
                this.setupSessionMonitoring();
                
                console.log('AuthManager: Session refreshed successfully');
            } else {
                this.handleSessionExpiry();
            }
        } catch (error) {
            console.error('AuthManager: Session refresh failed:', error);
            this.handleSessionExpiry();
        }
    },

    /**
     * Handles session expiry
     * @private
     */
    handleSessionExpiry: function() {
        this.clearSessionTimers();
        this.clearAuthData();
        this.currentUser = null;
        
        NotificationManager.warning('Your session has expired. Please log in again.');
        
        setTimeout(() => {
            window.location.href = '/pages/auth-register.html';
        }, 2000);
    },

    /**
     * Clears session timers
     * @private
     */
    clearSessionTimers: function() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
    },

    /**
     * Handles successful login redirect
     * @private
     */
    handleSuccessfulLogin: function(user) {
        const userRole = user.role?.type || user.role;
        
        // Role-based redirect mapping
        const redirectMap = {
            'clinician': '/pages/home.html',
            'lab-scientist': '/pages/home.html',
            'pharmacist': '/pages/home.html',
            'admin': '/pages/analytics.html',
            'default': '/pages/home.html'
        };

        const redirectUrl = redirectMap[userRole] || redirectMap.default;
        
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    },

    /**
     * Binds login form if it exists
     * @private
     */
    bindLoginForm: function() {
        const loginForm = document.getElementById('loginForm') || document.querySelector('form[data-form="login"]');
        
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(loginForm);
                const email = formData.get('email');
                const password = formData.get('password');
                const rememberMe = formData.get('remember') === 'on';
                
                await this.login(email, password, rememberMe);
            });
            
            console.log('AuthManager: Login form bound successfully');
        }
    },

    /**
     * Binds registration form if it exists
     * @private
     */
    bindRegisterForm: function() {
        const registerForm = document.getElementById('registerForm') || document.querySelector('form[data-form="register"]');
        
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(registerForm);
                const userData = {
                    email: formData.get('email'),
                    password: formData.get('password'),
                    confirmPassword: formData.get('confirmPassword'),
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    phone: formData.get('phone'),
                    role: formData.get('role'),
                    organization: formData.get('organization')
                };
                
                await this.register(userData);
            });
            
            console.log('AuthManager: Registration form bound successfully');
        }
    },

    /**
     * Binds logout buttons
     * @private
     */
    bindLogoutButtons: function() {
        const logoutButtons = document.querySelectorAll('[data-action="logout"], .logout-btn');
        
        logoutButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout(true);
            });
        });
        
        if (logoutButtons.length > 0) {
            console.log(`AuthManager: ${logoutButtons.length} logout button(s) bound successfully`);
        }
    },

    /**
     * Sets up form validation for authentication forms
     * @private
     */
    setupFormValidation: function() {
        // Real-time password strength indicator
        const passwordInputs = document.querySelectorAll('input[type="password"][name="password"]');
        
        passwordInputs.forEach(input => {
            const strengthIndicator = this.createPasswordStrengthIndicator(input);
            
            input.addEventListener('input', () => {
                this.updatePasswordStrength(input, strengthIndicator);
            });
        });

        // Email validation
        const emailInputs = document.querySelectorAll('input[type="email"]');
        
        emailInputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateEmailInput(input);
            });
        });

        // Password confirmation
        const confirmPasswordInputs = document.querySelectorAll('input[name="confirmPassword"]');
        
        confirmPasswordInputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validatePasswordConfirmation(input);
            });
        });
    },

    /**
     * Creates password strength indicator
     * @private
     */
    createPasswordStrengthIndicator: function(passwordInput) {
        // Check if indicator already exists
        let indicator = passwordInput.parentNode.querySelector('.password-strength');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'password-strength mt-1';
            indicator.innerHTML = `
                <div class="strength-bar">
                    <div class="strength-fill"></div>
                </div>
                <small class="strength-text text-muted">Enter a password</small>
            `;
            
            passwordInput.parentNode.appendChild(indicator);
        }
        
        return indicator;
    },

    /**
     * Updates password strength indicator
     * @private
     */
    updatePasswordStrength: function(input, indicator) {
        const password = input.value;
        const validation = this.validatePassword(password);
        
        const strengthFill = indicator.querySelector('.strength-fill');
        const strengthText = indicator.querySelector('.strength-text');
        
        // Update visual indicator
        let percentage = 0;
        let className = '';
        let text = '';
        
        if (!password) {
            percentage = 0;
            className = '';
            text = 'Enter a password';
        } else if (validation.strength === 'weak') {
            percentage = 33;
            className = 'weak';
            text = 'Weak password';
        } else if (validation.strength === 'medium') {
            percentage = 66;
            className = 'medium';
            text = 'Medium strength';
        } else {
            percentage = 100;
            className = 'strong';
            text = 'Strong password';
        }
        
        strengthFill.style.width = `${percentage}%`;
        strengthFill.className = `strength-fill ${className}`;
        strengthText.textContent = text;
        strengthText.className = `strength-text text-${className === 'strong' ? 'success' : className === 'medium' ? 'warning' : 'muted'}`;
    },

    /**
     * Validates email input
     * @private
     */
    validateEmailInput: function(input) {
        const email = input.value.trim();
        
        if (email && !this.isValidEmail(email)) {
            input.classList.add('is-invalid');
            this.showInputError(input, 'Please enter a valid email address');
        } else {
            input.classList.remove('is-invalid');
            this.hideInputError(input);
        }
    },

    /**
     * Validates password confirmation
     * @private
     */
    validatePasswordConfirmation: function(confirmInput) {
        const password = document.querySelector('input[name="password"]')?.value;
        const confirmPassword = confirmInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('is-invalid');
            this.showInputError(confirmInput, 'Passwords do not match');
        } else {
            confirmInput.classList.remove('is-invalid');
            this.hideInputError(confirmInput);
        }
    },

    /**
     * Shows input error message
     * @private
     */
    showInputError: function(input, message) {
        this.hideInputError(input);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        input.parentNode.appendChild(errorDiv);
    },

    /**
     * Hides input error message
     * @private
     */
    hideInputError: function(input) {
        const existingError = input.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }
};

// Password strength indicator CSS
const authCSS = `
<style>
.password-strength {
    margin-top: 0.5rem;
}

.strength-bar {
    height: 4px;
    background-color: #e9ecef;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.25rem;
}

.strength-fill {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
    border-radius: 2px;
}

.strength-fill.weak {
    background-color: #ff3e1d;
}

.strength-fill.medium {
    background-color: #ffab00;
}

.strength-fill.strong {
    background-color: #71dd37;
}

.strength-text {
    font-size: 0.75rem;
    margin: 0;
}
</style>
`;

// Inject CSS when the script loads
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', authCSS);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', authCSS);
    });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init();
});
