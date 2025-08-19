/**
 * MediTrack Loading States and User Feedback System
 * Provides modern loading indicators, progress bars, and toast notifications
 * 
 * @author MediTrack Development Team
 * @version 1.0.0
 * @since 2025-08-19
 */

/**
 * Loading States Manager
 * Handles loading spinners, progress bars, and loading overlays
 */
window.LoadingManager = {
    /**
     * Configuration options for loading states
     */
    config: {
        spinnerClass: 'meditrack-spinner',
        overlayClass: 'meditrack-overlay',
        progressBarClass: 'meditrack-progress',
        defaultTimeout: 30000, // 30 seconds
        animations: {
            fadeIn: 'fadeIn 0.3s ease-in',
            fadeOut: 'fadeOut 0.3s ease-out',
            spin: 'spin 1s linear infinite'
        }
    },

    /**
     * Shows a loading spinner on a specific element or globally
     * @param {string|HTMLElement} target - Element selector or element to show spinner on
     * @param {Object} options - Configuration options
     * @param {string} options.message - Loading message to display
     * @param {boolean} options.overlay - Whether to show overlay
     * @param {string} options.size - Size of spinner (small, medium, large)
     * @returns {string} Loading instance ID for later removal
     */
    showSpinner: function(target = 'body', options = {}) {
        const config = {
            message: 'Loading...',
            overlay: true,
            size: 'medium',
            ...options
        };

        const loadingId = this.generateId();
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!targetElement) {
            console.error('LoadingManager: Target element not found');
            return loadingId;
        }

        // Create loading container
        const loadingContainer = this.createLoadingContainer(loadingId, config);
        
        // Add to target element
        if (target === 'body' || target === document.body) {
            document.body.appendChild(loadingContainer);
        } else {
            targetElement.style.position = 'relative';
            targetElement.appendChild(loadingContainer);
        }

        // Store reference for cleanup
        this.activeLoaders = this.activeLoaders || new Map();
        this.activeLoaders.set(loadingId, {
            element: loadingContainer,
            target: targetElement,
            timeout: setTimeout(() => this.hideSpinner(loadingId), config.timeout || this.config.defaultTimeout)
        });

        return loadingId;
    },

    /**
     * Hides a loading spinner by ID
     * @param {string} loadingId - ID of the loading instance to hide
     */
    hideSpinner: function(loadingId) {
        if (!this.activeLoaders || !this.activeLoaders.has(loadingId)) {
            return;
        }

        const loader = this.activeLoaders.get(loadingId);
        
        // Clear timeout
        if (loader.timeout) {
            clearTimeout(loader.timeout);
        }

        // Animate out and remove
        loader.element.style.animation = this.config.animations.fadeOut;
        setTimeout(() => {
            if (loader.element.parentNode) {
                loader.element.parentNode.removeChild(loader.element);
            }
            this.activeLoaders.delete(loadingId);
        }, 300);
    },

    /**
     * Shows a progress bar for file uploads or long operations
     * @param {string|HTMLElement} target - Target element
     * @param {Object} options - Configuration options
     * @returns {Object} Progress controller object
     */
    showProgress: function(target, options = {}) {
        const config = {
            message: 'Processing...',
            progress: 0,
            showPercentage: true,
            ...options
        };

        const progressId = this.generateId();
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        
        if (!targetElement) {
            console.error('LoadingManager: Target element not found for progress bar');
            return null;
        }

        const progressContainer = this.createProgressContainer(progressId, config);
        targetElement.appendChild(progressContainer);

        const controller = {
            id: progressId,
            element: progressContainer,
            
            /**
             * Updates the progress value
             * @param {number} value - Progress value (0-100)
             * @param {string} message - Optional message to update
             */
            updateProgress: (value, message) => {
                const progressBar = progressContainer.querySelector('.progress-bar');
                const progressText = progressContainer.querySelector('.progress-text');
                const progressPercentage = progressContainer.querySelector('.progress-percentage');
                
                value = Math.max(0, Math.min(100, value));
                
                if (progressBar) {
                    progressBar.style.width = `${value}%`;
                    progressBar.setAttribute('aria-valuenow', value);
                }
                
                if (message && progressText) {
                    progressText.textContent = message;
                }
                
                if (progressPercentage) {
                    progressPercentage.textContent = `${Math.round(value)}%`;
                }
            },
            
            /**
             * Completes the progress and hides the bar
             * @param {string} successMessage - Success message to show
             */
            complete: (successMessage = 'Completed!') => {
                this.updateProgress(100, successMessage);
                setTimeout(() => {
                    this.hideProgress(progressId);
                }, 1000);
            },
            
            /**
             * Hides the progress bar
             */
            hide: () => {
                this.hideProgress(progressId);
            }
        };

        // Store reference
        this.activeLoaders = this.activeLoaders || new Map();
        this.activeLoaders.set(progressId, {
            element: progressContainer,
            target: targetElement,
            controller: controller
        });

        return controller;
    },

    /**
     * Hides a progress bar by ID
     * @param {string} progressId - ID of the progress instance
     */
    hideProgress: function(progressId) {
        if (!this.activeLoaders || !this.activeLoaders.has(progressId)) {
            return;
        }

        const loader = this.activeLoaders.get(progressId);
        loader.element.style.animation = this.config.animations.fadeOut;
        
        setTimeout(() => {
            if (loader.element.parentNode) {
                loader.element.parentNode.removeChild(loader.element);
            }
            this.activeLoaders.delete(progressId);
        }, 300);
    },

    /**
     * Creates a loading container element
     * @private
     */
    createLoadingContainer: function(id, config) {
        const container = document.createElement('div');
        container.id = `loading-${id}`;
        container.className = `${this.config.overlayClass} ${config.overlay ? 'with-overlay' : ''}`;
        
        const sizeClass = `spinner-${config.size}`;
        
        container.innerHTML = `
            <div class="loading-content">
                <div class="${this.config.spinnerClass} ${sizeClass}">
                    <div class="spinner-border" role="status" aria-hidden="true"></div>
                </div>
                ${config.message ? `<div class="loading-message">${config.message}</div>` : ''}
            </div>
        `;

        return container;
    },

    /**
     * Creates a progress container element
     * @private
     */
    createProgressContainer: function(id, config) {
        const container = document.createElement('div');
        container.id = `progress-${id}`;
        container.className = 'progress-container';
        
        container.innerHTML = `
            <div class="progress-content">
                ${config.message ? `<div class="progress-text">${config.message}</div>` : ''}
                <div class="progress" role="progressbar" aria-valuenow="${config.progress}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: ${config.progress}%"></div>
                </div>
                ${config.showPercentage ? `<div class="progress-percentage">${config.progress}%</div>` : ''}
            </div>
        `;

        return container;
    },

    /**
     * Generates a unique ID for loading instances
     * @private
     */
    generateId: function() {
        return 'load_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Cleans up all active loaders
     */
    cleanup: function() {
        if (this.activeLoaders) {
            this.activeLoaders.forEach((loader, id) => {
                if (loader.timeout) clearTimeout(loader.timeout);
                if (loader.element.parentNode) {
                    loader.element.parentNode.removeChild(loader.element);
                }
            });
            this.activeLoaders.clear();
        }
    }
};

/**
 * Toast Notification System
 * Modern replacement for alert() dialogs
 */
window.NotificationManager = {
    /**
     * Configuration for notifications
     */
    config: {
        container: null,
        defaultDuration: 5000,
        maxNotifications: 5,
        position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
        animations: {
            slideIn: 'slideInRight 0.3s ease-out',
            slideOut: 'slideOutRight 0.3s ease-in'
        }
    },

    /**
     * Shows a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    show: function(message, type = 'info', options = {}) {
        const config = {
            duration: this.config.defaultDuration,
            persistent: false,
            actions: [], // Array of {text, action, style} objects
            ...options
        };

        // Ensure container exists
        this.ensureContainer();

        const notificationId = this.generateId();
        const notification = this.createNotification(notificationId, message, type, config);
        
        // Add to container
        this.config.container.appendChild(notification);

        // Auto-remove if not persistent
        if (!config.persistent && config.duration > 0) {
            setTimeout(() => {
                this.hide(notificationId);
            }, config.duration);
        }

        // Limit number of notifications
        this.limitNotifications();

        return notificationId;
    },

    /**
     * Shows a success notification
     * @param {string} message - Success message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    success: function(message, options = {}) {
        return this.show(message, 'success', options);
    },

    /**
     * Shows an error notification
     * @param {string} message - Error message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    error: function(message, options = {}) {
        return this.show(message, 'error', { ...options, duration: 0, persistent: true });
    },

    /**
     * Shows a warning notification
     * @param {string} message - Warning message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    warning: function(message, options = {}) {
        return this.show(message, 'warning', options);
    },

    /**
     * Shows an info notification
     * @param {string} message - Info message
     * @param {Object} options - Additional options
     * @returns {string} Notification ID
     */
    info: function(message, options = {}) {
        return this.show(message, 'info', options);
    },

    /**
     * Hides a notification by ID
     * @param {string} notificationId - ID of notification to hide
     */
    hide: function(notificationId) {
        const notification = document.getElementById(`toast-${notificationId}`);
        if (notification) {
            notification.style.animation = this.config.animations.slideOut;
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    },

    /**
     * Clears all notifications
     */
    clearAll: function() {
        if (this.config.container) {
            this.config.container.innerHTML = '';
        }
    },

    /**
     * Creates the notification container if it doesn't exist
     * @private
     */
    ensureContainer: function() {
        if (!this.config.container) {
            this.config.container = document.createElement('div');
            this.config.container.id = 'notification-container';
            this.config.container.className = `notification-container position-${this.config.position}`;
            document.body.appendChild(this.config.container);
        }
    },

    /**
     * Creates a notification element
     * @private
     */
    createNotification: function(id, message, type, config) {
        const notification = document.createElement('div');
        notification.id = `toast-${id}`;
        notification.className = `toast-notification toast-${type}`;
        notification.style.animation = this.config.animations.slideIn;

        const iconMap = {
            success: 'bx-check-circle',
            error: 'bx-x-circle',
            warning: 'bx-error',
            info: 'bx-info-circle'
        };

        const actionsHtml = config.actions.length > 0 ? 
            `<div class="toast-actions">
                ${config.actions.map(action => 
                    `<button class="btn btn-sm ${action.style || 'btn-outline-primary'}" onclick="${action.action}">${action.text}</button>`
                ).join('')}
            </div>` : '';

        notification.innerHTML = `
            <div class="toast-content">
                <div class="toast-header">
                    <i class="bx ${iconMap[type]} toast-icon"></i>
                    <span class="toast-message">${message}</span>
                    ${!config.persistent ? '<button type="button" class="toast-close" onclick="NotificationManager.hide(\'' + id + '\')">&times;</button>' : ''}
                </div>
                ${actionsHtml}
            </div>
        `;

        return notification;
    },

    /**
     * Limits the number of visible notifications
     * @private
     */
    limitNotifications: function() {
        if (this.config.container) {
            const notifications = this.config.container.children;
            while (notifications.length > this.config.maxNotifications) {
                notifications[0].remove();
            }
        }
    },

    /**
     * Generates a unique ID for notifications
     * @private
     */
    generateId: function() {
        return 'notify_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};

/**
 * Modal Dialog System
 * For confirmation dialogs and complex interactions
 */
window.ModalManager = {
    /**
     * Shows a confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Configuration options
     * @returns {Promise} Promise that resolves to true/false
     */
    confirm: function(title, message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                confirmText: 'Confirm',
                cancelText: 'Cancel',
                confirmStyle: 'btn-primary',
                cancelStyle: 'btn-secondary',
                ...options
            };

            const modalId = this.generateId();
            const modal = this.createConfirmModal(modalId, title, message, config);
            
            document.body.appendChild(modal);

            // Show modal
            const modalInstance = new bootstrap.Modal(modal);
            modalInstance.show();

            // Handle button clicks
            modal.querySelector('.confirm-btn').addEventListener('click', () => {
                modalInstance.hide();
                resolve(true);
            });

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                modalInstance.hide();
                resolve(false);
            });

            // Clean up after hiding
            modal.addEventListener('hidden.bs.modal', () => {
                modal.remove();
            });
        });
    },

    /**
     * Shows a custom modal dialog
     * @param {string} title - Modal title
     * @param {string} content - Modal content HTML
     * @param {Object} options - Configuration options
     * @returns {Object} Modal controller
     */
    show: function(title, content, options = {}) {
        const config = {
            size: 'modal-lg', // modal-sm, modal-lg, modal-xl
            closeable: true,
            backdrop: true,
            ...options
        };

        const modalId = this.generateId();
        const modal = this.createModal(modalId, title, content, config);
        
        document.body.appendChild(modal);

        const modalInstance = new bootstrap.Modal(modal, {
            backdrop: config.backdrop,
            keyboard: config.closeable
        });
        
        modalInstance.show();

        // Clean up after hiding
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });

        return {
            id: modalId,
            element: modal,
            instance: modalInstance,
            hide: () => modalInstance.hide(),
            updateContent: (newContent) => {
                const contentArea = modal.querySelector('.modal-body');
                if (contentArea) {
                    contentArea.innerHTML = newContent;
                }
            }
        };
    },

    /**
     * Creates a confirmation modal
     * @private
     */
    createConfirmModal: function(id, title, message, config) {
        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn ${config.cancelStyle} cancel-btn">${config.cancelText}</button>
                        <button type="button" class="btn ${config.confirmStyle} confirm-btn">${config.confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        return modal;
    },

    /**
     * Creates a custom modal
     * @private
     */
    createModal: function(id, title, content, config) {
        const modal = document.createElement('div');
        modal.id = `modal-${id}`;
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-dialog ${config.size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        ${config.closeable ? '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        return modal;
    },

    /**
     * Generates a unique ID for modals
     * @private
     */
    generateId: function() {
        return 'modal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
};

// Inject CSS for loading states and notifications
const feedbackCSS = `
<style>
/* Loading Overlay Styles */
.meditrack-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-in;
}

.meditrack-overlay:not(.with-overlay) {
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
}

.loading-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.meditrack-spinner .spinner-border {
    color: #696cff;
}

.spinner-small .spinner-border {
    width: 1.5rem;
    height: 1.5rem;
}

.spinner-medium .spinner-border {
    width: 3rem;
    height: 3rem;
}

.spinner-large .spinner-border {
    width: 4.5rem;
    height: 4.5rem;
}

.loading-message {
    color: #384551;
    font-weight: 500;
    margin-top: 0.5rem;
}

/* Progress Bar Styles */
.progress-container {
    margin: 1rem 0;
    padding: 1rem;
    border: 1px solid #e4e6e8;
    border-radius: 0.375rem;
    background: #fff;
}

.progress-content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.progress-text {
    color: #384551;
    font-weight: 500;
    font-size: 0.875rem;
}

.progress {
    height: 0.75rem;
    background-color: #f5f5f9;
    border-radius: 0.375rem;
    overflow: hidden;
}

.progress-bar {
    background-color: #696cff;
    transition: width 0.3s ease;
}

.progress-percentage {
    text-align: center;
    color: #646E78;
    font-size: 0.75rem;
    font-weight: 600;
}

/* Toast Notification Styles */
.notification-container {
    position: fixed;
    z-index: 1050;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 400px;
    padding: 1rem;
}

.notification-container.position-top-right {
    top: 0;
    right: 0;
}

.notification-container.position-top-left {
    top: 0;
    left: 0;
}

.notification-container.position-bottom-right {
    bottom: 0;
    right: 0;
}

.notification-container.position-bottom-left {
    bottom: 0;
    left: 0;
}

.notification-container.position-top-center {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.notification-container.position-bottom-center {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.toast-notification {
    pointer-events: auto;
    background: #fff;
    border: 1px solid #e4e6e8;
    border-radius: 0.375rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075);
    margin-bottom: 0.5rem;
    overflow: hidden;
    position: relative;
    min-width: 300px;
}

.toast-success {
    border-left: 4px solid #71dd37;
}

.toast-error {
    border-left: 4px solid #ff3e1d;
}

.toast-warning {
    border-left: 4px solid #ffab00;
}

.toast-info {
    border-left: 4px solid #03c3ec;
}

.toast-content {
    padding: 0.75rem 1rem;
}

.toast-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.toast-icon {
    font-size: 1.125rem;
    flex-shrink: 0;
}

.toast-success .toast-icon {
    color: #71dd37;
}

.toast-error .toast-icon {
    color: #ff3e1d;
}

.toast-warning .toast-icon {
    color: #ffab00;
}

.toast-info .toast-icon {
    color: #03c3ec;
}

.toast-message {
    flex: 1;
    color: #384551;
    font-weight: 500;
    font-size: 0.875rem;
    line-height: 1.4;
}

.toast-close {
    background: none;
    border: none;
    color: #a7acb2;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    padding: 0;
    margin-left: auto;
    flex-shrink: 0;
}

.toast-close:hover {
    color: #646E78;
}

.toast-actions {
    margin-top: 0.75rem;
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
}

.toast-actions .btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
}

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOutRight {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 576px) {
    .notification-container {
        left: 0.5rem !important;
        right: 0.5rem !important;
        max-width: none;
        transform: none !important;
    }
    
    .toast-notification {
        min-width: unset;
    }
}
</style>
`;

// Inject CSS when the script loads
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', feedbackCSS);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', feedbackCSS);
    });
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    LoadingManager.cleanup();
    NotificationManager.clearAll();
});
