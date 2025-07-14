import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs';

// Directly create a fresh Supabase instance for server operations
// This bypasses potential client-side caching issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist the session, fresh instance every time
    autoRefreshToken: false, // Don't auto refresh token
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
    const { groupId, memberIds, forceDelete } = body;
    
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 });
    }
    
    // Verify user is the creator of the group
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
    
    // Log the operation
    // console.log(`Server delete: Removing ${memberIds ? 'specific' : 'all non-creator'} members from group ${groupId} by request of ${userId}, forceDelete=${!!forceDelete}`);
    
    let deleteSuccess = false;
    
    // If force delete flag is set, use the most direct approach possible
    if (forceDelete) {
      // console.log("FORCE DELETE mode activated - using maximum authority");
      
      try {
        // Attempt direct SQL execution using the database function
        const { error: forceError } = await supabase.rpc('force_delete_members', {
          p_group_id: groupId
        });
        
        if (!forceError) {
          // console.log("Force delete function succeeded");
          deleteSuccess = true;
        } else {
          console.error("Force delete function failed:", forceError);
          
          // Try the most direct approach possible without RLS constraints
          try {
            // Use a direct SQL delete with admin privileges
            const { error: directSqlError } = await supabase
              .from('presentation_group_members')
              .delete()
              .eq('group_id', groupId)
              .neq('is_creator', true); // Delete all that aren't creators
            
            if (!directSqlError) {
              // console.log("Direct SQL delete succeeded");
              deleteSuccess = true;
            } else {
              console.error("Direct SQL delete failed:", directSqlError);
            }
          } catch (sqlError) {
            console.error("Exception in direct SQL delete:", sqlError);
          }
        }
      } catch (rpcError) {
        console.error("Exception in force delete RPC call:", rpcError);
      }
    } else {
      // Regular deletion approaches
      
      // If specific member IDs were provided, try to delete those first
      if (memberIds && memberIds.length > 0) {
        // console.log(`Attempting to delete specific members: ${memberIds.join(', ')}`);
        
        // Try multiple deletion methods for the specific members
        const { error: specificDeleteError } = await supabase
          .from('presentation_group_members')
          .delete()
          .in('id', memberIds)
          .eq('group_id', groupId)
          .eq('is_creator', false);
          
        if (specificDeleteError) {
          console.error('Specific member delete failed:', specificDeleteError);
        } else {
          deleteSuccess = true;
        }
      } else {
        // Delete ALL non-creator members using server-side authority
        
        // 1. First try with a transaction for atomicity
        const { error: deleteError } = await supabase.rpc('delete_all_group_members', {
          p_group_id: groupId
        });
        
        if (!deleteError) {
          deleteSuccess = true;
        } else {
          console.error('RPC delete failed, trying direct delete:', deleteError);
          
          // 2. Fall back to direct delete
          const { error: directDeleteError } = await supabase
            .from('presentation_group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('is_creator', false);
            
          if (!directDeleteError) {
            deleteSuccess = true;
          } else {
            console.error('Direct delete failed:', directDeleteError);
            
            // 3. Try most direct raw SQL approach (requires service role key)
            try {
              const { error: rawSqlError } = await supabase.rpc('force_delete_members', {
                p_group_id: groupId
              });
              
              if (!rawSqlError) {
                deleteSuccess = true;
              } else {
                console.error('Raw SQL delete failed:', rawSqlError);
              }
            } catch (sqlError) {
              console.error('Exception in raw SQL deletion:', sqlError);
            }
          }
        }
      }
    }
    
    // FINAL ATTEMPT: Direct, unchecked deletion as last resort
    if (!deleteSuccess) {
      // console.log("All previous deletion attempts failed, trying emergency direct deletion");
      
      try {
        // This is the most direct possible approach 
        await supabase.from('presentation_group_members')
          .delete()
          .eq('group_id', groupId)
          .neq('user_id', userId);
        
        deleteSuccess = true;
      } catch (emergencyError) {
        console.error('Emergency deletion failed:', emergencyError);
      }
    }
    
    // Verify all members were deleted except the creator
    const { data: remainingMembers, error: verifyError } = await supabase
      .from('presentation_group_members')
      .select('id, is_creator, user_id')
      .eq('group_id', groupId);
      
    if (verifyError) {
      console.error('Error verifying deletions:', verifyError);
      return NextResponse.json({ 
        success: deleteSuccess, 
        message: 'Delete operation completed but verification failed' 
      });
    }
    
    // Should only be one member remaining (the creator)
    const nonCreatorMembers = remainingMembers?.filter(m => !m.is_creator) || [];
    
    if (memberIds && memberIds.length > 0) {
      // When deleting specific members, check if those specific IDs were deleted
      const remainingIds = nonCreatorMembers.map(m => m.id);
      const failedDeletions = memberIds.filter(id => remainingIds.includes(id));
      
      if (failedDeletions.length > 0) {
        console.error(`Failed to delete members: ${failedDeletions.join(', ')}`);
        return NextResponse.json({ 
          success: false, 
          error: 'Some members could not be deleted',
          failedIds: failedDeletions
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Members deleted successfully'
      });
    } else {
      // When deleting all members, check if any non-creator members remain
      if (nonCreatorMembers.length > 0) {
        console.error(`Failed to delete all members. ${nonCreatorMembers.length} non-creator members remain.`);
        
        // One last desperate attempt to delete members one-by-one
        let lastResortSuccess = true;
        for (const member of nonCreatorMembers) {
          const { error: individualError } = await supabase
            .from('presentation_group_members')
            .delete()
            .eq('id', member.id);
          
          if (individualError) {
            console.error(`Failed to delete member ${member.id}:`, individualError);
            lastResortSuccess = false;
          }
        }
        
        return NextResponse.json({ 
          success: lastResortSuccess, 
          error: lastResortSuccess ? undefined : 'Some members could not be deleted despite multiple attempts',
          remainingCount: lastResortSuccess ? 0 : nonCreatorMembers.length
        }, { status: lastResortSuccess ? 200 : 500 });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All members deleted successfully'
    });
    
  } catch (error) {
    console.error('Server error in delete-members route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
} 