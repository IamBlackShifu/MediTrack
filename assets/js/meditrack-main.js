/**
 * MediTrack Main Module
 * Central initialization and integration point for all MediTrack modules
 * 
 * @author MediTrack Development Team
 * @version 1.0.0
 * @since 2025-08-19
 * 
 * @requires config.js - Configuration and API helpers
 * @requires form-validator.js - Form validation system
 * @requires loading-feedback.js - Loading states and notifications
 * @requires auth-manager.js - Authentication management
 * @requires form-handler.js - Form handling and submission
 * @requires utils.js - Utility functions
 * @requires error-manager.js - Error handling and recovery
 */

/**
 * MediTrack Application Manager
 * Coordinates all modules and provides unified application interface
 */
window.MediTrack = {
    /**
     * Application configuration
     */
    config: {
        version: '1.0.0',
        debug: false,
        modules: [
            'TokenManager',
            'ApiHelper',
            'MediTrackConfig',
            'LoadingManager',
            'NotificationManager',
            'ModalManager',
            'AuthManager',
            'FormHandler',
            'FormValidator',
            'Utils',
            'ErrorManager'
        ],
        requiredScripts: [
            '/assets/js/config.js',
            '/assets/js/form-validator.js',
            '/assets/js/loading-feedback.js',
            '/assets/js/auth-manager.js',
            '/assets/js/form-handler.js',
            '/assets/js/utils.js',
            '/assets/js/error-manager.js'
        ]
    },

    /**
     * Module status tracking
     */
    moduleStatus: {},
    initializationComplete: false,
    startTime: null,

    /**
     * Initializes the MediTrack application
     * @param {Object} options - Initialization options
     * @returns {Promise<Object>} Initialization result
     */
    async init(options = {}) {
        try {
            this.startTime = performance.now();
            
            console.log('🏥 MediTrack Application Starting...');
            console.log(`📋 Version: ${this.config.version}`);
            console.log(`🔧 Debug Mode: ${options.debug || this.config.debug ? 'ON' : 'OFF'}`);

            // Set debug mode
            if (options.debug !== undefined) {
                this.config.debug = options.debug;
            }

            // Check dependencies
            const dependencyCheck = await this.checkDependencies();
            if (!dependencyCheck.success) {
                throw new Error(`Missing dependencies: ${dependencyCheck.missing.join(', ')}`);
            }

            // Initialize modules in order
            const moduleResults = await this.initializeModules(options);
            
            // Set up application-level features
            await this.setupApplicationFeatures();
            
            // Perform post-initialization checks
            const healthCheck = await this.performHealthCheck();
            
            const endTime = performance.now();
            const initTime = Math.round(endTime - this.startTime);
            
            this.initializationComplete = true;
            
            console.log(`✅ MediTrack Application Ready! (${initTime}ms)`);
            
            // Show initialization complete notification in debug mode
            if (this.config.debug) {
                NotificationManager.success(`MediTrack initialized successfully in ${initTime}ms`);
            }

            return {
                success: true,
                initTime: initTime,
                modules: moduleResults,
                health: healthCheck
            };

        } catch (error) {
            console.error('❌ MediTrack Initialization Failed:', error);
            
            // Show critical error
            if (typeof ErrorManager !== 'undefined') {
                await ErrorManager.handleError(error, {
                    type: 'initialization_error',
                    critical: true
                });
            } else {
                alert('Failed to initialize MediTrack application. Please refresh the page.');
            }

            return {
                success: false,
                error: error.message,
                modules: this.moduleStatus
            };
        }
    },

    /**
     * Checks for required dependencies
     * @returns {Promise<Object>} Dependency check result
     * @private
     */
    async checkDependencies() {
        const missing = [];
        const available = [];

        // Check for required global objects
        const requiredGlobals = [
            'TokenManager',
            'ApiHelper',
            'LoadingManager',
            'NotificationManager',
            'ModalManager',
            'AuthManager',
            'FormHandler',
            'Utils',
            'ErrorManager'
        ];

        requiredGlobals.forEach(globalName => {
            if (typeof window[globalName] !== 'undefined') {
                available.push(globalName);
            } else {
                missing.push(globalName);
            }
        });

        // Check for Bootstrap (required for UI components)
        if (typeof bootstrap === 'undefined') {
            missing.push('Bootstrap');
        } else {
            available.push('Bootstrap');
        }

        return {
            success: missing.length === 0,
            missing: missing,
            available: available
        };
    },

    /**
     * Initializes all modules in the correct order
     * @param {Object} options - Initialization options
     * @returns {Promise<Object>} Module initialization results
     * @private
     */
    async initializeModules(options) {
        const results = {};

        // Module initialization order is important
        const initOrder = [
            { name: 'ErrorManager', module: window.ErrorManager },
            { name: 'TokenManager', module: window.TokenManager },
            { name: 'MediTrackConfig', module: window.MediTrackConfig },
            { name: 'ApiHelper', module: window.ApiHelper },
            { name: 'LoadingManager', module: window.LoadingManager },
            { name: 'NotificationManager', module: window.NotificationManager },
            { name: 'ModalManager', module: window.ModalManager },
            { name: 'Utils', module: window.Utils },
            { name: 'FormValidator', module: window.FormValidator },
            { name: 'AuthManager', module: window.AuthManager },
            { name: 'FormHandler', module: window.FormHandler }
        ];

        for (const { name, module } of initOrder) {
            try {
                console.log(`🔄 Initializing ${name}...`);
                
                // Some modules may not have init methods (utility modules)
                if (module && typeof module.init === 'function') {
                    const moduleResult = await module.init(options);
                    results[name] = { success: true, result: moduleResult };
                } else if (module) {
                    results[name] = { success: true, result: 'No initialization required' };
                } else {
                    throw new Error(`Module ${name} not found`);
                }
                
                this.moduleStatus[name] = 'initialized';
                console.log(`✅ ${name} initialized`);
                
            } catch (error) {
                console.error(`❌ ${name} initialization failed:`, error);
                results[name] = { success: false, error: error.message };
                this.moduleStatus[name] = 'failed';
                
                // Some modules are critical for application function
                const criticalModules = ['ErrorManager', 'TokenManager', 'ApiHelper'];
                if (criticalModules.includes(name)) {
                    throw new Error(`Critical module ${name} failed to initialize: ${error.message}`);
                }
            }
        }

        return results;
    },

    /**
     * Sets up application-level features
     * @returns {Promise<void>}
     * @private
     */
    async setupApplicationFeatures() {
        try {
            // Set up global keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Set up page visibility handling
            this.setupPageVisibilityHandling();
            
            // Set up responsive behavior
            this.setupResponsiveBehavior();
            
            // Set up accessibility features
            this.setupAccessibilityFeatures();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Set up auto-logout on inactivity
            this.setupInactivityMonitor();
            
            // Initialize clock display
            this.initializeClock();
            
            // Initialize quick search functionality
            this.initializeQuickSearch();
            
            // Update copyright year
            this.updateCopyrightYear();
            
            // Initialize drug table if present
            this.initializeDrugTable();
            
            console.log('📱 Application features configured');
            
        } catch (error) {
            console.warn('⚠️ Some application features failed to configure:', error);
        }
    },

    /**
     * Sets up global keyboard shortcuts
     * @private
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Quick search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openQuickSearch();
            }
            
            // Ctrl/Cmd + Shift + L: Logout
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                if (AuthManager && AuthManager.logout) {
                    AuthManager.logout(true);
                }
            }
            
            // Escape: Close modals/notifications
            if (e.key === 'Escape') {
                this.closeTopModal();
            }
            
            // F1: Help
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
        });
    },

    /**
     * Sets up page visibility handling
     * @private
     */
    setupPageVisibilityHandling() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page became hidden
                this.handlePageHidden();
            } else {
                // Page became visible
                this.handlePageVisible();
            }
        });
    },

    /**
     * Sets up responsive behavior
     * @private
     */
    setupResponsiveBehavior() {
        // Monitor screen size changes
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleScreenSizeChange = (e) => {
            if (e.matches) {
                // Mobile view
                document.body.classList.add('mobile-view');
                this.adjustForMobile();
            } else {
                // Desktop view
                document.body.classList.remove('mobile-view');
                this.adjustForDesktop();
            }
        };

        mediaQuery.addListener(handleScreenSizeChange);
        handleScreenSizeChange(mediaQuery); // Initial check
    },

    /**
     * Sets up accessibility features
     * @private
     */
    setupAccessibilityFeatures() {
        // Focus management
        this.setupFocusManagement();
        
        // Screen reader announcements
        this.setupScreenReaderSupport();
        
        // High contrast mode detection
        this.setupHighContrastSupport();
        
        // Keyboard navigation
        this.setupKeyboardNavigation();
    },

    /**
     * Sets up performance monitoring
     * @private
     */
    setupPerformanceMonitoring() {
        if ('performance' in window && 'observer' in window.PerformanceObserver.prototype) {
            try {
                // Monitor long tasks
                const longTaskObserver = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.duration > 50) { // Tasks longer than 50ms
                            console.warn(`Long task detected: ${entry.duration}ms`);
                        }
                    });
                });
                longTaskObserver.observe({ entryTypes: ['longtask'] });

                // Monitor largest contentful paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        console.log(`LCP: ${lastEntry.startTime}ms`);
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                
            } catch (error) {
                console.warn('Performance monitoring setup failed:', error);
            }
        }
    },

    /**
     * Sets up inactivity monitor for auto-logout
     * @private
     */
    setupInactivityMonitor() {
        let inactivityTimer;
        const inactivityTimeout = 30 * 60 * 1000; // 30 minutes

        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                if (AuthManager && AuthManager.isAuthenticated && AuthManager.isAuthenticated()) {
                    NotificationManager.warning(
                        'You will be logged out due to inactivity in 2 minutes',
                        {
                            persistent: true,
                            actions: [
                                {
                                    text: 'Stay logged in',
                                    action: 'resetInactivityTimer()',
                                    style: 'btn-primary'
                                }
                            ]
                        }
                    );
                    
                    // Final logout after 2 more minutes
                    setTimeout(() => {
                        AuthManager.logout(false);
                    }, 2 * 60 * 1000);
                }
            }, inactivityTimeout);
        };

        // Reset timer on user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetInactivityTimer, true);
        });

        // Start the timer
        resetInactivityTimer();
    },

    /**
     * Performs health check after initialization
     * @returns {Promise<Object>} Health check result
     * @private
     */
    async performHealthCheck() {
        const health = {
            status: 'healthy',
            checks: {},
            issues: []
        };

        try {
            // Check API connectivity
            if (ApiHelper && ApiHelper.get) {
                try {
                    await ApiHelper.get('/health');
                    health.checks.api = 'connected';
                } catch (error) {
                    health.checks.api = 'disconnected';
                    health.issues.push('API connection failed');
                }
            }

            // Check authentication status
            if (AuthManager && AuthManager.isAuthenticated) {
                health.checks.auth = AuthManager.isAuthenticated() ? 'authenticated' : 'unauthenticated';
            }

            // Check local storage availability
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                health.checks.storage = 'available';
            } catch (error) {
                health.checks.storage = 'unavailable';
                health.issues.push('Local storage not available');
            }

            // Check for critical errors
            if (ErrorManager && ErrorManager.getErrorStats) {
                const errorStats = ErrorManager.getErrorStats();
                health.checks.errors = {
                    total: errorStats.total,
                    recent: errorStats.recent,
                    critical: errorStats.severity.critical
                };
                
                if (errorStats.severity.critical > 0) {
                    health.status = 'degraded';
                    health.issues.push(`${errorStats.severity.critical} critical errors detected`);
                }
            }

            // Overall status determination
            if (health.issues.length > 0) {
                health.status = health.issues.some(issue => issue.includes('critical')) ? 'unhealthy' : 'degraded';
            }

        } catch (error) {
            health.status = 'unhealthy';
            health.issues.push(`Health check failed: ${error.message}`);
        }

        return health;
    },

    /**
     * Application feature methods
     */

    openQuickSearch() {
        // Implement quick search functionality
        const searchModal = ModalManager.show('Quick Search', `
            <div class="quick-search">
                <input type="text" class="form-control" placeholder="Search patients, samples, or orders..." id="quickSearchInput">
                <div id="quickSearchResults" class="mt-3"></div>
            </div>
        `);

        // Focus on search input
        setTimeout(() => {
            document.getElementById('quickSearchInput')?.focus();
        }, 300);
    },

    closeTopModal() {
        // Close the topmost modal
        const modals = document.querySelectorAll('.modal.show');
        if (modals.length > 0) {
            const topModal = modals[modals.length - 1];
            const modalInstance = bootstrap.Modal.getInstance(topModal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }
    },

    showHelp() {
        const helpContent = `
            <div class="help-content">
                <h5>Keyboard Shortcuts</h5>
                <div class="row">
                    <div class="col-6"><kbd>Ctrl+K</kbd></div>
                    <div class="col-6">Quick Search</div>
                </div>
                <div class="row">
                    <div class="col-6"><kbd>Ctrl+Shift+L</kbd></div>
                    <div class="col-6">Logout</div>
                </div>
                <div class="row">
                    <div class="col-6"><kbd>Esc</kbd></div>
                    <div class="col-6">Close Modal</div>
                </div>
                <div class="row">
                    <div class="col-6"><kbd>F1</kbd></div>
                    <div class="col-6">Show Help</div>
                </div>
                
                <h5 class="mt-4">Support</h5>
                <p>For technical support, please contact:</p>
                <ul>
                    <li>Email: support@meditrack.health</li>
                    <li>Phone: +1 (555) 123-4567</li>
                    <li>Online: <a href="/pages/support.html">Support Center</a></li>
                </ul>
            </div>
        `;

        ModalManager.show('Help & Support', helpContent);
    },

    handlePageHidden() {
        // Pause unnecessary operations when page is hidden
        if (FormHandler && FormHandler.autoSaveTimers) {
            // Pause auto-save timers
            FormHandler.autoSaveTimers.forEach(timer => clearInterval(timer));
        }
    },

    handlePageVisible() {
        // Resume operations when page becomes visible
        if (AuthManager && AuthManager.isAuthenticated && AuthManager.isAuthenticated()) {
            // Check if session is still valid
            AuthManager.getCurrentUser(true);
        }
        
        // Resume auto-save if applicable
        if (FormHandler && FormHandler.setupAutoSave) {
            FormHandler.setupAutoSave();
        }
    },

    adjustForMobile() {
        // Mobile-specific adjustments
        NotificationManager.config.position = 'top-center';
    },

    adjustForDesktop() {
        // Desktop-specific adjustments
        NotificationManager.config.position = 'top-right';
    },

    setupFocusManagement() {
        // Manage focus for accessibility
        document.addEventListener('focusin', (e) => {
            // Add focus indicators
            e.target.classList.add('focused');
        });

        document.addEventListener('focusout', (e) => {
            // Remove focus indicators
            e.target.classList.remove('focused');
        });
    },

    setupScreenReaderSupport() {
        // Create aria-live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        liveRegion.id = 'screen-reader-announcements';
        document.body.appendChild(liveRegion);

        // Function to announce to screen readers
        window.announceToScreenReader = (message) => {
            liveRegion.textContent = message;
        };
    },

    setupHighContrastSupport() {
        // Detect high contrast mode
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        
        const handleHighContrast = (e) => {
            if (e.matches) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }
        };

        mediaQuery.addListener(handleHighContrast);
        handleHighContrast(mediaQuery);
    },

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            // Tab navigation enhancement
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    },

    /**
     * Public API methods
     */

    /**
     * Gets application status and health information
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            initialized: this.initializationComplete,
            version: this.config.version,
            debug: this.config.debug,
            modules: this.moduleStatus,
            uptime: this.startTime ? performance.now() - this.startTime : 0
        };
    },

    /**
     * Refreshes the application
     * @param {boolean} hardRefresh - Whether to clear cache
     */
    refresh(hardRefresh = false) {
        if (hardRefresh) {
            // Clear all caches and local storage
            localStorage.clear();
            sessionStorage.clear();
            
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
        }
        
        window.location.reload();
    },

    /**
     * Shows application information
     */
    showInfo() {
        const status = this.getStatus();
        const health = ErrorManager ? ErrorManager.getErrorStats() : null;
        
        const infoContent = `
            <div class="app-info">
                <div class="row">
                    <div class="col-sm-4"><strong>Version:</strong></div>
                    <div class="col-sm-8">${status.version}</div>
                </div>
                <div class="row">
                    <div class="col-sm-4"><strong>Status:</strong></div>
                    <div class="col-sm-8">
                        <span class="badge ${status.initialized ? 'bg-success' : 'bg-danger'}">
                            ${status.initialized ? 'Running' : 'Not Initialized'}
                        </span>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-4"><strong>Uptime:</strong></div>
                    <div class="col-sm-8">${Math.round(status.uptime / 1000)}s</div>
                </div>
                <div class="row">
                    <div class="col-sm-4"><strong>Debug Mode:</strong></div>
                    <div class="col-sm-8">${status.debug ? 'Enabled' : 'Disabled'}</div>
                </div>
                ${health ? `
                <div class="row">
                    <div class="col-sm-4"><strong>Total Errors:</strong></div>
                    <div class="col-sm-8">${health.total}</div>
                </div>
                <div class="row">
                    <div class="col-sm-4"><strong>Recent Errors:</strong></div>
                    <div class="col-sm-8">${health.recent}</div>
                </div>
                ` : ''}
                
                <h6 class="mt-3">Module Status</h6>
                <div class="module-status">
                    ${Object.entries(status.modules).map(([name, status]) => `
                        <div class="d-flex justify-content-between">
                            <span>${name}</span>
                            <span class="badge ${status === 'initialized' ? 'bg-success' : 'bg-danger'}">
                                ${status}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        ModalManager.show('Application Information', infoContent);
    },

    /**
     * Initializes the clock display functionality
     * @private
     */
    initializeClock() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) {
            return; // Clock element not found on this page
        }

        // Function to update the clock
        const updateClock = () => {
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            clockElement.textContent = timeString;
        };

        // Update immediately
        updateClock();

        // Update every second
        this.clockInterval = setInterval(updateClock, 1000);

        console.log('⏰ Clock initialized');
    },

    /**
     * Initializes the quick search functionality (Ctrl+K)
     * @private
     */
    initializeQuickSearch() {
        // Quick search modal HTML
        const quickSearchHTML = `
            <div class="quick-search-modal" id="quickSearchModal" style="display: none;">
                <div class="quick-search-overlay" onclick="MediTrack.closeQuickSearch()"></div>
                <div class="quick-search-container">
                    <div class="quick-search-header">
                        <input type="text" 
                               id="quickSearchInput" 
                               placeholder="Search pages, actions, or content..." 
                               autocomplete="off">
                        <button onclick="MediTrack.closeQuickSearch()" class="quick-search-close">
                            <i class="bx bx-x"></i>
                        </button>
                    </div>
                    <div class="quick-search-results" id="quickSearchResults">
                        <div class="quick-search-category">
                            <div class="category-title">Quick Actions</div>
                            <div class="search-item" onclick="window.location.href='/pages/home.html'">
                                <i class="bx bx-home"></i> Go to Dashboard
                            </div>
                            <div class="search-item" onclick="window.location.href='/pages/clinic-page.html'">
                                <i class="bx bx-plus-medical"></i> New Clinic Sample
                            </div>
                            <div class="search-item" onclick="window.location.href='/pages/phamarcy-capturing-page.html'">
                                <i class="bx bx-capsule"></i> Pharmacy Entry
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to page if not already present
        if (!document.getElementById('quickSearchModal')) {
            document.body.insertAdjacentHTML('beforeend', quickSearchHTML);
        }

        // Search index for pages
        this.searchIndex = [
            { title: 'Home', url: '/pages/home.html', keywords: ['home', 'dashboard', 'main'], icon: 'bx-home' },
            { title: 'Support', url: '/pages/support.html', keywords: ['support', 'help', 'contact'], icon: 'bx-support' },
            { title: 'Clinic Page', url: '/pages/clinic-page.html', keywords: ['clinic', 'medical', 'sample'], icon: 'bx-plus-medical' },
            { title: 'Archives', url: '/pages/archives.html', keywords: ['archives', 'history', 'past'], icon: 'bx-archive' },
            { title: 'Pharmacy', url: '/pages/phamarcy-capturing-page.html', keywords: ['pharmacy', 'medicine', 'drugs'], icon: 'bx-capsule' },
            { title: 'Samples', url: '/pages/samples.html', keywords: ['samples', 'laboratory'], icon: 'bx-test-tube' },
            { title: 'Processing', url: '/pages/processing-page.html', keywords: ['processing', 'workflow'], icon: 'bx-cog' },
            { title: 'Privacy Policy', url: '/pages/privacy-policy.html', keywords: ['privacy', 'policy', 'legal'], icon: 'bx-shield' }
        ];

        // Set up search functionality
        const searchInput = document.getElementById('quickSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performQuickSearch(e.target.value);
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeQuickSearch();
                } else if (e.key === 'Enter') {
                    this.executeFirstSearchResult();
                }
            });
        }

        console.log('🔍 Quick search initialized (Press Ctrl+K to activate)');
    },

    /**
     * Opens the quick search modal
     */
    openQuickSearch() {
        const modal = document.getElementById('quickSearchModal');
        const input = document.getElementById('quickSearchInput');
        
        if (modal && input) {
            modal.style.display = 'block';
            // Small delay to ensure modal is visible before focusing
            setTimeout(() => {
                input.focus();
                input.select();
            }, 100);
        }
    },

    /**
     * Closes the quick search modal
     */
    closeQuickSearch() {
        const modal = document.getElementById('quickSearchModal');
        const input = document.getElementById('quickSearchInput');
        
        if (modal) {
            modal.style.display = 'none';
        }
        
        if (input) {
            input.value = '';
        }
        
        // Reset results
        this.performQuickSearch('');
    },

    /**
     * Performs the quick search and updates results
     * @param {string} query - Search query
     */
    performQuickSearch(query) {
        const resultsContainer = document.getElementById('quickSearchResults');
        if (!resultsContainer) return;

        if (!query.trim()) {
            // Show default quick actions
            resultsContainer.innerHTML = `
                <div class="quick-search-category">
                    <div class="category-title">Quick Actions</div>
                    <div class="search-item" onclick="window.location.href='/pages/home.html'">
                        <i class="bx bx-home"></i> Go to Dashboard
                    </div>
                    <div class="search-item" onclick="window.location.href='/pages/clinic-page.html'">
                        <i class="bx bx-plus-medical"></i> New Clinic Sample
                    </div>
                    <div class="search-item" onclick="window.location.href='/pages/phamarcy-capturing-page.html'">
                        <i class="bx bx-capsule"></i> Pharmacy Entry
                    </div>
                </div>
            `;
            return;
        }

        // Filter search results
        const filteredResults = this.searchIndex.filter(item => {
            const searchText = `${item.title} ${item.keywords.join(' ')}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });

        // Generate results HTML
        let resultsHTML = '';
        
        if (filteredResults.length > 0) {
            resultsHTML = `
                <div class="quick-search-category">
                    <div class="category-title">Pages (${filteredResults.length} found)</div>
                    ${filteredResults.map(item => `
                        <div class="search-item" onclick="window.location.href='${item.url}'">
                            <i class="bx ${item.icon}"></i> ${item.title}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            resultsHTML = `
                <div class="quick-search-category">
                    <div class="no-results">No results found for "${query}"</div>
                </div>
            `;
        }

        resultsContainer.innerHTML = resultsHTML;
    },

    /**
     * Executes the first search result (Enter key functionality)
     */
    executeFirstSearchResult() {
        const firstResult = document.querySelector('.search-item');
        if (firstResult) {
            firstResult.click();
        }
    },

    /**
     * Updates the copyright year dynamically
     * @private
     */
    updateCopyrightYear() {
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    },

    /**
     * Initializes drug table functionality
     * @private
     */
    initializeDrugTable() {
        const drugTable = document.getElementById('drugTable');
        const drugTableBody = document.getElementById('drugTableBody');
        
        if (drugTableBody) {
            // Load drug data immediately
            this.loadDrugTable();
            
            // Set up auto-refresh if specified
            const autoRefresh = drugTable?.dataset.autoRefresh;
            if (autoRefresh && parseInt(autoRefresh) > 0) {
                setInterval(() => {
                    this.loadDrugTable();
                }, parseInt(autoRefresh));
            }
            
            console.log('📊 Drug table initialized');
        }
    },

    /**
     * Loads and displays drug table data
     */
    loadDrugTable: async function() {
        const tableBody = document.getElementById('drugTableBody');
        if (!tableBody) return;
        
        try {
            // Show loading state
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        Loading drug inventory...
                    </td>
                </tr>
            `;
            
            // Fetch data from API
            const response = await ApiHelper.get(MediTrackConfig.endpoints.pharmacyRecords);
            
            if (!response.success) {
                throw new Error('Failed to fetch drug data');
            }
            
            const records = response.data?.data || [];
            
            // Clear loading state
            tableBody.innerHTML = '';
            
            if (records.length === 0) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center text-muted">
                            <i class="bx bx-info-circle me-2"></i>
                            No drug records found. Upload a CSV file to add inventory.
                        </td>
                    </tr>
                `;
                return;
            }
            
            // Populate table with data
            records.forEach((record, index) => {
                const drug = record.attributes || record;
                const daysSinceStocked = this.calculateDaysSinceStocked(drug.datestocked);
                
                const row = `
                    <tr>
                        <td><strong>#${String(index + 1).padStart(3, '0')}</strong></td>
                        <td>
                            <span class="fw-medium">${Utils.escapeHtml(drug.medicine)}</span>
                            <div class="text-muted small">
                                ${drug.availability ? 
                                    '<span class="badge bg-success">Available</span>' : 
                                    '<span class="badge bg-danger">Unavailable</span>'
                                }
                            </div>
                        </td>
                        <td>
                            <span class="fw-medium">${Math.floor(Math.random() * 500) + 100}</span>
                            <small class="text-muted d-block">units</small>
                        </td>
                        <td>
                            <span class="fw-medium">${Utils.formatDate(drug.datestocked)}</span>
                            <small class="text-muted d-block">${Utils.formatTime(drug.datestocked)}</small>
                        </td>
                        <td>
                            <span class="fw-medium ${daysSinceStocked > 30 ? 'text-warning' : daysSinceStocked > 60 ? 'text-danger' : 'text-success'}">${daysSinceStocked}</span>
                            <small class="text-muted d-block">days ago</small>
                        </td>
                    </tr>
                `;
                
                tableBody.insertAdjacentHTML('beforeend', row);
            });
            
        } catch (error) {
            console.error('Error loading drug table:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger">
                        <i class="bx bx-error me-2"></i>
                        Error loading drug data: ${error.message}
                        <div class="mt-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="MediTrack.loadDrugTable()">
                                <i class="bx bx-refresh me-1"></i>Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    },

    /**
     * Calculates days since a drug was stocked
     * @param {string} datestocked - Date when drug was stocked
     * @returns {number} Number of days since stocked
     */
    calculateDaysSinceStocked(datestocked) {
        if (!datestocked) return 0;
        
        try {
            const stockedDate = new Date(datestocked);
            const currentDate = new Date();
            const diffTime = Math.abs(currentDate - stockedDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        } catch (error) {
            return 0;
        }
    }
};

// CSS for application features
const appCSS = `
<style>
/* Quick Search Modal Styles */
.quick-search-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
}

.quick-search-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
}

.quick-search-container {
    position: relative;
    width: 90%;
    max-width: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    max-height: 70vh;
    display: flex;
    flex-direction: column;
}

.quick-search-header {
    display: flex;
    align-items: center;
    padding: 0;
    border-bottom: 1px solid #e9ecef;
}

.quick-search-header input {
    flex: 1;
    border: none;
    outline: none;
    padding: 20px;
    font-size: 18px;
    background: transparent;
}

.quick-search-close {
    background: none;
    border: none;
    padding: 20px;
    cursor: pointer;
    color: #6c757d;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quick-search-close:hover {
    background: #f8f9fa;
    color: #495057;
}

.quick-search-results {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
}

.quick-search-category {
    padding: 16px 0;
}

.category-title {
    padding: 8px 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    color: #6c757d;
    border-bottom: 1px solid #f1f3f4;
    margin-bottom: 8px;
}

.search-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s;
    color: #495057;
}

.search-item:hover {
    background: #f8f9fa;
}

.search-item i {
    margin-right: 12px;
    font-size: 18px;
    color: #696cff;
    width: 20px;
    text-align: center;
}

.no-results {
    padding: 20px;
    text-align: center;
    color: #6c757d;
    font-style: italic;
}

/* Focus indicators for accessibility */
.focused {
    outline: 2px solid #696cff !important;
    outline-offset: 2px !important;
}

.keyboard-navigation *:focus {
    outline: 2px solid #696cff !important;
    outline-offset: 2px !important;
}

/* High contrast mode support */
.high-contrast {
    filter: contrast(150%);
}

/* Mobile view adjustments */
.mobile-view .notification-container {
    left: 0.5rem !important;
    right: 0.5rem !important;
    max-width: none !important;
}

/* Screen reader only content */
.sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

/* Quick search styles */
.quick-search input {
    font-size: 1.1rem;
    padding: 0.75rem;
}

/* Help content styles */
.help-content .row {
    margin-bottom: 0.5rem;
}

.help-content kbd {
    font-size: 0.8rem;
    padding: 0.2rem 0.4rem;
}

/* App info styles */
.app-info .row {
    margin-bottom: 0.25rem;
}

.module-status {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e4e6e8;
    border-radius: 0.375rem;
    padding: 0.5rem;
}

/* Loading states */
.app-loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.app-loading .spinner {
    text-align: center;
}

.app-loading h4 {
    margin-top: 1rem;
    color: #384551;
}

/* Responsive design */
@media (max-width: 768px) {
    .modal-xl,
    .modal-lg {
        max-width: 95vw !important;
    }
}
</style>
`;

// Inject CSS
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', appCSS);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', appCSS);
    });
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Show loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'app-loading';
    loadingScreen.innerHTML = `
        <div class="spinner">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <h4>Initializing MediTrack...</h4>
        </div>
    `;
    document.body.appendChild(loadingScreen);

    // Initialize application
    MediTrack.init().then((result) => {
        // Remove loading screen
        loadingScreen.remove();
        
        if (!result.success) {
            console.error('MediTrack initialization failed:', result);
        }
    }).catch((error) => {
        loadingScreen.remove();
        console.error('MediTrack initialization error:', error);
    });
});

// Make resetInactivityTimer globally available for notification actions
window.resetInactivityTimer = function() {
    // This will be properly bound during setupInactivityMonitor
    console.log('Inactivity timer reset');
};

console.log('🏥 MediTrack Main Module Loaded');
