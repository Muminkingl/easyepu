'use client';

import { useState } from 'react';
import { fixAnnouncementsTable, createPollsTable, updatePollResponsesTable } from '@/lib/fixDatabase';
import { useUserRole } from '@/hooks/useUserRole';
import Link from 'next/link';
import { ChevronLeft, Database, RefreshCw, Loader2, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { clerkClient } from '@clerk/nextjs'; 
import { getUserDataAction, updateUserUsernameAction } from '@/lib/actions';

export default function FixDatabasePage() {
  const { isAdmin, isLoading } = useUserRole();
  const [isFixingAnnouncements, setIsFixingAnnouncements] = useState<boolean>(false);
  const [isCreatingPolls, setIsCreatingPolls] = useState<boolean>(false);
  const [isUpdatingPollResponses, setIsUpdatingPollResponses] = useState<boolean>(false);
  const [isUpdatingUsernames, setIsUpdatingUsernames] = useState<boolean>(false);
  const [announcementsResult, setAnnouncementsResult] = useState<boolean | null>(null);
  const [pollsResult, setPollsResult] = useState<boolean | null>(null);
  const [pollResponsesResult, setPollResponsesResult] = useState<boolean | null>(null);
  const [usernamesResult, setUsernamesResult] = useState<boolean | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-950">
        <div className="p-4 rounded-lg bg-indigo-900/40 backdrop-blur-sm border border-indigo-800/30 shadow-lg">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin mx-auto" />
          <p className="mt-2 text-indigo-300 text-center">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-indigo-950">
        <div className="p-8 max-w-md w-full rounded-lg bg-indigo-900/40 backdrop-blur-sm border border-indigo-800/30 shadow-lg">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4 mx-auto" />
          <h1 className="text-2xl font-bold text-center text-indigo-100 mb-2">Admin Access Required</h1>
          <p className="text-center text-indigo-300 mb-6">You need admin privileges to access this page.</p>
          <div className="flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-indigo-700/80 text-white rounded-md hover:bg-indigo-600/80 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleFixAnnouncements = async () => {
    setIsFixingAnnouncements(true);
    setAnnouncementsResult(null);
    
    try {
      const success = await fixAnnouncementsTable();
      setAnnouncementsResult(success);
    } catch (error) {
      console.error('Error fixing announcements table:', error);
      setAnnouncementsResult(false);
    } finally {
      setIsFixingAnnouncements(false);
    }
  };

  const handleCreatePolls = async () => {
    setIsCreatingPolls(true);
    setPollsResult(null);
    
    try {
      const success = await createPollsTable();
      setPollsResult(success);
    } catch (error) {
      console.error('Error creating polls table:', error);
      setPollsResult(false);
    } finally {
      setIsCreatingPolls(false);
    }
  };

  const handleUpdatePollResponses = async () => {
    setIsUpdatingPollResponses(true);
    setPollResponsesResult(null);
    
    try {
      const success = await updatePollResponsesTable();
      setPollResponsesResult(success);
    } catch (error) {
      console.error('Error updating poll responses table:', error);
      setPollResponsesResult(false);
    } finally {
      setIsUpdatingPollResponses(false);
    }
  };

  const handleUpdateUsernames = async () => {
    setIsUpdatingUsernames(true);
    setUsernamesResult(null);
    
    try {
      // This is a server action - separate implementation needed
      const success = await updateClerkUsernames();
      setUsernamesResult(success);
    } catch (error) {
      console.error('Error updating usernames from Clerk:', error);
      setUsernamesResult(false);
    } finally {
      setIsUpdatingUsernames(false);
    }
  };

  // Function to update all usernames from Clerk data
  async function updateClerkUsernames() {
    try {
      // This is a client-side representation - server-side implementation in actions.ts needed
      const result = await fetch('/api/admin/update-usernames', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return result.ok;
    } catch (error) {
      console.error('Error updating usernames:', error);
      return false;
    }
  }

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-indigo-300 hover:text-indigo-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-indigo-100">Fix Database Structure</h1>
          <p className="mt-1 text-indigo-300">
            Use these tools to update the database structure when needed.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Fix announcements table */}
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-indigo-800/50 rounded-lg p-3 mr-4">
                <Database className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-indigo-100">Fix Announcements Table</h2>
                <p className="mt-1 text-sm text-indigo-300">
                  Updates the announcements table structure to work with Clerk user IDs.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleFixAnnouncements}
                disabled={isFixingAnnouncements}
                className="w-full py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isFixingAnnouncements ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Fix Announcements Table
                  </>
                )}
              </button>
            </div>
            
            {announcementsResult !== null && (
              <div className={`mt-4 p-3 rounded-lg ${
                announcementsResult 
                  ? 'bg-green-900/20 text-green-300 border border-green-800/30' 
                  : 'bg-red-900/20 text-red-300 border border-red-800/30'
              }`}>
                <div className="flex items-center">
                  {announcementsResult ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                  )}
                  <span>
                    {announcementsResult 
                      ? 'Announcements table fixed successfully!' 
                      : 'Failed to fix announcements table. Check console for details.'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Create polls table */}
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-indigo-800/50 rounded-lg p-3 mr-4">
                <Database className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-indigo-100">Create Polls Tables</h2>
                <p className="mt-1 text-sm text-indigo-300">
                  Creates the polls and poll_responses tables if they don't exist.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleCreatePolls}
                disabled={isCreatingPolls}
                className="w-full py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCreatingPolls ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create Polls Tables
                  </>
                )}
              </button>
            </div>
            
            {pollsResult !== null && (
              <div className={`mt-4 p-3 rounded-lg ${
                pollsResult 
                  ? 'bg-green-900/20 text-green-300 border border-green-800/30' 
                  : 'bg-red-900/20 text-red-300 border border-red-800/30'
              }`}>
                <div className="flex items-center">
                  {pollsResult ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                  )}
                  <span>
                    {pollsResult 
                      ? 'Polls tables created successfully!' 
                      : 'Failed to create polls tables. Check console for details.'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Update poll_responses table */}
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-indigo-800/50 rounded-lg p-3 mr-4">
                <Database className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-indigo-100">Update Poll Responses Table</h2>
                <p className="mt-1 text-sm text-indigo-300">
                  Adds username, email, gender, and group_class columns to the poll_responses table.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleUpdatePollResponses}
                disabled={isUpdatingPollResponses}
                className="w-full py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUpdatingPollResponses ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Poll Responses Table
                  </>
                )}
              </button>
            </div>
            
            {pollResponsesResult !== null && (
              <div className={`mt-4 p-3 rounded-lg ${
                pollResponsesResult 
                  ? 'bg-green-900/20 text-green-300 border border-green-800/30' 
                  : 'bg-red-900/20 text-red-300 border border-red-800/30'
              }`}>
                <div className="flex items-center">
                  {pollResponsesResult ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                  )}
                  <span>
                    {pollResponsesResult 
                      ? 'Poll responses table updated successfully!' 
                      : 'Failed to update poll responses table. Check console for details.'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Update usernames from Clerk */}
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 p-6">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-indigo-800/50 rounded-lg p-3 mr-4">
                <Users className="h-6 w-6 text-indigo-300" />
              </div>
                <div>
                <h2 className="text-lg font-semibold text-indigo-100">Update All Usernames</h2>
                <p className="mt-1 text-sm text-indigo-300">
                  Sets usernames from Clerk data for all users who don't have a username set.
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleUpdateUsernames}
                disabled={isUpdatingUsernames}
                className="w-full py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isUpdatingUsernames ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Usernames...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update All Usernames
                  </>
                )}
              </button>
            </div>
            
            {usernamesResult !== null && (
              <div className={`mt-4 p-3 rounded-lg ${
                usernamesResult 
                  ? 'bg-green-900/20 text-green-300 border border-green-800/30' 
                  : 'bg-red-900/20 text-red-300 border border-red-800/30'
              }`}>
                <div className="flex items-center">
                  {usernamesResult ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-400" />
                  )}
                  <span>
                    {usernamesResult 
                      ? 'All usernames updated successfully!' 
                      : 'Failed to update usernames. Check console for details.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 