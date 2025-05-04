'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { fixAnnouncementsTable } from '@/lib/fixDatabase';
import { useUserRole } from '@/hooks/useUserRole';
import Link from 'next/link';
import { ChevronLeft, Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function FixDatabasePage() {
  const { isAdmin } = useUserRole();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleFixDatabase = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await fixAnnouncementsTable();
      
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        throw new Error('Failed to fix database structure');
      }
    } catch (err) {
      console.error('Error fixing database:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
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
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-indigo-100 rounded-full">
                <Database className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Fix Database Structure</h1>
                <p className="text-gray-500">Fix issues with the announcements table</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {!isAdmin && (
              <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-xl flex items-center border border-amber-200 shadow-sm">
                <AlertTriangle className="h-6 w-6 mr-3 text-amber-600" />
                <span className="font-medium">You must be an admin to perform this action.</span>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center border border-green-200 shadow-sm">
                <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                <span className="font-medium">Database fixed successfully! Redirecting...</span>
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center border border-red-200 shadow-sm">
                <AlertTriangle className="h-6 w-6 mr-3 text-red-600" />
                <span className="font-medium">{error}</span>
              </div>
            )}
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-amber-800">Warning: Database Modification</h3>
                  <p className="text-amber-700 mt-1">
                    This action will recreate the announcements table to fix compatibility issues with Clerk authentication.
                    Any existing announcements will be lost.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <Link
                href="/admin"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              
              <button
                onClick={handleFixDatabase}
                disabled={loading || !isAdmin}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    <span>Fixing...</span>
                  </div>
                ) : (
                  <span>Fix Database</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 