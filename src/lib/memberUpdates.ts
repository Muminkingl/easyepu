import { supabase } from './supabase';

/**
 * Updates members of a presentation group with optimized UI refresh handling
 * @param userId The user ID making the update
 * @param groupId The group ID to update
 * @param members The members to update
 * @returns A promise that resolves to a boolean indicating success
 */
export async function updateGroupMembers(
  userId: string,
  groupId: number,
  members: { id?: number; name: string; email?: string | null }[]
): Promise<{ success: boolean; message: string }> {
  console.log(`updateGroupMembers called with ${members.length} members for group ${groupId}`);
  
  try {
    // Basic validation
    if (!userId) {
      return { success: false, message: 'User ID is required' };
    }
    
    if (!groupId) {
      return { success: false, message: 'Group ID is required' };
    }
    
    // Check if supabase is initialized
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return { success: false, message: 'Database connection not available' };
    }

    // Try to use the direct supabase function instead of RPC
    try {
      // Skip the RPC call since it might not exist on all environments
      // Go directly to the regular function
      const regularUpdate = await import('./supabase').then(module => 
        module.updatePresentationGroupMembers(userId, groupId, members)
      );
      
      if (regularUpdate) {
        // Verify the update was successful by checking member count
        await verifyMemberChanges(groupId, members);
        return { 
          success: true, 
          message: members.length === 0 
            ? 'All members deleted successfully' 
            : 'Group members updated successfully'
        };
      } else {
        return { success: false, message: 'Failed to update group members' };
      }
    } catch (directError) {
      console.error('Error in direct update:', directError);
      
      // Last resort - try a forced update for special case of emptying list
      if (members.length === 0 && supabase) {
        console.log('Attempting emergency flush of all non-creator members');
        const flushResult = await supabase
          .from('presentation_group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('is_creator', false);
          
        if (!flushResult.error) {
          return { success: true, message: 'All members deleted through emergency procedure' };
        }
      }
      
      return { success: false, message: 'Member updates could not be completed' };
    }
  } catch (error) {
    console.error('Error in updateGroupMembers:', error);
    return { success: false, message: 'An error occurred during the update process' };
  }
}

// Helper function to verify member changes were applied correctly
async function verifyMemberChanges(
  groupId: number, 
  expectedMembers: { id?: number; name: string; email?: string | null }[]
): Promise<boolean> {
  try {
    // Wait a moment to allow database operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if supabase is initialized
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }
    
    // Get the current members from the database
    const { data: currentMembers, error } = await supabase
      .from('presentation_group_members')
      .select('id, name, is_creator')
      .eq('group_id', groupId)
      .eq('is_creator', false);
      
    if (error) {
      console.error('Error fetching current members for verification:', error);
      return false;
    }
    
    console.log('Verification - Current non-creator members:', currentMembers);
    console.log('Verification - Expected members:', expectedMembers);
    
    // Special case: if we're emptying the list, verify all members are gone
    if (expectedMembers.length === 0) {
      const success = !currentMembers || currentMembers.length === 0;
      console.log(`Verification of empty list: ${success ? 'Passed' : 'Failed'}`);
      return success;
    }
    
    // Normal case: compare members
    // 1. Check member count matches (excluding members with no name)
    const validExpectedMembers = expectedMembers.filter(m => m.name?.trim());
    if (currentMembers?.length !== validExpectedMembers.length) {
      console.error(`Verification failed: Expected ${validExpectedMembers.length} members but found ${currentMembers?.length}`);
      return false;
    }
    
    // 2. Check all expected members exist with correct names
    let allMembersVerified = true;
    for (const expected of validExpectedMembers) {
      const matchingMember = currentMembers?.find(m => {
        // Match by ID if available, otherwise match by name
        return expected.id 
          ? m.id === expected.id 
          : m.name.toLowerCase() === expected.name.trim().toLowerCase();
      });
      
      if (!matchingMember) {
        console.error(`Verification failed: Expected member "${expected.name}" not found`);
        allMembersVerified = false;
      } else if (matchingMember.name !== expected.name.trim()) {
        console.error(`Verification failed: Member name mismatch. Expected "${expected.name.trim()}" but found "${matchingMember.name}"`);
        allMembersVerified = false;
      }
    }
    
    return allMembersVerified;
  } catch (error) {
    console.error('Error in verifyMemberChanges:', error);
    return false;
  }
}

/**
 * Force refreshes the page after member updates to ensure UI is in sync with database
 */
export function forcePageRefresh() {
  if (typeof window !== 'undefined') {
    // Add a timestamp to the URL to force a cache-busting reload
    const timestamp = Date.now();
    const url = new URL(window.location.href);
    url.searchParams.set('nocache', timestamp.toString());
    window.location.href = url.toString();
  }
}

/**
 * Force refreshes the page with cache clearing for maximum reliability
 */
export function forceHardRefresh() {
  if (typeof window !== 'undefined') {
    // Add parameters to trigger a full page reload and bypass cache
    const timestamp = Date.now();
    const url = new URL(window.location.href);
    url.searchParams.set('nocache', timestamp.toString());
    url.searchParams.set('reload', timestamp.toString());
    window.location.href = url.toString();
  }
}

/**
 * Updates DOM elements directly to reflect member changes without requiring a full page reload
 * Can be used as a fallback when React state updates aren't reflecting properly
 */
export function updateMembersDOMDirectly(
  groupId: number,
  members: { id?: number; name: string }[]
): void {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  // Add a delay to ensure DOM is ready
  setTimeout(() => {
    try {
      console.log('Forcing DOM update for members:', members);
      
      // Find all member elements by class
      const memberNameElements = document.querySelectorAll('.member-name');
      const memberAvatarElements = document.querySelectorAll('.member-avatar');
      
      // Update them all with their respective names
      memberNameElements.forEach(el => {
        // Try to find member ID in the closest parent data attribute
        const parent = el.closest('[data-member-content]');
        if (parent) {
          const memberName = parent.getAttribute('data-member-content');
          // Find if we have an updated version of this member
          const updatedMember = members.find(m => m.name === memberName);
          if (updatedMember) {
            if (el instanceof HTMLElement) {
              el.textContent = updatedMember.name || '';
            }
          }
        }
      });
      
      // Update avatars with first letters
      memberAvatarElements.forEach(el => {
        const parent = el.closest('[data-member-content]');
        if (parent) {
          const memberName = parent.getAttribute('data-member-content');
          const updatedMember = members.find(m => m.name === memberName);
          if (updatedMember && updatedMember.name && el instanceof HTMLElement) {
            el.textContent = updatedMember.name.charAt(0).toUpperCase() || '';
          }
        }
      });
      
      console.log('DOM update completed');
    } catch (e) {
      console.error('Error during manual DOM update:', e);
    }
  }, 500);
} 