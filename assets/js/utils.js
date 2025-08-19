/**
 * MediTrack Utilities Module
 * Common utility functions and helpers
 * 
 * @author MediTrack Development Team
 * @version 1.0.0
 * @since 2025-08-19
 */

/**
 * Utility Functions Manager
 * Provides common utility functions across the application
 */
window.Utils = {
    /**
     * Date and Time Utilities
     */
    DateTime: {
        /**
         * Formats a date according to the specified format
         * @param {Date|string} date - Date to format
         * @param {string} format - Format string (ISO, locale, custom)
         * @param {Object} options - Formatting options
         * @returns {string} Formatted date string
         */
        formatDate: function(date, format = 'locale', options = {}) {
            try {
                const dateObj = typeof date === 'string' ? new Date(date) : date;
                
                if (!(dateObj instanceof Date) || isNaN(dateObj)) {
                    return 'Invalid Date';
                }

                const defaultOptions = {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    ...options
                };

                switch (format) {
                    case 'ISO':
                        return dateObj.toISOString();
                    
                    case 'locale':
                        return dateObj.toLocaleDateString('en-US', defaultOptions);
                    
                    case 'short':
                        return dateObj.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        });
                    
                    case 'long':
                        return dateObj.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                    
                    case 'time':
                        return dateObj.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            ...options
                        });
                    
                    case 'datetime':
                        return dateObj.toLocaleString('en-US', defaultOptions);
                    
                    case 'medical':
                        // Medical standard format: YYYY-MM-DD HH:MM
                        return dateObj.getFullYear() + '-' +
                               String(dateObj.getMonth() + 1).padStart(2, '0') + '-' +
                               String(dateObj.getDate()).padStart(2, '0') + ' ' +
                               String(dateObj.getHours()).padStart(2, '0') + ':' +
                               String(dateObj.getMinutes()).padStart(2, '0');
                    
                    default:
                        // Custom format string
                        return this.customFormat(dateObj, format);
                }
            } catch (error) {
                console.error('Utils.DateTime.formatDate error:', error);
                return 'Format Error';
            }
        },

        /**
         * Custom date formatting with placeholders
         * @param {Date} date - Date object
         * @param {string} format - Format string with placeholders
         * @returns {string} Formatted date
         * @private
         */
        customFormat: function(date, format) {
            const placeholders = {
                'YYYY': date.getFullYear(),
                'MM': String(date.getMonth() + 1).padStart(2, '0'),
                'DD': String(date.getDate()).padStart(2, '0'),
                'HH': String(date.getHours()).padStart(2, '0'),
                'mm': String(date.getMinutes()).padStart(2, '0'),
                'ss': String(date.getSeconds()).padStart(2, '0')
            };

            let result = format;
            Object.entries(placeholders).forEach(([placeholder, value]) => {
                result = result.replace(new RegExp(placeholder, 'g'), value);
            });

            return result;
        },

        /**
         * Gets time ago string (e.g., "2 hours ago")
         * @param {Date|string} date - Date to compare
         * @returns {string} Time ago string
         */
        getTimeAgo: function(date) {
            try {
                const dateObj = typeof date === 'string' ? new Date(date) : date;
                const now = new Date();
                const diffMs = now - dateObj;
                const diffSecs = Math.floor(diffMs / 1000);
                const diffMins = Math.floor(diffSecs / 60);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);

                if (diffSecs < 60) {
                    return 'Just now';
                } else if (diffMins < 60) {
                    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
                } else if (diffHours < 24) {
                    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                } else if (diffDays < 7) {
                    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
                } else {
                    return this.formatDate(dateObj, 'short');
                }
            } catch (error) {
                console.error('Utils.DateTime.getTimeAgo error:', error);
                return 'Unknown';
            }
        },

        /**
         * Validates if a date is within a valid range for medical data
         * @param {Date|string} date - Date to validate
         * @param {Object} options - Validation options
         * @returns {Object} Validation result
         */
        validateMedicalDate: function(date, options = {}) {
            const result = {
                isValid: true,
                errors: [],
                warnings: []
            };

            try {
                const dateObj = typeof date === 'string' ? new Date(date) : date;
                const now = new Date();
                
                const config = {
                    allowFuture: false,
                    maxPastYears: 150,
                    minPastYears: 0,
                    ...options
                };

                if (!(dateObj instanceof Date) || isNaN(dateObj)) {
                    result.isValid = false;
                    result.errors.push('Invalid date format');
                    return result;
                }

                // Check if date is in the future
                if (!config.allowFuture && dateObj > now) {
                    result.warnings.push('Date is in the future');
                }

                // Check if date is too far in the past
                const maxPastDate = new Date();
                maxPastDate.setFullYear(now.getFullYear() - config.maxPastYears);
                
                if (dateObj < maxPastDate) {
                    result.isValid = false;
                    result.errors.push(`Date cannot be more than ${config.maxPastYears} years ago`);
                }

                // Check if date is too recent (for certain medical scenarios)
                if (config.minPastYears > 0) {
                    const minPastDate = new Date();
                    minPastDate.setFullYear(now.getFullYear() - config.minPastYears);
                    
                    if (dateObj > minPastDate) {
                        result.warnings.push(`Date should be at least ${config.minPastYears} year(s) ago`);
                    }
                }

            } catch (error) {
                result.isValid = false;
                result.errors.push('Date validation error');
                console.error('Utils.DateTime.validateMedicalDate error:', error);
            }

            return result;
        }
    },

    /**
     * String Utilities
     */
    String: {
        /**
         * Capitalizes the first letter of a string
         * @param {string} str - String to capitalize
         * @returns {string} Capitalized string
         */
        capitalize: function(str) {
            if (!str || typeof str !== 'string') return str;
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        /**
         * Converts string to title case
         * @param {string} str - String to convert
         * @returns {string} Title case string
         */
        toTitleCase: function(str) {
            if (!str || typeof str !== 'string') return str;
            return str.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },

        /**
         * Truncates a string to specified length
         * @param {string} str - String to truncate
         * @param {number} length - Maximum length
         * @param {string} suffix - Suffix to add (default: '...')
         * @returns {string} Truncated string
         */
        truncate: function(str, length = 100, suffix = '...') {
            if (!str || typeof str !== 'string') return str;
            if (str.length <= length) return str;
            return str.substring(0, length - suffix.length) + suffix;
        },

        /**
         * Removes all whitespace and special characters
         * @param {string} str - String to clean
         * @returns {string} Cleaned string
         */
        sanitize: function(str) {
            if (!str || typeof str !== 'string') return str;
            return str.replace(/[^a-zA-Z0-9]/g, '');
        },

        /**
         * Generates a URL-friendly slug
         * @param {string} str - String to convert
         * @returns {string} URL slug
         */
        toSlug: function(str) {
            if (!str || typeof str !== 'string') return str;
            return str
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
        },

        /**
         * Masks sensitive information (e.g., phone numbers, IDs)
         * @param {string} str - String to mask
         * @param {Object} options - Masking options
         * @returns {string} Masked string
         */
        mask: function(str, options = {}) {
            if (!str || typeof str !== 'string') return str;
            
            const config = {
                maskChar: '*',
                visibleStart: 2,
                visibleEnd: 2,
                ...options
            };

            if (str.length <= config.visibleStart + config.visibleEnd) {
                return config.maskChar.repeat(str.length);
            }

            const start = str.substring(0, config.visibleStart);
            const end = str.substring(str.length - config.visibleEnd);
            const middle = config.maskChar.repeat(str.length - config.visibleStart - config.visibleEnd);

            return start + middle + end;
        },

        /**
         * Validates and formats medical identifiers
         * @param {string} id - ID to validate and format
         * @param {string} type - Type of ID (patient, sample, etc.)
         * @returns {Object} Validation and formatting result
         */
        validateMedicalId: function(id, type = 'patient') {
            const result = {
                isValid: true,
                formatted: id,
                errors: []
            };

            if (!id || typeof id !== 'string') {
                result.isValid = false;
                result.errors.push('ID is required');
                return result;
            }

            const cleanId = id.trim().toUpperCase();

            switch (type) {
                case 'patient':
                    if (!/^[A-Z0-9]{6,12}$/.test(cleanId)) {
                        result.isValid = false;
                        result.errors.push('Patient ID must be 6-12 characters, letters and numbers only');
                    } else {
                        result.formatted = cleanId;
                    }
                    break;

                case 'sample':
                    if (!/^[A-Z0-9\-]{8,16}$/.test(cleanId)) {
                        result.isValid = false;
                        result.errors.push('Sample ID must be 8-16 characters, letters, numbers, and hyphens only');
                    } else {
                        result.formatted = cleanId;
                    }
                    break;

                case 'lab':
                    if (!/^LAB[A-Z0-9]{5,10}$/.test(cleanId)) {
                        result.isValid = false;
                        result.errors.push('Lab ID must start with "LAB" followed by 5-10 alphanumeric characters');
                    } else {
                        result.formatted = cleanId;
                    }
                    break;

                default:
                    // Generic ID validation
                    if (!/^[A-Z0-9\-]{3,20}$/.test(cleanId)) {
                        result.isValid = false;
                        result.errors.push('ID must be 3-20 characters, letters, numbers, and hyphens only');
                    } else {
                        result.formatted = cleanId;
                    }
            }

            return result;
        }
    },

    /**
     * Number Utilities
     */
    Number: {
        /**
         * Formats a number with proper separators
         * @param {number} num - Number to format
         * @param {Object} options - Formatting options
         * @returns {string} Formatted number
         */
        format: function(num, options = {}) {
            if (num === null || num === undefined || isNaN(num)) {
                return 'N/A';
            }

            const config = {
                decimals: 2,
                thousandsSeparator: ',',
                decimalSeparator: '.',
                prefix: '',
                suffix: '',
                ...options
            };

            try {
                const number = parseFloat(num);
                const formatted = number.toLocaleString('en-US', {
                    minimumFractionDigits: config.decimals,
                    maximumFractionDigits: config.decimals
                });

                return config.prefix + formatted + config.suffix;
            } catch (error) {
                console.error('Utils.Number.format error:', error);
                return 'Format Error';
            }
        },

        /**
         * Validates if a number is within medical reference ranges
         * @param {number} value - Value to validate
         * @param {Object} range - Reference range
         * @returns {Object} Validation result
         */
        validateMedicalRange: function(value, range) {
            const result = {
                isValid: true,
                status: 'normal',
                warnings: []
            };

            if (value === null || value === undefined || isNaN(value)) {
                result.isValid = false;
                result.status = 'invalid';
                return result;
            }

            const numValue = parseFloat(value);

            if (range.min !== undefined && numValue < range.min) {
                result.status = 'low';
                result.warnings.push(`Value is below normal range (minimum: ${range.min})`);
            }

            if (range.max !== undefined && numValue > range.max) {
                result.status = 'high';
                result.warnings.push(`Value is above normal range (maximum: ${range.max})`);
            }

            if (range.critical_low !== undefined && numValue < range.critical_low) {
                result.status = 'critical_low';
                result.warnings.push('CRITICAL: Value is dangerously low');
            }

            if (range.critical_high !== undefined && numValue > range.critical_high) {
                result.status = 'critical_high';
                result.warnings.push('CRITICAL: Value is dangerously high');
            }

            return result;
        },

        /**
         * Converts between different units
         * @param {number} value - Value to convert
         * @param {string} fromUnit - Source unit
         * @param {string} toUnit - Target unit
         * @returns {Object} Conversion result
         */
        convertUnits: function(value, fromUnit, toUnit) {
            const result = {
                success: true,
                value: value,
                error: null
            };

            if (value === null || value === undefined || isNaN(value)) {
                result.success = false;
                result.error = 'Invalid input value';
                return result;
            }

            const conversions = {
                // Temperature
                'celsius_to_fahrenheit': (c) => (c * 9/5) + 32,
                'fahrenheit_to_celsius': (f) => (f - 32) * 5/9,
                'celsius_to_kelvin': (c) => c + 273.15,
                'kelvin_to_celsius': (k) => k - 273.15,

                // Weight
                'kg_to_lbs': (kg) => kg * 2.20462,
                'lbs_to_kg': (lbs) => lbs / 2.20462,
                'g_to_oz': (g) => g * 0.035274,
                'oz_to_g': (oz) => oz / 0.035274,

                // Volume
                'ml_to_fl_oz': (ml) => ml * 0.033814,
                'fl_oz_to_ml': (oz) => oz / 0.033814,
                'l_to_gal': (l) => l * 0.264172,
                'gal_to_l': (gal) => gal / 0.264172,

                // Length
                'cm_to_in': (cm) => cm * 0.393701,
                'in_to_cm': (inches) => inches / 0.393701,
                'm_to_ft': (m) => m * 3.28084,
                'ft_to_m': (ft) => ft / 3.28084
            };

            const conversionKey = `${fromUnit}_to_${toUnit}`;
            const conversionFn = conversions[conversionKey];

            if (conversionFn) {
                try {
                    result.value = conversionFn(parseFloat(value));
                } catch (error) {
                    result.success = false;
                    result.error = 'Conversion calculation error';
                }
            } else {
                result.success = false;
                result.error = `Unsupported conversion: ${fromUnit} to ${toUnit}`;
            }

            return result;
        }
    },

    /**
     * Array Utilities
     */
    Array: {
        /**
         * Groups array items by a specified key
         * @param {Array} array - Array to group
         * @param {string|Function} key - Key or function to group by
         * @returns {Object} Grouped object
         */
        groupBy: function(array, key) {
            if (!Array.isArray(array)) return {};

            return array.reduce((groups, item) => {
                const groupKey = typeof key === 'function' ? key(item) : item[key];
                if (!groups[groupKey]) {
                    groups[groupKey] = [];
                }
                groups[groupKey].push(item);
                return groups;
            }, {});
        },

        /**
         * Sorts an array of objects by multiple criteria
         * @param {Array} array - Array to sort
         * @param {Array} criteria - Sort criteria
         * @returns {Array} Sorted array
         */
        multiSort: function(array, criteria) {
            if (!Array.isArray(array) || !Array.isArray(criteria)) return array;

            return array.sort((a, b) => {
                for (const criterion of criteria) {
                    const { key, direction = 'asc' } = criterion;
                    const aVal = this.getNestedValue(a, key);
                    const bVal = this.getNestedValue(b, key);

                    let comparison = 0;
                    if (aVal > bVal) comparison = 1;
                    if (aVal < bVal) comparison = -1;

                    if (comparison !== 0) {
                        return direction === 'desc' ? -comparison : comparison;
                    }
                }
                return 0;
            });
        },

        /**
         * Gets a nested value from an object using dot notation
         * @param {Object} obj - Object to search
         * @param {string} path - Dot notation path
         * @returns {any} Value at path
         * @private
         */
        getNestedValue: function(obj, path) {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        },

        /**
         * Removes duplicates from an array based on a key
         * @param {Array} array - Array to deduplicate
         * @param {string|Function} key - Key or function to compare
         * @returns {Array} Deduplicated array
         */
        uniqueBy: function(array, key) {
            if (!Array.isArray(array)) return [];

            const seen = new Set();
            return array.filter(item => {
                const keyValue = typeof key === 'function' ? key(item) : item[key];
                if (seen.has(keyValue)) {
                    return false;
                }
                seen.add(keyValue);
                return true;
            });
        },

        /**
         * Paginates an array
         * @param {Array} array - Array to paginate
         * @param {number} page - Page number (1-based)
         * @param {number} size - Page size
         * @returns {Object} Pagination result
         */
        paginate: function(array, page = 1, size = 10) {
            if (!Array.isArray(array)) {
                return { data: [], pagination: { page: 1, size: 0, total: 0, pages: 0 } };
            }

            const total = array.length;
            const pages = Math.ceil(total / size);
            const currentPage = Math.max(1, Math.min(page, pages));
            const start = (currentPage - 1) * size;
            const data = array.slice(start, start + size);

            return {
                data,
                pagination: {
                    page: currentPage,
                    size: size,
                    total: total,
                    pages: pages,
                    hasNext: currentPage < pages,
                    hasPrev: currentPage > 1
                }
            };
        }
    },

    /**
     * DOM Utilities
     */
    DOM: {
        /**
         * Creates an element with attributes and content
         * @param {string} tagName - Element tag name
         * @param {Object} attributes - Element attributes
         * @param {string|Array} content - Element content
         * @returns {HTMLElement} Created element
         */
        createElement: function(tagName, attributes = {}, content = '') {
            const element = document.createElement(tagName);

            // Set attributes
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className' || key === 'class') {
                    element.className = value;
                } else if (key === 'textContent') {
                    element.textContent = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });

            // Set content
            if (Array.isArray(content)) {
                content.forEach(child => {
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else if (child instanceof HTMLElement) {
                        element.appendChild(child);
                    }
                });
            } else if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            }

            return element;
        },

        /**
         * Finds the closest ancestor element matching a selector
         * @param {HTMLElement} element - Starting element
         * @param {string} selector - CSS selector
         * @returns {HTMLElement|null} Matching ancestor or null
         */
        closest: function(element, selector) {
            if (!element || !element.closest) return null;
            return element.closest(selector);
        },

        /**
         * Smoothly scrolls to an element
         * @param {HTMLElement|string} target - Target element or selector
         * @param {Object} options - Scroll options
         */
        scrollTo: function(target, options = {}) {
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            
            if (!element) {
                console.warn('ScrollTo: Target element not found');
                return;
            }

            const config = {
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest',
                offset: 0,
                ...options
            };

            const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
            const targetPosition = elementTop - config.offset;

            window.scrollTo({
                top: targetPosition,
                behavior: config.behavior
            });
        },

        /**
         * Checks if an element is visible in the viewport
         * @param {HTMLElement} element - Element to check
         * @param {Object} options - Visibility options
         * @returns {boolean} Whether element is visible
         */
        isInViewport: function(element, options = {}) {
            if (!element) return false;

            const rect = element.getBoundingClientRect();
            const config = {
                threshold: 0,
                rootMargin: 0,
                ...options
            };

            return (
                rect.top >= -config.rootMargin &&
                rect.left >= -config.rootMargin &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + config.rootMargin &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth) + config.rootMargin
            );
        },

        /**
         * Gets or sets CSS custom properties (variables)
         * @param {HTMLElement} element - Target element
         * @param {string} property - CSS property name
         * @param {string} value - Value to set (optional)
         * @returns {string|void} Property value if getting, void if setting
         */
        cssVar: function(element, property, value) {
            if (!element) return;

            const computedStyle = getComputedStyle(element);
            const propertyName = property.startsWith('--') ? property : `--${property}`;

            if (value === undefined) {
                return computedStyle.getPropertyValue(propertyName).trim();
            } else {
                element.style.setProperty(propertyName, value);
            }
        }
    },

    /**
     * Storage Utilities
     */
    Storage: {
        /**
         * Gets an item from storage with optional parsing
         * @param {string} key - Storage key
         * @param {any} defaultValue - Default value if not found
         * @param {string} storageType - 'local' or 'session'
         * @returns {any} Stored value or default
         */
        get: function(key, defaultValue = null, storageType = 'local') {
            try {
                const storage = storageType === 'session' ? sessionStorage : localStorage;
                const item = storage.getItem(key);
                
                if (item === null) return defaultValue;
                
                try {
                    return JSON.parse(item);
                } catch {
                    return item;
                }
            } catch (error) {
                console.error('Utils.Storage.get error:', error);
                return defaultValue;
            }
        },

        /**
         * Sets an item in storage with automatic stringification
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         * @param {string} storageType - 'local' or 'session'
         * @returns {boolean} Success status
         */
        set: function(key, value, storageType = 'local') {
            try {
                const storage = storageType === 'session' ? sessionStorage : localStorage;
                const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                storage.setItem(key, stringValue);
                return true;
            } catch (error) {
                console.error('Utils.Storage.set error:', error);
                return false;
            }
        },

        /**
         * Removes an item from storage
         * @param {string} key - Storage key
         * @param {string} storageType - 'local' or 'session'
         * @returns {boolean} Success status
         */
        remove: function(key, storageType = 'local') {
            try {
                const storage = storageType === 'session' ? sessionStorage : localStorage;
                storage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Utils.Storage.remove error:', error);
                return false;
            }
        },

        /**
         * Clears all items with a specific prefix
         * @param {string} prefix - Key prefix to match
         * @param {string} storageType - 'local' or 'session'
         * @returns {number} Number of items cleared
         */
        clearByPrefix: function(prefix, storageType = 'local') {
            try {
                const storage = storageType === 'session' ? sessionStorage : localStorage;
                const keysToRemove = [];
                
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith(prefix)) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => storage.removeItem(key));
                return keysToRemove.length;
            } catch (error) {
                console.error('Utils.Storage.clearByPrefix error:', error);
                return 0;
            }
        }
    },

    /**
     * Debounce and Throttle Utilities
     */
    Performance: {
        /**
         * Debounces a function call
         * @param {Function} func - Function to debounce
         * @param {number} delay - Delay in milliseconds
         * @returns {Function} Debounced function
         */
        debounce: function(func, delay) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => func.apply(this, args), delay);
            };
        },

        /**
         * Throttles a function call
         * @param {Function} func - Function to throttle
         * @param {number} limit - Time limit in milliseconds
         * @returns {Function} Throttled function
         */
        throttle: function(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Measures execution time of a function
         * @param {Function} func - Function to measure
         * @param {Array} args - Arguments to pass
         * @returns {Object} Result and timing info
         */
        measureTime: function(func, args = []) {
            const start = performance.now();
            const result = func.apply(this, args);
            const end = performance.now();
            
            return {
                result: result,
                executionTime: end - start,
                timestamp: Date.now()
            };
        }
    },

    /**
     * Medical Utilities
     */
    Medical: {
        /**
         * Validates medical reference numbers
         * @param {string} reference - Reference number
         * @param {string} type - Type of reference
         * @returns {Object} Validation result
         */
        validateReference: function(reference, type = 'general') {
            const result = {
                isValid: true,
                formatted: reference,
                errors: []
            };

            if (!reference || typeof reference !== 'string') {
                result.isValid = false;
                result.errors.push('Reference number is required');
                return result;
            }

            const cleanRef = reference.trim().toUpperCase();

            switch (type) {
                case 'lab_order':
                    if (!/^LO\d{8}$/.test(cleanRef)) {
                        result.isValid = false;
                        result.errors.push('Lab order must be format: LO########');
                    }
                    break;

                case 'prescription':
                    if (!/^RX\d{10}$/.test(cleanRef)) {
                        result.isValid = false;
                        result.errors.push('Prescription must be format: RX##########');
                    }
                    break;

                case 'patient_visit':
                    if (!/^PV\d{6}\-\d{4}$/.test(cleanRef)) {
                        result.isValid = false;
                        result.errors.push('Patient visit must be format: PV######-####');
                    }
                    break;

                default:
                    if (!/^[A-Z]{2}\d{6,12}$/.test(cleanRef)) {
                        result.isValid = false;
                        result.errors.push('Reference must be format: 2 letters followed by 6-12 digits');
                    }
            }

            if (result.isValid) {
                result.formatted = cleanRef;
            }

            return result;
        },

        /**
         * Calculates BMI and returns interpretation
         * @param {number} weight - Weight in kg
         * @param {number} height - Height in cm
         * @returns {Object} BMI calculation result
         */
        calculateBMI: function(weight, height) {
            const result = {
                bmi: null,
                category: 'Invalid',
                interpretation: 'Unable to calculate',
                isValid: false
            };

            if (!weight || !height || isNaN(weight) || isNaN(height)) {
                return result;
            }

            const weightKg = parseFloat(weight);
            const heightM = parseFloat(height) / 100; // Convert cm to m

            if (weightKg <= 0 || heightM <= 0) {
                return result;
            }

            const bmi = weightKg / (heightM * heightM);
            result.bmi = Math.round(bmi * 10) / 10; // Round to 1 decimal
            result.isValid = true;

            if (bmi < 18.5) {
                result.category = 'Underweight';
                result.interpretation = 'Below normal weight range';
            } else if (bmi < 25) {
                result.category = 'Normal weight';
                result.interpretation = 'Within normal weight range';
            } else if (bmi < 30) {
                result.category = 'Overweight';
                result.interpretation = 'Above normal weight range';
            } else {
                result.category = 'Obese';
                result.interpretation = 'Significantly above normal weight range';
            }

            return result;
        },

        /**
         * Validates vital signs
         * @param {Object} vitals - Vital signs object
         * @returns {Object} Validation result
         */
        validateVitals: function(vitals) {
            const result = {
                isValid: true,
                warnings: [],
                errors: []
            };

            const ranges = {
                temperature: { min: 35.0, max: 42.0, critical_low: 35.0, critical_high: 40.0 },
                heart_rate: { min: 40, max: 120, critical_low: 40, critical_high: 150 },
                blood_pressure_systolic: { min: 90, max: 140, critical_low: 80, critical_high: 180 },
                blood_pressure_diastolic: { min: 60, max: 90, critical_low: 50, critical_high: 110 },
                respiratory_rate: { min: 12, max: 20, critical_low: 10, critical_high: 30 },
                oxygen_saturation: { min: 95, max: 100, critical_low: 88, critical_high: 100 }
            };

            Object.entries(vitals).forEach(([vital, value]) => {
                if (ranges[vital] && value !== null && value !== undefined) {
                    const validation = Utils.Number.validateMedicalRange(value, ranges[vital]);
                    
                    if (validation.status.includes('critical')) {
                        result.errors.push(`CRITICAL ${vital}: ${value} (${validation.warnings.join(', ')})`);
                        result.isValid = false;
                    } else if (validation.status !== 'normal') {
                        result.warnings.push(`${vital}: ${value} (${validation.warnings.join(', ')})`);
                    }
                }
            });

            return result;
        }
    },

    /**
     * Generates unique IDs
     * @param {Object} options - ID generation options
     * @returns {string} Generated ID
     */
    generateId: function(options = {}) {
        const config = {
            prefix: '',
            length: 8,
            includeTimestamp: false,
            ...options
        };

        let id = config.prefix;

        if (config.includeTimestamp) {
            id += Date.now().toString(36);
        }

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < config.length; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return id;
    }
};

// Make utilities available globally
window.meditrackUtils = Utils;

console.log('Utils: Utility functions loaded successfully');
