'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminCourses, Course } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { deleteCourseAction } from '@/lib/actions';
import { 
  ChevronLeft, 
  PlusCircle, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Edit, 
  Loader2,
  Eye,
  BookOpen,
  Palette,
  Image as ImageIcon
} from 'lucide-react';

export default function CoursesAdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getAdminCourses();
        setCourses(data);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    setDeleting(id);
    try {
      console.log('Deleting course with ID:', id);
      
      const success = await deleteCourseAction(id);
      console.log('Delete result:', success);
      
      if (success) {
        setCourses(prev => prev.filter(c => c.id !== id));
      } else {
        throw new Error('Failed to delete course');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setError('Failed to delete course. Please check console for details.');
    } finally {
      setDeleting(null);
    }
  };

  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-800/50 rounded-full flex items-center justify-center mb-6 border border-indigo-700/30">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-300" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-2xl font-bold text-indigo-100 mb-2">Checking Access</h2>
            <p className="text-indigo-300 text-center">Verifying your admin permissions...</p>
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

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors group"
            >
              <ChevronLeft className="h-5 w-5 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-indigo-100">Manage Courses</h1>
          </div>
          
          <Link
            href="/admin/courses/new"
            className="flex items-center justify-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Course
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800/30 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center border border-indigo-800/30">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-300 mx-auto mb-4" />
            <p className="text-indigo-300">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center border border-indigo-800/30">
            <BookOpen className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">No Courses Yet</h2>
            <p className="text-indigo-300 mb-6">
              You haven't created any courses yet. Create your first course to get started.
            </p>
            <Link
              href="/admin/courses/new"
              className="inline-flex items-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Course
            </Link>
          </div>
        ) : (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-indigo-800/30">
            <div className="border-b border-indigo-800/30 px-6 py-4">
              <h2 className="font-semibold text-indigo-100">All Courses</h2>
            </div>
            
            <div className="divide-y divide-indigo-800/30">
              {courses.map((course, index) => (
                <div key={course.id} className={`p-6 ${
                  index % 2 === 0 ? 'bg-indigo-900/20' : 'bg-indigo-900/40'
                } hover:bg-indigo-800/30 transition-colors`}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-md mr-3 ${course.background_color}`}></div>
                        <h3 className="text-lg font-semibold text-indigo-100">{course.title}</h3>
                      </div>
                      
                      {course.description && (
                        <p className="mt-2 text-indigo-300 line-clamp-2">{course.description}</p>
                      )}
                      
                      <div className="mt-2 flex flex-wrap items-center text-sm text-indigo-400 gap-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{new Date(course.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        {course.image_url && (
                          <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-1" />
                            <span className="truncate max-w-[150px]">{course.image_url}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Palette className="h-4 w-4 mr-1" />
                          <span>{course.background_color}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            course.active 
                              ? 'bg-green-900/40 text-green-300 border border-green-800/30' 
                              : 'bg-amber-900/40 text-amber-300 border border-amber-800/30'
                          }`}>
                            {course.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="p-2 text-indigo-300 hover:text-indigo-100 hover:bg-indigo-700/40 rounded-lg transition-colors"
                        title="View course"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="p-2 text-blue-300 hover:text-blue-100 hover:bg-blue-800/30 rounded-lg transition-colors"
                        title="Edit course"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deleting === course.id}
                        className={`p-2 text-red-300 hover:text-red-100 hover:bg-red-900/30 rounded-lg transition-colors ${
                          deleting === course.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Delete course"
                      >
                        {deleting === course.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 