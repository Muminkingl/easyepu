import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkDbHealth } from '@/lib/dbSecurity';
import { getSecuritySummary } from '@/lib/securityMonitor';
import { checkEnvVars } from '@/lib/security';

/**
 * GET /api/health
 * Health check endpoint to verify the system is operational
 * - Checks database connectivity
 * - Verifies environment variables 
 * - Reports security incidents
 * - Includes basic system stats
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  const result: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    timestamp: string;
    uptime: number;
    responseTime: number;
    components: {
      database: {
        status: 'healthy' | 'degraded' | 'down';
        issues: string[];
      };
      environment: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        missingVars?: string[];
      };
      security: {
        status: 'healthy' | 'warning' | 'critical';
        incidents: {
          critical: number;
          error: number;
          warn: number;
          total: number;
        };
      };
    };
  } = {
    status: 'healthy',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: 0,
    components: {
      database: {
        status: 'healthy',
        issues: [],
      },
      environment: {
        status: 'healthy',
      },
      security: {
        status: 'healthy',
        incidents: {
          critical: 0,
          error: 0,
          warn: 0,
          total: 0,
        },
      },
    },
  };

  // 1. Check database health
  const dbHealth = await checkDbHealth();
  result.components.database = dbHealth;

  // 2. Check environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];
  
  const envVarsHealthy = checkEnvVars(requiredVars);
  if (!envVarsHealthy) {
    result.components.environment.status = 'unhealthy';
    result.components.environment.missingVars = requiredVars.filter(
      varName => !process.env[varName]
    );
  }

  // 3. Check security incidents in the last hour
  const securitySummary = await getSecuritySummary(60 * 60 * 1000); // 1 hour
  result.components.security.incidents = {
    critical: securitySummary.bySeverity.critical,
    error: securitySummary.bySeverity.error,
    warn: securitySummary.bySeverity.warn,
    total: securitySummary.total,
  };

  // Determine security status based on incidents
  if (securitySummary.bySeverity.critical > 0) {
    result.components.security.status = 'critical';
  } else if (securitySummary.bySeverity.error > 0) {
    result.components.security.status = 'warning';
  }

  // 4. Determine overall system health
  if (
    result.components.database.status === 'down' ||
    result.components.environment.status === 'unhealthy' ||
    result.components.security.status === 'critical'
  ) {
    result.status = 'unhealthy';
  } else if (
    result.components.database.status === 'degraded' ||
    result.components.security.status === 'warning'
  ) {
    result.status = 'degraded';
  }

  // Calculate response time
  result.responseTime = Date.now() - startTime;

  // Set appropriate status code based on health
  const statusCode = result.status === 'unhealthy' ? 503 : 200;

  // Add cache control headers to prevent caching
  return NextResponse.json(result, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

/**
 * HEAD /api/health
 * Lightweight health check for monitoring systems
 * Returns 200 if system is operational, 503 if not
 */
export async function HEAD(request: Request) {
  // Quick check if database is available
  let isHealthy = true;
  
  if (supabase) {
    try {
      const { error } = await supabase.from('_health').select('count').limit(1).timeout(2000);
      isHealthy = !error;
    } catch (e) {
      isHealthy = false;
    }
  } else {
    isHealthy = false;
  }
  
  return new Response(null, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
} 