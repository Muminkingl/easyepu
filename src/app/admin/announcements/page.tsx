'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAnnouncements, Announcement, getPollByAnnouncementId } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { deleteAnnouncementAction } from '@/lib/actions';
import { 
  Bell, 
  ChevronLeft, 
  PlusCircle, 
  AlertTriangle, 
  Calendar, 
  Trash2, 
  Edit, 
  Loader2,
  Eye,
  BarChart,
  RefreshCw
} from 'lucide-react';

export default function AnnouncementsPage() {
  const router = useRouter();
  const { isAdmin } = useUserRole();
  const [announcements, setAnnouncements] = useState<(Announcement & { hasPoll?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await getAnnouncements();
        
        // Check each announcement for polls
        const announcementsWithPollInfo = await Promise.all(
          data.map(async (announcement) => {
            const poll = await getPollByAnnouncementId(announcement.id);
            return {
              ...announcement,
              hasPoll: !!poll
            };
          })
        );
        
        setAnnouncements(announcementsWithPollInfo);
      } catch (err) {
        console.error('Error loading announcements:', err);
        setError('Failed to load announcements');
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeleting(id);
    try {
      const success = await deleteAnnouncementAction(id);
      if (success) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } else {
        throw new Error('Failed to delete announcement');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  const refreshAnnouncements = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await getAnnouncements();
      
      // Check each announcement for polls
      const announcementsWithPollInfo = await Promise.all(
        data.map(async (announcement) => {
          const poll = await getPollByAnnouncementId(announcement.id);
          return {
            ...announcement,
            hasPoll: !!poll
          };
        })
      );
      
      setAnnouncements(announcementsWithPollInfo);
    } catch (err) {
      console.error('Error refreshing announcements:', err);
      setError('Failed to refresh announcements');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-indigo-950 p-8">
        <div className="max-w-4xl mx-auto bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-6">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-center text-indigo-100 mb-2">Admin Access Required</h1>
          <p className="text-center text-indigo-300">You need admin privileges to view this page.</p>
          <div className="mt-6 text-center">
            <Link href="/dashboard" className="text-indigo-300 hover:text-indigo-100 font-medium">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-indigo-100">Manage Announcements</h1>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={refreshAnnouncements}
              disabled={loading}
              className="flex items-center justify-center py-2 px-4 border border-indigo-700/30 bg-indigo-800/40 hover:bg-indigo-700/50 text-indigo-200 font-medium rounded-lg transition-colors backdrop-blur-sm"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5 mr-2" />
              )}
              Refresh
            </button>
            
            <Link
              href="/admin/announcements/new"
              className="flex items-center justify-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Announcement
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-900/20 backdrop-blur-sm border border-red-800/30 text-red-300 px-4 py-3 rounded-lg">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-300 mx-auto mb-4" />
            <p className="text-indigo-300">Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <Bell className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">No Announcements Yet</h2>
            <p className="text-indigo-300 mb-6">
              You haven't created any announcements yet. Create your first announcement to share important information with students.
            </p>
            <Link
              href="/admin/announcements/new"
              className="inline-flex items-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Create Announcement
            </Link>
          </div>
        ) : (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 overflow-hidden">
            <div className="grid grid-cols-1 divide-y divide-indigo-800/30">
              {announcements.map(announcement => (
                <div key={announcement.id} className="p-6 hover:bg-indigo-800/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <h3 className="text-lg font-semibold text-indigo-100 mr-2">
                          {announcement.title}
                        </h3>
                        
                        {announcement.hasPoll && (
                          <div className="bg-indigo-700/50 p-1 rounded-full border border-indigo-600/50">
                            <BarChart className="h-4 w-4 text-indigo-300" />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-indigo-300 mt-1 mb-2 line-clamp-2">
                        {announcement.content}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap items-center text-sm text-indigo-400 gap-4">
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
                        
                        {announcement.hasPoll && (
                          <div className="flex items-center">
                            <span className="px-2 py-1 rounded-full text-xs bg-indigo-800/50 text-indigo-300 border border-indigo-700/30">
                              Poll
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/announcements/${announcement.id}`}
                        className="flex items-center py-2 px-3 bg-indigo-800/40 hover:bg-indigo-700/50 text-indigo-200 rounded-lg transition-colors border border-indigo-700/30"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      
                      <Link
                        href={`/admin/announcements/${announcement.id}/edit`}
                        className="flex items-center py-2 px-3 bg-indigo-700/50 hover:bg-indigo-600/50 text-indigo-200 rounded-lg transition-colors border border-indigo-600/30"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                      
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        disabled={deleting === announcement.id}
                        className="flex items-center py-2 px-3 bg-red-900/30 hover:bg-red-800/40 text-red-300 rounded-lg transition-colors border border-red-800/30"
                      >
                        {deleting === announcement.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}