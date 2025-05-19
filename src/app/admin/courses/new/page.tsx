'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { createCourseAction } from '@/lib/actions';
import { getUserData } from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { 
  ChevronLeft, 
  AlertTriangle, 
  Loader2, 
  BookOpen, 
  Palette, 
  Image as ImageIcon,
  Info,
  CheckCircle,
  X
} from 'lucide-react';

// Available background colors with enhanced palette
const backgroundColors = [
  { value: 'bg-gray-300', label: 'Gray', textColor: 'text-gray-800' },
  { value: 'bg-red-200', label: 'Red', textColor: 'text-red-800' },
  { value: 'bg-orange-200', label: 'Orange', textColor: 'text-orange-800' },
  { value: 'bg-amber-200', label: 'Amber', textColor: 'text-amber-800' },
  { value: 'bg-yellow-200', label: 'Yellow', textColor: 'text-yellow-800' },
  { value: 'bg-lime-200', label: 'Lime', textColor: 'text-lime-800' },
  { value: 'bg-green-200', label: 'Green', textColor: 'text-green-800' },
  { value: 'bg-emerald-200', label: 'Emerald', textColor: 'text-emerald-800' },
  { value: 'bg-teal-200', label: 'Teal', textColor: 'text-teal-800' },
  { value: 'bg-cyan-200', label: 'Cyan', textColor: 'text-cyan-800' },
  { value: 'bg-sky-200', label: 'Sky', textColor: 'text-sky-800' },
  { value: 'bg-blue-200', label: 'Blue', textColor: 'text-blue-800' },
  { value: 'bg-indigo-200', label: 'Indigo', textColor: 'text-indigo-800' },
  { value: 'bg-violet-200', label: 'Violet', textColor: 'text-violet-800' },
  { value: 'bg-purple-200', label: 'Purple', textColor: 'text-purple-800' },
  { value: 'bg-fuchsia-200', label: 'Fuchsia', textColor: 'text-fuchsia-800' },
  { value: 'bg-pink-200', label: 'Pink', textColor: 'text-pink-800' },
  { value: 'bg-rose-200', label: 'Rose', textColor: 'text-rose-800' },
];

export default function CreateCoursePage() {
  const router = useRouter();
  const { user } = useUser();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    imageUrl: '',
    backgroundColor: 'bg-indigo-200',
    semester: 1,
  });
  
  // Current admin's semester
  const [adminSemester, setAdminSemester] = useState<number | null>(null);

  // Available semesters (1-8)
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewImage, setPreviewImage] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    title: false,
    description: false,
    imageUrl: false,
  });

  // For parallax effect on scroll
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Get admin's semester when component mounts
    async function loadUserSemester() {
      if (!user) return;
      
      try {
        const userData = await getUserData(user.id);
        const semester = userData?.semester || null;
        
        if (semester !== null) {
          setAdminSemester(semester);
          // Set the form's semester to match admin's semester
          setFormValues(prev => ({ ...prev, semester }));
        } else {
          // Redirect to profile if admin has no semester selected
          router.push('/dashboard/profile');
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to get your semester information. Please try again.');
      }
    }
    
    if (user) {
      loadUserSemester();
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Mark field as touched
    if (!touchedFields[name as keyof typeof touchedFields]) {
      setTouchedFields(prev => ({ ...prev, [name]: true }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
  };

  const isImageUrlValid = (url: string) => {
    if (!url) return true; // Empty URL is valid
    try {
      new URL(url);
      return url.match(/\.(jpeg|jpg|gif|png|webp)$/) !== null;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!formValues.title.trim()) {
      setError('Course title is required');
      return;
    }

    if (formValues.imageUrl && !isImageUrlValid(formValues.imageUrl)) {
      setError('Please enter a valid image URL');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      console.log('Submitting form with user ID:', user.id);
      console.log('Form values:', formValues);
      
      const courseId = await createCourseAction(
        String(user.id),
        formValues.title.trim(),
        formValues.description.trim() || null,
        formValues.imageUrl.trim() || null,
        formValues.backgroundColor,
        null, // instructorName
        null, // instructorTitle
        null, // instructorEmail
        null, // instructorImage
        formValues.semester // Pass the semester
      );

      console.log('Result from createCourseAction:', courseId);

      if (courseId) {
        setSuccess('Course created successfully!');
        setTimeout(() => {
          router.push('/admin/courses');
        }, 1000);
      } else {
        throw new Error('Failed to create course');
      }
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
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

  // Unauthorized state
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

  // Course preview card
  const getCoursePreview = () => {
    const selectedColor = backgroundColors.find(color => color.value === formValues.backgroundColor);
    const textColor = selectedColor?.textColor || 'text-gray-800';
    
    return (
      <div className="w-full rounded-xl overflow-hidden shadow-lg">
        <div className={`h-40 relative ${formValues.backgroundColor}`}>
          {formValues.imageUrl && isImageUrlValid(formValues.imageUrl) ? (
            <img 
              src={formValues.imageUrl} 
              alt="Course preview" 
              className="w-full h-full object-cover" 
              onError={() => setPreviewImage(false)}
              onLoad={() => setPreviewImage(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className={`h-16 w-16 opacity-30 ${textColor}`} />
            </div>
          )}
        </div>
        <div className="p-5 bg-indigo-800/30 border-t border-indigo-700/30">
          <h3 className="font-bold text-xl mb-2 line-clamp-1 text-indigo-100">
            {formValues.title || 'Course Title'}
          </h3>
          <p className="text-indigo-300 text-sm line-clamp-2">
            {formValues.description || 'Your course description will appear here.'}
          </p>
        </div>
      </div>
    );
  };

  // Main form
  return (
    <div className="min-h-screen bg-indigo-950">
      {/* Top floating navigation bar */}
      <div className="sticky top-0 z-10 bg-indigo-900/80 backdrop-blur-md shadow-sm border-b border-indigo-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/admin/courses"
            className="inline-flex items-center space-x-1 text-indigo-300 hover:text-indigo-100 font-medium transition-colors group"
          >
            <ChevronLeft className="h-5 w-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
            <span>Back to Courses</span>
          </Link>
          
          <div className="hidden sm:block text-sm text-indigo-300">
            {formValues.title ? `Creating: ${formValues.title}` : 'New Course'}
          </div>
        </div>
      </div>

      {/* Success notification */}
      {success && (
        <div className="fixed top-20 right-4 z-50 bg-green-900/40 border-l-4 border-green-500 shadow-lg rounded-lg py-3 px-4 flex items-center max-w-sm animate-slide-in-right backdrop-blur-sm border border-green-800/30">
          <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
          <span className="text-green-200">{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="ml-auto text-green-400 hover:text-green-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 
            className="text-3xl sm:text-4xl font-bold text-indigo-100 mb-2"
            style={{ 
              transform: `translateY(${scrollY * 0.1}px)`,
              opacity: 1 - (scrollY * 0.001) 
            }}
          >
            Create New Course
          </h1>
          <p className="text-indigo-300 max-w-2xl">
            Design your course with an eye-catching title, description, and visual theme to engage your students.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800/30 text-red-300 px-4 py-3 rounded-lg backdrop-blur-sm">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form section */}
          <div className="lg:col-span-2">
            <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-indigo-800/30 transition-all hover:shadow-lg">
              <div className="border-b border-indigo-800/30 px-6 py-4">
                <h2 className="font-semibold text-indigo-100 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-indigo-300" />
                  Course Details
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-indigo-300 mb-1">
                    Course Title <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formValues.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      className={`w-full px-4 py-3 bg-indigo-800/30 border ${
                        touchedFields.title && !formValues.title.trim() ? 'border-red-500/50 bg-red-900/20' : 'border-indigo-700/50'
                      } rounded-lg text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                      placeholder="e.g. Introduction to Programming"
                    />
                    {touchedFields.title && !formValues.title.trim() && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                    )}
                  </div>
                  {touchedFields.title && !formValues.title.trim() && (
                    <p className="mt-1 text-sm text-red-400">Title is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-indigo-300 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formValues.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={4}
                    className="w-full px-4 py-3 bg-indigo-800/30 border border-indigo-700/50 rounded-lg text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="What will students learn in this course?"
                  ></textarea>
                  <p className="mt-1 text-sm text-indigo-400 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    A clear description helps students understand the course content
                  </p>
                </div>

                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-indigo-300 mb-1">
                    Cover Image URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <input
                      type="url"
                      id="imageUrl"
                      name="imageUrl"
                      value={formValues.imageUrl}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-3 bg-indigo-800/30 border ${
                        touchedFields.imageUrl && formValues.imageUrl && !isImageUrlValid(formValues.imageUrl)
                          ? 'border-red-500/50 bg-red-900/20'
                          : 'border-indigo-700/50'
                      } rounded-lg text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                      placeholder="https://example.com/course-image.jpg"
                    />
                  </div>
                  {touchedFields.imageUrl && formValues.imageUrl && !isImageUrlValid(formValues.imageUrl) ? (
                    <p className="mt-1 text-sm text-red-400">Please enter a valid image URL (ending with .jpg, .jpeg, .png, .gif, or .webp)</p>
                  ) : (
                    <p className="mt-1 text-sm text-indigo-400">
                      Optional: Add a cover image to make your course stand out
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="backgroundColor" className="block text-sm font-medium text-indigo-300 mb-2 flex items-center">
                    <Palette className="h-4 w-4 mr-1" />
                    Theme Color
                  </label>

                  <div className="bg-indigo-800/20 p-4 rounded-lg mb-3 border border-indigo-700/30">
                    <div className="flex flex-wrap gap-2">
                      {backgroundColors.map(color => (
                        <button
                          type="button"
                          key={color.value}
                          onClick={() => setFormValues(prev => ({ ...prev, backgroundColor: color.value }))}
                          className={`w-8 h-8 rounded-full cursor-pointer ${color.value} transition-all transform hover:scale-110 ${
                            formValues.backgroundColor === color.value 
                              ? 'ring-2 ring-offset-2 ring-indigo-400 scale-110' 
                              : 'hover:shadow-md'
                          }`}
                          title={color.label}
                          aria-label={`Select ${color.label} color`}
                        ></button>
                      ))}
                    </div>
                  </div>

                  <select
                    id="backgroundColor"
                    name="backgroundColor"
                    value={formValues.backgroundColor}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-indigo-800/30 border border-indigo-700/50 rounded-lg text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    aria-label="Select background color"
                  >
                    {backgroundColors.map(color => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="semester" className="block text-sm font-medium text-indigo-300 mb-1">
                    Semester <span className="text-red-400">*</span>
                  </label>
                  <div className="w-full px-4 py-3 bg-indigo-800/30 border border-indigo-700/50 rounded-lg text-indigo-100">
                    Semester {formValues.semester}
                  </div>
                  <p className="mt-1 text-sm text-indigo-400 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Courses can only be created for your selected semester
                  </p>
                </div>

                <div className="pt-4 flex items-center justify-end space-x-3">
                  <Link
                    href="/admin/courses"
                    className="px-5 py-2.5 border border-indigo-700/50 text-indigo-300 rounded-lg hover:bg-indigo-800/40 transition-colors font-medium"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2.5 bg-indigo-700/80 text-white rounded-lg transition-all border border-indigo-600/50
                      ${submitting 
                        ? 'opacity-70 cursor-not-allowed' 
                        : 'hover:bg-indigo-600/80 hover:shadow-lg active:transform active:scale-95'}`}
                  >
                    {submitting ? (
                      <span className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Creating...
                      </span>
                    ) : (
                      'Create Course'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Preview section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-lg font-medium text-indigo-200 mb-4">Preview</h3>
              <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-indigo-800/30">
                {getCoursePreview()}
              </div>
              <div className="mt-4 bg-indigo-800/30 rounded-lg p-4 border border-indigo-700/30">
                <h4 className="font-medium flex items-center text-indigo-200 mb-2">
                  <Info className="h-4 w-4 mr-1.5" />
                  Course Tips
                </h4>
                <ul className="text-sm text-indigo-300 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-1.5 text-indigo-400">•</span>
                    Use a clear, descriptive title that highlights the main focus
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1.5 text-indigo-400">•</span>
                    Choose colors that complement your course subject
                  </li>
                  <li className="flex items-start">
                    <span className="mr-1.5 text-indigo-400">•</span>
                    Keep descriptions concise and highlight key learning outcomes
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}