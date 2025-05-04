'use client';

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { checkEnvironmentVariables } from "@/lib/debugUtils";
import { BookOpenIcon, BellIcon } from "@heroicons/react/24/outline";
import Announcements from "@/components/Announcements";
import Link from "next/link";
import { getCourses } from "@/lib/supabase";
import { useTranslations } from "@/lib/i18n";

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { userData, isLoading: isUserDataLoading, isAdmin, error: userDataError } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState(false);
  const [unreadAnnouncementsCount, setUnreadAnnouncementsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { t, dir } = useTranslations();
  
  // Check environment variables on component mount
  useEffect(() => {
    const envCheck = checkEnvironmentVariables();
    setEnvError(!envCheck);
  }, []);
  
  useEffect(() => {
    // If user is not logged in, redirect to home
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }
    
    // If user email doesn't end with @epu.edu.iq, redirect to unauthorized
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      if (!user.primaryEmailAddress.emailAddress.endsWith('@epu.edu.iq')) {
        router.push('/unauthorized');
        return;
      }
      
      // No longer redirecting admins away from student dashboard
      // Just set loading to false and allow access
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user, router, isUserDataLoading, isAdmin]);

  // Fetch courses when component loads
  useEffect(() => {
    const fetchCourses = async () => {
      if (!loading && isLoaded && isSignedIn) {
        try {
          setIsLoadingCourses(true);
          const courses = await getCourses();
          setCoursesCount(courses.length);
        } catch (error) {
          console.error("Error fetching courses:", error);
        } finally {
          setIsLoadingCourses(false);
        }
      }
    };

    fetchCourses();
  }, [loading, isLoaded, isSignedIn]);

  // Listen for announcement updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get initial unread count if available
      if ('unreadAnnouncementsCount' in window) {
        setUnreadAnnouncementsCount(window.unreadAnnouncementsCount || 0);
      }

      // Listen for updates
      const handleUnreadUpdate = (event: CustomEvent<{count: number}>) => {
        setUnreadAnnouncementsCount(event.detail.count);
      };
      
      window.addEventListener('unreadAnnouncementsUpdated', handleUnreadUpdate as EventListener);
      
      return () => {
        window.removeEventListener('unreadAnnouncementsUpdated', handleUnreadUpdate as EventListener);
      };
    }
  }, []);

  // Listen for sidebar toggle events
  useEffect(() => {
    const handleSidebarToggle = (event: CustomEvent<{collapsed: boolean}>) => {
      setSidebarCollapsed(event.detail.collapsed);
    };
    
    window.addEventListener('sidebarToggled', handleSidebarToggle as EventListener);
    
    return () => {
      window.removeEventListener('sidebarToggled', handleSidebarToggle as EventListener);
    };
  }, []);

  if (loading || !isLoaded || !isSignedIn || isUserDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  // Get display name - prioritize Clerk real name, then fall back to username, then email
  const displayName = user.fullName || user.firstName || userData?.username || user.primaryEmailAddress?.emailAddress.split('@')[0];

  // Dynamic data for stats display
  const stats = [
    { 
      label: t('dashboard.currentCourses'), 
      value: isLoadingCourses ? '...' : coursesCount.toString(), 
      icon: BookOpenIcon, 
      color: 'bg-blue-500', 
      link: '/dashboard/courses' 
    },
    { label: t('dashboard.unreadAnnouncements'), value: unreadAnnouncementsCount.toString(), icon: BellIcon, color: unreadAnnouncementsCount > 0 ? 'bg-red-500' : 'bg-yellow-500' },
  ];

  // Sample announcements
  const announcements = [
    {
      id: 1,
      title: 'Final Exams Schedule',
      date: 'April 20, 2025',
      preview: 'The final examination schedule for the spring semester has been released.',
      priority: 'high'
    },
    {
      id: 2,
      title: 'New Online Resources',
      date: 'April 15, 2025',
      preview: 'The library has added new online resources for computer science students.',
      priority: 'medium'
    }
  ];

  return (
    <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16 md:ml-16' : 'ml-16 md:ml-64'} p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
      {/* Alert messages */}
      {envError && (
          <div className={`bg-yellow-900/50 ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-yellow-500 text-yellow-200 p-4 mb-6 rounded shadow-sm backdrop-blur-sm`} role="alert">
          <p className="font-bold">{t('dashboard.alerts.envVariableIssue')}</p>
          <p>{t('dashboard.alerts.supabaseMissing')}</p>
          <p className="text-sm mt-2">{t('dashboard.alerts.checkEnv')}</p>
        </div>
      )}
      
      {userDataError && (
          <div className={`bg-yellow-900/50 ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-yellow-500 text-yellow-200 p-4 mb-6 rounded shadow-sm backdrop-blur-sm`} role="alert">
          <p className="font-bold">{t('dashboard.alerts.dbConnectionIssue')}</p>
          <p>{t('dashboard.alerts.defaultRole')}</p>
        </div>
      )}
      
      {/* Header with welcome message */}
        <div className={`bg-indigo-900/30 backdrop-blur-sm shadow-md rounded-lg p-6 mb-6 ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} border-indigo-500`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold text-white">{t('dashboard.studentDashboard')}</h1>
              <p className="text-indigo-200 mt-1">
              {t('dashboard.welcomeBack')}, <span className="font-semibold">{displayName}</span>!
            </p>
              <p className="text-indigo-300 text-sm mt-1">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {user.fullName && (
                <span className="bg-indigo-800/50 text-indigo-200 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center justify-center backdrop-blur-sm">
                {user.fullName}
              </span>
            )}
            
            {isAdmin && (
              <a 
                href="/admin" 
                  className="bg-purple-800/50 hover:bg-purple-700/50 text-purple-200 text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center justify-center backdrop-blur-sm"
              >
                {t('dashboard.adminDashboard')}
              </a>
            )}
            
            <a 
              href="/dashboard/profile" 
                className="bg-indigo-800/30 hover:bg-indigo-700/30 text-indigo-200 text-sm font-medium px-4 py-2 rounded-md transition-colors flex items-center justify-center backdrop-blur-sm"
            >
              {t('dashboard.viewProfile')}
            </a>
          </div>
        </div>
      </div>
      
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
            <div key={index} className="bg-indigo-900/20 backdrop-blur-sm shadow-sm rounded-lg overflow-hidden border border-indigo-800/30">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`${stat.color} rounded-full p-3 ${dir === 'rtl' ? 'ml-4' : 'mr-4'}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                    <p className="text-indigo-300 text-sm">{stat.label}</p>
                  {stat.link ? (
                      <Link href={stat.link} className="text-2xl font-bold text-white hover:text-indigo-400 transition-colors">
                      {stat.value}
                    </Link>
                  ) : (
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Announcements section */}
        <div className="lg:col-span-2">
            <div className="bg-indigo-900/20 backdrop-blur-sm shadow-md rounded-lg overflow-hidden border border-indigo-800/30">
              <div className="border-b border-indigo-800/50 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">{t('dashboard.latestAnnouncements')}</h2>
              <Link 
                href="/dashboard/announcements" 
                  className="text-sm font-medium text-indigo-300 hover:text-indigo-200 transition-colors"
              >
                {t('dashboard.viewAll')}
              </Link>
            </div>
            <div className="p-6">
              <Announcements />
            </div>
          </div>
        </div>
        
        {/* Quick actions and links section */}
        <div>
            <div className="bg-indigo-900/20 backdrop-blur-sm shadow-md rounded-lg overflow-hidden border border-indigo-800/30">
              <div className="border-b border-indigo-800/50 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{t('dashboard.quickActions')}</h2>
            </div>
            <div className="p-6 space-y-4">
              <a 
                href="/dashboard/courses" 
                  className="flex items-center p-3 bg-indigo-800/50 rounded-lg hover:bg-indigo-700/50 transition-colors group"
              >
                  <div className={`bg-indigo-800/50 rounded-md p-2 ${dir === 'rtl' ? 'ml-4' : 'mr-3'} group-hover:bg-indigo-700/50 transition-colors`}>
                  <BookOpenIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-medium text-white">{t('dashboard.viewCourses')}</h3>
                    <p className="text-indigo-300 text-sm">{t('dashboard.accessCourses')}</p>
                </div>
              </a>
              
              <a 
                  href="/dashboard/announcements" 
                  className="flex items-center p-3 bg-indigo-800/50 rounded-lg hover:bg-indigo-700/50 transition-colors group"
              >
                  <div className={`bg-indigo-800/50 rounded-md p-2 ${dir === 'rtl' ? 'ml-4' : 'mr-3'} group-hover:bg-indigo-700/50 transition-colors`}>
                    <BellIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                    <h3 className="font-medium text-white">{t('dashboard.announcements')}</h3>
                    <p className="text-indigo-300 text-sm">{t('dashboard.viewAllAnnouncements')}</p>
                </div>
              </a>
            </div>
          </div>
          
            {/* Help section */}
            <div className="bg-indigo-900/20 backdrop-blur-sm shadow-md rounded-lg overflow-hidden mt-6 border border-indigo-800/30">
              <div className="border-b border-indigo-800/50 px-6 py-4">
                <h2 className="text-lg font-semibold text-white">{t('dashboard.needHelp')}</h2>
            </div>
            <div className="p-6">
                <div className="text-center">
                  <p className="text-indigo-200 mb-4">
                    {t('dashboard.contactSupport')}
                  </p>
                  <a 
                    href="https://t.me/RtxMumin" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-block px-4 py-2 bg-indigo-700/50 hover:bg-indigo-600/50 text-white rounded-lg transition-colors"
                  >
                    {t('dashboard.supportButton')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}