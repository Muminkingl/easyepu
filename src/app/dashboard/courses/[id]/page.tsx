'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useUser } from '@clerk/nextjs';
import useSWR from 'swr';
import { 
  ChevronLeft, 
  AlertTriangle, 
  Loader2, 
  BookOpen, 
  FileIcon, 
  Bookmark, 
  Share2,
  Download,
  BookOpenCheck,
  Calendar,
  Clock,
  Users,
  ChevronDown,
  ArrowRight,
  Star,
  Shield,
  X,
  Info
} from 'lucide-react';
import { Course, CourseSection, CourseFile } from '@/lib/supabase';
import { tryAllBlobDownloadMethods } from '@/lib/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from '@/lib/i18n';

interface CoursePageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function CoursePage({ params }: CoursePageProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isSaved, setIsSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showAllResources, setShowAllResources] = useState(false);
  const [showBlobModal, setShowBlobModal] = useState(false);
  const [currentBlob, setCurrentBlob] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const { t, dir } = useTranslations();
  
  // Using Next.js 15+ approach with use() to unwrap params
  const resolvedParams = 'then' in params ? use(params) : params;
  const courseId = resolvedParams.id;

  // SWR fetcher functions for real-time updates
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch data');
    return res.json();
  };

  // Use SWR for real-time data updates
  const { data: course, error: courseError, isLoading: courseLoading } = useSWR<Course>(
    `/api/courses/${courseId}`, 
    fetcher, 
    { 
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000
    }
  );

  const { data: sectionsData, error: sectionsError, isLoading: sectionsLoading } = useSWR<CourseSection[]>(
    `/api/courses/${courseId}/sections`,
    fetcher,
    { 
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true
    }
  );

  const { data: filesData, error: filesError, isLoading: filesLoading } = useSWR<CourseFile[]>(
    `/api/courses/${courseId}/files`,
    fetcher,
    { 
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true
    }
  );

  const sections = sectionsData || [];
  const files = filesData || [];
  const loading = courseLoading || sectionsLoading || filesLoading;
  const error = courseError || sectionsError || filesError ? 
    (courseError?.message || sectionsError?.message || filesError?.message) : null;
  
  // Toggle section expansion - allow all sections to be closed
  const toggleSection = (sectionId: string) => {
    setActiveSection(activeSection === sectionId ? null : sectionId);
  };

  // Function to determine file icon based on type
  const getFileIcon = (fileType: string) => {
    switch(fileType.toLowerCase()) {
      case 'pdf': return '📄';
      case 'video': return '🎬';
      case 'audio': return '🎧';
      case 'doc':
      case 'docx': return '📝';
      case 'ppt':
      case 'pptx': return '📊';
      case 'xls':
      case 'xlsx': return '📈';
      default: return '📁';
    }
  };

  useEffect(() => {
    // Check if course is saved in localStorage
    const savedCourses = localStorage.getItem('savedCourses');
    if (savedCourses) {
      try {
        const saved = JSON.parse(savedCourses);
        setIsSaved(saved.includes(courseId));
      } catch (err) {
        console.error('Error parsing saved courses:', err);
      }
    }
    
    // We no longer automatically set the first section as active
    // This allows all sections to be closed initially
  }, [courseId]);
  
  // Toggle saving/bookmarking the course
  const toggleSave = () => {
    const savedCourses = localStorage.getItem('savedCourses');
    let saved: string[] = [];
    
    if (savedCourses) {
      try {
        saved = JSON.parse(savedCourses);
      } catch (err) {
        console.error('Error parsing saved courses:', err);
      }
    }
    
    if (isSaved) {
      // Remove from saved
      saved = saved.filter(id => id !== courseId);
    } else {
      // Add to saved
      saved.push(courseId);
    }
    
    localStorage.setItem('savedCourses', JSON.stringify(saved));
    setIsSaved(!isSaved);
  };

  // Add a function to handle file downloads correctly
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    if (!fileUrl) return;

    try {
      // For blob URLs, use our specialized utility that tries multiple methods
      if (fileUrl.startsWith('blob:')) {
        console.log('Attempting to download blob URL:', fileUrl);
        
        // Show a loading message
        const downloadingMessage = `Starting download for "${fileName}"...`;
        alert(downloadingMessage);
        
        // Try all our blob download methods
        tryAllBlobDownloadMethods(fileUrl, fileName)
          .then(success => {
            if (!success) {
              console.error('All download methods failed');
              setCurrentBlob(fileUrl);
              setCurrentFileName(fileName);
              setShowBlobModal(true);
            }
          })
          .catch(error => {
            console.error('Error downloading blob:', error);
            setCurrentBlob(fileUrl);
            setCurrentFileName(fileName);
            setShowBlobModal(true);
          });
        
        return;
      }
      
      // For regular URLs, use the proxy API
      const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`;
      window.open(proxyUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      // Fall back to direct opening
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0f0b1e] flex items-center justify-center">
        <motion.div 
          className="text-center p-8 bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-xl max-w-md w-full border border-indigo-800/30"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Loader2 className="h-10 w-10 animate-spin text-indigo-400 mx-auto mb-6" 
            suppressHydrationWarning={true} />
          <h3 className="text-xl font-semibold text-white mb-2">{t('courseDetail.loading')}</h3>
          <p className="text-indigo-300">{t('courseDetail.loadingDescription')}</p>
          
          <div className="mt-6 w-full bg-indigo-950/50 h-2 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0f0b1e] p-4 sm:p-8 flex items-center justify-center">
        <motion.div 
          className="max-w-lg w-full bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-indigo-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-900/30 mx-auto mb-6">
            <AlertTriangle 
              className="h-8 w-8 text-red-400" 
              suppressHydrationWarning={true}
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-3">{t('courseDetail.error')}</h1>
          <p className="text-center text-indigo-300 mb-6">{error}</p>
          <div className="flex justify-center">
            <Link 
              href="/dashboard/courses" 
              className="flex items-center justify-center px-6 py-3 bg-indigo-600/80 hover:bg-indigo-500/80 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('courseDetail.returnToCourses')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0f0b1e] p-4 sm:p-8 flex items-center justify-center">
        <motion.div 
          className="max-w-lg w-full bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-indigo-800/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-amber-900/30 mx-auto mb-6">
            <AlertTriangle 
              className="h-8 w-8 text-amber-400" 
              suppressHydrationWarning={true}
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-3">Course Not Found</h1>
          <p className="text-center text-indigo-300 mb-6">The course you're looking for doesn't exist or has been removed.</p>
          <div className="flex justify-center">
            <Link 
              href="/dashboard/courses" 
              className="flex items-center justify-center px-6 py-3 bg-indigo-600/80 hover:bg-indigo-500/80 text-white font-medium rounded-xl transition-colors shadow-md hover:shadow-lg backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t('courseDetail.returnToCourses')}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }
  
  // Get instructor info from the course (moved after checking course exists)
  const instructor = {
    initials: course?.instructor_name ? course.instructor_name.split(' ').map((part: string) => part[0]).join('').toUpperCase() : "?",
    name: course?.instructor_name || t('courseDetail.noInstructorAssigned'),
    title: course?.instructor_title || "Course Instructor",
    email: course?.instructor_email || "",
    image: course?.instructor_image || null
  };

  // Process course data to extract additional info for enhanced UI
  const totalStudents = 128; // Placeholder
  const estimatedHours = 12; // Placeholder

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-[#0f0b1e]">
      {/* Course header with gradient background */}
      <div 
        className={`bg-gradient-to-r from-indigo-600 to-purple-700 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('courseDetail.backToCourses')}
            </Link>
          </motion.div>
          
          {/* Course title and actions */}
          <motion.div 
            className="mt-6 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{course.title}</h1>
              {course.description && (
                <p className="text-white/80 mt-3 text-lg">{course.description}</p>
              )}
            </div>
            
            <motion.div 
              className="flex gap-3 sm:self-start lg:self-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <button
                onClick={toggleSave}
                className="inline-flex items-center px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-sm transition-all hover:shadow-lg"
              >
                <Bookmark className={`h-5 w-5 mr-2.5 ${isSaved ? 'fill-white' : ''}`} />
                {isSaved ? t('courseDetail.saved') : t('coursesPage.save')}
              </button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-12 right-10 w-64 h-64 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-24 w-96 h-96 bg-indigo-700 rounded-full opacity-20 blur-3xl -mb-48"></div>
      </div>
      
      {/* Course content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* Main course content - expanded to 5 columns */}
          <div className="lg:col-span-5">
            <motion.div 
              className="bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-indigo-800/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-indigo-800/30">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <BookOpen className="h-5 w-5 text-indigo-400 mr-2" />
                  {t('courseDetail.courseContent')}
                </h2>
                
                {sections.length > 0 && (
                  <div className="text-sm text-indigo-300">
                    {sections.length} {sections.length === 1 ? 'section' : 'sections'}
                  </div>
                )}
              </div>
              
              {sections.length === 0 ? (
                <motion.div 
                  className="flex flex-col items-center justify-center py-16 px-6 bg-indigo-950/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-indigo-800/50 rounded-full p-4 mb-4">
                    <BookOpen className="h-8 w-8 text-indigo-300" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t('courseDetail.noContentYet')}</h3>
                  <p className="text-indigo-300 text-center max-w-md">
                    {t('courseDetail.noContentMessage')}
                  </p>
                </motion.div>
              ) : (
                <div className="divide-y divide-indigo-800/30">
                  {sections.map((section: CourseSection, index: number) => {
                    const sectionFiles = files.filter((file: CourseFile) => file.section_id === section.id);
                    const isActive = activeSection === section.id;
                    
                    return (
                      <div key={section.id} className="bg-indigo-900/10">
                        <button
                          onClick={() => toggleSection(section.id)}
                          className={`flex items-center justify-between w-full p-6 text-left transition-colors ${isActive ? 'bg-indigo-800/30' : 'hover:bg-indigo-900/30'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-700/50 text-indigo-200 font-medium text-sm">
                              {index + 1}
                            </span>
                            <h3 className="font-semibold text-white">{section.title}</h3>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-indigo-300 mr-4">
                              {sectionFiles.length} {sectionFiles.length === 1 ? 'file' : 'files'}
                            </span>
                            <ChevronDown className={`h-5 w-5 text-indigo-300 transition-transform ${isActive ? 'transform rotate-180' : ''}`} />
                          </div>
                        </button>
                        
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 space-y-3">
                                {sectionFiles.length === 0 ? (
                                  <p className="text-indigo-300 text-sm py-2">No files in this section yet.</p>
                                ) : (
                                  sectionFiles.map((file: CourseFile) => {
                                    return (
                                      <motion.div 
                                        key={file.id} 
                                        className="flex items-center bg-indigo-950/50 border border-indigo-800/30 hover:border-indigo-700/50 hover:bg-indigo-800/30 p-4 rounded-xl transition-all"
                                        whileHover={{ scale: 1.01 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <div className="flex-shrink-0 mr-4 flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-700/30 text-indigo-300 text-lg">
                                          {getFileIcon(file.file_type)}
                                        </div>
                                        <div className="flex-grow">
                                          <div className="font-medium text-white">{file.title}</div>
                                          <div className="text-xs text-indigo-300 flex items-center mt-1">
                                            <span className="uppercase font-medium text-indigo-300 bg-indigo-700/30 px-2 py-0.5 rounded-full text-xs">{file.file_type}</span>
                                            <span className="mx-2">•</span>
                                            <span>{file.file_size}</span>
                                          </div>
                                        </div>
                                        {file.file_url && (
                                          <button 
                                            onClick={() => handleFileDownload(file.file_url, file.title)}
                                            className="ml-2 p-2 hover:bg-indigo-700/50 rounded-full transition-colors"
                                            title="Download File"
                                          >
                                            <Download className="h-5 w-5 text-indigo-300" />
                                          </button>
                                        )}
                                      </motion.div>
                                    );
                                  })
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
          
          {/* Course sidebar - reduced to 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Instructor card */}
            <motion.div 
              className="bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-indigo-800/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Shield className="h-4 w-4 text-indigo-400 mr-2" />
                {t('courseDetail.instructor')}
              </h3>
              
              <div className="flex items-center">
                {instructor.image ? (
                  <img 
                    src={instructor.image} 
                    alt={instructor.name}
                    className="h-12 w-12 rounded-full object-cover border-2 border-indigo-700"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-indigo-800 flex items-center justify-center text-white font-medium">
                    {instructor.initials}
                  </div>
                )}
                
                <div className="ml-3">
                  <div className="font-medium text-white">{instructor.name}</div>
                  {instructor.title && (
                    <div className="text-sm text-indigo-300">{instructor.title}</div>
                  )}
                </div>
              </div>
              
              {instructor.email && (
                <div className="mt-4 pt-4 border-t border-indigo-800/30">
                  <div className="text-sm text-indigo-300 flex items-center">
                    <div className="text-white break-all">{instructor.email}</div>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Resources */}
            <motion.div 
              className="bg-indigo-900/20 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-indigo-800/30"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <BookOpenCheck className="h-4 w-4 text-indigo-400 mr-2" />
                {t('courseDetail.resources')}
              </h3>
              
              {files.length === 0 ? (
                <p className="text-indigo-300 text-sm">
                  {t('courseDetail.noResources')}
                </p>
              ) : (
                <div className="space-y-3">
                  {files
                    .slice(0, showAllResources ? undefined : 3)
                    .map((file: CourseFile) => (
                      <button 
                        key={file.id} 
                        onClick={() => file.file_url && handleFileDownload(file.file_url, file.title)}
                        className="flex items-center p-3 w-full text-left bg-indigo-950/50 hover:bg-indigo-800/30 border border-indigo-800/30 hover:border-indigo-700/50 rounded-xl transition-all group"
                      >
                        <div className="h-8 w-8 rounded-md bg-indigo-700/30 flex items-center justify-center text-indigo-300 mr-3">
                          {getFileIcon(file.file_type)}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium text-white group-hover:text-indigo-200 transition-colors">{file.title}</div>
                          <div className="text-xs text-indigo-400">{file.file_type.toUpperCase()}</div>
                        </div>
                        <Download className="h-4 w-4 text-indigo-300 opacity-70 group-hover:opacity-100" />
                      </button>
                    ))}
                  
                  {/* Show more button if there are more than 3 resources */}
                  {files.length > 3 && (
                    <button
                      onClick={() => setShowAllResources(!showAllResources)}
                      className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 pt-2"
                    >
                      {showAllResources ? 'Show less' : 'Show all resources'}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Blob URL helper modal */}
      {showBlobModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-indigo-900 rounded-xl shadow-xl max-w-lg w-full border border-indigo-700/50 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Info className="h-5 w-5 text-indigo-400 mr-2" />
                File Access Information
              </h3>
              <button 
                onClick={() => setShowBlobModal(false)}
                className="text-indigo-300 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/20 rounded-full p-2 mt-1">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-indigo-100">
                  This file is stored in a special format that can't be downloaded directly due to browser security. 
                  <strong className="text-white"> {currentFileName}</strong> needs to be accessed differently.
                </p>
              </div>
              
              <div className="bg-indigo-950/80 p-4 rounded-lg border border-indigo-800/50">
                <h4 className="font-medium text-white mb-2">Alternative ways to access this file:</h4>
                <ol className="list-decimal list-inside text-indigo-200 space-y-2">
                  <li>Return to the course page and try downloading a different file format</li>
                  <li>Try accessing this course from a different device or browser</li>
                  <li>Contact your instructor to provide the file in a different format</li>
                  <li>Check if you can view this content directly on the course platform</li>
                </ol>
              </div>
              
              <div className="mt-4 p-3 bg-indigo-800/30 rounded-lg">
                <p className="text-sm text-indigo-300">
                  <strong className="text-white">Technical note:</strong> Blob URLs from external sources cannot be downloaded directly due to browser security restrictions. This is a limitation of web browsers to protect user security.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBlobModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}