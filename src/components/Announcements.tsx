'use client';

import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { getAnnouncements, Announcement, getPollByAnnouncementId } from '@/lib/supabase';
import { useUserData } from '@/hooks/useUserData';
import { Bell, AlertTriangle, ChevronRight, X, FileText, BarChart, RefreshCw } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

// Create a fetcher function for SWR
const announcementsFetcher = async (key: string, semester?: number) => {
  const data = await getAnnouncements();
  // Filter announcements that are published and either match the semester or have no semester set
  const announcements = data
    .filter(a => a.published)
    .filter(a => !semester || !a.semester || a.semester === semester);
  
  // Check each announcement for polls
  const announcementsWithPollInfo = await Promise.all(
    announcements.map(async (announcement) => {
      const poll = await getPollByAnnouncementId(announcement.id);
      return {
        ...announcement,
        hasPoll: !!poll,
        poll: poll
      };
    })
  );
  
  return announcementsWithPollInfo;
};

export default function Announcements() {
  const { userData } = useUserData();
  const { t, dir } = useTranslations();
  // Use SWR for data fetching with auto-refresh
  const { data, error, mutate } = useSWR(
    ['announcements', userData?.semester], 
    ([key, semester]) => announcementsFetcher(key, semester), 
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>([]);

  // Get announcements or empty array if loading
  const announcements = data || [];
  // Is it loading?
  const loading = !data && !error;

  useEffect(() => {
    // Load dismissed announcements from localStorage
    const savedDismissed = localStorage.getItem('dismissedAnnouncements');
    if (savedDismissed) {
      try {
        setDismissedAnnouncements(JSON.parse(savedDismissed));
      } catch (err) {
        console.error('Error parsing dismissed announcements:', err);
      }
    }

    // Load read announcements from localStorage
    const savedRead = localStorage.getItem('readAnnouncements');
    if (savedRead) {
      try {
        setReadAnnouncements(JSON.parse(savedRead));
      } catch (err) {
        console.error('Error parsing read announcements:', err);
      }
    }
  }, []);

  // This function dismisses an announcement from the UI
  const dismissAnnouncement = (id: string) => {
    const updated = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(updated);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(updated));
  };

  // This function marks an announcement as read
  const markAsRead = useCallback((id: string) => {
    if (!readAnnouncements.includes(id)) {
      const updated = [...readAnnouncements, id];
      setReadAnnouncements(updated);
      localStorage.setItem('readAnnouncements', JSON.stringify(updated));
    }
  }, [readAnnouncements]);

  // Function to get the count of unread announcements
  const getUnreadCount = useCallback(() => {
    return announcements.filter(
      announcement => !readAnnouncements.includes(announcement.id)
    ).length;
  }, [announcements, readAnnouncements]);

  // Export the unread count to make it available globally
  useEffect(() => {
    // Only set this when we have data
    if (announcements.length > 0) {
      window.unreadAnnouncementsCount = getUnreadCount();
      
      // Dispatch an event that other components can listen for
      const event = new CustomEvent('unreadAnnouncementsUpdated', {
        detail: { count: getUnreadCount() }
      });
      window.dispatchEvent(event);
    }
  }, [announcements, readAnnouncements, getUnreadCount]);

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(
    announcement => !dismissedAnnouncements.includes(announcement.id)
  );

  // Function to refresh announcements data
  const refreshAnnouncements = () => {
    mutate();
  };

  if (loading) {
    return (
      <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-md p-6 animate-pulse border border-indigo-800/30">
        <div className="flex items-center mb-4">
          <div className="bg-indigo-700/30 rounded-full w-8 h-8 mr-3"></div>
          <div className="h-6 bg-indigo-700/30 rounded w-1/3"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-indigo-700/30 rounded w-3/4"></div>
          <div className="h-4 bg-indigo-700/30 rounded w-full"></div>
          <div className="h-4 bg-indigo-700/30 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 backdrop-blur-sm border border-red-800/30 rounded-xl p-4 shadow-sm">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
          <p className="text-red-300">{t('announcements.failedToLoad')}</p>
        </div>
        <button 
          onClick={refreshAnnouncements}
          className="mt-3 px-4 py-2 bg-red-800/30 hover:bg-red-700/30 text-red-200 text-sm font-medium rounded-md transition-colors"
        >
          {t('announcements.tryAgain')}
        </button>
      </div>
    );
  }

  // Show a nice empty state instead of nothing
  if (visibleAnnouncements.length === 0) {
    return (
      <div className={`text-center py-8 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <div className="mx-auto w-16 h-16 bg-indigo-800/30 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-indigo-300" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">{t('announcements.noAnnouncements')}</h3>
        <p className="text-indigo-300 max-w-md mx-auto">
          {t('announcements.noAnnouncementsMessage')}
        </p>
        <button 
          onClick={refreshAnnouncements}
          className="mt-4 px-4 py-2 bg-indigo-700/30 hover:bg-indigo-600/30 text-indigo-200 text-sm font-medium rounded-md transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-1 inline" />
          {t('announcements.refresh')}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Bell className={`${dir === 'rtl' ? 'ml-2' : 'mr-2'} h-5 w-5 text-indigo-400`} />
          {t('announcements.title')}
          {getUnreadCount() > 0 && (
            <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full`}>
              {getUnreadCount()}
            </span>
          )}
        </h2>
        <button 
          onClick={refreshAnnouncements}
          className="text-sm text-indigo-300 hover:text-indigo-200 flex items-center"
        >
          <RefreshCw className={`h-4 w-4 ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} />
          {t('announcements.refresh')}
        </button>
      </div>
      
      {visibleAnnouncements.map(announcement => {
        const isRead = readAnnouncements.includes(announcement.id);
        
        return (
          <div 
            key={announcement.id} 
            className={`relative bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-md overflow-hidden ${dir === 'rtl' ? 'border-r-4' : 'border-l-4'} ${
              announcement.important ? 'border-red-500' : isRead ? 'border-indigo-700/50' : 'border-indigo-500'
            } ${isRead ? 'opacity-75' : 'opacity-100'} border border-indigo-800/30`}
          >
            <button 
              onClick={() => dismissAnnouncement(announcement.id)}
              className={`absolute top-2 ${dir === 'rtl' ? 'left-2' : 'right-2'} text-indigo-300 hover:text-indigo-100 focus:outline-none`}
              aria-label={t('announcements.dismiss')}
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-5">
              <div className="flex items-start mb-2">
                {announcement.important && (
                  <div className={`bg-red-800/50 p-1 rounded-full ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`}>
                    <AlertTriangle className="h-4 w-4 text-red-300" />
                  </div>
                )}
                {!isRead && (
                  <div className={`h-2 w-2 rounded-full bg-indigo-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'} mt-2`}></div>
                )}
                <h3 className={`text-lg font-semibold ${isRead ? 'text-indigo-300' : 'text-white'}`}>
                  {announcement.title}
                </h3>
                
                {announcement.hasPoll && (
                  <div className={`bg-indigo-800/50 p-1 rounded-full ${dir === 'rtl' ? 'mr-2' : 'ml-2'} flex-shrink-0`}>
                    <BarChart className="h-4 w-4 text-indigo-300" />
                  </div>
                )}
              </div>
              
              <p className={`${isRead ? 'text-indigo-400' : 'text-indigo-200'} line-clamp-3`}>
                {announcement.content}
              </p>
              
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-indigo-400">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
                
                <Link
                  href={`/dashboard/announcements/${announcement.id}`}
                  onClick={() => markAsRead(announcement.id)}
                  className="inline-flex items-center text-indigo-300 hover:text-indigo-100 text-sm font-medium"
                >
                  {announcement.hasPoll ? t('announcements.viewPoll') : t('announcements.readMore')} 
                  <ChevronRight className={`h-4 w-4 ${dir === 'rtl' ? 'mr-1' : 'ml-1'}`} />
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Add to window type
declare global {
  interface Window {
    unreadAnnouncementsCount: number;
  }
} 