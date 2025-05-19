'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getAnnouncements, Announcement, getPollByAnnouncementId } from '@/lib/supabase';
import { useUserData } from '@/hooks/useUserData';
import { Bell, AlertTriangle, Calendar, Users, Search, Loader2, FileText, BarChart, RefreshCw, X } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import { useSemesterCheck } from '@/hooks/useSemesterCheck';
import Maintenance from '@/components/Maintenance';

// Fetcher function for SWR
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

export default function AnnouncementsPage() {
  const { userData } = useUserData();
  const { t, lang: locale, dir } = useTranslations();
  const { semesterSelected, isChecking, SemesterLock } = useSemesterCheck();
  const isRtl = dir === 'rtl';
  const { data, error, mutate } = useSWR(
    ['announcements', userData?.semester], 
    ([key, semester]) => announcementsFetcher(key, semester),
    {
      refreshInterval: 60000, // Auto-refresh every minute
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );
  
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get announcements and filter them
  const allAnnouncements = data || [];
  const loading = !data && !error;
  
  // Filter announcements based on search
  const filteredAnnouncements = allAnnouncements.filter(announcement => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      announcement.title.toLowerCase().includes(lowerCaseQuery) ||
      announcement.content.toLowerCase().includes(lowerCaseQuery)
    );
  });

  // Load read announcements from localStorage
  useEffect(() => {
    const savedRead = localStorage.getItem('readAnnouncements');
    if (savedRead) {
      try {
        setReadAnnouncements(JSON.parse(savedRead));
      } catch (err) {
        console.error('Error parsing read announcements:', err);
      }
    }
  }, []);
  
  // Mark announcement as read
  const markAsRead = useCallback((id: string) => {
    if (!readAnnouncements.includes(id)) {
      const updated = [...readAnnouncements, id];
      setReadAnnouncements(updated);
      localStorage.setItem('readAnnouncements', JSON.stringify(updated));
      
      // Update global unread count
      if (typeof window !== 'undefined') {
        const currentCount = window.unreadAnnouncementsCount || 0;
        window.unreadAnnouncementsCount = Math.max(0, currentCount - 1);
        
        const event = new CustomEvent('unreadAnnouncementsUpdated', {
          detail: { count: window.unreadAnnouncementsCount }
        });
        window.dispatchEvent(event);
      }
    }
  }, [readAnnouncements]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Refresh announcements
  const refreshAnnouncements = () => {
    mutate();
  };

  // Maintenance mode
  const maintenanceMode = true; // Set this to false to disable maintenance mode
  
  // If in maintenance mode, show maintenance screen
  if (maintenanceMode) {
    return <Maintenance returnUrl="/dashboard" returnText={t('sidebar.dashboard')} />;
  }
  
  // Show loading state if still checking semester requirements
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // If semester is not selected, show the lock screen
  if (!semesterSelected) {
    return (
      <div className="min-h-screen p-6">
        <SemesterLock />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">{t('announcements.title')}</h1>
          <p className="text-indigo-200">
            {t('dashboard.viewAllAnnouncements')}
          </p>
        </div>
        
        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-5 w-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={t('announcements.searchAnnouncements')}
              className={`${isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'} py-2 border border-indigo-700/50 bg-indigo-900/30 text-white rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 backdrop-blur-sm placeholder-indigo-400/70`}
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center text-indigo-400 hover:text-indigo-300`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <button
            onClick={refreshAnnouncements}
            className="flex items-center justify-center py-2 px-4 border border-indigo-700/50 bg-indigo-800/30 rounded-lg hover:bg-indigo-700/30 text-indigo-200 transition-colors sm:w-auto backdrop-blur-sm"
          >
            <RefreshCw className={`h-5 w-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t('announcements.refresh')}
          </button>
        </div>
        
        {/* Announcements List */}
        {loading ? (
          <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-md p-8 animate-pulse border border-indigo-800/30">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-700/30 rounded-full w-12 h-12 mr-4"></div>
              <div>
                <div className="h-6 bg-indigo-700/30 rounded w-48 mb-2"></div>
                <div className="h-4 bg-indigo-700/30 rounded w-32"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-indigo-700/30 rounded w-full"></div>
              <div className="h-4 bg-indigo-700/30 rounded w-full"></div>
              <div className="h-4 bg-indigo-700/30 rounded w-3/4"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 backdrop-blur-sm border border-red-700/30 rounded-xl p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">{t('announcements.failedToLoad')}</h2>
            <p className="text-red-300 mb-6">
              {t('dashboard.alerts.defaultRole')}
            </p>
            <button
              onClick={refreshAnnouncements}
              className="inline-flex items-center py-2 px-4 bg-red-800/50 hover:bg-red-700/50 text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('announcements.tryAgain')}
            </button>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-md p-8 text-center border border-indigo-800/30">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">{t('announcements.noMatchingAnnouncements')}</h2>
                <p className="text-indigo-300 mb-6">
                  {t('announcements.noMatchingMessage', { query: searchQuery })}
                </p>
                <button
                  onClick={clearSearch}
                  className="inline-flex items-center py-2 px-4 bg-indigo-700 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                >
                  {t('announcements.clearSearch')}
                </button>
              </>
            ) : (
              <>
                <FileText className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">{t('announcements.noAnnouncements')}</h2>
                <p className="text-indigo-300">
                  {t('announcements.noAnnouncementsMessage')}
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnnouncements.map(announcement => {
              const isRead = readAnnouncements.includes(announcement.id);
              
              return (
                <Link
                  key={announcement.id}
                  href={`/dashboard/announcements/${announcement.id}`}
                  onClick={() => markAsRead(announcement.id)}
                  className={`block bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-indigo-800/30
                    ${!isRead ? `border-${isRtl ? 'r' : 'l'}-4 border-indigo-500` : ''}`}
                >
                  <div className="p-6">
                    <div className={`flex items-start ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="flex-1">
                        <div className={`flex items-center mb-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isRead && (
                            <div className={`h-2 w-2 bg-indigo-400 rounded-full ${isRtl ? 'ml-2' : 'mr-2'}`}></div>
                          )}
                          {announcement.important && (
                            <div className={`bg-red-800/50 p-1 rounded-full ${isRtl ? 'ml-2' : 'mr-2'}`}>
                              <AlertTriangle className="h-4 w-4 text-red-300" />
                            </div>
                          )}
                          <h3 className="text-lg font-semibold text-white">
                            {announcement.title}
                          </h3>
                          
                          {announcement.hasPoll && (
                            <div className={`bg-indigo-800/50 p-1 rounded-full ${isRtl ? 'mr-2' : 'ml-2'}`}>
                              <BarChart className="h-4 w-4 text-indigo-300" />
                            </div>
                          )}
                        </div>
                        
                        <p className={`text-indigo-200 mb-4 line-clamp-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                          {announcement.content}
                        </p>
                        
                        <div className={`flex flex-wrap items-center text-sm text-indigo-400 gap-3 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Calendar className={`h-4 w-4 ${isRtl ? 'mr-1 order-2' : 'mr-1'}`} />
                            <span>{new Date(announcement.created_at).toLocaleDateString(locale)}</span>
                          </div>
                          
                          {announcement.important && (
                            <div className="flex items-center">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-red-800/40 text-red-300">
                                {t('announcements.important')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 