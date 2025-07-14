'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { 
  ChevronLeft, 
  Download, 
  Search, 
  AlertTriangle, 
  Loader2,
  Phone,
  Mail,
  Calendar,
  Filter,
  User as UserIcon,
  RefreshCw,
  X,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  GraduationCap
} from 'lucide-react';
import { getAllUsers, getUserData, UserData } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import * as XLSX from 'xlsx';
import { useUser } from '@clerk/nextjs';

// Add a helper function to format the user's display name
function formatDisplayName(user: UserData): string {
  // Use username from database if available
  if (user.username) {
    return user.username;
  }
  
  // If no username, extract name from email (capitalized)
  const emailName = user.email.split('@')[0];
  return emailName.charAt(0).toUpperCase() + emailName.slice(1);
}

// Helper to get the initial letter for the avatar
function getInitialLetter(user: UserData): string {
  // Use first letter of username if available
  if (user.username) {
    return user.username.charAt(0).toUpperCase();
  }
  
  // Otherwise use email initial
  return user.email.charAt(0).toUpperCase();
}

// Create a fetcher function for SWR
const usersFetcher = async (key: string, adminId: string | undefined) => {
  // Get admin's semester if available
  if (!adminId) return [];
  
  const userData = await getUserData(adminId);
  const adminSemester = userData?.semester || null;
  const userRole = userData?.role || 'student';
  
  // Get users filtered by admin's semester (unless user is owner, then get all)
  const data = await getAllUsers(adminSemester, userRole);
  return data;
};

// Add this type definition after imports and before component
type ClerkUserData = {
  id: string;
  fullName: string;
  imageUrl: string;
  email: string;
};

export default function ManageUsersPage() {
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateJoined');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [animateRefresh, setAnimateRefresh] = useState(false);
  const [isManualLoading, setIsManualLoading] = useState(false);
  const { user: currentUser, isLoaded: isUserLoaded } = useUser();
  const [clerkUsers, setClerkUsers] = useState<Record<string, ClerkUserData>>({});
  const [adminSemester, setAdminSemester] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  
  // Use SWR for data fetching with auto-refresh
  const { data, error, mutate } = useSWR(
    currentUser ? ['users', currentUser.id] : null, 
    ([key, adminId]) => usersFetcher(key, adminId),
    {
      refreshInterval: 60000, // Auto-refresh every minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  const users = data || [];
  const loading = isManualLoading || (!data && !error);

  // Get admin's semester for display
  useEffect(() => {
    const fetchAdminSemester = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData(currentUser.id);
          if (userData && userData.semester !== undefined && userData.semester !== null) {
            setAdminSemester(userData.semester);
          }
          // Store the user role
          if (userData?.role === 'owner') {
            setRoleFilter('all'); // Default to showing all users for owners
            setIsOwner(true);
          }
        } catch (error) {
          console.error('Error fetching admin semester:', error);
        }
      }
    };
    
    fetchAdminSemester();
  }, [currentUser]);

  // Function to export users to Excel
  const downloadExcel = () => {
    // Skip if no users available
    if (!users || users.length === 0) return;
    
    try {
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Format data for Excel
      const worksheetData = users.map(user => {
        // Get Clerk user info if available
        const clerkUser = clerkUsers[user.clerk_id];
        const displayName = clerkUser?.fullName || formatDisplayName(user);
        
        return {
          'Display Name': displayName,
          'Email': user.email,
          'Role': user.role || 'student',
          'Phone Number': user.phone_number || 'Not provided',
          'Gender': user.gender || 'Not specified',
          'Group Class': user.group_class || 'Not assigned',
          'Account Created': user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown'
        };
      });
      
      // Create a worksheet from the data
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(workbook, 'epu_users.xlsx');
    } catch (err) {
      console.error('Error generating Excel file:', err);
      // Show error toast or notification
    }
  };

  // Function to fetch Clerk user data
  async function fetchClerkData() {
    try {
      setIsManualLoading(true);
      const response = await fetch('/api/admin/get-users-clerk-data');
      
      if (response.ok) {
        const data = await response.json();
        const userMap: Record<string, ClerkUserData> = {};
        
        if (data.users && Array.isArray(data.users)) {
          data.users.forEach((user: ClerkUserData) => {
            if (user.id) {
              userMap[user.id] = user;
            }
          });
        }
        
        setClerkUsers(userMap);
        setIsManualLoading(false);
      } else {
        // Check if this is an auth error (don't log it to console to prevent noise)
        if (response.status === 401 || response.status === 403) {
          // Silently handle auth errors
          setIsManualLoading(false);
          return; // Don't retry on auth errors
        }
        
        // For non-auth errors, log and possibly retry
        console.error('Failed to fetch Clerk data:', await response.text());
        setIsManualLoading(false);
        
        // Retry for other types of errors
        setTimeout(() => {
          fetchClerkData();
        }, 5000); // Retry after 5 seconds
      }
    } catch (error) {
      // Only log non-auth errors
      if (error instanceof Error && !error.message.includes('Unauthorized')) {
        console.error('Error fetching Clerk data:', error);
      }
      setIsManualLoading(false);
    }
  }

  // Effect to fetch Clerk data on component mount
  useEffect(() => {
    fetchClerkData();
  }, []);

  // Also fetch when users data changes
  useEffect(() => {
    if (users.length > 0) {
      fetchClerkData();
    }
  }, [users]);

  // Filter users based on search term and filters
  useEffect(() => {
    if (!users.length) return;
    
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.username && user.username.toLowerCase().includes(term)) ||
        user.email.toLowerCase().includes(term) ||
        (user.phone_number && user.phone_number.includes(term))
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply sorting
    filtered = filtered.sort((a, b) => {
      if (sortBy === 'dateJoined') {
        const dateA = new Date(a.created_at || '').getTime();
        const dateB = new Date(b.created_at || '').getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'name') {
        const nameA = a.username || a.email;
        const nameB = b.username || b.email;
        return sortOrder === 'asc' 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      } else if (sortBy === 'email') {
        return sortOrder === 'asc' 
          ? a.email.localeCompare(b.email) 
          : b.email.localeCompare(a.email);
      }
      return 0;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, sortBy, sortOrder]);

  // Function to refresh the users data
  const refreshUserData = () => {
    setIsRefreshing(true);
    setAnimateRefresh(true);
    setIsManualLoading(true);
    
    // Clear clerk users data and refresh it
    setClerkUsers({});
    fetchClerkData();
    
    // Refetch admin's semester
    if (currentUser) {
      getUserData(currentUser.id).then(userData => {
        if (userData && userData.semester !== undefined && userData.semester !== null) {
          setAdminSemester(userData.semester);
        }
      });
    }
    
    mutate()
      .then(() => {
        setTimeout(() => {
          setIsRefreshing(false);
          setIsManualLoading(false);
          // Keep animation for a bit longer for better UX
          setTimeout(() => setAnimateRefresh(false), 300);
        }, 500);
      })
      .catch(() => {
        setIsRefreshing(false);
        setIsManualLoading(false);
        setTimeout(() => setAnimateRefresh(false), 300);
      });
  };
  
  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
    } else {
      setSelectedUser(userId);
    }
  };

  // Function to toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  // Security check - only admins can access this page
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
    <div className="min-h-screen bg-indigo-950">
      {/* Header Section */}
      <div className="bg-indigo-900/40 backdrop-blur-sm border-b border-indigo-800/30 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-0 gap-3 sm:gap-0">
            <div className="flex items-center">
              <Link
                href="/admin"
                className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors group"
              >
                <ChevronLeft className="h-5 w-5 mr-1 group-hover:transform group-hover:-translate-x-1 transition-transform" />
                Dashboard
              </Link>
              <span className="mx-2 text-indigo-700">|</span>
              <h1 className="text-lg font-bold text-indigo-100">Manage Users</h1>
              {isOwner ? (
                <div className="ml-4 flex items-center">
                  <span className="px-3 py-1 bg-purple-800/50 text-purple-300 text-sm rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1">
                      <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                    </svg>
                    Owner Access: All Users
                  </span>
                </div>
              ) : adminSemester !== null && (
                <div className="ml-4 flex items-center">
                  <span className="px-3 py-1 bg-indigo-800/50 text-indigo-300 text-sm rounded-full flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1 text-indigo-400" />
                    Semester {adminSemester} Students
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 sm:space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-indigo-700/60 text-indigo-100 shadow-sm border border-indigo-600/50'
                      : 'bg-indigo-800/30 hover:bg-indigo-700/40 text-indigo-300 border border-indigo-700/30'
                  }`}
                  title="Table View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                  </svg>
                </button>
                
                <button
                  onClick={() => setViewMode('card')}
                  className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'card'
                      ? 'bg-indigo-700/60 text-indigo-100 shadow-sm border border-indigo-600/50'
                      : 'bg-indigo-800/30 hover:bg-indigo-700/40 text-indigo-300 border border-indigo-700/30'
                  }`}
                  title="Card View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={refreshUserData}
                disabled={isRefreshing}
                className={`inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 bg-indigo-800/30 hover:bg-indigo-700/40 text-indigo-300 border border-indigo-700/30 ${
                  animateRefresh ? 'animate-pulse' : ''
                }`}
                title="Refresh Data"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search and filters */}
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md mb-6 p-4 border border-indigo-800/30">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-grow">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-indigo-400" />
                </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-indigo-700/50 bg-indigo-800/30 rounded-lg text-indigo-100 placeholder-indigo-400/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-700"
                  placeholder="Search users by name, email, or phone..."
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-indigo-400 hover:text-indigo-200 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
              )}
              </div>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center py-2 px-4 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-indigo-700/60 text-indigo-100 border border-indigo-600/50' 
                  : 'bg-indigo-800/30 hover:bg-indigo-700/40 text-indigo-300 border border-indigo-700/30'
              }`}
            >
              <Filter className="h-5 w-5 mr-2" />
              <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
            </button>
            
            <button
              onClick={downloadExcel}
              className="inline-flex items-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-indigo-100 rounded-lg transition-colors border border-indigo-600/50"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Export</span>
            </button>
          </div>
          
          {/* Filter options */}
          {showFilters && (
            <div className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full p-2 pl-3 pr-10 border border-indigo-700/50 bg-indigo-800/30 rounded-lg text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-700 appearance-none"
                    >
                      <option value="all">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-indigo-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Sort By
                  </label>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full p-2 pl-3 pr-10 border border-indigo-700/50 bg-indigo-800/30 rounded-lg text-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-700 appearance-none"
                    >
                      <option value="dateJoined">Date Joined</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDown className="h-5 w-5 text-indigo-400" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-indigo-300 mb-2">
                    Order
                  </label>
                  <button
                    onClick={toggleSortOrder}
                    className="w-full p-2 border border-indigo-700/50 bg-indigo-800/30 rounded-lg text-indigo-200 flex items-center justify-between hover:bg-indigo-700/40 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                    {sortOrder === 'desc' ? (
                      <ArrowDown className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <ArrowUp className="h-5 w-5 text-indigo-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md p-16 flex flex-col items-center justify-center border border-indigo-800/30">
            <div className="w-16 h-16 bg-indigo-800/50 rounded-full flex items-center justify-center mb-4 border border-indigo-700/30">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-300" />
            </div>
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">Loading Users</h2>
            <p className="text-indigo-300">Please wait while we fetch the user data...</p>
          </div>
        ) : error ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl border-2 border-red-800/30 p-8 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 border border-red-800/30">
              <AlertTriangle className="h-8 w-8 text-red-400" suppressHydrationWarning={true} />
            </div>
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">Unable to Load Users</h2>
            <p className="text-indigo-300 mb-6 text-center max-w-lg">{error.message || 'There was a problem retrieving the user data. Please try again.'}</p>
            <button 
              onClick={refreshUserData}
              className="inline-flex items-center justify-center px-5 py-3 bg-red-800/70 hover:bg-red-700/70 text-white font-medium rounded-xl transition-all duration-200 border border-red-700/50"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Retry
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md p-8 flex flex-col items-center text-center border border-indigo-800/30">
            <div className="w-16 h-16 bg-indigo-800/50 rounded-full flex items-center justify-center mb-4 border border-indigo-700/30">
              <UserIcon className="h-8 w-8 text-indigo-300" />
            </div>
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">No Users Found</h2>
            <p className="text-indigo-300 mb-6">
              {adminSemester === null 
                ? 'No semester selected. Please select a semester in your profile.'
                : searchTerm || roleFilter !== 'all' 
                  ? 'No users match your search criteria. Try adjusting your filters.'
                  : 'There are no users in the system yet.'}
            </p>
            {adminSemester === null ? (
              <Link href="/dashboard/profile" 
                className="inline-flex items-center justify-center px-5 py-2 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-all duration-200 border border-indigo-600/50">
                <GraduationCap className="h-4 w-4 mr-2" />
                Set Semester in Profile
              </Link>
            ) : (searchTerm || roleFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                  }}
                className="inline-flex items-center justify-center px-5 py-2 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-all duration-200 border border-indigo-600/50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-indigo-300">
                Showing <span className="font-semibold text-indigo-100">{filteredUsers.length}</span> user{filteredUsers.length !== 1 && 's'}
              </p>
              <button
                onClick={downloadExcel}
                className="inline-flex items-center justify-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white text-sm font-medium rounded-lg transition-colors border border-indigo-600/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
                </button>
              </div>
            
            {viewMode === 'table' ? (
              /* Table View */
              <div className="bg-indigo-900/40 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden border border-indigo-800/30">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-indigo-800/30">
                    <thead>
                      <tr className="bg-indigo-800/40">
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Email Address
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Group
                        </th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Gender
                        </th>
                        <th scope="col" className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                          Date Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-800/30">
                      {filteredUsers.map((user, index) => (
                        <tr 
                          key={user.clerk_id} 
                          className={`hover:bg-indigo-800/30 transition-colors ${
                            selectedUser === user.clerk_id ? 'bg-indigo-800/50' : 
                            index % 2 === 0 ? 'bg-indigo-900/20' : 'bg-indigo-900/40'
                          }`}
                          onClick={() => toggleUserSelection(user.clerk_id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold transition-transform ${
                                selectedUser === user.clerk_id ? 'transform scale-110 ring-2 ring-indigo-300' : ''
                              }`}>
                                {clerkUsers[user.clerk_id] && clerkUsers[user.clerk_id].imageUrl ? (
                                  <img 
                                    src={clerkUsers[user.clerk_id].imageUrl} 
                                    alt={clerkUsers[user.clerk_id].fullName || formatDisplayName(user)} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitialLetter(user)
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-indigo-100">
                                  {clerkUsers[user.clerk_id]?.fullName || formatDisplayName(user)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-indigo-100">
                              {user.email || (clerkUsers[user.clerk_id]?.email || 'No email')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-indigo-800/50 text-indigo-200 border border-indigo-700/50' 
                                : 'bg-emerald-900/30 text-emerald-200 border border-emerald-800/30'
                            }`}>
                              {user.role || 'student'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-indigo-200">
                              {user.group_class ? (
                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-200 border border-blue-800/30">
                                  {user.group_class}
                                </span>
                              ) : (
                                <span className="text-indigo-400 italic text-xs">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-indigo-200">
                              {user.phone_number ? (
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 text-indigo-400 mr-2" />
                                  {user.phone_number}
                                </div>
                              ) : (
                                <span className="text-indigo-400 italic text-xs">Not provided</span>
                              )}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                            {user.gender ? (
                              <span className="capitalize">{user.gender}</span>
                            ) : (
                              <span className="text-indigo-400 italic text-xs">Not provided</span>
                            )}
                          </td>
                          <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-indigo-200">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-indigo-400 mr-2" />
                              {user.created_at 
                                ? new Date(user.created_at).toLocaleDateString() 
                                : 'Unknown'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Card View */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user) => (
                  <div 
                    key={`card-${user.clerk_id}`} 
                    className={`bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer border border-indigo-800/30 ${
                      selectedUser === user.clerk_id ? 'ring-2 ring-indigo-400 transform scale-[1.02]' : ''
                    }`}
                    onClick={() => toggleUserSelection(user.clerk_id)}
                  >
                    <div className="bg-gradient-to-r from-indigo-800 to-purple-800 h-16 relative">
                      <div className="absolute top-8 left-4">
                        <div className="h-16 w-16 rounded-full bg-indigo-900/50 p-1 shadow-md border border-indigo-700/50">
                          <div className="h-full w-full rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
                            {clerkUsers[user.clerk_id] && clerkUsers[user.clerk_id].imageUrl ? (
                              <img 
                                src={clerkUsers[user.clerk_id].imageUrl} 
                                alt={clerkUsers[user.clerk_id].fullName || formatDisplayName(user)} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitialLetter(user)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-12 p-4">
                      <h3 className="text-lg font-semibold text-indigo-100">
                        {clerkUsers[user.clerk_id]?.fullName || formatDisplayName(user)}
                      </h3>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center text-sm text-indigo-200">
                          <Mail className="h-4 w-4 text-indigo-400 mr-2" />
                          <span className="truncate">{user.email || (clerkUsers[user.clerk_id]?.email || 'No email')}</span>
                        </div>
                        {user.phone_number && (
                          <div className="flex items-center text-sm text-indigo-200">
                            <Phone className="h-4 w-4 text-indigo-400 mr-2" />
                            {user.phone_number}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-indigo-200">
                          <Calendar className="h-4 w-4 text-indigo-400 mr-2" />
                          {user.created_at 
                            ? new Date(user.created_at).toLocaleDateString() 
                            : 'Unknown'}
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-indigo-800/50 text-indigo-200 border border-indigo-700/50' 
                            : 'bg-emerald-900/30 text-emerald-200 border border-emerald-800/30'
                        }`}>
                          {user.role || 'student'}
                        </span>
                        <div className="flex space-x-2">
                          {user.group_class && (
                            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-200 border border-blue-800/30">
                              {user.group_class}
                            </span>
                          )}
                          {user.gender && (
                            <span className="text-xs text-indigo-300 capitalize">
                              {user.gender}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}