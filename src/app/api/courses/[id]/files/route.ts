import { NextRequest, NextResponse } from 'next/server';
import { getAllCourseFiles } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle params as Promise in Next.js 15.3+
    const resolvedParams = 'then' in params ? await params : params;
    const courseId = resolvedParams.id;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
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