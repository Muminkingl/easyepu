import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadCourseFile, updateCourseFile, deleteCourseFile as deleteCourseFileFromStorage, getCourseFile } from '@/lib/storage';

// This sets up the /api/upload-course-file endpoint
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Get data from form data
    const userId = formData.get('userId') as string;
    const courseId = formData.get('courseId') as string;
    
    // Check if this is a Google Drive link submission
    const isExternalLink = formData.get('isExternalLink') === 'true';
    const driveUrl = formData.get('driveUrl') as string;
    const driveLinkFileName = formData.get('fileName') as string;
    
    // The standard file upload
    const file = formData.get('file') as File | null;
    
    if (!userId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // For Google Drive links, we need a URL and filename
    if (isExternalLink && (!driveUrl || !driveLinkFileName)) {
      return NextResponse.json(
        { success: false, error: 'Missing Google Drive link or filename' },
        { status: 400 }
      );
    }
    
    // For file uploads, we need a file
    if (!isExternalLink && !file) {
      return NextResponse.json(
        { success: false, error: 'Missing file for upload' },
        { status: 400 }
      );
    }
    
    // Check user is admin
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    const { data: userData, error: userError } = await supabase
      .from('user_role')
      .select('user_id, role')
      .eq('user_id', userId)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'User does not have admin privileges' },
        { status: 403 }
      );
    }
    
    // Check course exists and belongs to this admin
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, created_by')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    if (courseData.created_by !== userId) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to modify this course' },
        { status: 403 }
      );
    }
    
    // Get the existing file to ensure we delete it
    const existingFileData = await getCourseFile(courseId);
    
    // If an existing file is found, delete it before uploading the new one
    // But only if it's not a Google Drive link
    if (existingFileData && existingFileData.url && !existingFileData.url.includes('drive.google.com')) {
      try {
        await deleteCourseFileFromStorage(existingFileData.url);
      } catch (deleteError) {
        console.error('Error deleting previous course file:', deleteError);
        // Continue with upload even if delete fails
      }
    }
    
    let fileUrl = '';
    let fileName = '';
    
    // Handle Google Drive link
    if (isExternalLink) {
      fileUrl = driveUrl;
      fileName = driveLinkFileName;
    } 
    // Handle file upload 
    else if (file) {
      // Upload file to Vercel Blob Storage
      fileUrl = await uploadCourseFile(file, courseId);
      
      if (!fileUrl) {
        return NextResponse.json(
          { success: false, error: 'Failed to upload file to Vercel Blob storage' },
          { status: 500 }
        );
      }
      
      fileName = file.name;
    }
    
    // Update the database with the file URL or Drive link
    const success = await updateCourseFile(courseId, fileUrl, fileName);
    
    if (!success) {
      console.error('Failed to update database with course file information');
      // If database update fails and we uploaded a file (not a Drive link), try to delete it
      if (!isExternalLink && fileUrl) {
        try {
          await deleteCourseFileFromStorage(fileUrl);
        } catch (cleanupError) {
          console.error('Failed to clean up file after database error:', cleanupError);
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to update database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: fileName
    });
    
  } catch (error) {
    console.error('Error in upload-course-file endpoint:', error);
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