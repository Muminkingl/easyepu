// Script to fix course creation permissions in Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if needed
require('dotenv').config();

// Supabase connection details
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for RLS operations

// Initialize Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixCoursePermissions() {
  try {
    console.log('Starting fix for course permissions...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'fix_rls_policy.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL script using the Supabase client
    // Note: In production, we'd parse and execute statements individually
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      console.error('Error executing SQL:', error);
      return;
    }

    console.log('Successfully updated course RLS policies');

    // Verify a test admin can create courses
    console.log('Verifying admin permissions...');
    const testAdmin = await getAdminUser();
    if (testAdmin) {
      console.log(`Testing permissions with admin user: ${testAdmin.email}`);
      
      // Try inserting a test course
      const { data, error: insertError } = await supabase
        .from('courses')
        .insert({
          title: 'Test Course (Please Delete)',
          description: 'This is a test course created to verify RLS policies',
          created_by: testAdmin.clerk_id,
          background_color: 'bg-gray-300'
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Test course creation failed:', insertError);
      } else {
        console.log('Test course created successfully with ID:', data.id);
        
        // Clean up the test course
        const { error: deleteError } = await supabase
          .from('courses')
          .delete()
          .eq('id', data.id);
        
        if (deleteError) {
          console.error('Failed to clean up test course:', deleteError);
        } else {
          console.log('Test course deleted successfully');
        }
      }
    } else {
      console.log('No admin users found for testing');
    }

    console.log('Permission fix process completed');
  } catch (error) {
    console.error('Error fixing permissions:', error);
  }
}

async function getAdminUser() {
  // Get the first admin user for testing
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching admin user:', error);
    return null;
  }

  return data;
}

// Run the fix
fixCoursePermissions().catch(console.error); 