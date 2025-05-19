import { NextRequest, NextResponse } from 'next/server';
import { getAllCourseFiles, getCourseById, getUserData } from '@/lib/supabase';
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Get the current user ID from auth or header (set by middleware)
    const { userId } = auth() || {};
    // Also check the X-User-ID header set by middleware as fallback
    const headerUserId = request.headers.get('X-User-ID');
    
    // Use either auth userId or header userId
    const currentUserId = userId || headerUserId;
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Handle params as Promise in Next.js 15.3+
    const resolvedParams = 'then' in params ? await params : params;
    const courseId = resolvedParams.id;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    
    // Get the course to check semester
    const course = await getCourseById(courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Get the user's data including semester
    const userData = await getUserData(currentUserId);
    
    // If this is a semester-specific course, check if user's semester matches
    if (course.semester !== null && userData?.semester !== null) {
      if (course.semester !== userData.semester) {
        return NextResponse.json(
          { error: 'Access denied - course not available for your semester' },
          { status: 403 }
        );
      }
    }
    
    const files = await getAllCourseFiles(courseId);
    
    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching course files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course files' },
      { status: 500 }
    );
  }
} 