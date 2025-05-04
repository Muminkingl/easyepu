import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/", "/unauthorized", "/sign-in", "/sign-up"]);
// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(["/admin"]);
// Define API routes that should be rate limited
const isApiRoute = createRouteMatcher(["/api/:path*"]);

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
  }

  // Add security headers to all responses
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  
  // Content Security Policy - make it more permissive while still maintaining security
  response.headers.set(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.epu.edu.iq https://*.clerk.accounts.dev; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev https://clerk.epu.edu.iq wss://*.supabase.co; frame-src 'self' https://*.clerk.accounts.dev https://clerk.epu.edu.iq; object-src 'none'; base-uri 'self';`
  );
  
  // Additional security headers
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // For non-public routes
  if (!isPublicRoute(req)) {
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
        
        // If there's an error or user is not an admin, redirect to dashboard
        if (error || data?.role !== 'admin') {
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