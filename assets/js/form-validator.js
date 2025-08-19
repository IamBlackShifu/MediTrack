/**
 * MediTrack Form Validation Library
 * Comprehensive client-side form validation with real-time feedback
 */

window.FormValidator = {
    // Validation rules
    rules: {
        required: {
            test: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
            message: 'This field is required'
        },
        email: {
            test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please enter a valid email address'
        },
        phone: {
            test: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, '')),
            message: 'Please enter a valid phone number'
        },
        number: {
            test: (value) => !isNaN(value) && isFinite(value),
            message: 'Please enter a valid number'
        },
        positiveNumber: {
            test: (value) => !isNaN(value) && isFinite(value) && parseFloat(value) > 0,
            message: 'Please enter a positive number'
        },
        integer: {
            test: (value) => Number.isInteger(Number(value)),
            message: 'Please enter a whole number'
        },
        date: {
            test: (value) => !isNaN(Date.parse(value)),
            message: 'Please enter a valid date'
        },
        minLength: (min) => ({
            test: (value) => value.length >= min,
            message: `Must be at least ${min} characters long`
        }),
        maxLength: (max) => ({
            test: (value) => value.length <= max,
            message: `Must not exceed ${max} characters`
        }),
        pattern: (regex, customMessage) => ({
            test: (value) => regex.test(value),
            message: customMessage || 'Invalid format'
        })
    },

    // Medical-specific validation rules
    medicalRules: {
        patientId: {
            test: (value) => /^[A-Z]{2}\d{6}$/.test(value),
            message: 'Patient ID must be 2 letters followed by 6 digits (e.g., AB123456)'
        },
        drugCode: {
            test: (value) => /^[A-Z0-9]{3,10}$/.test(value),
            message: 'Drug code must be 3-10 alphanumeric characters'
        },
        batchNumber: {
            test: (value) => /^[A-Z0-9\-]{4,20}$/.test(value),
            message: 'Batch number must be 4-20 alphanumeric characters with optional hyphens'
        },
        concentration: {
            test: (value) => /^\d+(\.\d+)?\s*(mg|g|ml|l|%|μg|ng)$/i.test(value),
            message: 'Enter concentration with unit (e.g., 500mg, 2.5ml, 10%)'
        }
    },

    // Initialize validation for a form
    init: function(formSelector, options = {}) {
        const form = document.querySelector(formSelector);
        if (!form) {
            console.error(`Form not found: ${formSelector}`);
            return;
        }

        const config = {
            showRealTimeValidation: true,
            showRequiredIndicators: true,
            customErrorContainer: null,
            submitCallback: null,
            ...options
        };

        this.setupForm(form, config);
        return new FormInstance(form, config);
    },

    setupForm: function(form, config) {
        // Add required indicators
        if (config.showRequiredIndicators) {
            this.addRequiredIndicators(form);
        }

        // Setup real-time validation
        if (config.showRealTimeValidation) {
            this.setupRealTimeValidation(form);
        }

        // Setup submit handling
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const isValid = this.validateForm(form);
            
            if (isValid) {
                if (config.submitCallback) {
                    config.submitCallback(new FormData(form));
                } else {
                    this.defaultSubmitHandler(form);
                }
            }
        });
    },

    addRequiredIndicators: function(form) {
        const requiredFields = form.querySelectorAll('[data-required="true"], [required]');
        requiredFields.forEach(field => {
            const label = form.querySelector(`label[for="${field.id}"]`) || 
                         field.closest('.form-group')?.querySelector('label');
            
            if (label && !label.querySelector('.required-indicator')) {
                const indicator = document.createElement('span');
                indicator.className = 'required-indicator';
                indicator.innerHTML = ' <span style="color: #ff3e1d;">*</span>';
                label.appendChild(indicator);
            }
        });
    },

    setupRealTimeValidation: function(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            // Validate on blur for better UX
            field.addEventListener('blur', () => {
                this.validateField(field);
            });

            // Clear errors on focus
            field.addEventListener('focus', () => {
                this.clearFieldError(field);
            });

            // Real-time validation for specific field types
            if (field.type === 'email' || field.type === 'tel' || field.type === 'number') {
                field.addEventListener('input', () => {
                    // Debounce validation
                    clearTimeout(field.validationTimeout);
                    field.validationTimeout = setTimeout(() => {
                        this.validateField(field);
                    }, 500);
                });
            }
        });
    },

    validateField: function(field) {
        const value = field.value.trim();
        const rules = this.getFieldRules(field);
        const errors = [];

        // Skip validation for empty optional fields
        if (!value && !rules.includes('required')) {
            this.clearFieldError(field);
            return true;
        }

        // Apply validation rules
        rules.forEach(rule => {
            const ruleConfig = this.getRuleConfig(rule);
            if (ruleConfig && !ruleConfig.test(value)) {
                errors.push(ruleConfig.message);
            }
        });

        if (errors.length > 0) {
            this.showFieldError(field, errors[0]);
            return false;
        } else {
            this.showFieldSuccess(field);
            return true;
        }
    },

    validateForm: function(form) {
        const fields = form.querySelectorAll('input, select, textarea');
        let isValid = true;
        let firstInvalidField = null;

        fields.forEach(field => {
            const fieldValid = this.validateField(field);
            if (!fieldValid) {
                isValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            }
        });

        // Focus first invalid field
        if (firstInvalidField) {
            firstInvalidField.focus();
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        return isValid;
    },

    getFieldRules: function(field) {
        const rules = [];
        
        // Required rule
        if (field.hasAttribute('required') || field.dataset.required === 'true') {
            rules.push('required');
        }

        // Type-based rules
        if (field.type === 'email') rules.push('email');
        if (field.type === 'tel') rules.push('phone');
        if (field.type === 'number') rules.push('number');

        // Custom rules from data attributes
        if (field.dataset.rules) {
            rules.push(...field.dataset.rules.split(','));
        }

        return rules;
    },

    getRuleConfig: function(rule) {
        // Check standard rules first
        if (this.rules[rule]) return this.rules[rule];
        
        // Check medical rules
        if (this.medicalRules[rule]) return this.medicalRules[rule];

        // Handle parameterized rules
        if (rule.includes(':')) {
            const [ruleName, param] = rule.split(':');
            if (this.rules[ruleName] && typeof this.rules[ruleName] === 'function') {
                return this.rules[ruleName](param);
            }
        }

        return null;
    },

    showFieldError: function(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        
        field.parentNode.appendChild(errorDiv);
    },

    showFieldSuccess: function(field) {
        this.clearFieldError(field);
        
        field.classList.add('is-valid');
        field.classList.remove('is-invalid');
    },

    clearFieldError: function(field) {
        field.classList.remove('is-invalid', 'is-valid');
        
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    },

    defaultSubmitHandler: function(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        // Simulate API call - replace with actual API call
        setTimeout(() => {
            console.log('Form submitted:', data);
            this.showNotification('Data submitted successfully!', 'success');
            
            // Reset form
            form.reset();
            this.clearFormErrors(form);
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 1000);
    },

    clearFormErrors: function(form) {
        const fields = form.querySelectorAll('.is-invalid, .is-valid');
        fields.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
        });

        const errors = form.querySelectorAll('.invalid-feedback');
        errors.forEach(error => error.remove());
    },

    showNotification: function(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.form-notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} form-notification`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1050;
            min-width: 300px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bx bx-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
};

// Form instance class for advanced features
class FormInstance {
    constructor(form, config) {
        this.form = form;
        this.config = config;
    }

    validate() {
        return FormValidator.validateForm(this.form);
    }

    reset() {
        this.form.reset();
        FormValidator.clearFormErrors(this.form);
    }

    setFieldValue(fieldName, value) {
        const field = this.form.querySelector(`[name="${fieldName}"]`);
        if (field) {
            field.value = value;
            FormValidator.validateField(field);
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData.entries());
    }
}

// CSS for validation styling (inject into page)
const validationCSS = `
<style>
.required-indicator {
    color: #ff3e1d;
    font-weight: bold;
}

.is-valid {
    border-color: #71dd37 !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2371dd37' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e") !important;
    background-repeat: no-repeat !important;
    background-position: right calc(0.375em + 0.1875rem) center !important;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem) !important;
}

.is-invalid {
    border-color: #ff3e1d !important;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23ff3e1d'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 4.6 1.4 1.4 1.4-1.4M8.6 7.4l-1.4-1.4-1.4 1.4'/%3e%3c/svg%3e") !important;
    background-repeat: no-repeat !important;
    background-position: right calc(0.375em + 0.1875rem) center !important;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem) !important;
}

.invalid-feedback {
    display: block !important;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875em;
    color: #ff3e1d;
}

.form-group {
    margin-bottom: 1rem;
}

.form-notification {
    animation: slideInRight 0.3s ease-out;
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
</style>
`;

// Inject CSS when the script loads
if (document.head) {
    document.head.insertAdjacentHTML('beforeend', validationCSS);
} else {
    document.addEventListener('DOMContentLoaded', () => {
        document.head.insertAdjacentHTML('beforeend', validationCSS);
    });
}
