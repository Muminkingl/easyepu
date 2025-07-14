'use client';

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TempAdminDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
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
      
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (loading || !isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6">
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6" role="alert">
          <p className="font-bold">Temporary Admin Page</p>
          <p>This is a temporary admin page that doesn't rely on Supabase. Use this page for testing until you set up Supabase properly.</p>
          <p className="text-sm mt-2">Once Supabase is set up, you can access the regular admin page at /admin.</p>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Temporary Admin Dashboard</h1>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
          </div>
          
          <p className="text-gray-600 mb-4">
            Welcome, {user.firstName || user.primaryEmailAddress?.emailAddress.split('@')[0]}!
          </p>
          
          <div className="bg-indigo-50 p-4 rounded-md mb-6">
            <p className="text-gray-700">
              This temporary page assumes you have <strong>administrator access</strong> with your EPU email: <strong>{user.primaryEmailAddress?.emailAddress}</strong>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Manage Announcements</h2>
              <p className="text-gray-600 mb-4">Create, edit, and delete announcements for students.</p>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm">
                Create Announcement
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">User Management</h2>
              <p className="text-gray-600 mb-4">Manage user roles and permissions.</p>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm">
                View Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 