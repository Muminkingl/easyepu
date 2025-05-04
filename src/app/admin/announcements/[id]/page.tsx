'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { getAnnouncements, Announcement, getPollByAnnouncementId, Poll, getPollResults, PollResults } from '@/lib/supabase';
import { updatePollAction, deleteAnnouncementAction } from '@/lib/actions';
import PollComponent from '@/components/PollComponent';
import AdminPollResults from '@/components/AdminPollResults';
import { 
  Bell, 
  Calendar, 
  ChevronLeft, 
  AlertTriangle, 
  Edit,
  Trash2,
  BarChart,
  PlayCircle,
  PauseCircle,
  Loader2
} from 'lucide-react';

// Client-only loader component to fix hydration issues
function ClientOnlyLoader({ className }: { className: string }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div className={className} />;
  }
  
  return <Loader2 className={`${className} animate-spin`} />;
}

export default function AnnouncementDetailsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Use the newer Next.js approach to unwrap params
  const resolvedParams = 'then' in params ? use(params) : params;
  const announcementId = resolvedParams.id;
  
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    async function loadAnnouncement() {
      try {
        const data = await getAnnouncements();
        const found = data.find(a => a.id === announcementId);
        
        if (!found) {
          setError('Announcement not found');
        } else {
          setAnnouncement(found);
          
          // Check if there's a poll for this announcement
          const pollData = await getPollByAnnouncementId(announcementId);
          if (pollData) {
            setPoll(pollData);
            
            // Get poll results
            const results = await getPollResults(pollData.id);
            if (results) {
              setPollResults(results);
            }
          }
        }
      } catch (err) {
        console.error('Error loading announcement:', err);
        setError('Failed to load announcement');
      } finally {
        setLoading(false);
      }
    }

    if (!isRoleLoading && isAdmin) {
      loadAnnouncement();
    } else if (!isRoleLoading && !isAdmin) {
      setError('You do not have permission to view this page');
      setLoading(false);
    }
  }, [announcementId, isRoleLoading, isAdmin]);

  const handleDelete = async () => {
    if (!announcement || !confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeleting(true);
    try {
      const success = await deleteAnnouncementAction(announcement.id);
      if (success) {
        router.push('/admin/announcements');
      } else {
        throw new Error('Failed to delete announcement');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
      setDeleting(false);
    }
  };

  // Handle toggling poll status
  const handleTogglePollStatus = async () => {
    if (!poll) return;
    
    setUpdateLoading(true);
    try {
      const success = await updatePollAction(poll.id, {
        is_active: !poll.is_active
      });
      
      if (success) {
        setPoll(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      } else {
        throw new Error('Failed to update poll status');
      }
    } catch (err) {
      console.error('Error updating poll status:', err);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Show loading state while checking permissions
  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <ClientOnlyLoader className="h-8 w-8 text-indigo-300 mx-auto mb-4" />
            <p className="text-indigo-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/admin/announcements"
            className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Announcements
          </Link>
        </div>
        
        {error ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">{error}</h2>
            <p className="text-indigo-300 mb-6">
              Unable to load the announcement. It may have been deleted or you don't have permission to view it.
            </p>
            <Link
              href="/admin/announcements"
              className="mt-4 inline-flex items-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
            >
              Return to Announcements
            </Link>
          </div>
        ) : loading ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <ClientOnlyLoader className="h-8 w-8 text-indigo-300 mx-auto mb-4" />
            <p className="text-indigo-300">Loading announcement...</p>
          </div>
        ) : announcement ? (
          <>
            <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden mb-6 border border-indigo-800/30">
              <div className="p-6 border-b border-indigo-800/30">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-indigo-800/50 rounded-full border border-indigo-700/50">
                    <Bell className="h-6 w-6 text-indigo-300" />
                  </div>
                  <h1 className="text-2xl font-bold text-indigo-100">Announcement Details</h1>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
                  <div className="flex-1">
                    <div className="flex items-start mb-2">
                      {announcement.important && (
                        <div className="bg-red-900/30 p-1 rounded-full mr-2 mt-1 border border-red-800/30">
                          <AlertTriangle className="h-4 w-4 text-red-400" />
                        </div>
                      )}
                      <h2 className="text-2xl font-bold text-indigo-100">{announcement.title}</h2>
                    </div>
                    
                    <div className="flex flex-wrap items-center text-sm text-indigo-400 gap-4 mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          announcement.published 
                            ? 'bg-green-900/30 text-green-300 border border-green-800/30' 
                            : 'bg-yellow-900/30 text-yellow-300 border border-yellow-800/30'
                        }`}>
                          {announcement.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      {announcement.important && (
                        <div className="flex items-center">
                          <span className="px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-300 border border-red-800/30">
                            Important
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-900/30 text-blue-300 border border-blue-800/30">
                          {announcement.target_audience === 'all' 
                            ? 'All Users' 
                            : announcement.target_audience === 'students' 
                              ? 'Students Only' 
                              : 'Faculty Only'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/admin/announcements/${announcement.id}/edit`}
                      className="flex items-center py-2 px-4 bg-indigo-700/50 hover:bg-indigo-600/50 text-indigo-200 font-medium rounded-lg transition-colors border border-indigo-600/30"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center py-2 px-4 bg-red-900/30 hover:bg-red-800/40 text-red-300 font-medium rounded-lg transition-colors border border-red-800/30"
                    >
                      {deleting ? (
                        <ClientOnlyLoader className="h-4 w-4 mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="bg-indigo-800/20 rounded-lg p-6 mt-4 border border-indigo-700/30">
                  <h3 className="text-lg font-semibold text-indigo-100 mb-4">Content</h3>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-indigo-200 whitespace-pre-line">{announcement.content}</p>
                  </div>
                </div>
                
                {poll && (
                  <div className="mt-8 bg-indigo-900/30 border border-indigo-800/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <BarChart className="h-5 w-5 text-indigo-300 mr-2" />
                        <h3 className="text-xl font-semibold text-indigo-100">Poll</h3>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleTogglePollStatus}
                          disabled={updateLoading}
                          className={`flex items-center py-2 px-4 font-medium rounded-lg transition-colors border ${
                            poll.is_active
                              ? 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-300 border-amber-800/30'
                              : 'bg-green-900/30 hover:bg-green-800/40 text-green-300 border-green-800/30'
                          }`}
                        >
                          {updateLoading ? (
                            <ClientOnlyLoader className="h-4 w-4 mr-2" />
                          ) : poll.is_active ? (
                            <PauseCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <PlayCircle className="h-4 w-4 mr-2" />
                          )}
                          {poll.is_active ? 'End Poll' : 'Reactivate Poll'}
                        </button>
                      </div>
                    </div>
                    
                    <AdminPollResults pollId={poll.id} />
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
} 