'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { 
  ArrowLeft, 
  Loader2, 
  AlertTriangle, 
  BookOpen, 
  Search, 
  Filter, 
  Bookmark,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { getCourses, Course, getUserData } from '@/lib/supabase';
import { useTranslations } from '@/lib/i18n';
import { useSemesterCheck } from '@/hooks/useSemesterCheck.tsx';
import { useUser } from '@clerk/nextjs';

// Create a fetcher function for SWR
const coursesFetcher = async (key: string, userId: string) => {
  const data = await getCourses(userId);
  return data;
};

export default function CoursesPage() {
  const { t, dir } = useTranslations();
  const { user } = useUser();
  const { semesterSelected, isChecking, SemesterLock } = useSemesterCheck();
  const [userSemester, setUserSemester] = useState<number | null>(null);
  
  // Use SWR for data fetching with auto-refresh
  const { data, error, mutate } = useSWR(
    user ? ['courses', user.id] : null, 
    ([key, userId]) => coursesFetcher(key, userId),
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Get courses or empty array if loading
  const courses = data || [];
  // Is it loading?
  const loading = !data && !error;

  // Simplified categories
  const categories = [
    { id: 'all', name: t('coursesPage.categories.all') },
    { id: 'saved', name: t('coursesPage.categories.saved') }
  ];

  // Fetch user data and their semester when component mounts
  useEffect(() => {
    const fetchUserSemester = async () => {
      if (user) {
        try {
          const userData = await getUserData(user.id);
          if (userData && userData.semester !== null) {
            setUserSemester(userData.semester);
          }
        } catch (error) {
          console.error('Error fetching user semester:', error);
        }
      }
    };
    
    fetchUserSemester();
  }, [user]);

  useEffect(() => {
    // Add scroll event listener
    const handleScroll = () => {
      const position = window.scrollY;
      setScrollPosition(position);
      
      if (position > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Load saved courses from localStorage
    const savedItems = localStorage.getItem('savedCourses');
    if (savedItems) {
      try {
        setSavedCourses(JSON.parse(savedItems));
      } catch (err) {
        console.error('Error parsing saved courses:', err);
      }
    }
    
    // Listen for sidebar toggle events - matching dashboard behavior
    const handleSidebarToggle = (event: CustomEvent<{collapsed: boolean}>) => {
      setSidebarCollapsed(event.detail.collapsed);
    };
    
    window.addEventListener('sidebarToggled', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('sidebarToggled', handleSidebarToggle as EventListener);
    };
  }, []);

  // Filter courses based on search term and active category
  useEffect(() => {
    if (!courses || courses.length === 0) return;
    
    let filtered = [...courses];
    
    // Filter courses by user semester
    if (userSemester !== null) {
      filtered = filtered.filter(course => course.semester === userSemester);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (activeCategory !== 'all') {
      // Filter for saved courses
      if (activeCategory === 'saved') {
        filtered = filtered.filter(course => savedCourses.includes(course.id));
      }
    }
    
    setFilteredCourses(filtered);
  }, [courses, searchTerm, activeCategory, savedCourses, userSemester]);

  // Save/unsave a course
  const toggleSaveCourse = (id: string) => {
    let updated = [...savedCourses];
    
    if (savedCourses.includes(id)) {
      // Remove from saved
      updated = updated.filter(courseId => courseId !== id);
    } else {
      // Add to saved
      updated.push(id);
    }
    
    setSavedCourses(updated);
    localStorage.setItem('savedCourses', JSON.stringify(updated));
  };

  // Function to refresh courses data
  const refreshCourses = () => {
    mutate();
  };

  // Render course card (grid view)
  const renderCourseCard = (course: Course) => {
    const isSaved = savedCourses.includes(course.id);
    // Dynamically adjust font size based on title length
    const titleFontSize = course.title.length > 25 ? 'text-lg' : 'text-xl';
    
    return (
      <div key={course.id} className="group h-full">
        <div className="relative h-52 sm:h-64 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-indigo-900/40 backdrop-blur-sm bg-[#0c0a1f]">
          <Link href={`/dashboard/courses/${course.id}`} className="block absolute inset-0 z-10">
            <span className="sr-only">{t('coursesPage.view')}</span>
          </Link>
          
          {/* Course background - using the specified background color or a default */}
          <div className={`absolute inset-0 ${course.background_color || 'bg-[#131033]'}`}>
            {course.image_url ? (
              <img 
                src={course.image_url} 
                alt={course.title}
                className="w-full h-[calc(100%-80px)] object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-16 w-16 opacity-30 text-white" />
              </div>
            )}
          </div>
          
          {/* Save button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSaveCourse(course.id);
            }}
            className="absolute top-3 right-3 z-20 bg-indigo-900/60 hover:bg-indigo-800/60 p-2 rounded-full transition-colors"
            title={isSaved ? t('coursesPage.unsave') : t('coursesPage.save')}
          >
            <Bookmark className={`h-4 w-4 text-white ${isSaved ? 'fill-white' : ''}`} />
          </button>
          
          {/* Course title and description at bottom */}
          <div className="absolute bottom-0 inset-x-0">
            <div className="p-5 bg-[#0f0c24] border-t border-indigo-900/30">
              <h3 className={`font-bold ${titleFontSize} mb-2 text-indigo-100`}>
                {course.title}
              </h3>
              {course.description && (
                <p className="text-indigo-300 text-sm line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render course row (list view)
  const renderCourseRow = (course: Course) => {
    const isSaved = savedCourses.includes(course.id);
    
    return (
      <div 
        key={course.id} 
        className="relative flex items-center bg-[#0c0a1f] backdrop-blur-sm p-3 rounded-lg border border-indigo-900/40 mb-2 hover:bg-[#131033] transition-colors"
      >
        <Link href={`/dashboard/courses/${course.id}`} className="block absolute inset-0 z-10">
          <span className="sr-only">{t('coursesPage.view')}</span>
        </Link>
        
        <div className={`h-12 w-12 flex items-center justify-center rounded-md ${course.background_color || 'bg-[#131033]'}`}>
          {course.image_url ? (
            <img src={course.image_url} alt="" className="h-full w-full object-cover rounded-md" />
          ) : (
            <BookOpen className="h-6 w-6 opacity-30 text-white" />
          )}
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-base font-bold text-indigo-100 truncate">{course.title}</h3>
          {course.description && (
            <p className="mt-1 text-xs text-indigo-300 truncate">{course.description}</p>
          )}
        </div>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSaveCourse(course.id);
          }}
          className="z-20 bg-indigo-900/60 hover:bg-indigo-800/60 p-2 rounded-full transition-colors"
          title={isSaved ? t('coursesPage.unsave') : t('coursesPage.save')}
        >
          <Bookmark className={`h-4 w-4 text-white ${isSaved ? 'fill-white' : ''}`} />
        </button>
      </div>
    );
  };

  // Show loading state if still checking semester requirements
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // If semester is not selected, show the lock screen
  if (!semesterSelected) {
    return (
      <div className="min-h-screen p-6">
        <SemesterLock />
      </div>
    );
  }
  
  // Regular component render below for users who have selected a semester
  return (
    <div className={`min-h-screen px-4 py-6 ${sidebarCollapsed ? 'sm:pl-20' : 'sm:pl-72'} transition-all duration-300`}>
      {/* Header with back button and title */}
      <header 
        ref={headerRef}
        className={`bg-black/20 backdrop-blur-sm ${isScrolled ? 'fixed top-0 inset-x-0 z-20 shadow-md border-b border-indigo-800/20 py-4 px-4 sm:px-6' : 'py-2'} transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center p-2 rounded-full text-indigo-400 hover:text-white hover:bg-indigo-800/30 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back to dashboard</span>
                </button>
              </Link>
              <h1 className="text-2xl font-semibold text-white">{t('coursesPage.title')}</h1>
              {semesterSelected && (
                <span className="ml-3 px-3 py-1 bg-indigo-800/50 text-indigo-300 text-sm rounded-full">
                  {t('semester')} {userSemester || '-'}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className={`max-w-7xl mx-auto ${isScrolled ? 'mt-24' : 'mt-6'}`}>
        {/* Heading and description */}
        <div className="bg-indigo-950/20 backdrop-blur-sm p-6 rounded-xl border border-indigo-800/30 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-indigo-300">{t('coursesPage.subtitle')}</p>
              {userSemester && (
                <p className="text-indigo-400 text-sm mt-2">
                  <span className="bg-indigo-900/50 px-2 py-1 rounded-md">
                    {t('coursesPage.semesterFilter', { fallback: 'Showing courses for Semester' })} {userSemester}
                  </span>
                </p>
              )}
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={refreshCourses}
                className="inline-flex items-center px-3 py-2 border border-indigo-500/30 text-sm font-medium rounded-md text-white bg-indigo-600/30 hover:bg-indigo-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t('coursesPage.refresh')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Filters and search */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Category filters */}
          <div className="flex">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-indigo-500/30 text-sm font-medium rounded-md text-white bg-indigo-600/30 hover:bg-indigo-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              {t('coursesPage.filters')}
            </button>
          </div>
          
          {/* Search */}
          <div className="flex flex-1 max-w-md">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-indigo-400" />
              </div>
              <input
                type="text"
                placeholder={t('coursesPage.search')}
                className="w-full py-2 pl-10 pr-4 bg-indigo-950/30 border border-indigo-800/40 rounded-md text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Filter options (conditionally shown) */}
        {showFilters && (
          <div className="mb-6 bg-indigo-950/20 backdrop-blur-sm p-4 rounded-lg border border-indigo-800/30">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-3 py-1.5 rounded-md text-sm ${
                    activeCategory === category.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-800/40'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Courses grid */}
        <div className="min-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-lg font-medium text-indigo-200">{t('coursesPage.loading')}</h3>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 bg-red-900/20 backdrop-blur-sm p-6 rounded-xl border border-red-800/30">
              <AlertTriangle className="h-10 w-10 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-200">{t('coursesPage.error')}</h3>
              <button
                onClick={() => mutate()}
                className="mt-4 px-4 py-2 bg-red-800/30 hover:bg-red-700/40 rounded-md text-white"
              >
                {t('coursesPage.tryAgain')}
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-indigo-950/20 backdrop-blur-sm p-6 rounded-xl border border-indigo-800/30">
              <BookOpen className="h-10 w-10 text-indigo-400 mb-4" />
              <h3 className="text-lg font-medium text-indigo-200">{t('coursesPage.noCourses')}</h3>
              <p className="text-center text-indigo-300 mt-2 max-w-md">
                {searchTerm 
                  ? `No courses matching "${searchTerm}" found.`
                  : activeCategory === 'saved' 
                    ? 'You have not saved any courses yet.'
                    : t('coursesPage.noCoursesMessage')}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'flex flex-col gap-2'
            }>
              {filteredCourses.map((course) => (
                viewMode === 'grid' 
                  ? renderCourseCard(course) 
                  : renderCourseRow(course)
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}