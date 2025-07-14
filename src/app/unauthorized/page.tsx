'use client';

import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function Unauthorized() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If user is not signed in, redirect to home
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
    
    // If user has EPU email, redirect to dashboard
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress?.endsWith('@epu.edu.iq')) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Unauthorized Access
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-lg text-gray-800 mb-4">
            This platform is only available for users with an <strong>@epu.edu.iq</strong> email address.
          </p>
          <p className="text-gray-600">
            You're currently signed in with: <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
          </p>
          <p className="text-gray-600 mt-2">
            Please sign out and try again with your EPU email account.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Home
          </Link>
          
          <SignOutButton>
            <button className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Sign Out
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}