'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminCourses, Course, getUserData } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { deleteCourseAction } from '@/lib/actions';
import { useUser } from '@clerk/nextjs';
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
  Image as ImageIcon,
  BookOpenCheck
} from 'lucide-react';

export default function CoursesAdminPage() {
  const router = useRouter();
  const { user } = useUser();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentSemester, setCurrentSemester] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      
      try {
        const userData = await getUserData(user.id);
        setCurrentSemester(userData?.semester || null);
        setIsOwner(userData?.role === 'owner');
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    }
    
    if (user) {
      loadUserData();
    }
  }, [user]);
  
  useEffect(() => {
    async function loadCourses() {
      if (!user || currentSemester === undefined) return;
      
      try {
        setLoading(true);
        const data = await getAdminCourses(user.id);
        setCourses(data);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    if (user && currentSemester !== undefined) {
      loadCourses();
    }
  }, [user, currentSemester]);

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

  // Check if admin has selected a semester
  if (currentSemester === null && !isOwner) {
    return (
      <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors group"
            >
              <ChevronLeft className="h-5 w-5 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-indigo-100">Manage Courses</h1>
          </div>
          
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md p-8 text-center border border-indigo-800/30">
            <AlertTriangle className="h-16 w-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-indigo-100 mb-4">No Semester Selected</h2>
            <p className="text-indigo-300 mb-8">
              You need to select a semester in your profile before you can manage courses.
              As an admin, you will only be able to manage courses for your selected semester.
            </p>
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center py-3 px-6 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
            >
              Go to Profile
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
            <div className="text-indigo-300 text-sm mt-1">
              <span className={`${isOwner ? 'bg-purple-800/50' : 'bg-indigo-800/50'} px-2 py-1 rounded-md flex items-center space-x-1`}>
                {isOwner && (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-300 mr-1">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                    <span className="text-purple-300">Owner Access: All Semesters</span>
                  </>
                )}
                {!isOwner && (
                  <>Semester {currentSemester}</>
                )}
              </span>
            </div>
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
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">
              No Courses for Semester {currentSemester}
            </h2>
            <p className="text-indigo-300 mb-6">
              You haven't created any courses for Semester {currentSemester} yet.
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
            <div className="border-b border-indigo-800/30 px-6 py-4 flex justify-between items-center">
              <h2 className="font-semibold text-indigo-100">
                Courses for Semester {currentSemester}
              </h2>
              <span className="bg-indigo-800/50 px-3 py-1 rounded-full text-sm text-indigo-200">
                {courses.length} course{courses.length !== 1 ? 's' : ''}
              </span>
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