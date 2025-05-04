'use server';

import { supabase } from './supabase';

/**
 * Fix the announcements table structure to work with Clerk user IDs
 */
export async function fixAnnouncementsTable() {
  try {
    if (!supabase) {
      console.error('Supabase not configured');
      return false;
    }

    // Instead of directly executing SQL, use supabase stored procedures
    // that have been created specifically for these database operations
    // This prevents SQL injection by using proper parameterization
    
    // Drop the existing table through a pre-defined stored procedure
    await supabase.rpc('drop_announcements_table');

    // Create the table with the correct structure using a stored procedure
    await supabase.rpc('create_announcements_table');

    // Create index using a stored procedure
    await supabase.rpc('create_announcements_index');

    // Set up RLS using a stored procedure
    await supabase.rpc('setup_announcements_rls');

    return true;
  } catch (error) {
    console.error('Error fixing announcements table:', error);
    return false;
  }
}

/**
 * Create the polls table structure
 */
export async function createPollsTable() {
  try {
    if (!supabase) {
      console.error('Supabase not configured');
      return false;
    }

    // Use stored procedures instead of raw SQL execution
    
    // Create polls table using a stored procedure
    await supabase.rpc('create_polls_table');

    // Create poll_responses table using a stored procedure
    await supabase.rpc('create_poll_responses_table');

    // Create indexes using a stored procedure
    await supabase.rpc('create_polls_indexes');

    // Set up RLS using a stored procedure
    await supabase.rpc('setup_polls_rls');

    return true;
  } catch (error) {
    console.error('Error creating polls table:', error);
    return false;
  }
} 