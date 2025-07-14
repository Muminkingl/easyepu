import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { groupId, fileUrl, fileName, adminToken } = body;
    
    // Quick validation
    if (!groupId || !fileUrl || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Validate admin token - very basic protection
    // In production this should use proper auth
    if (adminToken !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Ensure supabase client is available
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    // Get current data for debugging
    const { data: before } = await supabase
      .from('presentation_groups')
      .select('*')
      .eq('id', groupId)
      .single();
    
    console.log('Current group data:', before);
    
    // Try the force update RPC function first
    let success = false;
    
    try {
      const { data: forceResult, error: forceError } = await supabase.rpc('force_update_presentation_file', {
        p_group_id: groupId,
        p_file_url: fileUrl,
        p_file_name: fileName
      });
      
      if (!forceError && forceResult) {
        success = true;
      } else {
        console.error('Force update error:', forceError);
      }
    } catch (forceError) {
      console.error('Force update failed:', forceError);
    }
    
    // If that fails, try raw SQL as a last resort
    if (!success) {
      try {
        // Execute direct SQL to bypass any restrictions
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          sql: `
            UPDATE presentation_groups 
            SET presentation_file_url = '${fileUrl}',
                presentation_file_name = '${fileName}',
                file_url = '${fileUrl}',
                file_name = '${fileName}',
                updated_at = NOW()
            WHERE id = ${groupId}
          `
        });
        
        if (!sqlError) {
          success = true;
        } else {
          console.error('Raw SQL error:', sqlError);
        }
      } catch (sqlError) {
        console.error('SQL execution error:', sqlError);
      }
    }
    
    // Get updated data for verification
    const { data: after } = await supabase
      .from('presentation_groups')
      .select('*')
      .eq('id', groupId)
      .single();
    
    console.log('Updated group data:', after);
    
    // Verify the update actually worked
    const fileUrlUpdated = after?.file_url === fileUrl || after?.presentation_file_url === fileUrl;
    
    return NextResponse.json({
      success: success && fileUrlUpdated,
      before,
      after,
      message: success && fileUrlUpdated 
        ? 'File data updated successfully' 
        : 'Update operation completed but verification failed'
    });
  } catch (error) {
    console.error('Error in fix-presentation-file endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Increase the body size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}; 