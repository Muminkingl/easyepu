'use server';

import { NextResponse } from 'next/server';
import { 
  sanitizeInput, 
  validateSchema, 
  detectSuspiciousInput, 
  logSecurityEvent,
  safeJsonParse,
  safeDbOperation
} from './security';

/**
 * Rate limiting configuration for API endpoints
 */
type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
};

// In-memory store for rate limiting - in production, use Redis
const rateLimitStore = new Map<string, { count: number, resetTime: number }>();

/**
 * Secure API wrapper with built-in validation, rate limiting, and error handling
 * @param handler The API route handler function
 * @param options Configuration options for security features
 * @returns A wrapped handler function with security features
 */
export function secureApiRoute<T>(
  handler: (req: Request, context: any) => Promise<NextResponse<T>>,
  options: {
    schema?: Record<string, any>;
    rateLimit?: RateLimitConfig;
    requiredRole?: string;
    sanitizeRequestBody?: boolean;
    responseHeaders?: Record<string, string>;
  } = {}
) {
  return async (req: Request, context: any): Promise<NextResponse<T>> => {
    try {
      // 1. Apply rate limiting if configured
      if (options.rateLimit) {
        const result = applyRateLimit(req, options.rateLimit);
        if (!result.success) {
          return NextResponse.json(
            { error: 'Too many requests', message: 'Rate limit exceeded' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil(result.timeRemaining / 1000)) } }
          ) as NextResponse<any>;
        }
      }

      // 2. Parse and validate request body if needed
      let body = undefined;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        try {
          const text = await req.text();
          if (text) {
            body = safeJsonParse(text);
            
            // Input validation
            if (options.schema && body) {
              const validation = validateSchema(body, options.schema);
              if (!validation.valid) {
                logSecurityEvent(
                  'VALIDATION', 
                  'Schema validation failed', 
                  { errors: validation.errors, path: req.url },
                  'warn'
                );
                return NextResponse.json(
                  { error: 'Validation error', details: validation.errors },
                  { status: 400 }
                ) as NextResponse<any>;
              }
            }
            
            // Check for suspicious input patterns
            if (options.sanitizeRequestBody && body) {
              const sanitizedBody = sanitizeRequestBody(body);
              
              // If suspicious patterns were detected
              if (sanitizedBody.suspicious) {
                logSecurityEvent(
                  'ATTACK', 
                  'Suspicious input detected', 
                  { originalInput: body, sanitizedInput: sanitizedBody.data, path: req.url },
                  'error'
                );
                return NextResponse.json(
                  { error: 'Bad request', message: 'Invalid input detected' },
                  { status: 400 }
                ) as NextResponse<any>;
              }
              
              // Replace body with sanitized version
              body = sanitizedBody.data;
            }
            
            // Attach parsed body to request object
            (req as any).parsedBody = body;
          }
        } catch (error) {
          logSecurityEvent('VALIDATION', 'Failed to parse request body', { error, path: req.url }, 'warn');
          return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
          ) as NextResponse<any>;
        }
      }

      // 3. Role-based access control (if configured)
      if (options.requiredRole) {
        // This would be implemented based on your auth system
        // For example, checking the user's role from a JWT token or session
        // For now, we'll just stub it out
        /* 
        const user = getUserFromRequest(req);
        if (!user || user.role !== options.requiredRole) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'Insufficient permissions' },
            { status: 403 }
          ) as NextResponse<any>;
        }
        */
      }

      // 4. Call the original handler with added security context
      const securityContext = {
        ...context,
        securityInfo: {
          // Add additional security info to context if needed
        }
      };
      
      // Safely execute the handler
      const response = await handler(req, securityContext);
      
      // 5. Add security headers to response
      const headers = new Headers(response.headers);
      const defaultHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      };
      
      // Apply default and custom headers
      const allHeaders = { ...defaultHeaders, ...options.responseHeaders };
      Object.entries(allHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      // Create new response with updated headers
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      }) as NextResponse<T>;
    } catch (error) {
      // Global error handler
      logSecurityEvent(
        'ACCESS', 
        'API route error', 
        { error: error instanceof Error ? error.message : String(error), path: req.url }, 
        'error'
      );
      
      // Return a generic error response to avoid leaking sensitive information
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ) as NextResponse<any>;
    }
  };
}

/**
 * Apply rate limiting to a request
 * @param req The request object
 * @param config Rate limiting configuration
 * @returns Result object with success flag and time remaining if limited
 */
function applyRateLimit(req: Request, config: RateLimitConfig): { success: boolean; timeRemaining: number } {
  const now = Date.now();
  
  // Generate rate limit key (default to IP-based)
  const keyGenerator = config.keyGenerator || ((req: Request) => {
    const forwarded = req.headers.get('x-forwarded-for');
    return forwarded 
      ? `${req.method}:${forwarded.split(',')[0].trim()}`
      : `${req.method}:${req.headers.get('x-real-ip') || 'unknown'}`;
  });
  
  const key = keyGenerator(req);
  
  // Get current rate limit data or create a new entry
  let limitData = rateLimitStore.get(key);
  
  if (!limitData || now > limitData.resetTime) {
    // Reset if window has passed
    limitData = { 
      count: 0, 
      resetTime: now + config.windowMs 
    };
  }
  
  // Increment request count
  limitData.count++;
  
  // Update store
  rateLimitStore.set(key, limitData);
  
  // Check if limit exceeded
  if (limitData.count > config.maxRequests) {
    const timeRemaining = limitData.resetTime - now;
    return { success: false, timeRemaining };
  }
  
  return { success: true, timeRemaining: 0 };
}

/**
 * Recursively sanitize all string values in an object
 * @param input The input object to sanitize
 * @returns Sanitized object and flag indicating if suspicious content was found
 */
function sanitizeRequestBody(input: any): { data: any; suspicious: boolean } {
  let foundSuspicious = false;
  
  // Handle null/undefined
  if (input === null || input === undefined) {
    return { data: input, suspicious: false };
  }
  
  // Handle primitive types
  if (typeof input !== 'object') {
    if (typeof input === 'string') {
      const isSuspicious = detectSuspiciousInput(input);
      // Always sanitize strings even if not suspicious
      return { 
        data: sanitizeInput(input), 
        suspicious: isSuspicious 
      };
    }
    return { data: input, suspicious: false };
  }
  
  // Handle arrays
  if (Array.isArray(input)) {
    const result = input.map(item => sanitizeRequestBody(item));
    const sanitizedArray = result.map(r => r.data);
    const anySuspicious = result.some(r => r.suspicious);
    
    return { 
      data: sanitizedArray, 
      suspicious: anySuspicious 
    };
  }
  
  // Handle objects
  const sanitizedObject: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    // Sanitize keys as well (rare but possible attack vector)
    const sanitizedKey = sanitizeInput(key);
    const result = sanitizeRequestBody(value);
    
    sanitizedObject[sanitizedKey] = result.data;
    if (result.suspicious) {
      foundSuspicious = true;
    }
  }
  
  return { 
    data: sanitizedObject, 
    suspicious: foundSuspicious 
  };
}

/**
 * Example schema for creating a course
 */
export const createCourseSchema = {
  title: { 
    required: true, 
    type: 'string',
    minLength: 3,
    maxLength: 100
  },
  description: { 
    required: false, 
    type: 'string',
    maxLength: 1000
  },
  imageUrl: {
    required: false,
    type: 'string',
    validate: (value: string) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol);
      } catch {
        return false;
      }
    }
  },
  backgroundColor: {
    required: true,
    type: 'string',
    pattern: /^bg-[a-z]+-[0-9]+$/
  },
  active: {
    required: false,
    type: 'boolean'
  }
};

/**
 * Example schema for user profile
 */
export const userProfileSchema = {
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/
  },
  email: {
    required: true,
    type: 'string',
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    }
  },
  phoneNumber: {
    required: false,
    type: 'string',
    pattern: /^07\d{9}$/
  },
  gender: {
    required: false,
    type: 'string',
    validate: (value: string) => ['male', 'female', 'other', ''].includes(value)
  },
  groupClass: {
    required: false,
    type: 'string',
    maxLength: 50
  }
}; 