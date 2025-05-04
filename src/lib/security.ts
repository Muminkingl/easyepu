'use server';

import crypto from 'crypto';
import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim());
}

/**
 * Generates a secure hash of a password
 * @param password The password to hash
 * @param salt Optional salt (will be generated if not provided)
 * @returns Object containing the hash and salt
 */
export function hashPassword(password: string, providedSalt?: string): { hash: string; salt: string } {
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
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return storedHash === hash;
}

/**
 * Generates a secure random token
 * @param length The length of the token (default: 32)
 * @returns A secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validates an email address format
 * @param email The email to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a password strength
 * @param password The password to validate
 * @returns Object with result and reason for failure if applicable
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
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
export function validateUsername(username: string): { valid: boolean; reason?: string } {
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
export function validatePhoneNumber(phoneNumber: string): { valid: boolean; reason?: string } {
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
export function validateUrl(url: string): { valid: boolean; reason?: string } {
  if (!url) {
    return { valid: true }; // Empty URL is valid (optional field)
  }
  
  try {
    new URL(url);
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
export function validateImageUrl(url: string): { valid: boolean; reason?: string } {
  if (!url) {
    return { valid: true }; // Empty URL is valid (optional field)
  }
  
  try {
    new URL(url);
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