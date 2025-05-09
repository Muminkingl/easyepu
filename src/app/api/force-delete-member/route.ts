import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client with admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { memberId } = body;
    
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'Member ID is required' }, { status: 400 });
    }
    
    // console.log(`Force delete: Removing member ${memberId}`);
    
    // Call the SQL function directly
    const { data, error } = await supabase.rpc(
      'force_delete_member',
      { p_member_id: memberId }
    );
    
    if (error) {
      console.error('Error calling force_delete_member function:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Database error: ${error.message}` 
      }, { status: 500 });
    }
    
    // Verify if it worked
    const { data: memberCheck, error: checkError } = await supabase
      .from('presentation_group_members')
      .select('id')
      .eq('id', memberId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if member was deleted:', checkError);
    }
    
    const isDeleted = memberCheck === null; // Member is deleted if we can't find it
    
    return NextResponse.json({ 
      success: isDeleted, 
      message: isDeleted 
        ? `Member ${memberId} was successfully deleted` 
        : `Failed to delete member ${memberId}`
    });
    
  } catch (error) {
    console.error('Server error in force-delete-member route:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    }, { status: 500 });
  }
} 