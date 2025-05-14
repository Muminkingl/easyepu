'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, AlertTriangle, Loader2, BookOpen, Palette, PencilIcon, Eye, EyeOff, Upload, FileIcon, CheckCircle, XCircle, Download, LinkIcon } from 'lucide-react';
import { getCourseById } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { getCourseFileAction } from '@/lib/actions';
import { useUser } from '@clerk/nextjs';
import React from 'react';

interface CoursePageProps {
  params: {
    id: string;
  };
}

// Add a Google Drive link component
const GoogleDriveLinkForm = ({ courseId, onSuccess, onCancel }: { courseId: string, onSuccess: () => void, onCancel: () => void }) => {
  const [driveLinkUrl, setDriveLinkUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driveLinkUrl.trim()) {
      setError('Please enter a valid Google Drive link');
      return;
    }
    
    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }
    
    if (!user) {
      setError('You must be logged in');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Create FormData for the API call
      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('courseId', courseId);
      formData.append('driveUrl', driveLinkUrl);
      formData.append('fileName', fileName);
      formData.append('isExternalLink', 'true');
      
      // Use the existing endpoint but with link data
      const response = await fetch('/api/upload-course-file', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Failed to save Google Drive link.');
      }
    } catch (error) {
      console.error('Error saving Google Drive link:', error);
      setError('An error occurred while saving the link.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-800/30">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center">
        <LinkIcon className="h-5 w-5 text-indigo-400 mr-2" />
        Add Google Drive Link
      </h3>
      
      {error && (
        <div className="p-3 bg-red-900/30 border border-red-800/40 rounded-md mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fileName" className="block text-sm font-medium text-indigo-300 mb-1">
            File Name *
          </label>
          <input
            type="text"
            id="fileName"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-white"
            placeholder="e.g., Course Syllabus"
            required
          />
        </div>
        
        <div>
          <label htmlFor="driveLink" className="block text-sm font-medium text-indigo-300 mb-1">
            Google Drive Link *
          </label>
          <input
            type="url"
            id="driveLink"
            value={driveLinkUrl}
            onChange={(e) => setDriveLinkUrl(e.target.value)}
            className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-md text-white"
            placeholder="https://drive.google.com/file/d/..."
            required
          />
          <p className="mt-1 text-xs text-indigo-400">
            Paste a shareable Google Drive link (make sure it's set to "Anyone with the link can view")
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving...' : 'Save Link'}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-indigo-900/40 hover:bg-indigo-800/40 text-indigo-300 rounded-md"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default function CoursePage({ params }: CoursePageProps) {
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useUser();
  const [courseFile, setCourseFile] = useState<{ url: string; name: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const [fileUploadSuccess, setFileUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDriveLinkForm, setShowDriveLinkForm] = useState(false);
  
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
          
          // Load course file if it exists
          const fileData = await getCourseFileAction(courseId);
          if (fileData) {
            setCourseFile(fileData);
          }
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    // Reset states
    setFileUploadError('');
    setFileUploadSuccess('');
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileUploadError('File size exceeds the 10MB limit.');
      return;
    }
    
    // Validate file type (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, etc.)
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type)) {
      setFileUploadError('Invalid file type. Please upload PDF, DOC, DOCX, PPT, PPTX, XLS, or XLSX files.');
      return;
    }
    
    setUploadingFile(true);
    
    try {
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('courseId', courseId);
      
      // Use the server-side endpoint to handle the upload
      const response = await fetch('/api/upload-course-file', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFileUploadSuccess('File uploaded successfully!');
        
        // Update the course file state for immediate feedback
        setCourseFile({ 
          url: result.fileUrl, 
          name: result.fileName 
        });
        
        // Reload the course data to ensure we have the latest info
        const updatedCourse = await getCourseById(courseId);
        if (updatedCourse) {
          setCourse(updatedCourse);
        }
      } else {
        setFileUploadError(result.error || 'Failed to upload file.');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileUploadError('An error occurred during file upload.');
    } finally {
      setUploadingFile(false);
      
      // Clear the input field so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Add this function to handle successful link submission
  const handleDriveLinkSuccess = async () => {
    setShowDriveLinkForm(false);
    setFileUploadSuccess('Google Drive link saved successfully!');
    
    // Reload the course data to ensure we have the latest info
    const updatedCourse = await getCourseById(courseId);
    if (updatedCourse) {
      setCourse(updatedCourse);
    }
    
    // Update the course file state
    const courseFileData = await getCourseFileAction(courseId);
    if (courseFileData) {
      setCourseFile(courseFileData);
    }
  };

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

            {/* Course file upload section */}
            <div className="mt-6 border-t border-indigo-800/30 pt-6">
              <h3 className="text-lg font-medium text-indigo-100 mb-4">Course Materials</h3>
              
              {fileUploadError && (
                <div className="mb-4 p-3 bg-red-900/30 rounded-lg text-red-300 border border-red-800/30 flex items-start">
                  <XCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{fileUploadError}</span>
                </div>
              )}
              
              {fileUploadSuccess && (
                <div className="mb-4 p-3 bg-green-900/30 rounded-lg text-green-300 border border-green-800/30 flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{fileUploadSuccess}</span>
                </div>
              )}
              
              {courseFile ? (
                <div className="mb-4">
                  <div className="p-4 bg-indigo-800/30 rounded-lg border border-indigo-700">
                    <div className="flex items-center">
                      <FileIcon className="h-6 w-6 text-indigo-400 mr-3" />
                      <div>
                        <div className="font-medium text-white">{courseFile.name}</div>
                        <div className="text-xs text-indigo-300">
                          {courseFile.url.includes('drive.google.com') ? 'Google Drive Link' : 'Uploaded File'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex space-x-2">
                      <a 
                        href={courseFile.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-700/50 text-white font-medium rounded hover:bg-blue-600/50 border border-blue-600/30"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </a>
                      <a
                        href={courseFile.url}
                        download={!courseFile.url.includes('drive.google.com')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 text-xs bg-indigo-700/50 text-white font-medium rounded hover:bg-indigo-600/50 border border-indigo-600/30"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {courseFile.url.includes('drive.google.com') ? 'Open' : 'Download'}
                      </a>
                      <label
                        className="inline-flex items-center px-3 py-1.5 text-xs bg-amber-700/50 text-white font-medium rounded hover:bg-amber-600/50 border border-amber-600/30 cursor-pointer"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Replace
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  {showDriveLinkForm ? (
                    <GoogleDriveLinkForm 
                      courseId={courseId} 
                      onSuccess={handleDriveLinkSuccess}
                      onCancel={() => setShowDriveLinkForm(false)} 
                    />
                  ) : (
                    <div className="p-4 bg-indigo-800/30 rounded-lg border border-dashed border-indigo-700 text-center">
                      <FileIcon className="h-8 w-8 mx-auto mb-2 text-indigo-400" />
                      <p className="text-indigo-300 text-sm mb-3">No file uploaded yet</p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <label className="inline-flex items-center px-4 py-2 bg-indigo-700/50 text-white font-medium rounded-lg hover:bg-indigo-600/50 border border-indigo-600/30 cursor-pointer transition-colors">
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingFile ? 'Uploading...' : 'Upload Course Materials'}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                            disabled={uploadingFile}
                          />
                        </label>
                        
                        <button
                          onClick={() => setShowDriveLinkForm(true)}
                          className="inline-flex items-center px-4 py-2 bg-blue-700/50 text-white font-medium rounded-lg hover:bg-blue-600/50 border border-blue-600/30 transition-colors"
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Add Google Drive Link
                        </button>
                      </div>
                      
                      <p className="mt-2 text-xs text-indigo-400">
                        Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 