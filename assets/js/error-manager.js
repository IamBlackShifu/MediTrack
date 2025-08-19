/**
 * MediTrack Error Handling Module
 * Comprehensive error handling, logging, and recovery system
 * 
 * @author MediTrack Development Team
 * @version 1.0.0
 * @since 2025-08-19
 */

/**
 * Error Manager
 * Provides comprehensive error handling, logging, and recovery
 */
window.ErrorManager = {
    /**
     * Configuration for error handling
     */
    config: {
        // Error logging settings
        logging: {
            enabled: true,
            logToConsole: true,
            logToServer: true,
            logLevel: 'error', // 'debug', 'info', 'warn', 'error', 'fatal'
            maxLogEntries: 100,
            serverEndpoint: '/api/logs/client-errors'
        },
        
        // Error display settings
        display: {
            showToUser: true,
            userFriendlyMessages: true,
            showTechnicalDetails: false, // Set to true in development
            showStackTrace: false
        },
        
        // Retry settings
        retry: {
            enabled: true,
            maxAttempts: 3,
            backoffMultiplier: 1.5,
            initialDelay: 1000
        },
        
        // Recovery settings
        recovery: {
            autoRecover: true,
            fallbackUrls: {
                '/api/': '/api/v1/',
                '/auth/': '/api/auth/'
            },
            gracefulDegradation: true
        }
    },

    /**
     * Error categories and their configurations
     */
    errorCategories: {
        NETWORK: {
            name: 'Network Error',
            userMessage: 'Connection problem. Please check your internet connection.',
            recoverable: true,
            retryable: true,
            severity: 'high'
        },
        API: {
            name: 'API Error',
            userMessage: 'Server communication error. Please try again.',
            recoverable: true,
            retryable: true,
            severity: 'high'
        },
        VALIDATION: {
            name: 'Validation Error',
            userMessage: 'Please check your input and try again.',
            recoverable: true,
            retryable: false,
            severity: 'medium'
        },
        AUTH: {
            name: 'Authentication Error',
            userMessage: 'Your session has expired. Please log in again.',
            recoverable: true,
            retryable: false,
            severity: 'high'
        },
        PERMISSION: {
            name: 'Permission Error',
            userMessage: 'You do not have permission to perform this action.',
            recoverable: false,
            retryable: false,
            severity: 'medium'
        },
        DATA: {
            name: 'Data Error',
            userMessage: 'There was a problem with the data. Please try again.',
            recoverable: true,
            retryable: true,
            severity: 'medium'
        },
        UI: {
            name: 'Interface Error',
            userMessage: 'There was a problem with the interface. Please refresh the page.',
            recoverable: true,
            retryable: false,
            severity: 'low'
        },
        SYSTEM: {
            name: 'System Error',
            userMessage: 'A system error occurred. Please contact support if this continues.',
            recoverable: false,
            retryable: false,
            severity: 'critical'
        },
        UNKNOWN: {
            name: 'Unknown Error',
            userMessage: 'An unexpected error occurred. Please try again.',
            recoverable: true,
            retryable: true,
            severity: 'medium'
        }
    },

    /**
     * Error log storage
     */
    errorLog: [],
    retryAttempts: new Map(),

    /**
     * Initializes the error manager
     */
    init: function() {
        this.setupGlobalErrorHandlers();
        this.setupUnhandledRejectionHandler();
        this.setupNetworkErrorHandler();
        this.loadPreviousErrors();
        
        console.log('ErrorManager: Initialized successfully');
    },

    /**
     * Handles an error with comprehensive processing
     * @param {Error|Object} error - Error to handle
     * @param {Object} context - Error context information
     * @param {Object} options - Handling options
     * @returns {Promise<Object>} Error handling result
     */
    handleError: async function(error, context = {}, options = {}) {
        try {
            // Create standardized error object
            const errorObj = this.standardizeError(error, context);
            
            // Log the error
            await this.logError(errorObj);
            
            // Determine error category
            const category = this.categorizeError(errorObj);
            const categoryConfig = this.errorCategories[category];
            
            // Check if error is retryable and attempt retry
            if (options.enableRetry !== false && categoryConfig.retryable && this.config.retry.enabled) {
                const retryResult = await this.attemptRetry(errorObj, context, options);
                if (retryResult.success) {
                    return retryResult;
                }
            }
            
            // Attempt recovery if configured
            if (this.config.recovery.autoRecover && categoryConfig.recoverable) {
                const recoveryResult = await this.attemptRecovery(errorObj, context);
                if (recoveryResult.success) {
                    return recoveryResult;
                }
            }
            
            // Display error to user
            if (this.config.display.showToUser && options.suppressUserNotification !== true) {
                this.displayErrorToUser(errorObj, categoryConfig);
            }
            
            // Handle critical errors
            if (categoryConfig.severity === 'critical') {
                this.handleCriticalError(errorObj, context);
            }
            
            return {
                success: false,
                error: errorObj,
                category: category,
                recovered: false,
                retried: false
            };
            
        } catch (handlingError) {
            console.error('ErrorManager: Error occurred while handling error:', handlingError);
            this.handleEmergencyError(handlingError, error);
            
            return {
                success: false,
                error: error,
                category: 'SYSTEM',
                recovered: false,
                retried: false,
                handlingFailed: true
            };
        }
    },

    /**
     * Creates a standardized error object
     * @param {Error|Object} error - Original error
     * @param {Object} context - Error context
     * @returns {Object} Standardized error object
     * @private
     */
    standardizeError: function(error, context) {
        const standardError = {
            id: this.generateErrorId(),
            timestamp: new Date().toISOString(),
            message: '',
            stack: '',
            code: null,
            type: 'Error',
            category: 'UNKNOWN',
            severity: 'medium',
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                ...context
            },
            metadata: {}
        };

        // Handle different error types
        if (error instanceof Error) {
            standardError.message = error.message;
            standardError.stack = error.stack;
            standardError.type = error.constructor.name;
            standardError.code = error.code;
        } else if (typeof error === 'object' && error !== null) {
            standardError.message = error.message || error.error || error.description || 'Unknown error';
            standardError.code = error.code || error.status || error.statusCode;
            standardError.stack = error.stack;
            standardError.type = error.type || error.name || 'CustomError';
            standardError.metadata = { ...error };
        } else if (typeof error === 'string') {
            standardError.message = error;
            standardError.type = 'StringError';
        } else {
            standardError.message = 'Unknown error occurred';
            standardError.metadata.originalError = error;
        }

        // Add additional context
        if (typeof AuthManager !== 'undefined' && AuthManager.currentUser) {
            standardError.context.userId = AuthManager.currentUser.id;
            standardError.context.userRole = AuthManager.currentUser.role;
        }

        return standardError;
    },

    /**
     * Categorizes an error based on its characteristics
     * @param {Object} errorObj - Standardized error object
     * @returns {string} Error category
     * @private
     */
    categorizeError: function(errorObj) {
        const message = errorObj.message.toLowerCase();
        const code = errorObj.code;
        const type = errorObj.type;

        // Network errors
        if (
            type === 'NetworkError' ||
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('timeout') ||
            code === 'NETWORK_ERROR'
        ) {
            return 'NETWORK';
        }

        // API errors
        if (
            code >= 400 && code < 600 ||
            message.includes('api') ||
            message.includes('server') ||
            type === 'HTTPError'
        ) {
            // Specific API error subcategories
            if (code === 401 || code === 403 || message.includes('unauthorized') || message.includes('forbidden')) {
                return 'AUTH';
            }
            if (code === 403 || message.includes('permission') || message.includes('access denied')) {
                return 'PERMISSION';
            }
            return 'API';
        }

        // Validation errors
        if (
            code === 400 ||
            message.includes('validation') ||
            message.includes('invalid') ||
            message.includes('required') ||
            type === 'ValidationError'
        ) {
            return 'VALIDATION';
        }

        // Data errors
        if (
            message.includes('data') ||
            message.includes('parse') ||
            message.includes('json') ||
            type === 'SyntaxError' ||
            type === 'DataError'
        ) {
            return 'DATA';
        }

        // UI errors
        if (
            message.includes('element') ||
            message.includes('dom') ||
            message.includes('render') ||
            type === 'DOMException'
        ) {
            return 'UI';
        }

        // Authentication errors
        if (
            message.includes('auth') ||
            message.includes('login') ||
            message.includes('token') ||
            message.includes('session')
        ) {
            return 'AUTH';
        }

        return 'UNKNOWN';
    },

    /**
     * Logs an error to various destinations
     * @param {Object} errorObj - Error to log
     * @returns {Promise<void>}
     * @private
     */
    logError: async function(errorObj) {
        // Add to internal log
        this.errorLog.unshift(errorObj);
        
        // Maintain log size limit
        if (this.errorLog.length > this.config.logging.maxLogEntries) {
            this.errorLog = this.errorLog.slice(0, this.config.logging.maxLogEntries);
        }
        
        // Store in local storage for persistence
        try {
            Utils.Storage.set('meditrack_error_log', this.errorLog);
        } catch (storageError) {
            console.warn('ErrorManager: Failed to store error log:', storageError);
        }

        // Console logging
        if (this.config.logging.logToConsole) {
            const consoleMethod = this.getConsoleMethod(errorObj.category);
            consoleMethod(`[${errorObj.category}] ${errorObj.message}`, errorObj);
        }

        // Server logging
        if (this.config.logging.logToServer) {
            try {
                await this.sendErrorToServer(errorObj);
            } catch (serverError) {
                console.warn('ErrorManager: Failed to send error to server:', serverError);
            }
        }
    },

    /**
     * Sends error to server for centralized logging
     * @param {Object} errorObj - Error to send
     * @returns {Promise<void>}
     * @private
     */
    sendErrorToServer: async function(errorObj) {
        try {
            // Prepare error data for server
            const logData = {
                ...errorObj,
                // Remove sensitive information
                context: {
                    ...errorObj.context,
                    userAgent: navigator.userAgent,
                    url: window.location.href
                }
            };

            // Remove stack trace if not in development
            if (!this.config.display.showStackTrace) {
                delete logData.stack;
            }

            await fetch(this.config.logging.serverEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TokenManager.getToken()}`
                },
                body: JSON.stringify(logData)
            });
        } catch (error) {
            // Fail silently to avoid infinite error loops
            console.debug('ErrorManager: Server logging failed:', error);
        }
    },

    /**
     * Attempts to retry a failed operation
     * @param {Object} errorObj - Error object
     * @param {Object} context - Error context
     * @param {Object} options - Retry options
     * @returns {Promise<Object>} Retry result
     * @private
     */
    attemptRetry: async function(errorObj, context, options) {
        const retryKey = context.operationId || errorObj.id;
        const currentAttempts = this.retryAttempts.get(retryKey) || 0;
        
        if (currentAttempts >= this.config.retry.maxAttempts) {
            return { success: false, reason: 'Max retry attempts exceeded' };
        }

        // Calculate delay with exponential backoff
        const delay = this.config.retry.initialDelay * Math.pow(this.config.retry.backoffMultiplier, currentAttempts);
        
        try {
            // Show retry notification
            const retryNotification = NotificationManager.info(
                `Retrying operation... (Attempt ${currentAttempts + 1}/${this.config.retry.maxAttempts})`,
                { duration: delay + 1000 }
            );

            // Wait for delay
            await this.sleep(delay);
            
            // Update retry count
            this.retryAttempts.set(retryKey, currentAttempts + 1);
            
            // Attempt to retry the operation
            if (context.retryFunction && typeof context.retryFunction === 'function') {
                const result = await context.retryFunction();
                
                // Success - clear retry count
                this.retryAttempts.delete(retryKey);
                NotificationManager.success('Operation completed successfully after retry');
                
                return {
                    success: true,
                    result: result,
                    attempts: currentAttempts + 1
                };
            } else {
                return { success: false, reason: 'No retry function provided' };
            }
            
        } catch (retryError) {
            // Retry failed
            const retryErrorObj = this.standardizeError(retryError, context);
            
            if (currentAttempts + 1 >= this.config.retry.maxAttempts) {
                this.retryAttempts.delete(retryKey);
                NotificationManager.error('Operation failed after maximum retry attempts');
            }
            
            return {
                success: false,
                error: retryErrorObj,
                attempts: currentAttempts + 1
            };
        }
    },

    /**
     * Attempts to recover from an error
     * @param {Object} errorObj - Error object
     * @param {Object} context - Error context
     * @returns {Promise<Object>} Recovery result
     * @private
     */
    attemptRecovery: async function(errorObj, context) {
        try {
            // Try fallback URLs for API errors
            if (errorObj.category === 'API' && context.originalUrl) {
                const fallbackUrl = this.getFallbackUrl(context.originalUrl);
                if (fallbackUrl && fallbackUrl !== context.originalUrl) {
                    NotificationManager.info('Attempting to use alternative server endpoint...');
                    
                    if (context.recoveryFunction) {
                        const result = await context.recoveryFunction(fallbackUrl);
                        NotificationManager.success('Successfully connected using alternative endpoint');
                        return { success: true, result: result };
                    }
                }
            }

            // Clear caches for data errors
            if (errorObj.category === 'DATA') {
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                    NotificationManager.info('Cache cleared, please refresh the page');
                }
            }

            // Refresh authentication for auth errors
            if (errorObj.category === 'AUTH') {
                if (typeof AuthManager !== 'undefined') {
                    const refreshResult = await AuthManager.refreshSession();
                    if (refreshResult) {
                        return { success: true, result: 'Session refreshed' };
                    }
                }
            }

            return { success: false, reason: 'No recovery method available' };
            
        } catch (recoveryError) {
            console.warn('ErrorManager: Recovery attempt failed:', recoveryError);
            return { success: false, error: recoveryError };
        }
    },

    /**
     * Displays error to user with appropriate UI
     * @param {Object} errorObj - Error object
     * @param {Object} categoryConfig - Category configuration
     * @private
     */
    displayErrorToUser: function(errorObj, categoryConfig) {
        const userMessage = this.config.display.userFriendlyMessages 
            ? categoryConfig.userMessage 
            : errorObj.message;

        const notificationType = this.getNotificationType(categoryConfig.severity);
        
        const notificationOptions = {
            persistent: categoryConfig.severity === 'critical',
            actions: []
        };

        // Add retry action if retryable
        if (categoryConfig.retryable && errorObj.context.retryFunction) {
            notificationOptions.actions.push({
                text: 'Retry',
                action: `ErrorManager.retryFromNotification('${errorObj.id}')`,
                style: 'btn-primary'
            });
        }

        // Add technical details toggle in development
        if (this.config.display.showTechnicalDetails) {
            notificationOptions.actions.push({
                text: 'Details',
                action: `ErrorManager.showErrorDetails('${errorObj.id}')`,
                style: 'btn-secondary'
            });
        }

        // Add report action for critical errors
        if (categoryConfig.severity === 'critical') {
            notificationOptions.actions.push({
                text: 'Report',
                action: `ErrorManager.reportError('${errorObj.id}')`,
                style: 'btn-danger'
            });
        }

        NotificationManager[notificationType](userMessage, notificationOptions);
    },

    /**
     * Handles critical errors that require immediate attention
     * @param {Object} errorObj - Error object
     * @param {Object} context - Error context
     * @private
     */
    handleCriticalError: function(errorObj, context) {
        // Log critical error immediately
        console.error('CRITICAL ERROR:', errorObj);
        
        // Attempt to send critical error report immediately
        this.sendCriticalErrorReport(errorObj, context);
        
        // Show critical error modal
        this.showCriticalErrorModal(errorObj);
        
        // Set up recovery options
        this.setupCriticalErrorRecovery(errorObj);
    },

    /**
     * Shows critical error modal with recovery options
     * @param {Object} errorObj - Error object
     * @private
     */
    showCriticalErrorModal: function(errorObj) {
        const modalContent = `
            <div class="critical-error-modal">
                <div class="text-center mb-4">
                    <i class="bx bx-error-circle text-danger" style="font-size: 4rem;"></i>
                    <h4 class="mt-3 text-danger">Critical System Error</h4>
                </div>
                
                <div class="alert alert-danger">
                    <strong>Error ID:</strong> ${errorObj.id}<br>
                    <strong>Time:</strong> ${new Date(errorObj.timestamp).toLocaleString()}<br>
                    <strong>Description:</strong> ${errorObj.message}
                </div>
                
                <div class="recovery-options">
                    <h5>Recovery Options:</h5>
                    <div class="d-grid gap-2">
                        <button class="btn btn-primary" onclick="location.reload()">
                            <i class="bx bx-refresh me-2"></i>Refresh Page
                        </button>
                        <button class="btn btn-secondary" onclick="ErrorManager.clearLocalData()">
                            <i class="bx bx-trash me-2"></i>Clear Local Data
                        </button>
                        <button class="btn btn-info" onclick="ErrorManager.exportErrorLog()">
                            <i class="bx bx-download me-2"></i>Export Error Log
                        </button>
                        <button class="btn btn-warning" onclick="window.location.href='/pages/support.html'">
                            <i class="bx bx-support me-2"></i>Contact Support
                        </button>
                    </div>
                </div>
                
                <div class="mt-3">
                    <small class="text-muted">
                        This error has been automatically reported to our support team. 
                        If the problem persists, please contact technical support with the Error ID above.
                    </small>
                </div>
            </div>
        `;

        ModalManager.show('Critical Error', modalContent, {
            size: 'modal-lg',
            closeable: false,
            backdrop: 'static'
        });
    },

    /**
     * Sets up global error handlers
     * @private
     */
    setupGlobalErrorHandlers: function() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError(event.error || event, {
                type: 'global_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                source: 'window.error'
            });
        });

        // Global unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandled_promise_rejection',
                source: 'window.unhandledrejection'
            });
        });
    },

    /**
     * Sets up unhandled rejection handler
     * @private
     */
    setupUnhandledRejectionHandler: function() {
        window.addEventListener('unhandledrejection', (event) => {
            // Prevent the default browser console error
            event.preventDefault();
            
            this.handleError(event.reason, {
                type: 'unhandled_promise_rejection',
                promise: event.promise,
                source: 'unhandledrejection'
            });
        });
    },

    /**
     * Sets up network error handler
     * @private
     */
    setupNetworkErrorHandler: function() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            NotificationManager.success('Connection restored');
            this.handleNetworkRecovery();
        });

        window.addEventListener('offline', () => {
            NotificationManager.warning('Connection lost. Working in offline mode.');
        });
    },

    /**
     * Handles network recovery
     * @private
     */
    handleNetworkRecovery: function() {
        // Retry any pending network operations
        const pendingNetworkOperations = this.errorLog.filter(error => 
            error.category === 'NETWORK' && 
            error.context.retryFunction &&
            Date.now() - new Date(error.timestamp).getTime() < 300000 // 5 minutes
        );

        pendingNetworkOperations.forEach(async (error) => {
            try {
                await error.context.retryFunction();
                NotificationManager.success('Pending operation completed successfully');
            } catch (retryError) {
                console.warn('Network recovery retry failed:', retryError);
            }
        });
    },

    /**
     * Loads previous errors from storage
     * @private
     */
    loadPreviousErrors: function() {
        try {
            const storedErrors = Utils.Storage.get('meditrack_error_log', []);
            if (Array.isArray(storedErrors)) {
                this.errorLog = storedErrors;
            }
        } catch (error) {
            console.warn('ErrorManager: Failed to load previous errors:', error);
        }
    },

    /**
     * Handles emergency errors when error handling itself fails
     * @private
     */
    handleEmergencyError: function(handlingError, originalError) {
        console.error('EMERGENCY: Error handling failed!', {
            handlingError: handlingError,
            originalError: originalError
        });

        // Fallback to basic alert if all else fails
        try {
            alert('A critical system error occurred. Please refresh the page and contact support if the problem persists.');
        } catch (alertError) {
            // Last resort - write to console
            console.error('CATASTROPHIC: All error handling mechanisms failed!');
        }
    },

    /**
     * Utility methods
     */
    
    generateErrorId: function() {
        return 'ERR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    getConsoleMethod: function(category) {
        const severityMap = {
            'SYSTEM': console.error,
            'NETWORK': console.warn,
            'API': console.warn,
            'AUTH': console.warn,
            'VALIDATION': console.info,
            'UI': console.info,
            'DATA': console.warn,
            'PERMISSION': console.warn,
            'UNKNOWN': console.log
        };

        return severityMap[category] || console.log;
    },

    getNotificationType: function(severity) {
        const typeMap = {
            'critical': 'error',
            'high': 'error',
            'medium': 'warning',
            'low': 'info'
        };

        return typeMap[severity] || 'info';
    },

    getFallbackUrl: function(originalUrl) {
        for (const [pattern, replacement] of Object.entries(this.config.recovery.fallbackUrls)) {
            if (originalUrl.includes(pattern)) {
                return originalUrl.replace(pattern, replacement);
            }
        }
        return null;
    },

    /**
     * Public API methods
     */

    /**
     * Retry operation from notification
     * @param {string} errorId - Error ID to retry
     */
    retryFromNotification: function(errorId) {
        const error = this.errorLog.find(e => e.id === errorId);
        if (error && error.context.retryFunction) {
            this.attemptRetry(error, error.context, {});
        }
    },

    /**
     * Show error details modal
     * @param {string} errorId - Error ID to show details for
     */
    showErrorDetails: function(errorId) {
        const error = this.errorLog.find(e => e.id === errorId);
        if (!error) return;

        const detailsContent = `
            <div class="error-details">
                <div class="row">
                    <div class="col-sm-3"><strong>Error ID:</strong></div>
                    <div class="col-sm-9"><code>${error.id}</code></div>
                </div>
                <div class="row">
                    <div class="col-sm-3"><strong>Category:</strong></div>
                    <div class="col-sm-9">${error.category}</div>
                </div>
                <div class="row">
                    <div class="col-sm-3"><strong>Type:</strong></div>
                    <div class="col-sm-9">${error.type}</div>
                </div>
                <div class="row">
                    <div class="col-sm-3"><strong>Time:</strong></div>
                    <div class="col-sm-9">${new Date(error.timestamp).toLocaleString()}</div>
                </div>
                <div class="row">
                    <div class="col-sm-3"><strong>Message:</strong></div>
                    <div class="col-sm-9">${error.message}</div>
                </div>
                ${error.code ? `
                <div class="row">
                    <div class="col-sm-3"><strong>Code:</strong></div>
                    <div class="col-sm-9">${error.code}</div>
                </div>
                ` : ''}
                <div class="row">
                    <div class="col-sm-3"><strong>URL:</strong></div>
                    <div class="col-sm-9"><small>${error.context.url}</small></div>
                </div>
                ${error.stack && this.config.display.showStackTrace ? `
                <div class="row mt-3">
                    <div class="col-12">
                        <strong>Stack Trace:</strong>
                        <pre class="mt-2 p-2 bg-light"><code>${error.stack}</code></pre>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        ModalManager.show('Error Details', detailsContent, {
            size: 'modal-xl'
        });
    },

    /**
     * Report error to support
     * @param {string} errorId - Error ID to report
     */
    reportError: function(errorId) {
        const error = this.errorLog.find(e => e.id === errorId);
        if (!error) return;

        // Prepare error report
        const report = {
            errorId: error.id,
            timestamp: error.timestamp,
            category: error.category,
            message: error.message,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        // Redirect to support page with error details
        const params = new URLSearchParams(report);
        window.location.href = `/pages/support.html?error_report=1&${params.toString()}`;
    },

    /**
     * Clear local data for recovery
     */
    clearLocalData: function() {
        try {
            localStorage.clear();
            sessionStorage.clear();
            
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => caches.delete(name));
                });
            }
            
            NotificationManager.success('Local data cleared successfully');
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            NotificationManager.error('Failed to clear local data');
        }
    },

    /**
     * Export error log for support
     */
    exportErrorLog: function() {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                errors: this.errorLog
            };

            const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `meditrack-error-log-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            NotificationManager.success('Error log exported successfully');
        } catch (error) {
            NotificationManager.error('Failed to export error log');
        }
    },

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats: function() {
        const stats = {
            total: this.errorLog.length,
            categories: {},
            recent: 0,
            severity: { critical: 0, high: 0, medium: 0, low: 0 }
        };

        const oneHourAgo = Date.now() - (60 * 60 * 1000);

        this.errorLog.forEach(error => {
            // Count by category
            stats.categories[error.category] = (stats.categories[error.category] || 0) + 1;
            
            // Count recent errors
            if (new Date(error.timestamp).getTime() > oneHourAgo) {
                stats.recent++;
            }
            
            // Count by severity
            const categoryConfig = this.errorCategories[error.category];
            if (categoryConfig) {
                stats.severity[categoryConfig.severity]++;
            }
        });

        return stats;
    },

    /**
     * Cleanup error log
     */
    cleanup: function() {
        // Clear old errors (older than 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        this.errorLog = this.errorLog.filter(error => 
            new Date(error.timestamp).getTime() > oneDayAgo
        );
        
        // Clear retry attempts
        this.retryAttempts.clear();
        
        // Update storage
        Utils.Storage.set('meditrack_error_log', this.errorLog);
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ErrorManager.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    ErrorManager.cleanup();
});
