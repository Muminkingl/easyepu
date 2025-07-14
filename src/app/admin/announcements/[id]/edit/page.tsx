'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { getAnnouncements, Announcement } from '@/lib/supabase';
import { updateAnnouncementAction } from '@/lib/actions';
import { 
  Bell, 
  ChevronLeft, 
  Save, 
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Use the newer Next.js approach to unwrap params
  const resolvedParams = 'then' in params ? use(params) : params;
  const announcementId = resolvedParams.id;
  
  const router = useRouter();
  const { isAdmin, isLoading: isRoleLoading } = useUserRole();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [important, setImportant] = useState(false);
  const [targetAudience, setTargetAudience] = useState('all');

  useEffect(() => {
    // Only redirect if we're sure the user is not an admin (role loading is complete)
    if (!isRoleLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    if (isRoleLoading) {
      return; // Wait for role to be determined
    }

    async function loadAnnouncement() {
      try {
        const data = await getAnnouncements();
        const found = data.find(a => a.id === announcementId);
        
        if (!found) {
          setError('Announcement not found');
        } else {
          setAnnouncement(found);
          setTitle(found.title);
          setContent(found.content);
          setPublished(found.published);
          setImportant(found.important);
          setTargetAudience(found.target_audience);
        }
      } catch (err) {
        console.error('Error loading announcement:', err);
        setError('Failed to load announcement');
      } finally {
        setLoading(false);
      }
    }

    loadAnnouncement();
  }, [announcementId, isAdmin, router, isRoleLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      const success = await updateAnnouncementAction(
        announcementId,
        {
          title: title.trim(),
          content: content.trim(),
          published,
          important,
          target_audience: targetAudience
        }
      );
      
      if (success) {
        router.push(`/admin/announcements/${announcementId}`);
      } else {
        throw new Error('Failed to update announcement');
      }
    } catch (err) {
      console.error('Error updating announcement:', err);
      setError('Failed to update announcement');
      setSaving(false);
    }
  };

  // Show loading state while checking admin status
  if (isRoleLoading) {
    return (
      <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-300 mx-auto mb-4" />
            <p className="text-indigo-300">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Return null if not admin (will be redirected in useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-indigo-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/admin/announcements/${announcementId}`}
            className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Announcement
          </Link>
        </div>
        
        {error ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center mb-6">
            <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-indigo-100 mb-2">{error}</h2>
            {announcement ? null : (
              <p className="text-indigo-300 mb-6">
                The announcement might have been deleted or you don't have permission to edit it.
              </p>
            )}
          </div>
        ) : null}
        
        {loading ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md border border-indigo-800/30 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-300 mx-auto mb-4" />
            <p className="text-indigo-300">Loading announcement...</p>
          </div>
        ) : announcement ? (
          <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-indigo-800/30">
            <div className="p-6 border-b border-indigo-800/30">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-indigo-800/50 rounded-full border border-indigo-700/50">
                  <Bell className="h-6 w-6 text-indigo-300" />
                </div>
                <h1 className="text-2xl font-bold text-indigo-100">Edit Announcement</h1>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-indigo-200 mb-1">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter announcement title"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-indigo-200 mb-1">
                    Content <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter announcement content"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="block text-sm font-medium text-indigo-200 mb-2">Settings</p>
                    
                    <div className="space-y-3 bg-indigo-800/20 p-4 rounded-lg border border-indigo-700/30">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="published"
                          checked={published}
                          onChange={(e) => setPublished(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-indigo-700/50 rounded"
                        />
                        <label htmlFor="published" className="ml-2 text-indigo-200">
                          Published
                        </label>
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="important"
                          checked={important}
                          onChange={(e) => setImportant(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-indigo-700/50 rounded"
                        />
                        <label htmlFor="important" className="ml-2 flex items-center text-indigo-200">
                          <AlertTriangle className="h-4 w-4 text-amber-400 mr-1" />
                          Mark as important
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="targetAudience" className="block text-sm font-medium text-indigo-200 mb-2">
                      Target Audience
                    </label>
                    <select
                      id="targetAudience"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-indigo-800/30 text-indigo-100 border border-indigo-700/50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Users</option>
                      <option value="students">Students Only</option>
                      <option value="faculty">Faculty Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center py-2 px-6 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
} 