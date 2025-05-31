import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { uploadSectionFile } from '@/lib/storage';
import { isAdminRole } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin permissions
    const isAdmin = await isAdminRole(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sectionId = formData.get('sectionId') as string;

    // Validate inputs
    if (!file || !sectionId) {
      return NextResponse.json(
        { error: 'Missing required fields: file and sectionId' },
        { status: 400 }
      );
    }

    // Upload the file
    const result = await uploadSectionFile(file, sectionId);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in upload-section-file API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 