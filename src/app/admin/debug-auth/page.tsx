'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { debugAdminAuth } from '@/lib/actions';
import { AlertTriangle, ChevronLeft, Loader2 } from 'lucide-react';

export default function DebugAuthPage() {
  const { user } = useUser();
  const router = useRouter();
  const [debugResult, setDebugResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runDebug = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const userId = String(user.id);
      console.log('Running debug for user ID:', userId);
      
      const result = await debugAdminAuth(userId);
      console.log('Debug result:', result);
      
      setDebugResult(result);
    } catch (err) {
      console.error('Debug error:', err);
      setError('Failed to run auth debug. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Admin Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-800">Authentication Debug</h1>
          <p className="mt-2 text-gray-600">Use this page to debug authentication and admin role issues</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-xl overflow-hidden mb-6">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="font-semibold text-gray-800">User Authentication Debug</h2>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-700">Current User: {user?.firstName} {user?.lastName}</p>
              <p className="text-gray-700">User ID: {user?.id}</p>
              <p className="text-gray-700">Email: {user?.primaryEmailAddress?.emailAddress}</p>
            </div>
            
            <button
              onClick={runDebug}
              disabled={loading}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors 
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Running Debug...
                </span>
              ) : (
                'Debug Authentication'
              )}
            </button>
          </div>
        </div>

        {debugResult && (
          <div className="bg-white shadow-md rounded-xl overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="font-semibold text-gray-800">Debug Results</h2>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-800 mb-2">User Data</h3>
                {debugResult.userData ? (
                  <div className="mb-4">
                    <p><strong>Clerk ID:</strong> {debugResult.userData.clerk_id}</p>
                    <p><strong>Email:</strong> {debugResult.userData.email}</p>
                    <p><strong>Role:</strong> <span className={`font-bold ${debugResult.userData.role === 'admin' ? 'text-green-600' : 'text-red-600'}`}>{debugResult.userData.role}</span></p>
                    <p><strong>Created:</strong> {new Date(debugResult.userData.created_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-red-600">User not found in database!</p>
                )}

                <h3 className="text-lg font-medium text-gray-800 mb-2">Authentication Status</h3>
                <div className="mb-4">
                  <p><strong>Has Session:</strong> {debugResult.authStatus?.hasSession ? 'Yes' : 'No'}</p>
                  <p><strong>Auth User ID:</strong> {debugResult.authStatus?.userId || 'None'}</p>
                </div>

                <h3 className="text-lg font-medium text-gray-800 mb-2">RLS Check</h3>
                {debugResult.rlsCheck?.error ? (
                  <p className="text-red-600">Error: {JSON.stringify(debugResult.rlsCheck.error)}</p>
                ) : (
                  <p>Is Admin: <span className={`font-bold ${debugResult.rlsCheck?.result ? 'text-green-600' : 'text-red-600'}`}>{debugResult.rlsCheck?.result ? 'Yes' : 'No'}</span></p>
                )}

                <h3 className="text-lg font-medium text-gray-800 mb-2">Raw Debug Data</h3>
                <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-auto max-h-96">
                  {JSON.stringify(debugResult, null, 2)}
                </pre>
              </div>

              <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">Troubleshooting Guide</h3>
                <ul className="list-disc list-inside space-y-2 text-yellow-700">
                  <li>If user is not found, make sure the user has signed in at least once.</li>
                  <li>If role is not 'admin', run the SQL update statement to set the role.</li>
                  <li>If RLS check fails, verify the users table structure and that the clerk_id is stored as TEXT.</li>
                  <li>Verify auth.uid() format matches the stored clerk_id format in the database.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 