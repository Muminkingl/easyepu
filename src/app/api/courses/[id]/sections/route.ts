import { NextRequest, NextResponse } from 'next/server';
import { getCourseSections } from '@/lib/supabase';

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
    
    const sections = await getCourseSections(courseId);
    
    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching course sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course sections' },
      { status: 500 }
    );
  }
} 