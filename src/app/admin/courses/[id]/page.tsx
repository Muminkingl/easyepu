'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Loader2, BookOpen, Palette, PencilIcon, Eye, EyeOff } from 'lucide-react';
import { getCourseById } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import React from 'react';

interface CoursePageProps {
  params: {
    id: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Unwrap params with React.use()
  const unwrappedParams = React.use(params as any);
  const courseId = unwrappedParams.id;

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        if (!courseData) {
          setError('Course not found');
        } else {
          setCourse(courseData);
        }
      } catch (err) {
        console.error('Error loading course:', err);
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [courseId]);

  if (isRoleLoading || loading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-800/50 rounded-full flex items-center justify-center mb-6 border border-indigo-700/30">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-300" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">Loading Course</h2>
            <p className="text-indigo-300 text-center">Please wait while we fetch the course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-900/30 rounded-full flex items-center justify-center mb-6 border border-amber-800/30">
              <AlertTriangle className="h-10 w-10 text-amber-400" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">Access Restricted</h2>
            <p className="text-indigo-300 text-center mb-6">This area requires administrator privileges to access.</p>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 border border-indigo-600/50"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mb-6 border border-red-800/30">
              <AlertTriangle className="h-10 w-10 text-red-400" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">Error</h2>
            <p className="text-indigo-300 text-center mb-6">{error}</p>
            <Link 
              href="/admin/courses" 
              className="inline-flex items-center justify-center px-5 py-3 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 border border-indigo-600/50"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Return to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/courses"
            className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </Link>
        </div>
        
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-indigo-800/30">
          <div className="border-b border-indigo-800/30 px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-indigo-100 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-indigo-300" />
              Course Details
            </h1>
            <div className="flex space-x-2">
              <Link
                href={`/admin/courses/${courseId}/edit`}
                className="inline-flex items-center px-3 py-1.5 bg-indigo-700/80 text-white text-sm font-medium rounded hover:bg-indigo-600/80 border border-indigo-600/50"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </div>
          </div>

          <div className="p-6">
            <div className={`p-4 mb-6 rounded-lg ${course?.background_color || 'bg-indigo-800/30'} border border-indigo-700/30`}>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-indigo-100">{course?.title}</h2>
                {course?.active ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-800/30">
                    <Eye className="h-3 w-3 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900/40 text-amber-300 border border-amber-800/30">
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
              
              {course?.image_url && (
                <div className="mt-4">
                  <img 
                    src={course.image_url} 
                    alt={course.title} 
                    className="w-full max-h-48 object-cover rounded-md border border-indigo-700/30"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-indigo-300">Description</h3>
                <p className="mt-1 text-indigo-100">{course?.description || 'No description provided.'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-indigo-300">Background Color</h3>
                <div className="mt-1 flex items-center">
                  <div className={`h-6 w-6 mr-2 rounded border border-indigo-700/50 ${course?.background_color || 'bg-indigo-800/50'}`}></div>
                  <span className="text-indigo-200">{course?.background_color || 'bg-indigo-800/50'}</span>
                </div>
              </div>
              
              <div className="border-t border-indigo-800/30 pt-4">
                <h3 className="text-sm font-medium text-indigo-300">Created</h3>
                <p className="mt-1 text-indigo-200">
                  {course?.created_at ? new Date(course.created_at).toLocaleString() : 'Unknown'}
                </p>
              </div>
              
              {course?.updated_at && (
                <div>
                  <h3 className="text-sm font-medium text-indigo-300">Last Updated</h3>
                  <p className="mt-1 text-indigo-200">
                    {new Date(course.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 