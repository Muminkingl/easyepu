import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs';

// Directly create a fresh Supabase instance with admin privileges
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
    // Authenticate the user
    const user = await currentUser();
    const userId = user?.id;
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { memberId, groupId } = body;
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }
    
    // Verify user is the creator of the group, if groupId is provided
    if (groupId) {
      const { data: membership, error: membershipError } = await supabase
        .from('presentation_group_members')
        .select('user_id, is_creator')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .eq('is_creator', true)
        .single();
        
      if (membershipError || !membership) {
        console.error('Error or user not group creator:', membershipError);
        return NextResponse.json({ 
          success: false, 
          error: 'You must be the creator of the group to delete members' 
        }, { status: 403 });
      }
    }
    
    console.log(`Emergency deletion for specific member ${memberId}`);
    
    // Try multiple approaches to ensure deletion
    
    // APPROACH 1: Try using the SQL function
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('delete_specific_member_by_id', {
        p_member_id: memberId
      });
      
      if (!rpcError && rpcResult === true) {
        console.log(`Successfully deleted member ${memberId} using SQL function`);
        return NextResponse.json({ 
          success: true, 
          message: `Member ${memberId} deleted successfully`
        });
      } else {
        console.error(`SQL function failed for member ${memberId}:`, rpcError);
      }
    } catch (e) {
      console.error(`Exception in SQL function for member ${memberId}:`, e);
    }
    
    // APPROACH 2: Try direct delete with fresh client
    try {
      const { error: deleteError } = await supabase
        .from('presentation_group_members')
        .delete()
        .eq('id', memberId);
        
      if (!deleteError) {
        console.log(`Successfully deleted member ${memberId} using direct delete`);
        return NextResponse.json({ 
          success: true, 
          message: `Member ${memberId} deleted successfully`
        });
      } else {
        console.error(`Direct delete failed for member ${memberId}:`, deleteError);
      }
    } catch (e) {
      console.error(`Exception in direct delete for member ${memberId}:`, e);
    }
    
    // APPROACH 3: Try with even more specific WHERE conditions
    try {
      const { error: specificDeleteError } = await supabase
        .from('presentation_group_members')
        .delete()
        .eq('id', memberId)
        .eq('is_creator', false);
        
      if (!specificDeleteError) {
        console.log(`Successfully deleted member ${memberId} using specific conditions`);
        return NextResponse.json({ 
          success: true, 
          message: `Member ${memberId} deleted successfully`
        });
      } else {
        console.error(`Specific delete failed for member ${memberId}:`, specificDeleteError);
      }
    } catch (e) {
      console.error(`Exception in specific delete for member ${memberId}:`, e);
    }
    
    // Verify if the member was actually deleted
    const { data: memberCheck, error: checkError } = await supabase
      .from('presentation_group_members')
      .select('id')
      .eq('id', memberId)
      .single();
      
    if (checkError && checkError.code === 'PGRST116') {
      // PGRST116 means "not found" which suggests the member was deleted
      console.log(`Verification shows member ${memberId} was deleted`);
      return NextResponse.json({ 
        success: true, 
        message: `Member ${memberId} appears to have been deleted`
      });
    }
    
    // If we get here, all approaches failed
    return NextResponse.json({ 
      success: false, 
      error: `Failed to delete member ${memberId} despite multiple attempts`
    }, { status: 500 });
    
  } catch (error) {
    console.error('Server error in delete-specific-member route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
} 