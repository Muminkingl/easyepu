import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadCourseFile, updateCourseFile, deleteCourseFile as deleteCourseFileFromStorage, getCourseFile } from '@/lib/storage';

// This sets up the /api/upload-course-file endpoint
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Get file and userId, courseId from form data
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const courseId = formData.get('courseId') as string;
    
    if (!file || !userId || !courseId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
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
    if (existingFileData && existingFileData.url) {
      try {
        await deleteCourseFileFromStorage(existingFileData.url);
      } catch (deleteError) {
        console.error('Error deleting previous course file:', deleteError);
        // Continue with upload even if delete fails
      }
    }
      
    // Upload file to Vercel Blob Storage
    const fileUrl = await uploadCourseFile(file, courseId);
    
    if (!fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload file to Vercel Blob storage' },
        { status: 500 }
      );
    }
    
    // Update the database with the file URL
    const success = await updateCourseFile(courseId, fileUrl, file.name);
    
    if (!success) {
      console.error('Failed to update database with course file information');
      // If database update fails, try to delete the uploaded file to avoid orphaned files
      try {
        await deleteCourseFileFromStorage(fileUrl);
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