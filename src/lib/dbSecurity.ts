'use server';

import { logSecurityEvent } from './security';
import { supabase } from './supabase';

/**
 * Configuration for database operation options
 */
type DbOperationOptions = {
  errorMessage?: string;
  logErrors?: boolean;
  timeout?: number;
};

/**
 * Default options for database operations
 */
const DEFAULT_DB_OPTIONS: DbOperationOptions = {
  logErrors: true,
  timeout: 15000, // 15 seconds timeout for operations
};

/**
 * Safely execute a database query with error handling and logging
 * @param operation Function that performs the database operation
 * @param options Configuration options
 * @returns Result of the operation or null on error
 */
export async function secureDbOperation<T>(
  operation: () => Promise<T>,
  options: DbOperationOptions = {}
): Promise<T | null> {
  const opts = { ...DEFAULT_DB_OPTIONS, ...options };
  
  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Database operation timed out'));
      }, opts.timeout);
    });
    
    // Race the operation against the timeout
    const result = await Promise.race([operation(), timeoutPromise]) as T;
    return result;
  } catch (error) {
    if (opts.logErrors) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logSecurityEvent(
        'ACCESS',
        opts.errorMessage || 'Database operation failed',
        { error: errorMessage },
        'error'
      );
    }
    return null;
  }
}

/**
 * Safely execute a database transaction with error handling and automatic rollback
 * @param operations Array of functions to execute in a transaction
 * @param options Configuration options
 * @returns Results of all operations or null on error
 */
export async function secureDbTransaction<T>(
  operations: Array<() => Promise<any>>,
  options: DbOperationOptions = {}
): Promise<T | null> {
  if (!supabase) {
    logSecurityEvent('ACCESS', 'Supabase client not initialized', {}, 'error');
    return null;
  }
  
  const opts = { ...DEFAULT_DB_OPTIONS, ...options };
  
  try {
    // Start a transaction
    await supabase.rpc('begin_transaction');
    
    // Execute all operations in sequence
    const results = [];
    for (const operation of operations) {
      const result = await operation();
      results.push(result);
    }
    
    // Commit the transaction
    await supabase.rpc('commit_transaction');
    
    return results as T;
  } catch (error) {
    // Rollback the transaction on error
    try {
      await supabase.rpc('rollback_transaction');
    } catch (rollbackError) {
      logSecurityEvent(
        'ACCESS',
        'Failed to rollback transaction',
        { error: rollbackError instanceof Error ? rollbackError.message : String(rollbackError) },
        'error'
      );
    }
    
    if (opts.logErrors) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logSecurityEvent(
        'ACCESS',
        opts.errorMessage || 'Transaction failed',
        { error: errorMessage },
        'error'
      );
    }
    
    return null;
  }
}

/**
 * Create a parameterized query with protection against SQL injection
 * @param query The SQL query with parameters represented as :param
 * @param params Object with parameter values
 * @returns Safe query object for execution
 */
export function createSafeQuery(
  query: string,
  params: Record<string, any>
): { query: string; values: any[] } {
  // Validate the query for potential unsafe patterns
  const unsafePatterns = [
    /EXECUTE\s+IMMEDIATE/i,
    /EXEC\s+\(/i,
    /xp_cmdshell/i,
    /INTO\s+OUTFILE/i,
    /LOAD_FILE/i,
    /BENCHMARK\s*\(/i
  ];
  
  if (unsafePatterns.some(pattern => pattern.test(query))) {
    logSecurityEvent(
      'ATTACK',
      'Potentially unsafe SQL query detected',
      { query },
      'error'
    );
    throw new Error('Unsafe SQL pattern detected');
  }
  
  // Validate parameter names for safety
  const invalidParamNames = Object.keys(params).filter(key => !/^[a-zA-Z0-9_]+$/.test(key));
  if (invalidParamNames.length > 0) {
    logSecurityEvent(
      'ATTACK',
      'Invalid parameter names detected',
      { invalidParams: invalidParamNames },
      'error'
    );
    throw new Error('Invalid parameter names');
  }
  
  // Convert named parameters to positional parameters
  const paramNames = Object.keys(params);
  let positionalQuery = query;
  const values: any[] = [];
  
  paramNames.forEach(name => {
    const regex = new RegExp(`:${name}\\b`, 'g');
    const paramPlaceholder = '$' + (values.length + 1);
    positionalQuery = positionalQuery.replace(regex, paramPlaceholder);
    values.push(params[name]);
  });
  
  return { query: positionalQuery, values };
}

/**
 * Execute a raw SQL query with protection against SQL injection
 * @param query The SQL query with named parameters
 * @param params Parameter values
 * @param options Configuration options
 * @returns Query result or null on error
 */
export async function executeSecureQuery<T>(
  query: string,
  params: Record<string, any> = {},
  options: DbOperationOptions = {}
): Promise<T | null> {
  if (!supabase) {
    logSecurityEvent('ACCESS', 'Supabase client not initialized', {}, 'error');
    return null;
  }
  
  const opts = { ...DEFAULT_DB_OPTIONS, ...options };
  
  try {
    // Prepare safe query
    const { query: safeQuery, values } = createSafeQuery(query, params);
    
    // Execute query with timeout
    const operation = async () => {
      const { data, error } = await supabase.rpc('execute_query', {
        p_query: safeQuery,
        p_params: values
      });
      
      if (error) throw error;
      return data as T;
    };
    
    return await secureDbOperation(operation, opts);
  } catch (error) {
    if (opts.logErrors) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logSecurityEvent(
        'ACCESS',
        opts.errorMessage || 'Query execution failed',
        { error: errorMessage, query },
        'error'
      );
    }
    return null;
  }
}

/**
 * Validate database config to ensure DB is properly set up
 * @returns True if configuration is valid, false otherwise
 */
export async function validateDbConfig(): Promise<boolean> {
  if (!supabase) {
    logSecurityEvent('CONFIG', 'Supabase client not initialized', {}, 'error');
    return false;
  }
  
  try {
    // Check if required tables exist and RLS is properly configured
    const { data, error } = await supabase.rpc('check_db_config');
    
    if (error) {
      logSecurityEvent('CONFIG', 'Database configuration validation failed', { error: error.message }, 'error');
      return false;
    }
    
    if (!data || !data.valid) {
      logSecurityEvent('CONFIG', 'Invalid database configuration', { issues: data?.issues || [] }, 'error');
      return false;
    }
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logSecurityEvent('CONFIG', 'Failed to validate database configuration', { error: errorMessage }, 'error');
    return false;
  }
}

/**
 * Check database connection health
 * @returns Connection status object
 */
export async function checkDbHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down', issues: string[] }> {
  if (!supabase) {
    return { 
      status: 'down', 
      issues: ['Supabase client not initialized'] 
    };
  }
  
  try {
    // Simple query to check if database is responsive
    const start = Date.now();
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    const responseTime = Date.now() - start;
    
    if (error) {
      return { 
        status: 'down', 
        issues: [`Database error: ${error.message}`] 
      };
    }
    
    // Check response time to determine if it's degraded
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    
    if (responseTime > 500) {
      status = 'degraded';
      issues.push(`Slow response time: ${responseTime}ms`);
    }
    
    return { status, issues };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      status: 'down', 
      issues: [`Connection error: ${errorMessage}`] 
    };
  }
} 