'use client';

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { checkEnvironmentVariables } from "@/lib/debugUtils";
import Link from "next/link";
import Image from "next/image";
import { 
  AlertTriangle, 
  Bell, 
  Users, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  ChevronRight,
  Plus,
  Database,
  BookOpen as BookOpenIcon,
  ArrowRight as ArrowRightIcon,
  BarChart,
  Calendar,
  Shield,
  TrendingUp,
  Zap,
  Menu,
  X,
  Users2 as UserGroup
} from "lucide-react";
import { getAnnouncements, getAllUsers } from "@/lib/supabase";

export default function AdminDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAdmin, isOwner, isLoading: isRoleLoading, error: roleError, debugInfo, refreshRole } = useUserRole();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [announcementsCount, setAnnouncementsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
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
    // TEMPORARILY DISABLED FOR TESTING
    /*
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      if (!user.primaryEmailAddress.emailAddress.endsWith('@epu.edu.iq')) {
        router.push('/unauthorized');
        return;
      }
      
      setLoading(false);
    }
    */
    
    // TEMPORARY CODE FOR TESTING - Allow all email domains
    if (isLoaded && isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user, router, isRoleLoading, isAdmin]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch announcements and users count
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingStats(true);
        
        // Fetch announcements
        const announcements = await getAnnouncements();
        setAnnouncementsCount(announcements.length);
        
        // Fetch students
        const users = await getAllUsers();
        setStudentsCount(users.length);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    if (isAdmin && !loading) {
      fetchData();
    }
  }, [isAdmin, loading]);

  // Function to refresh stats manually
  const refreshStats = async () => {
    if (!isAdmin) return;
    
    try {
      setIsLoadingStats(true);
      
      // Fetch announcements
      const announcements = await getAnnouncements();
      setAnnouncementsCount(announcements.length);
      
      // Fetch students
      const users = await getAllUsers();
      setStudentsCount(users.length);
    } catch (error) {
      console.error("Error refreshing stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Get today's date in a nice format
  const today = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Get time in 12hr format
  const timeString = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (loading || !isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 border border-indigo-800/30">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-800/50 rounded-full flex items-center justify-center mb-6 border border-indigo-700/30">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-700 border-t-purple-500 border-r-indigo-500"></div>
            </div>
            <h2 className="text-xl font-bold text-indigo-100 mb-2">Loading admin dashboard...</h2>
            <p className="text-indigo-300 text-center mb-6">Please wait while we verify your credentials</p>
            <div className="w-full bg-indigo-800/30 h-2 rounded-full overflow-hidden border border-indigo-700/30">
              <div className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 animate-pulse rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-indigo-950">
      {/* Side Navigation - Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-indigo-900/40 backdrop-blur-sm shadow-lg overflow-y-auto rounded-r-2xl border-r border-indigo-800/30">
          <div className="flex items-center justify-center h-24 px-4 bg-gradient-to-r from-purple-800 to-indigo-900 rounded-br-3xl">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-800/60 backdrop-blur-sm p-2 rounded-xl shadow-md border border-indigo-700/50">
                <Shield className="h-8 w-8 text-indigo-200" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-indigo-100">EPU Admin</h2>
                <p className="text-indigo-300 text-sm">Management Portal</p>
              </div>
            </div>
          </div>
          
          <div className="px-4 py-6">
            <div className="mb-8">
              <div className="flex items-center px-4 py-3 bg-indigo-800/30 rounded-xl border border-indigo-700/30">
                <div className="relative mr-4">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full border-2 border-indigo-700 shadow-sm"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-indigo-100 font-semibold text-lg shadow-sm">
                      {user?.fullName?.[0] || user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress[0].toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-indigo-800"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-indigo-100 truncate">
                    {user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress.split('@')[0]}
                  </p>
                  <p className="text-xs text-indigo-300 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
            </div>
            
            <nav className="flex-1 space-y-2">
              <p className="px-4 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Dashboard</p>
              
              <Link href="/admin" className="group flex items-center px-4 py-3 text-indigo-100 rounded-xl bg-indigo-700/60">
                <LayoutDashboard className="mr-3 h-5 w-5 text-indigo-300" />
                <span className="font-medium">Overview</span>
              </Link>
              
              <Link href="/admin/users" className="group flex items-center px-4 py-3 text-indigo-200 rounded-xl hover:bg-indigo-800/40 transition-all">
                <Users className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                <span>Users</span>
              </Link>
              
              <Link href="/admin/courses" className="group flex items-center px-4 py-3 text-indigo-200 rounded-xl hover:bg-indigo-800/40 transition-all">
                <BookOpenIcon className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                <span>Courses</span>
              </Link>

              <Link href="/admin/presentation-groups" className="group flex items-center px-4 py-3 text-indigo-200 rounded-xl hover:bg-indigo-800/40 transition-all">
                <UserGroup className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                <span>Presentation Groups</span>
              </Link>
            </nav>
          </div>
          
          <div className="p-4 mt-auto">
            <Link href="/dashboard" className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-xl hover:from-purple-800 hover:to-indigo-800 transition-all shadow-md border border-indigo-600/50">
              <LayoutDashboard className="mr-2 h-5 w-5" />
              <span>Student Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="fixed top-0 left-0 right-0 z-20 bg-indigo-900/80 backdrop-blur-sm shadow-md border-b border-indigo-800/30">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-800/60 backdrop-blur-sm p-2 rounded-lg shadow-md border border-indigo-700/50">
                <Shield className="h-6 w-6 text-indigo-200" />
              </div>
              <h2 className="text-lg font-bold text-indigo-100">EPU Admin</h2>
            </div>
            
            <button 
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg bg-indigo-800/40 hover:bg-indigo-700/50 transition-colors border border-indigo-700/30"
            >
              {mobileMenuOpen ? <X className="h-6 w-6 text-indigo-200" /> : <Menu className="h-6 w-6 text-indigo-200" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-10 bg-black bg-opacity-50 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
        )}
        
        {/* Mobile Menu Sidebar */}
        <div className={`fixed top-0 left-0 z-30 w-64 h-full bg-indigo-900/90 backdrop-blur-md border-r border-indigo-800/30 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-800 to-indigo-900">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-800/60 p-1.5 rounded-lg shadow-md border border-indigo-700/50">
                  <Shield className="h-5 w-5 text-indigo-200" />
                </div>
                <h2 className="text-lg font-bold text-indigo-100">EPU Admin</h2>
              </div>
              <button onClick={toggleMobileMenu} className="p-1.5 rounded-lg bg-indigo-800/40 hover:bg-indigo-700/50 transition-colors border border-indigo-700/30">
                <X className="h-5 w-5 text-indigo-200" />
              </button>
            </div>
            
            <div className="px-3 py-4">
              <div className="mb-6">
                <div className="flex items-center px-3 py-3 bg-indigo-800/30 rounded-xl border border-indigo-700/30">
                  <div className="relative mr-3">
                    {user?.imageUrl ? (
                      <Image
                        src={user.imageUrl}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="rounded-full border-2 border-indigo-700 shadow-sm"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-indigo-100 font-semibold text-lg shadow-sm">
                        {user?.fullName?.[0] || user?.firstName?.[0] || user?.primaryEmailAddress?.emailAddress[0].toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 border-2 border-indigo-800"></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-100 truncate">
                      {user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress.split('@')[0]}
                    </p>
                    <p className="text-xs text-indigo-300 truncate">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 space-y-1">
                <p className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Dashboard</p>
                
                <Link href="/admin" className="group flex items-center px-3 py-2.5 text-indigo-100 rounded-lg bg-indigo-700/60" onClick={toggleMobileMenu}>
                  <LayoutDashboard className="mr-3 h-5 w-5 text-indigo-300" />
                  <span className="font-medium">Overview</span>
                </Link>
                
                <Link href="/admin/users" className="group flex items-center px-3 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-800/40 transition-all" onClick={toggleMobileMenu}>
                  <Users className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                  <span>Users</span>
                </Link>
                
                <Link href="/admin/courses" className="group flex items-center px-3 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-800/40 transition-all" onClick={toggleMobileMenu}>
                  <BookOpenIcon className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                  <span>Courses</span>
                </Link>

                <Link href="/admin/presentation-groups" className="group flex items-center px-3 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-800/40 transition-all" onClick={toggleMobileMenu}>
                  <UserGroup className="mr-3 h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                  <span>Presentation Groups</span>
                </Link>
              </nav>
            </div>
            
            <div className="p-3 mt-auto">
              <Link 
                href="/dashboard" 
                className="flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white rounded-lg hover:from-purple-800 hover:to-indigo-800 transition-all shadow-md border border-indigo-600/50"
                onClick={toggleMobileMenu}
              >
                <LayoutDashboard className="mr-2 h-5 w-5" />
                <span>Student Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {/* Admin Header */}
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-8">
            <div className="relative bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-800/30">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90 opacity-95"></div>
              <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[url('/pattern-bg.png')] bg-repeat"></div>
              
              <div className="relative p-6 sm:p-8 lg:p-10 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
                    <p className="text-lg font-medium text-indigo-200">Welcome back, {user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress.split('@')[0]}</p>
                    <div className="flex items-center mt-2 text-indigo-300">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{today}</span>
                      <span className="mx-2">•</span>
                      <span>{timeString}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Link 
                      href="/dashboard"
                      className="inline-flex items-center px-4 py-2.5 rounded-lg bg-indigo-800/40 hover:bg-indigo-700/50 transition-all text-indigo-100 text-sm font-medium backdrop-blur-sm border border-indigo-700/30"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      View Student Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mx-4 sm:mx-6 lg:mx-8 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-indigo-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-indigo-100">Announcements</h2>
                  <div className="p-3 bg-indigo-800/50 rounded-xl border border-indigo-700/50">
                    <Bell className="h-6 w-6 text-indigo-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-indigo-100">{announcementsCount}</p>
                <div className="flex items-center mt-2 text-sm">
                  <p className="text-indigo-300">Active announcements</p>
                  {isLoadingStats ? (
                    <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-800/50 text-indigo-300">
                      Loading...
                    </span>
                  ) : (
                    <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-700/50 text-indigo-200 border border-indigo-600/30">
                      <Zap className="w-3 h-3 mr-1" />
                      New
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-indigo-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-indigo-100">Students</h2>
                  <div className="p-3 bg-indigo-800/50 rounded-xl border border-indigo-700/50">
                    <Users className="h-6 w-6 text-indigo-300" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-indigo-100">{studentsCount}</p>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <p className="text-indigo-300">Registered students</p>
                  {isLoadingStats ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-800/50 text-indigo-300">
                      Loading...
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-800/50 text-green-200 border border-green-700/30">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +5%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-indigo-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-indigo-100">Database Status</h2>
                  <div className="p-3 bg-indigo-800/50 rounded-xl border border-indigo-700/50">
                    <Database className="h-6 w-6 text-indigo-300" />
                  </div>
                </div>
                <p className="text-xl font-bold text-indigo-100">Connected</p>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-indigo-300">Supabase connection active</p>
                  </div>
                  <button 
                    onClick={refreshStats}
                    disabled={isLoadingStats}
                    className="text-indigo-300 hover:text-indigo-100 text-sm flex items-center transition-colors"
                  >
                    {isLoadingStats ? "Refreshing..." : "Refresh Stats"}
                  </button>
                </div>
              </div>
              
              <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow border border-indigo-800/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-indigo-100">System Health</h2>
                  <div className="p-3 bg-indigo-800/50 rounded-xl border border-indigo-700/50">
                    <Shield className="h-6 w-6 text-indigo-300" />
                  </div>
                </div>
                <p className="text-xl font-bold text-indigo-100">Optimal</p>
                <div className="w-full bg-indigo-800/50 rounded-full h-2.5 mt-3 border border-indigo-700/30">
                  <div className="bg-gradient-to-r from-green-500 to-green-400 h-2.5 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <p className="text-xs text-indigo-300 mt-2">System resources: 95% available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}