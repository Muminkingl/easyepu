/**
 * Debug utility to check environment variable configuration
 * This helps diagnose issues with missing or improperly formatted environment variables
 */
export function checkEnvironmentVariables() {
  const envVars = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // Add other important environment variables as needed
    // e.g. Clerk variables, etc.
  };

  const missing = Object.entries(envVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing.join(', '));
    console.warn('Please check your .env.local file or environment configuration.');
    return false;
  }

  console.log('✅ All required environment variables are set.');
  return true;
} 