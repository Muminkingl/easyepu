import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminRole, compareEmailDomains } from '@/lib/supabase';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/", "/unauthorized", "/sign-in", "/sign-up", "/about", "/contact", "/privacy-policy", "/terms-of-service", "/cookie-policy"]);
// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(["/admin", "/admin/:path*"]);
// Define API routes that should be rate limited
const isApiRoute = createRouteMatcher(["/api/:path*"]);

// Enhanced in-memory rate limiting with IP blocking
// In production, use a Redis store or similar for distributed environments
const ipRequestCounts = new Map<string, { count: number, timestamp: number, consecutive429s: number }>();
const API_RATE_LIMIT = 60; // Max requests per minute
const API_WINDOW_MS = 60 * 1000; // 1 minute window
const CONSECUTIVE_429_THRESHOLD = 5; // Block IPs after this many consecutive rate limit violations
const BLOCKED_IPS = new Set<string>(); // Store blocked IPs
const BLOCK_DURATION_MS = 30 * 60 * 1000; // Block for 30 minutes

// Scheduled cleanup
if (typeof setInterval !== 'undefined') {
  // Clean up the IP request counts every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequestCounts.entries()) {
      if (now - data.timestamp > API_WINDOW_MS) {
        // Reset counter but preserve consecutive 429s count for abusive clients
        data.count = 0;
        data.timestamp = now;
        ipRequestCounts.set(ip, data);
      }
    }
  }, 5 * 60 * 1000);
  
  // Unblock IPs after the block duration
  setInterval(() => {
    // No need to iterate through all blocked IPs - they'll be checked on access
  }, 10 * 60 * 1000); // Check every 10 minutes
}

export default clerkMiddleware(async (auth, req) => {
  // Get the original response
  let response = NextResponse.next();
  
  // Get client IP from headers or forwarded headers
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
            req.headers.get('x-real-ip') || 'unknown';
  
  // Check if IP is blocked
  if (BLOCKED_IPS.has(ip)) {
    const now = Date.now();
    // Check if block duration has passed
    if (now - (ipRequestCounts.get(ip)?.timestamp || 0) > BLOCK_DURATION_MS) {
      // Unblock the IP
      BLOCKED_IPS.delete(ip);
      // Reset consecutive 429s count
      if (ipRequestCounts.has(ip)) {
        const data = ipRequestCounts.get(ip)!;
        data.consecutive429s = 0;
        ipRequestCounts.set(ip, data);
      }
    } else {
      // IP is still blocked
      response = new NextResponse(
        JSON.stringify({ 
          error: 'Access denied', 
          message: 'Your IP has been temporarily blocked due to suspicious activity' 
        }),
        { 
          status: 403, 
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '1800' // 30 minutes
          }
        }
      );
      return response;
    }
  }
  
  // Implement enhanced rate limiting for API routes
  if (isApiRoute(req)) {
    const now = Date.now();
    
    const current = ipRequestCounts.get(ip) || { count: 0, timestamp: now, consecutive429s: 0 };
    
    // Reset counter if window has passed
    if (now - current.timestamp > API_WINDOW_MS) {
      current.count = 0;
      current.timestamp = now;
      // Don't reset consecutive429s to allow for pattern detection across windows
    }
    
    // Increment counter
    current.count++;
    ipRequestCounts.set(ip, current);
    
    // Check if limit exceeded
    if (current.count > API_RATE_LIMIT) {
      // Increment consecutive 429s count
      current.consecutive429s++;
      ipRequestCounts.set(ip, current);
      
      // Block IP if too many consecutive rate limit violations
      if (current.consecutive429s >= CONSECUTIVE_429_THRESHOLD) {
        BLOCKED_IPS.add(ip);
        console.warn(`IP ${ip} blocked for excessive rate limit violations`);
      }
      
      // Return 429 Too Many Requests
      response = new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Rate limit exceeded, please try again later' 
        }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60' // Suggest retry after 1 minute
          }
        }
      );
      return response;
    }
  }

  // Generate a unique nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // COMPLETELY DISABLE CSP - removed for blob URL support
  // CSP was causing issues with blob URL access
  
  // Leave security headers that don't interfere with blob URLs
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Download-Options', 'noopen');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');

  // For non-public routes
  if (!isPublicRoute(req)) {
    try {
      const { userId, sessionClaims, redirectToSignIn } = await auth();
      
      // If not authenticated, redirect to sign-in
      if (!userId) {
        return redirectToSignIn();
      }
      
      // If authenticated but doesn't have EPU email domain, redirect to unauthorized
      const userEmail = sessionClaims?.email as string;
      if (userEmail && !userEmail.endsWith('@epu.edu.iq')) {
        const unauthorizedUrl = new URL('/unauthorized', req.url);
        return NextResponse.redirect(unauthorizedUrl);
      }

      // For admin routes, check if user has admin role
      if (isAdminRoute(req)) {
        try {
          // Initialize Supabase client
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (!supabaseUrl || !supabaseKey) {
            // If Supabase isn't configured, redirect to dashboard (failsafe)
            console.error('Supabase environment variables missing');
            const dashboardUrl = new URL('/dashboard', req.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          // Check if user has admin role with additional validation
          const { data, error } = await supabase
            .from('users')
            .select('role, email')
            .eq('clerk_id', userId)
            .single();
          
          // Enhanced validation with case-insensitive role check
          const isAdmin = isAdminRole(data?.role);
          
          // Use the email from the database if userEmail is undefined
          const effectiveUserEmail = userEmail || data?.email;
          
          // Use robust email domain comparison function with fuzzy matching for more lenient comparison
          const emailDomainsMatch = effectiveUserEmail ? 
            compareEmailDomains(data?.email, effectiveUserEmail, true) : 
            true; // Skip email check if no email available
          
          // Enhanced error reporting for actual errors
          if (error) {
            console.warn(`Admin access denied due to database error for user ${userId}`);
            const dashboardUrl = new URL('/', req.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
          if (!isAdmin) {
            console.warn(`Admin access denied - user ${userId} does not have admin role`);
            const dashboardUrl = new URL('/', req.url);
            return NextResponse.redirect(dashboardUrl);
          }
          
          // Skip email domain check if userEmail is undefined
          if (!userEmail) {
            // Silently continue for admin users with no email
          } else if (!emailDomainsMatch) {
            console.warn(`Admin access denied - email domain mismatch for user ${userId}`);
            const dashboardUrl = new URL('/', req.url);
            return NextResponse.redirect(dashboardUrl);
          }
        } catch (error) {
          // On any error, redirect to dashboard as failsafe
          console.error('Error checking admin role:', error);
          const dashboardUrl = new URL('/', req.url);
          return NextResponse.redirect(dashboardUrl);
        }
      }
    } catch (authError) {
      // Handle authentication errors gracefully
      console.error('Authentication error:', authError);
      if (!isPublicRoute(req)) {
        const loginUrl = new URL('/sign-in', req.url);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return response;
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)'
  ],
};