/**
 * MediTrack Form Handler Module
 * Handles form submissions, validation, and user interactions
 * 
 * @author MediTrack Development Team
 * @version 1.0.0
 * @since 2025-08-19
 */

/**
 * Form Handler Manager
 * Provides comprehensive form handling functionality
 */
window.FormHandler = {
    /**
     * Configuration for form handling
     */
    config: {
        // API endpoints for different form types
        endpoints: {
            clinicForm: '/clinic-samples',
            pharmacyForm: '/pharmacy-captures',
            pharmacyCSV: '/pharmacy-records',
            labForm: '/lab-results',
            processingForm: '/sample-processing',
            supportForm: '/support-requests'
        },
        
        // Form validation rules
        validation: {
            required: ['patientId', 'sampleId', 'collectionDate'],
            email: ['contactEmail', 'notificationEmail'],
            phone: ['phoneNumber', 'emergencyContact'],
            date: ['collectionDate', 'expiryDate', 'testDate'],
            time: ['collectionTime', 'processingTime'],
            numeric: ['quantity', 'temperature', 'volume']
        },
        
        // File upload settings
        fileUpload: {
            maxSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/csv'],
            maxFiles: 5
        },
        
        // Auto-save settings
        autoSave: {
            enabled: true,
            interval: 30000, // 30 seconds
            storagePrefix: 'meditrack_draft_'
        }
    },

    /**
     * Active forms being tracked
     */
    activeForms: new Map(),
    autoSaveTimers: new Map(),

    /**
     * Initializes the form handler
     */
    init: function() {
        this.bindForms();
        this.setupFileUploads();
        this.setupAutoSave();
        this.setupFormValidation();
        this.restoreDrafts();
        
        console.log('FormHandler: Initialized successfully');
    },

    /**
     * Submits a form with comprehensive handling
     * @param {HTMLFormElement} form - Form element to submit
     * @param {Object} options - Submission options
     * @returns {Promise<Object>} Submission result
     */
    submitForm: async function(form, options = {}) {
        try {
            const formType = form.dataset.formType || 'generic';
            const endpoint = options.endpoint || this.getEndpointForForm(formType);
            
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton?.textContent;
            const loadingId = LoadingManager.showSpinner(form, {
                message: 'Submitting form...',
                overlay: false
            });
            
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';
            }

            // Validate form
            const validationResult = await this.validateForm(form);
            if (!validationResult.isValid) {
                throw new Error('Please correct the errors in the form: ' + validationResult.errors.join(', '));
            }

            // Prepare form data
            const formData = this.prepareFormData(form);
            
            // Handle CSV uploads specifically for pharmacy forms
            if (formType === 'pharmacyCSV') {
                return await this.handleCSVUpload(form, formData, endpoint);
            }
            
            // Handle file uploads if present
            if (this.hasFileUploads(form)) {
                await this.handleFileUploads(form, formData);
            }

            // Submit to API
            const response = await ApiHelper.post(endpoint, formData);

            if (!response.success) {
                throw new Error(response.error?.message || 'Form submission failed');
            }

            // Clear auto-save draft
            this.clearDraft(form);

            // Hide loading state
            LoadingManager.hideSpinner(loadingId);
            
            // Reset submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }

            // Show success notification
            const successMessage = this.getSuccessMessage(formType, response.data);
            NotificationManager.success(successMessage);

            // Handle post-submission actions
            this.handleSuccessfulSubmission(form, formType, response.data);

            return {
                success: true,
                data: response.data,
                message: successMessage
            };

        } catch (error) {
            LoadingManager.hideSpinner(loadingId);
            
            // Reset submit button
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }

            // Show error notification
            const errorMessage = error.message || 'Form submission failed. Please try again.';
            NotificationManager.error(errorMessage);

            // Log error for debugging
            console.error('FormHandler Submission Error:', error);

            return {
                success: false,
                error: errorMessage
            };
        }
    },

    /**
     * Validates a form with comprehensive checks
     * @param {HTMLFormElement} form - Form to validate
     * @returns {Promise<Object>} Validation result
     */
    validateForm: async function(form) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        // Get all form inputs
        const inputs = form.querySelectorAll('input, select, textarea');
        
        for (const input of inputs) {
            const fieldResult = await this.validateField(input);
            
            if (!fieldResult.isValid) {
                result.errors.push(...fieldResult.errors);
                this.showFieldError(input, fieldResult.errors[0]);
            } else {
                this.clearFieldError(input);
            }
            
            if (fieldResult.warnings.length > 0) {
                result.warnings.push(...fieldResult.warnings);
            }
        }

        // Cross-field validation
        const crossFieldResult = await this.validateCrossFields(form);
        if (!crossFieldResult.isValid) {
            result.errors.push(...crossFieldResult.errors);
        }

        result.isValid = result.errors.length === 0;
        return result;
    },

    /**
     * Validates a single field
     * @param {HTMLElement} field - Field to validate
     * @returns {Promise<Object>} Validation result
     */
    validateField: async function(field) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const value = field.value?.trim();
        const fieldName = field.name || field.id;
        const fieldType = field.type;
        const isRequired = field.hasAttribute('required') || this.config.validation.required.includes(fieldName);

        // Required field validation
        if (isRequired && !value) {
            result.errors.push(`${this.getFieldLabel(field)} is required`);
            result.isValid = false;
            return result;
        }

        // Skip further validation if field is empty and not required
        if (!value) {
            return result;
        }

        // Type-specific validation
        switch (fieldType) {
            case 'email':
                if (!this.isValidEmail(value)) {
                    result.errors.push(`Please enter a valid email address`);
                    result.isValid = false;
                }
                break;

            case 'tel':
                if (!this.isValidPhone(value)) {
                    result.errors.push(`Please enter a valid phone number`);
                    result.isValid = false;
                }
                break;

            case 'number':
                if (isNaN(value) || value < 0) {
                    result.errors.push(`Please enter a valid positive number`);
                    result.isValid = false;
                }
                break;

            case 'date':
                if (!this.isValidDate(value)) {
                    result.errors.push(`Please enter a valid date`);
                    result.isValid = false;
                } else if (this.isFutureDate(value) && !field.dataset.allowFuture) {
                    result.warnings.push(`Date is in the future`);
                }
                break;

            case 'time':
                if (!this.isValidTime(value)) {
                    result.errors.push(`Please enter a valid time`);
                    result.isValid = false;
                }
                break;

            case 'file':
                const fileResult = await this.validateFileField(field);
                result.errors.push(...fileResult.errors);
                result.warnings.push(...fileResult.warnings);
                result.isValid = fileResult.isValid;
                break;
        }

        // Field-specific validation
        if (fieldName === 'patientId') {
            if (!/^[A-Z0-9]{6,12}$/.test(value)) {
                result.errors.push('Patient ID must be 6-12 characters, letters and numbers only');
                result.isValid = false;
            }
        }

        if (fieldName === 'sampleId') {
            if (!/^[A-Z0-9\-]{8,16}$/.test(value)) {
                result.errors.push('Sample ID must be 8-16 characters, letters, numbers, and hyphens only');
                result.isValid = false;
            }
        }

        if (fieldName === 'temperature') {
            const temp = parseFloat(value);
            if (temp < -80 || temp > 100) {
                result.warnings.push('Temperature seems unusual for medical samples');
            }
        }

        return result;
    },

    /**
     * Validates cross-field relationships
     * @param {HTMLFormElement} form - Form to validate
     * @returns {Promise<Object>} Validation result
     */
    validateCrossFields: async function(form) {
        const result = {
            isValid: true,
            errors: []
        };

        // Date range validation
        const startDate = form.querySelector('[name="startDate"]')?.value;
        const endDate = form.querySelector('[name="endDate"]')?.value;
        
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            result.errors.push('Start date cannot be after end date');
            result.isValid = false;
        }

        // Collection and processing time validation
        const collectionTime = form.querySelector('[name="collectionTime"]')?.value;
        const processingTime = form.querySelector('[name="processingTime"]')?.value;
        
        if (collectionTime && processingTime && collectionTime > processingTime) {
            result.errors.push('Processing time cannot be before collection time');
            result.isValid = false;
        }

        // Patient ID and sample ID correlation (if needed)
        const patientId = form.querySelector('[name="patientId"]')?.value;
        const sampleId = form.querySelector('[name="sampleId"]')?.value;
        
        if (patientId && sampleId) {
            // Check if sample ID follows patient ID pattern (business rule)
            const expectedPrefix = patientId.substring(0, 3);
            if (!sampleId.startsWith(expectedPrefix)) {
                result.errors.push('Sample ID should start with patient ID prefix');
                result.isValid = false;
            }
        }

        return result;
    },

    /**
     * Validates file field
     * @param {HTMLElement} fileField - File input field
     * @returns {Promise<Object>} Validation result
     */
    validateFileField: async function(fileField) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const files = fileField.files;
        
        if (!files || files.length === 0) {
            return result;
        }

        // Check file count
        if (files.length > this.config.fileUpload.maxFiles) {
            result.errors.push(`Maximum ${this.config.fileUpload.maxFiles} files allowed`);
            result.isValid = false;
            return result;
        }

        // Check each file
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Check file size
            if (file.size > this.config.fileUpload.maxSize) {
                result.errors.push(`File "${file.name}" is too large. Maximum size is ${this.formatFileSize(this.config.fileUpload.maxSize)}`);
                result.isValid = false;
            }
            
            // Check file type
            if (!this.config.fileUpload.allowedTypes.includes(file.type)) {
                result.errors.push(`File "${file.name}" has an unsupported format`);
                result.isValid = false;
            }
            
            // Check for potential security issues
            if (this.isPotenitallyDangerous(file.name)) {
                result.warnings.push(`File "${file.name}" has a potentially dangerous extension`);
            }
        }

        return result;
    },

    /**
     * Handles file uploads with progress tracking
     * @param {HTMLFormElement} form - Form containing file uploads
     * @param {Object} formData - Form data object
     * @returns {Promise<Object>} Upload result
     */
    handleFileUploads: async function(form, formData) {
        const fileInputs = form.querySelectorAll('input[type="file"]');
        const uploadResults = {};

        for (const fileInput of fileInputs) {
            const files = fileInput.files;
            
            if (files && files.length > 0) {
                const fieldName = fileInput.name || fileInput.id;
                
                // Show progress for this field
                const progressContainer = this.createProgressContainer(fileInput);
                const progress = LoadingManager.showProgress(progressContainer, {
                    message: `Uploading ${files.length} file(s)...`,
                    progress: 0,
                    showPercentage: true
                });

                try {
                    const uploadedFiles = [];
                    
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        
                        // Update progress
                        const currentProgress = ((i / files.length) * 100);
                        progress.updateProgress(currentProgress, `Uploading ${file.name}...`);

                        // Upload individual file
                        const uploadResult = await this.uploadFile(file, {
                            onProgress: (percentage) => {
                                const totalProgress = currentProgress + (percentage / files.length);
                                progress.updateProgress(totalProgress);
                            }
                        });

                        if (uploadResult.success) {
                            uploadedFiles.push(uploadResult.data);
                        } else {
                            throw new Error(`Failed to upload ${file.name}: ${uploadResult.error}`);
                        }
                    }

                    // Complete progress
                    progress.complete(`${files.length} file(s) uploaded successfully`);
                    
                    // Add to form data
                    formData[fieldName] = uploadedFiles;
                    uploadResults[fieldName] = uploadedFiles;

                } catch (error) {
                    progress.hide();
                    throw error;
                }
            }
        }

        return uploadResults;
    },

    /**
     * Uploads a single file
     * @param {File} file - File to upload
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    uploadFile: async function(file, options = {}) {
        try {
            const formData = new FormData();
            formData.append('files', file);
            formData.append('ref', 'api::upload.upload');

            // Create XMLHttpRequest for progress tracking
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable && options.onProgress) {
                        const percentage = (e.loaded / e.total) * 100;
                        options.onProgress(percentage);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve({
                                success: true,
                                data: response[0] // Strapi returns array
                            });
                        } catch (error) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed due to network error'));
                });

                xhr.open('POST', `${MediTrackConfig.apiUrl}/upload`);
                xhr.setRequestHeader('Authorization', `Bearer ${TokenManager.getToken()}`);
                xhr.send(formData);
            });

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Sets up auto-save functionality
     */
    setupAutoSave: function() {
        if (!this.config.autoSave.enabled) {
            return;
        }

        const forms = document.querySelectorAll('form[data-auto-save="true"]');
        
        forms.forEach(form => {
            const formId = form.id || form.dataset.formType || 'form_' + Date.now();
            
            // Set up auto-save timer
            const timer = setInterval(() => {
                this.saveDraft(form);
            }, this.config.autoSave.interval);
            
            this.autoSaveTimers.set(formId, timer);
            
            // Save on input changes (debounced)
            let saveTimeout;
            form.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.saveDraft(form);
                }, 5000); // 5 second debounce
            });
        });
        
        console.log(`FormHandler: Auto-save enabled for ${forms.length} form(s)`);
    },

    /**
     * Saves form draft to local storage
     * @param {HTMLFormElement} form - Form to save
     */
    saveDraft: function(form) {
        try {
            const formId = form.id || form.dataset.formType || 'form';
            const formData = this.prepareFormData(form, true);
            
            // Don't save if form is empty
            if (this.isFormEmpty(formData)) {
                return;
            }

            const draftData = {
                timestamp: Date.now(),
                data: formData,
                url: window.location.pathname
            };

            const storageKey = this.config.autoSave.storagePrefix + formId;
            localStorage.setItem(storageKey, JSON.stringify(draftData));
            
            console.log(`FormHandler: Draft saved for form ${formId}`);
        } catch (error) {
            console.error('FormHandler: Failed to save draft:', error);
        }
    },

    /**
     * Restores form drafts from local storage
     */
    restoreDrafts: function() {
        const currentUrl = window.location.pathname;
        
        // Find all draft keys for current URL
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            if (key && key.startsWith(this.config.autoSave.storagePrefix)) {
                try {
                    const draftData = JSON.parse(localStorage.getItem(key));
                    
                    if (draftData.url === currentUrl) {
                        const formId = key.replace(this.config.autoSave.storagePrefix, '');
                        const form = document.getElementById(formId) || 
                                   document.querySelector(`form[data-form-type="${formId}"]`);
                        
                        if (form) {
                            this.showDraftRestoreOption(form, draftData);
                        }
                    }
                } catch (error) {
                    console.error('FormHandler: Failed to parse draft data:', error);
                }
            }
        }
    },

    /**
     * Shows option to restore draft
     * @param {HTMLFormElement} form - Form to restore
     * @param {Object} draftData - Draft data
     */
    showDraftRestoreOption: function(form, draftData) {
        const timeDiff = Date.now() - draftData.timestamp;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        const timeText = hours > 0 ? `${hours}h ${minutes}m ago` : `${minutes}m ago`;
        
        NotificationManager.info(
            `Found a draft from ${timeText}. Would you like to restore it?`,
            {
                persistent: true,
                actions: [
                    {
                        text: 'Restore',
                        action: () => this.restoreDraft(form, draftData),
                        style: 'btn-primary'
                    },
                    {
                        text: 'Discard',
                        action: () => this.clearDraft(form),
                        style: 'btn-secondary'
                    }
                ]
            }
        );
    },

    /**
     * Restores draft data to form
     * @param {HTMLFormElement} form - Form to restore
     * @param {Object} draftData - Draft data
     */
    restoreDraft: function(form, draftData) {
        try {
            // Populate form fields
            Object.entries(draftData.data).forEach(([fieldName, value]) => {
                const field = form.querySelector(`[name="${fieldName}"]`);
                
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        field.checked = value;
                    } else if (field.tagName === 'SELECT') {
                        field.value = value;
                        // Trigger change event for dynamic forms
                        field.dispatchEvent(new Event('change'));
                    } else {
                        field.value = value;
                    }
                }
            });

            NotificationManager.success('Draft restored successfully');
            console.log('FormHandler: Draft restored successfully');
        } catch (error) {
            console.error('FormHandler: Failed to restore draft:', error);
            NotificationManager.error('Failed to restore draft');
        }
    },

    /**
     * Clears draft from storage
     * @param {HTMLFormElement} form - Form whose draft to clear
     */
    clearDraft: function(form) {
        const formId = form.id || form.dataset.formType || 'form';
        const storageKey = this.config.autoSave.storagePrefix + formId;
        localStorage.removeItem(storageKey);
    },

    /**
     * Prepares form data for submission
     * @param {HTMLFormElement} form - Form to prepare
     * @param {boolean} includeDrafts - Whether to include draft-only fields
     * @returns {Object} Prepared form data
     */
    prepareFormData: function(form, includeDrafts = false) {
        const formData = new FormData(form);
        const data = {};

        // Convert FormData to object
        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, multiple selects)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        // Add unchecked checkboxes if including drafts
        if (includeDrafts) {
            const checkboxes = form.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (!data.hasOwnProperty(checkbox.name)) {
                    data[checkbox.name] = false;
                }
            });
        }

        // Add metadata
        data._metadata = {
            formType: form.dataset.formType || 'generic',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        return data;
    },

    /**
     * Gets endpoint for form type
     * @param {string} formType - Type of form
     * @returns {string} API endpoint
     */
    getEndpointForForm: function(formType) {
        return this.config.endpoints[formType] || '/forms/submit';
    },

    /**
     * Gets success message for form type
     * @param {string} formType - Type of form
     * @param {Object} responseData - Response data
     * @returns {string} Success message
     */
    getSuccessMessage: function(formType, responseData) {
        const messages = {
            clinicForm: 'Sample collection form submitted successfully',
            pharmacyForm: 'Pharmacy capture recorded successfully',
            pharmacyCSV: 'Drug inventory uploaded successfully',
            labForm: 'Lab results submitted successfully',
            processingForm: 'Sample processing completed successfully',
            supportForm: 'Support request submitted successfully'
        };

        return messages[formType] || 'Form submitted successfully';
    },

    /**
     * Handles post-submission actions
     * @param {HTMLFormElement} form - Submitted form
     * @param {string} formType - Type of form
     * @param {Object} responseData - Response data
     */
    handleSuccessfulSubmission: function(form, formType, responseData) {
        // Clear form if specified
        if (form.dataset.clearOnSuccess !== 'false') {
            form.reset();
        }

        // Redirect if specified
        const redirectUrl = form.dataset.successRedirect;
        if (redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2000);
        }

        // Generate receipt/confirmation if applicable
        if (responseData.id || responseData.confirmationNumber) {
            this.showSubmissionReceipt(formType, responseData);
        }

        // Trigger custom events
        form.dispatchEvent(new CustomEvent('formSubmitted', {
            detail: { formType, responseData }
        }));
    },

    /**
     * Shows submission receipt
     * @param {string} formType - Type of form
     * @param {Object} responseData - Response data
     */
    showSubmissionReceipt: function(formType, responseData) {
        const confirmationNumber = responseData.id || responseData.confirmationNumber || 'N/A';
        
        const receiptContent = `
            <div class="submission-receipt">
                <div class="text-center mb-3">
                    <i class="bx bx-check-circle text-success" style="font-size: 3rem;"></i>
                    <h4 class="mt-2">Submission Successful</h4>
                </div>
                <div class="receipt-details">
                    <div class="row">
                        <div class="col-sm-6"><strong>Confirmation Number:</strong></div>
                        <div class="col-sm-6">${confirmationNumber}</div>
                    </div>
                    <div class="row">
                        <div class="col-sm-6"><strong>Submitted:</strong></div>
                        <div class="col-sm-6">${new Date().toLocaleString()}</div>
                    </div>
                    <div class="row">
                        <div class="col-sm-6"><strong>Form Type:</strong></div>
                        <div class="col-sm-6">${this.getFormTypeDisplay(formType)}</div>
                    </div>
                </div>
                <div class="text-center mt-3">
                    <small class="text-muted">
                        Save this confirmation number for your records
                    </small>
                </div>
            </div>
        `;

        ModalManager.show('Submission Receipt', receiptContent, {
            size: 'modal-md',
            closeable: true
        });
    },

    /**
     * Utility functions
     */
    
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    isValidPhone: function(phone) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    },

    isValidDate: function(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) && dateString === date.toISOString().split('T')[0];
    },

    isValidTime: function(timeString) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(timeString);
    },

    isFutureDate: function(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date > today;
    },

    hasFileUploads: function(form) {
        return form.querySelectorAll('input[type="file"]').length > 0;
    },

    isFormEmpty: function(formData) {
        const significantFields = Object.entries(formData).filter(([key, value]) => 
            key !== '_metadata' && value !== '' && value !== false && value !== null
        );
        return significantFields.length === 0;
    },

    formatFileSize: function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    isPotenitallyDangerous: function(filename) {
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar'];
        return dangerousExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },

    getFieldLabel: function(field) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        return label?.textContent?.trim() || field.name || field.placeholder || 'Field';
    },

    getFormTypeDisplay: function(formType) {
        const displays = {
            clinicForm: 'Clinic Sample Collection',
            pharmacyForm: 'Pharmacy Capture',
            labForm: 'Laboratory Results',
            processingForm: 'Sample Processing',
            supportForm: 'Support Request'
        };
        return displays[formType] || 'Generic Form';
    },

    createProgressContainer: function(fileInput) {
        let container = fileInput.parentNode.querySelector('.upload-progress');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'upload-progress mt-2';
            fileInput.parentNode.appendChild(container);
        }
        
        return container;
    },

    showFieldError: function(field, message) {
        field.classList.add('is-invalid');
        
        let errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
    },

    clearFieldError: function(field) {
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    },

    /**
     * Binds all forms on the page
     * @private
     */
    bindForms: function() {
        const forms = document.querySelectorAll('form[data-handler="meditrack"]');
        
        forms.forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitForm(form);
            });
            
            // Track active form
            const formId = form.id || form.dataset.formType || 'form_' + Date.now();
            this.activeForms.set(formId, form);
        });
        
        console.log(`FormHandler: ${forms.length} form(s) bound successfully`);
    },

    /**
     * Sets up file upload handling
     * @private
     */
    setupFileUploads: function() {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        fileInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileSelection(e.target);
            });
        });
        
        console.log(`FormHandler: ${fileInputs.length} file input(s) configured`);
    },

    /**
     * Handles file selection and preview
     * @private
     */
    handleFileSelection: function(fileInput) {
        const files = fileInput.files;
        
        if (!files || files.length === 0) {
            return;
        }

        // Show file preview
        this.showFilePreview(fileInput, files);
        
        // Validate files
        this.validateFileField(fileInput).then(result => {
            if (!result.isValid) {
                this.showFieldError(fileInput, result.errors[0]);
            } else {
                this.clearFieldError(fileInput);
            }
        });
    },

    /**
     * Shows file preview
     * @private
     */
    showFilePreview: function(fileInput, files) {
        let previewContainer = fileInput.parentNode.querySelector('.file-preview');
        
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.className = 'file-preview mt-2';
            fileInput.parentNode.appendChild(previewContainer);
        }

        previewContainer.innerHTML = '';

        Array.from(files).forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item d-flex align-items-center mb-1';
            
            const icon = this.getFileIcon(file.type);
            const size = this.formatFileSize(file.size);
            
            fileItem.innerHTML = `
                <i class="bx ${icon} me-2"></i>
                <span class="file-name flex-grow-1">${file.name}</span>
                <small class="text-muted me-2">${size}</small>
                <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentNode.remove()">
                    <i class="bx bx-x"></i>
                </button>
            `;
            
            previewContainer.appendChild(fileItem);
        });
    },

    /**
     * Gets appropriate icon for file type
     * @private
     */
    getFileIcon: function(mimeType) {
        const iconMap = {
            'image/': 'bx-image',
            'application/pdf': 'bx-file-blank',
            'text/csv': 'bx-spreadsheet',
            'application/': 'bx-file',
            'default': 'bx-file'
        };

        for (const [type, icon] of Object.entries(iconMap)) {
            if (mimeType.startsWith(type)) {
                return icon;
            }
        }

        return iconMap.default;
    },

    /**
     * Sets up form validation
     * @private
     */
    setupFormValidation: function() {
        // Real-time validation on blur
        document.addEventListener('blur', async (e) => {
            const target = e.target;
            
            if (target.matches('input, select, textarea')) {
                const form = target.closest('form[data-handler="meditrack"]');
                
                if (form) {
                    const result = await this.validateField(target);
                    
                    if (!result.isValid) {
                        this.showFieldError(target, result.errors[0]);
                    } else {
                        this.clearFieldError(target);
                    }
                }
            }
        }, true);

        console.log('FormHandler: Real-time validation configured');
    },

    /**
     * Handles CSV file upload and processing for pharmacy inventory
     * @param {HTMLFormElement} form - The form element
     * @param {Object} formData - Prepared form data
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} Processing result
     */
    handleCSVUpload: async function(form, formData, endpoint) {
        const fileInput = form.querySelector('input[type="file"]');
        const file = fileInput?.files[0];
        
        if (!file) {
            throw new Error('Please select a CSV file to upload');
        }
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            throw new Error('Please upload a valid CSV file');
        }
        
        // Show progress for file processing
        const progressId = LoadingManager.showProgress(form, {
            message: 'Processing CSV file...',
            progress: 0
        });
        
        try {
            // Read and parse CSV file
            const csvData = await this.readCSVFile(file, progressId);
            
            // Validate CSV structure
            const validationResult = this.validateCSVData(csvData);
            if (!validationResult.isValid) {
                throw new Error('CSV validation failed: ' + validationResult.errors.join(', '));
            }
            
            // Process each record
            LoadingManager.updateProgress(progressId, {
                message: 'Uploading records to server...',
                progress: 30
            });
            
            const results = await this.processCSVRecords(csvData.records, endpoint, progressId);
            
            // Complete processing
            LoadingManager.updateProgress(progressId, {
                message: 'Upload completed!',
                progress: 100
            });
            
            setTimeout(() => LoadingManager.hideProgress(progressId), 1000);
            
            // Show success notification
            NotificationManager.showToast({
                title: 'CSV Upload Complete',
                message: `Successfully processed ${results.successful} records (${results.failed} failed)`,
                type: 'success',
                duration: 5000
            });
            
            // Clear form if successful
            if (results.failed === 0) {
                form.reset();
            }
            
            // Refresh drug table if present
            this.refreshDrugTable();
            
            return {
                success: true,
                data: results
            };
            
        } catch (error) {
            LoadingManager.hideProgress(progressId);
            throw error;
        }
    },

    /**
     * Reads and parses CSV file content
     * @param {File} file - CSV file to read
     * @param {string} progressId - Progress indicator ID
     * @returns {Promise<Object>} Parsed CSV data
     */
    readCSVFile: function(file, progressId) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    LoadingManager.updateProgress(progressId, {
                        message: 'Parsing CSV data...',
                        progress: 20
                    });
                    
                    const text = e.target.result;
                    const lines = text.split('\n').filter(line => line.trim());
                    
                    if (lines.length < 2) {
                        throw new Error('CSV file must contain at least a header row and one data row');
                    }
                    
                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                    const records = [];
                    
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        if (values.length === headers.length) {
                            const record = {};
                            headers.forEach((header, index) => {
                                record[header] = values[index];
                            });
                            records.push(record);
                        }
                    }
                    
                    resolve({
                        headers,
                        records
                    });
                } catch (error) {
                    reject(new Error('Failed to parse CSV file: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read CSV file'));
            reader.readAsText(file);
        });
    },

    /**
     * Validates CSV data structure
     * @param {Object} csvData - Parsed CSV data
     * @returns {Object} Validation result
     */
    validateCSVData: function(csvData) {
        const requiredColumns = ['medicine', 'availability', 'datestocked'];
        const errors = [];
        
        // Check for required columns
        requiredColumns.forEach(column => {
            if (!csvData.headers.includes(column)) {
                errors.push(`Missing required column: ${column}`);
            }
        });
        
        // Validate record data
        csvData.records.forEach((record, index) => {
            if (!record.medicine || record.medicine.trim() === '') {
                errors.push(`Row ${index + 2}: Medicine name is required`);
            }
            
            if (record.availability && !['true', 'false', '1', '0', 'yes', 'no'].includes(record.availability.toLowerCase())) {
                errors.push(`Row ${index + 2}: Availability must be true/false, 1/0, or yes/no`);
            }
            
            if (record.datestocked && isNaN(Date.parse(record.datestocked))) {
                errors.push(`Row ${index + 2}: Invalid date format for datestocked`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    },

    /**
     * Processes CSV records and submits to API
     * @param {Array} records - CSV records to process
     * @param {string} endpoint - API endpoint
     * @param {string} progressId - Progress indicator ID
     * @returns {Promise<Object>} Processing results
     */
    processCSVRecords: async function(records, endpoint, progressId) {
        const results = {
            successful: 0,
            failed: 0,
            errors: []
        };
        
        for (let i = 0; i < records.length; i++) {
            try {
                const record = records[i];
                
                // Transform record data
                const payload = {
                    medicine: record.medicine,
                    availability: this.parseBoolean(record.availability),
                    datestocked: record.datestocked
                };
                
                // Submit to API
                const response = await ApiHelper.post(endpoint, payload);
                
                if (response.success) {
                    results.successful++;
                } else {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: ${response.error?.message || 'Unknown error'}`);
                }
                
                // Update progress
                const progress = 30 + ((i + 1) / records.length) * 60;
                LoadingManager.updateProgress(progressId, {
                    message: `Processing record ${i + 1} of ${records.length}...`,
                    progress: Math.round(progress)
                });
                
                // Small delay to prevent overwhelming the server
                if (i < records.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
            } catch (error) {
                results.failed++;
                results.errors.push(`Row ${i + 2}: ${error.message}`);
            }
        }
        
        return results;
    },

    /**
     * Parses boolean values from CSV
     * @param {string} value - String value to parse
     * @returns {boolean} Parsed boolean value
     */
    parseBoolean: function(value) {
        if (!value) return false;
        const lowercaseValue = value.toLowerCase().trim();
        return ['true', '1', 'yes', 'available'].includes(lowercaseValue);
    },

    /**
     * Refreshes the drug table display
     */
    refreshDrugTable: function() {
        const tableContainer = document.getElementById('drugTableBody');
        if (tableContainer) {
            // Trigger a refresh of the drug table
            setTimeout(() => {
                if (window.MediTrack && window.MediTrack.loadDrugTable) {
                    window.MediTrack.loadDrugTable();
                }
            }, 1000);
        }
    },

    /**
     * Cleanup function
     */
    cleanup: function() {
        // Clear auto-save timers
        this.autoSaveTimers.forEach(timer => clearInterval(timer));
        this.autoSaveTimers.clear();
        
        // Clear active forms
        this.activeForms.clear();
        
        console.log('FormHandler: Cleanup completed');
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    FormHandler.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    FormHandler.cleanup();
});
