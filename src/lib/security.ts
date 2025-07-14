'use server';

import crypto from 'crypto';
import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The input to sanitize
 * @returns Sanitized string
 */
export async function sanitizeInput(input: string): Promise<string> {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim());
}

/**
 * Strongly sanitizes HTML input - removes all tags except basic formatting
 * @param input The HTML input to sanitize
 * @returns Sanitized HTML string
 */
export async function sanitizeHtml(input: string): Promise<string> {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORBID_CONTENTS: ['script', 'style', 'iframe', 'form', 'input'],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true },
  });
}

/**
 * Validate object against schema - useful for API payload validation
 * @param data The data object to validate
 * @param schema Validation schema with field definitions
 * @returns Validation result with errors if any
 */
export async function validateSchema(data: any, schema: Record<string, { 
  required?: boolean; 
  type?: string; 
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  validate?: (value: any) => boolean;
}>): Promise<{ 
  valid: boolean; 
  errors: Record<string, string>; 
}> {
  const errors: Record<string, string> = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    // Skip further validation if field is not required and not provided
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors[field] = `${field} must be of type ${rules.type}`;
      continue;
    }
    
    // String-specific checks
    if (rules.type === 'string' && typeof value === 'string') {
      // Min length
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
        continue;
      }
      
      // Max length
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        errors[field] = `${field} must be at most ${rules.maxLength} characters`;
        continue;
      }
      
      // Pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = `${field} has an invalid format`;
        continue;
      }
    }
    
    // Custom validator
    if (rules.validate && !rules.validate(value)) {
      errors[field] = `${field} is invalid`;
      continue;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Log security event with appropriate severity
 * @param type The type of security event
 * @param message Description of the event
 * @param data Additional data about the event
 * @param severity Severity level (info, warn, error)
 */
export async function logSecurityEvent(
  type: 'AUTH' | 'ACCESS' | 'VALIDATION' | 'RATE_LIMIT' | 'ATTACK' | 'CONFIG' | 'SYSTEM',
  message: string,
  data?: any,
  severity: 'info' | 'warn' | 'error' = 'info'
): Promise<void> {
  const event = {
    type,
    message,
    timestamp: new Date().toISOString(),
    data: data || {}
  };
  
  // Don't log system info events to the console in production
  // Only log important events (warnings, errors, non-system events)
  if (process.env.NODE_ENV === 'production' && type === 'SYSTEM' && severity === 'info') {
    return;
  }
  
  // Log based on severity
  switch (severity) {
    case 'error':
      console.error('SECURITY EVENT:', event);
      break;
    case 'warn':
      console.warn('SECURITY EVENT:', event);
      break;
    default:
      console.info('SECURITY EVENT:', event);
  }
  
  // In production, you would send this to a monitoring service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Check for suspicious patterns in input data
 * @param input The input to check
 * @returns True if suspicious, false otherwise
 */
export async function detectSuspiciousInput(input: string): Promise<boolean> {
  if (!input) return false;
  
  // Check for common attack patterns
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // SQL Injection
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i, // XSS
    /javascript:[^;]*/i, // JavaScript injection
    /data:text\/html/i, // HTML data URI
    /eval\(|setTimeout\(|setInterval\(|Function\(|document\.location|document\.cookie|window\.location/i, // JavaScript execution
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Safely parse JSON with error handling
 * @param jsonString The JSON string to parse
 * @returns Parsed object or null if invalid
 */
export async function safeJsonParse(jsonString: string): Promise<any> {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    await logSecurityEvent('VALIDATION', 'Invalid JSON input', { input: jsonString.substring(0, 100) }, 'warn');
    return null;
  }
}

/**
 * Generates a secure hash of a password
 * @param password The password to hash
 * @param salt Optional salt (will be generated if not provided)
 * @returns Object containing the hash and salt
 */
export async function hashPassword(password: string, providedSalt?: string): Promise<{ hash: string; salt: string }> {
  const salt = providedSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');
  
  return { hash, salt };
}

/**
 * Verifies a password against a stored hash
 * @param password The password to verify
 * @param storedHash The stored hash to compare against
 * @param salt The salt used for the stored hash
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, salt);
  return storedHash === hash;
}

/**
 * Generates a secure random token
 * @param length The length of the token (default: 32)
 * @returns A secure random token
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validates an email address format
 * @param email The email to validate
 * @returns True if the email is valid, false otherwise
 */
export async function isValidEmail(email: string): Promise<boolean> {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password strength
 * @param password The password to validate
 * @returns Object with result and reason for failure if applicable
 */
export async function validatePasswordStrength(password: string): Promise<{ valid: boolean; reason?: string }> {
  if (!password || password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one number' };
  }
  
  // Check for at least one special character
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

/**
 * Checks if a username is valid
 * @param username The username to validate
 * @returns Object with result and reason for failure if applicable
 */
export async function validateUsername(username: string): Promise<{ valid: boolean; reason?: string }> {
  if (!username || username.length < 3) {
    return { valid: false, reason: 'Username must be at least 3 characters long' };
  }
  
  // Check for valid characters (letters, numbers, underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, reason: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validates a phone number format
 * @param phoneNumber The phone number to validate
 * @returns Object with result and reason for failure if applicable
 */
export async function validatePhoneNumber(phoneNumber: string): Promise<{ valid: boolean; reason?: string }> {
  // Validate Iraq phone number format (starts with 07 and has 11 digits)
  const phoneRegex = /^07\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return { valid: false, reason: 'Phone number must start with 07 and have 11 digits total' };
  }
  
  return { valid: true };
}

/**
 * Validates a URL
 * @param url The URL to validate
 * @returns Object with result and reason for failure if applicable
 */
export async function validateUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
  if (!url) {
    return { valid: true }; // Empty URL is valid (optional field)
  }
  
  try {
    const urlObj = new URL(url);
    // Additional checks for URL safety
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, reason: 'URL must use http or https protocol' };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Validates an image URL
 * @param url The URL to validate
 * @returns Object with result and reason for failure if applicable
 */
export async function validateImageUrl(url: string): Promise<{ valid: boolean; reason?: string }> {
  if (!url) {
    return { valid: true }; // Empty URL is valid (optional field)
  }
  
  try {
    const urlObj = new URL(url);
    // Check protocol safety
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, reason: 'Image URL must use http or https protocol' };
    }
    // Check if the URL ends with a common image extension
    if (!url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return { 
        valid: false, 
        reason: 'URL must end with a valid image extension (.jpg, .jpeg, .png, .gif, .webp)' 
      };
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: 'Invalid URL format' };
  }
}

/**
 * Safe wrapper for async database operations with automatic error handling
 * @param operation The async operation to perform
 * @param errorMessage Custom error message for logging
 * @returns Result of the operation or null on error
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Database operation failed'
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    await logSecurityEvent('ACCESS', errorMessage, { error: error instanceof Error ? error.message : String(error) }, 'error');
    return null;
  }
}

/**
 * Checks if required environment variables are set and logs any missing ones
 * @param requiredVars List of required environment variable names
 * @returns True if all variables are set, false otherwise
 */
export async function checkEnvVars(requiredVars: string[]): Promise<boolean> {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    await logSecurityEvent(
      'CONFIG',
      'Missing required environment variables',
      { missing },
      'error'
    );
    return false;
  }
  
  return true;
} 