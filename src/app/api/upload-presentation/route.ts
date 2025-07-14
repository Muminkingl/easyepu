import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadPresentationFile, updateGroupPresentationFile, deletePresentationFile, getGroupPresentationFile } from '@/lib/storage';

// This sets up the /api/upload-presentation endpoint
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Get file and userId, groupId from form data
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const groupId = formData.get('groupId') as string;
    
    if (!file || !userId || !groupId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Check user membership
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    const { data: membership, error: membershipError } = await supabase
      .from('presentation_group_members')
      .select('user_id, is_creator')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError || !membership || !membership.is_creator) {
      return NextResponse.json(
        { success: false, error: 'User is not the creator of this group' },
        { status: 403 }
      );
    }
    
    // Get the existing file directly from the database to ensure we delete it
    const existingFileData = await getGroupPresentationFile(Number(groupId));
    
    // If an existing file is found, delete it before uploading the new one
    if (existingFileData && existingFileData.url) {
      try {
        await deletePresentationFile(existingFileData.url);
      } catch (deleteError) {
        console.error('Error deleting previous file:', deleteError);
        // Continue with upload even if delete fails
        }
      }
      
    // Upload file to Vercel Blob Storage using our helper function
    const fileUrl = await uploadPresentationFile(file, Number(groupId));
    
    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to Vercel Blob storage' },
        { status: 500 }
      );
    }
    
    // Update the database with the file URL
    const success = await updateGroupPresentationFile(Number(groupId), fileUrl, file.name);
    
    if (!success) {
      console.error('Failed to update database with file information');
      // If database update fails, try to delete the uploaded file to avoid orphaned files
      try {
        await deletePresentationFile(fileUrl);
      } catch (cleanupError) {
        console.error('Failed to clean up file after database error:', cleanupError);
      }
      
        return NextResponse.json(
          { success: false, error: 'Failed to update database' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
      fileUrl: fileUrl,
        fileName: file.name
      });
    
  } catch (error) {
    console.error('Error in upload-presentation endpoint:', error);
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