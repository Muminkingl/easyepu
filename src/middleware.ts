import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/", "/unauthorized", "/sign-in", "/sign-up", "/privacy-policy", "/terms-of-service", "/cookie-policy"]);
// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(["/admin(.*)"]); 

// Simple in-memory rate limiting
// In production, use a Redis store or similar for distributed environments
const ipRequestCounts = new Map<string, { count: number, timestamp: number }>();
const API_RATE_LIMIT = 60; // Max requests per minute
const API_WINDOW_MS = 60 * 1000; // 1 minute window  

// Clean up the IP map periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of ipRequestCounts.entries()) {
      if (now - data.timestamp > API_WINDOW_MS) {
        ipRequestCounts.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

// Helper function to check if the request is for an API route
function isApiRoute(req: Request): boolean {
  return req.url.includes('/api/');
}

// Helper function to check if the request is for a course API route
function isCourseApiRoute(req: Request): boolean {
  return req.url.includes('/api/courses/');
}

// Helper function to check if the request is for dashboard or its subpages
function isDashboardRoute(req: Request): boolean {
  return req.url.includes('/dashboard');
}

export default clerkMiddleware(async (auth, req) => {
  // Get the original response
  let response = NextResponse.next();

  // Implement rate limiting for API routes
  if (isApiRoute(req)) {
    // Get client IP from headers or forwarded headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() :
               req.headers.get('x-real-ip') || 'unknown';

    const now = Date.now();

    const current = ipRequestCounts.get(ip) || { count: 0, timestamp: now };

    // Reset counter if window has passed
    if (now - current.timestamp > API_WINDOW_MS) {
      current.count = 0;
      current.timestamp = now;
    }
    
    // Increment counter
    current.count++;
    ipRequestCounts.set(ip, current);
    
    // Check if limit exceeded
    if (current.count > API_RATE_LIMIT) {
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
    
    // Handle API authentication - all API routes require auth
    const { userId } = await auth();

    // If it's an API route and user is not authenticated, return 401
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Modify response to include user ID in headers for course APIs
    if (isCourseApiRoute(req)) {
      response.headers.set('X-User-ID', userId);
    }
  }

  // Set permissive Content Security Policy to ensure Paddle works properly
  response.headers.set(
    'Content-Security-Policy',
    "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob:; frame-src * https://*.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com https://checkout.paddle.com https://sandbox-checkout.paddle.com;"
  );

  // Remove any CSP Report-Only headers that might conflict
  response.headers.delete('Content-Security-Policy-Report-Only');

  // Additional security headers - these are more permissive
  response.headers.set('X-XSS-Protection', '0');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'no-referrer-when-downgrade');
  // Remove restrictive frame options
  // response.headers.set('X-Frame-Options', 'DENY');
  // Remove restrictive permissions policy
  // response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // For non-public routes that aren't API routes
  if (!isPublicRoute(req) && !isApiRoute(req)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // If not authenticated, redirect to sign in
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
          const dashboardUrl = new URL('/dashboard', req.url);
          return NextResponse.redirect(dashboardUrl);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if user has admin role
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('clerk_id', userId)
          .single();
        
        // If there's an error or user is not an admin or owner, redirect to dashboard
        if (error || (data?.role !== 'admin' && data?.role !== 'owner')) {
          const dashboardUrl = new URL('/dashboard', req.url);
          return NextResponse.redirect(dashboardUrl);
        }
      } catch (error) {
        // On any error, redirect to dashboard as failsafe
        console.error('Error checking admin role:', error);
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
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