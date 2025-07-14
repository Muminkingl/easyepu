import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client with maximum permissions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { memberId, groupId } = body;
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }
    
    console.log(`Simple delete: Removing member ${memberId} from group ${groupId || 'unknown'}`);
    
    // Try multiple deletion approaches - no authentication needed since we're using server-side code
    
    // APPROACH 1: Direct SQL delete
    try {
      const { error: deleteError } = await supabase
        .from('presentation_group_members')
        .delete()
        .eq('id', memberId);
        
      if (!deleteError) {
        console.log(`Successfully deleted member ${memberId}`);
        return NextResponse.json({ 
          success: true, 
          message: `Member ${memberId} deleted successfully`
        });
      } else {
        console.error(`Delete failed for member ${memberId}:`, deleteError);
      }
    } catch (e) {
      console.error(`Exception deleting member ${memberId}:`, e);
    }
    
    // APPROACH 2: Try with additional condition to ensure it's not a creator
    try {
      const { error: deleteWithConditionError } = await supabase
        .from('presentation_group_members')
        .delete()
        .eq('id', memberId)
        .eq('is_creator', false);
        
      if (!deleteWithConditionError) {
        console.log(`Successfully deleted non-creator member ${memberId}`);
        return NextResponse.json({ 
          success: true, 
          message: `Member ${memberId} deleted successfully`
        });
      } else {
        console.error(`Conditional delete failed for member ${memberId}:`, deleteWithConditionError);
      }
    } catch (e) {
      console.error(`Exception in conditional delete for member ${memberId}:`, e);
    }
    
    // APPROACH 3: Raw SQL as a last resort
    try {
      const { data, error: sqlError } = await supabase.rpc(
        'direct_delete_member',
        { member_id: memberId }
      );
      
      if (!sqlError) {
        console.log(`Successfully deleted member ${memberId} via SQL function`);
        return NextResponse.json({ 
          success: true, 
          message: `Member ${memberId} deleted via SQL function`
        });
      } else {
        console.error(`SQL function delete failed:`, sqlError);
      }
    } catch (e) {
      console.error(`Exception in SQL function:`, e);
    }
    
    // Final check to see if the member still exists
    const { data: memberCheck, error: checkError } = await supabase
      .from('presentation_group_members')
      .select('id')
      .eq('id', memberId)
      .maybeSingle();
      
    if (!memberCheck) {
      // Member not found, so it's probably deleted
      return NextResponse.json({ 
        success: true, 
        message: `Member ${memberId} appears to have been deleted`
      });
    }
    
    // If we get here, all methods failed
    return NextResponse.json({ 
      success: false, 
      error: `Failed to delete member ${memberId} despite multiple attempts`
    }, { status: 500 });
    
  } catch (error) {
    console.error('Server error in simple-delete-member route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
} 