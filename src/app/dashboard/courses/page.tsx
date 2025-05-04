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
import { getCourses, Course } from '@/lib/supabase';
import { useTranslations } from '@/lib/i18n';

// Create a fetcher function for SWR
const coursesFetcher = async () => {
  const data = await getCourses();
  return data;
};

export default function CoursesPage() {
  const { t, dir } = useTranslations();
  
  // Use SWR for data fetching with auto-refresh
  const { data, error, mutate } = useSWR('courses', coursesFetcher, {
    refreshInterval: 30000, // Auto-refresh every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  
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
  }, [courses, searchTerm, activeCategory, savedCourses]);

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
    
    return (
      <div key={course.id} className="group h-full">
        <div className="relative h-52 sm:h-64 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-indigo-800/30 backdrop-blur-sm">
          <Link href={`/dashboard/courses/${course.id}`} className="block absolute inset-0 z-10">
            <span className="sr-only">{t('coursesPage.view')}</span>
          </Link>
          
          {/* Course background - using the specified background color or a default */}
          <div className={`absolute inset-0 ${course.background_color || 'bg-indigo-900/30'}`}>
            {course.title.toLowerCase().includes('program') && (
              <div className="absolute inset-0 flex items-center justify-center opacity-60 p-4">
                <div className="text-left font-mono text-xs overflow-hidden">
                  <div className="text-indigo-300">
                    <span className="text-pink-300">var</span> <span className="text-blue-300">w</span> = <span className="text-green-300">window</span>;
                  </div>
                  <div className="text-indigo-300">
                    <span className="text-pink-300">if</span> (<span className="text-blue-300">w</span> &amp;&amp; <span className="text-blue-300">w</span>.<span className="text-blue-300">console</span>) {'{'}
                  </div>
                  <div className="text-indigo-300 pl-4">
                    <span className="text-gray-300">// Output the course name</span>
                  </div>
                  <div className="text-indigo-300 pl-4">
                    <span className="text-blue-300">console</span>.<span className="text-blue-300">log</span>(<span className="text-amber-300">"{course.title}"</span>);
                  </div>
                  <div className="text-indigo-300">{'}'};</div>
                </div>
              </div>
            )}
            
            {course.image_url ? (
              <img 
                src={course.image_url} 
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-overlay"
              />
            ) : !course.title.toLowerCase().includes('program') && (
              <div className="flex items-center justify-center h-full">
                <BookOpen className="h-16 w-16 text-white opacity-30" />
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
            className="absolute top-3 right-3 z-20 bg-indigo-800/50 hover:bg-indigo-700/50 p-2 rounded-full transition-colors"
            title={isSaved ? t('coursesPage.unsave') : t('coursesPage.save')}
          >
            <Bookmark className={`h-4 w-4 text-white ${isSaved ? 'fill-white' : ''}`} />
          </button>
          
          {/* Course title and description at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-4">
            <div className="bg-indigo-900/80 backdrop-blur-sm p-4 rounded-md border-t border-indigo-700/30">
              <h3 className="text-lg font-medium text-white truncate">{course.title}</h3>
              
              {course.instructor_name && (
                <div className="mt-1 text-xs text-indigo-300">
                  {t('coursesPage.instructor')}: {course.instructor_name}
                </div>
              )}
              
              {course.description && (
                <p className="mt-2 text-sm text-indigo-200 line-clamp-2">{course.description}</p>
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
        className="relative flex items-center bg-indigo-950/20 backdrop-blur-sm p-3 rounded-lg border border-indigo-800/30 mb-2 hover:bg-indigo-900/30 transition-colors"
      >
        <Link href={`/dashboard/courses/${course.id}`} className="block absolute inset-0 z-10">
          <span className="sr-only">{t('coursesPage.view')}</span>
        </Link>
        
        <div className={`h-10 w-10 flex items-center justify-center rounded-md ${course.background_color || 'bg-indigo-900/30'}`}>
          {course.image_url ? (
            <img src={course.image_url} alt="" className="h-full w-full object-cover rounded-md" />
          ) : (
            <BookOpen className="h-5 w-5 text-white opacity-70" />
          )}
        </div>
        
        <div className="ml-3 flex-1 min-w-0">
          <h3 className="text-base font-medium text-white truncate">{course.title}</h3>
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
          className="z-20 bg-indigo-800/50 hover:bg-indigo-700/50 p-2 rounded-full transition-colors"
          title={isSaved ? t('coursesPage.unsave') : t('coursesPage.save')}
        >
          <Bookmark className={`h-4 w-4 text-white ${isSaved ? 'fill-white' : ''}`} />
        </button>
      </div>
    );
  };

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