'use client';

import { useState, useEffect, use } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useTranslations } from '@/lib/i18n';
import { BarChart, Check, Edit2, Bell, Calendar, ChevronLeft, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAnnouncements, getPollByAnnouncementId } from '@/lib/supabase';
import Link from 'next/link';
import { submitPollResponseAction, getPollResultsAction, getUserDataAction } from '@/lib/actions';
import { useUser } from '@clerk/nextjs';
import DOMPurify from 'dompurify';
import { useRouter } from 'next/navigation';

interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  votes: number;
}

export interface Poll {
  id: string;
  announcement_id: string;
  title: string;           
  question?: string;       // Optional question field that might be in the data
  options: any[];          // Use any[] to allow for different option formats
  created_at: string;
  updated_at: string;
  total_votes?: number;    // Optional since it might not always be present
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  important: boolean;
  published: boolean;
}

export default function AnnouncementDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  // Properly unwrap params using React.use()
  const resolvedParams = 'then' in params ? use(params) : params;
  const announcementId = resolvedParams.id;
  
  const { t, dir } = useTranslations();
  const isRtl = dir === 'rtl';
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('initializing');
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  
  // FIX: Use proper client-side rendering detection
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Improve fetchData to explicitly log poll data and votes
  useEffect(() => {
    // Only run this effect if we're mounted on the client
    if (!isMounted) return;
    
    let isActive = true;
    
    const fetchData = async () => {
      if (!announcementId) {
        setError('No announcement ID found');
        setLoading(false);
        return;
      }
      
      try {
        setLoadingMessage('loadingAnnouncementData');
        
        // Get announcements
        const data = await getAnnouncements();
        
        if (!isActive) return;
        
        if (!data || data.length === 0) {
          console.log('No announcements found');
          setError('No announcements were found');
          setLoading(false);
          return;
        }
        
        // Find the specific announcement
        const foundAnnouncement = data.find(a => a.id === announcementId);
        
        if (foundAnnouncement) {
          console.log(`Found announcement: ${foundAnnouncement.title}`);
          setAnnouncement(foundAnnouncement);
          setLoadingMessage('loadingPollData');
          
          // Now get the poll
          try {
            const pollData = await getPollByAnnouncementId(announcementId);
            if (!isActive) return;
            
            console.log('Raw poll data from API:', pollData);
            
            if (pollData) {
              // Structure expected by our component
              // Use proper type checking or type assertions for the poll data
              const formattedPoll = {
                id: pollData.id || `poll-${Date.now()}`,
                announcement_id: pollData.announcement_id || announcementId,
                title: pollData.title || pollData.question || "Poll Question",
                question: pollData.question || pollData.title || "Poll Question",
                options: Array.isArray(pollData.options) 
                  ? pollData.options.map((opt: any, index) => ({
                      id: typeof opt === 'object' && opt.id ? opt.id : `option-${index}`,
                      poll_id: pollData.id || `poll-${Date.now()}`,
                      option_text: typeof opt === 'object' ? (opt.option_text || opt.text || `Option ${index + 1}`) : opt,
                      votes: typeof opt === 'object' && typeof opt.votes === 'number' ? opt.votes : 0
                    }))
                  : [],
                created_at: pollData.created_at || new Date().toISOString(),
                updated_at: pollData.updated_at || new Date().toISOString(),
                total_votes: typeof pollData.total_votes === 'number' ? pollData.total_votes : 0
              };
              
              console.log('Formatted poll data:', formattedPoll);
              setPoll(formattedPoll as Poll);
            } else {
              console.log('No poll found for this announcement');
            }
          } catch (pollErr) {
            console.error('Error fetching poll:', pollErr);
            // We don't fail the whole page if just the poll fails
          }
          
          // FIX: Make sure to set loading to false regardless of poll results
          if (isActive) {
            setLoading(false);
          }
        } else {
          console.log('Announcement not found by ID');
          setError(`Announcement with ID ${announcementId} was not found`);
          setLoading(false);
        }
      } catch (err) {
        if (!isActive) return;
        console.error('Error fetching announcements:', err);
        
        // Try one more time if first attempt fails
        if (loadAttempt < 1) {
          console.log('Retrying announcement fetch...');
          setLoadAttempt(prev => prev + 1);
        } else {
          setError('Failed to load announcement data. Please try again.');
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Clean up function
    return () => {
      isActive = false;
    };
  }, [announcementId, loadAttempt, isMounted]);

  // Create the render content based on current state
  const renderContent = () => {
    if (!isMounted) {
      return (
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md p-8 text-center border border-indigo-800/30">
          <div className="h-8 w-8 mx-auto mb-4"></div>
          <p className="text-indigo-300">{t('announcements.initializing') || 'Initializing...'}</p>
        </div>
      );
    }

    if (loading) {
      // Show a more detailed and interactive loading state
      return (
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md p-8 text-center border border-indigo-800/30">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-300 mx-auto mb-4" />
          <p className="text-indigo-300 text-lg mb-2">{t(`announcements.${loadingMessage}`) || loadingMessage}</p>
          
          <div className="mt-6 max-w-md mx-auto">
            <div className="w-full bg-indigo-950/50 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all" 
                style={{ 
                  width: loadingMessage === 'loadingPollData' ? '90%' : '50%',
                  transition: 'width 0.5s ease'
                }}
              ></div>
            </div>
            <p className="text-indigo-500 text-xs mt-2">
              {loadAttempt > 0 ? `${t('announcements.retryAttempt') || 'Retry attempt'} ${loadAttempt}...` : (t('announcements.loadingContent') || 'Loading content...')}
            </p>
          </div>
          
          <Link 
            href="/dashboard/announcements" 
            className="mt-6 inline-flex items-center text-indigo-400 hover:text-indigo-200 text-sm"
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            {t('announcements.returnToList') || 'Return to announcements list'}
          </Link>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md p-8 text-center border border-indigo-800/30">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-indigo-100 mb-2">{error}</h2>
          <Link
            href="/dashboard/announcements"
            className="mt-4 inline-flex items-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
          >
            {t('announcements.backToList') || 'Back to announcements'}
          </Link>
        </div>
      );
    }

    if (!announcement) {
      return (
        <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-md p-8 text-center border border-indigo-800/30">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-indigo-100 mb-2">
            {t('announcements.notFound') || 'Announcement not found'}
          </h2>
          <Link
            href="/dashboard/announcements"
            className="mt-4 inline-flex items-center py-2 px-4 bg-indigo-700/80 hover:bg-indigo-600/80 text-white font-medium rounded-lg transition-colors border border-indigo-600/50"
          >
            {t('announcements.backToList') || 'Back to announcements'}
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden mb-6 border border-indigo-800/30">
        <div className="p-6">
          <div className="flex items-start mb-4">
            {announcement.important && (
              <div className={`bg-red-800/50 p-1 rounded-full ${isRtl ? 'ml-2' : 'mr-2'} mt-1`}>
                <AlertTriangle className="h-4 w-4 text-red-300" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-white">{announcement.title}</h1>
          </div>
          
          <div className="flex items-center text-sm text-indigo-400 mb-6">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
          </div>

          <div 
            className="text-indigo-200 mb-8 whitespace-pre-wrap"
            // Sanitize content to prevent XSS attacks
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(announcement.content) }}
          ></div>

          {poll && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">{t('announcements.poll') || 'Poll'}</h2>
              <ErrorBoundary fallback={
                <div className="bg-amber-900/20 text-amber-300 p-4 rounded-lg border border-amber-800/30">
                  <p>{t('poll.errorDisplaying') || 'There was an error displaying the poll'}</p>
                </div>
              }>
                <div className="relative">
                  <PollComponent poll={poll} />
                  <button
                    onClick={() => window.location.reload()}
                    className="absolute top-4 right-4 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-500 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3 mr-1 inline" />
                    Refresh
                  </button>
                </div>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-indigo-950/90 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard/announcements"
            className="inline-flex items-center text-indigo-300 hover:text-indigo-100 font-medium transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {t('announcements.backToList') || 'Back to announcements'}
          </Link>
        </div>

        {renderContent()}
      </div>
    </div>
  );
}

function PollComponent({ poll }: { poll: Poll }) {
  const { t, dir } = useTranslations();
  const userRole = useUserRole();
  
  // Fix: Use the real Clerk user ID instead of placeholders
  const { user } = useUser();
  const userId = user?.id || 'anonymous'; // Use the actual Clerk user ID
  
  const isRtl = dir === 'rtl';
  const router = useRouter();
  
  // Add state variables for user profile data
  const [userGender, setUserGender] = useState<string | null>(null);
  const [userGroupClass, setUserGroupClass] = useState<string | null>(null);
  const [hasProfileError, setHasProfileError] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Add effect to fetch user profile data
  useEffect(() => {
    if (!user || !user.id) return;
    
    const fetchUserProfile = async () => {
      try {
        const userData = await getUserDataAction(user.id);
        if (userData) {
          setUserGender(userData.gender || null);
          setUserGroupClass(userData.group_class || null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [user]);
  
  // Add defensive checks for poll data
  if (!poll) {
    return (
      <div className="bg-amber-900/20 text-amber-300 p-4 rounded-lg border border-amber-800/30">
        <p>Poll data is incomplete</p>
      </div>
    );
  }
  
  // Process options based on their type
  let pollOptionsArray: PollOption[] = [];
  
  if (Array.isArray(poll.options)) {
    // Handle different formats of options
    if (poll.options.length > 0) {
      if (typeof poll.options[0] === 'string') {
        // Convert string array to PollOption array
        pollOptionsArray = (poll.options as string[]).map((option, index) => ({
          id: `option-${index}`,
          poll_id: poll.id,
          option_text: option,
          votes: 0
        }));
      } else {
        // Handle options that are already objects
        pollOptionsArray = poll.options.map((option: any, index) => {
          if (typeof option === 'object' && option !== null) {
            return {
              id: option.id || `option-${index}`,
              poll_id: poll.id,
              option_text: option.option_text || option.text || `Option ${index + 1}`,
              votes: typeof option.votes === 'number' ? option.votes : 0
            };
          } else {
            // Fallback for unexpected format
            return {
              id: `option-${index}`,
              poll_id: poll.id,
              option_text: String(option),
              votes: 0
            };
          }
        });
      }
    }
  }
  
  if (pollOptionsArray.length === 0) {
    return (
      <div className="bg-amber-900/20 text-amber-300 p-4 rounded-lg border border-amber-800/30">
        <p>No options available for this poll</p>
      </div>
    );
  }
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [totalVotes, setTotalVotes] = useState(poll?.total_votes || 0);
  const [pollOptions, setPollOptions] = useState<PollOption[]>(pollOptionsArray);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!poll) return;
    
    let isMounted = true;
    
    const fetchPollData = async () => {
      try {
        setIsLoading(true);
        
        // Get real-time poll results from the server
        const pollResults = await getPollResultsAction(poll.id);
        
        if (!isMounted) return;
        
        if (pollResults) {
          // Update options with vote counts from the server
          const updatedOptions = [...pollOptions].map((option, index) => {
            const serverVoteInfo = pollResults.options[index];
            if (serverVoteInfo) {
              return {
                ...option,
                votes: serverVoteInfo.votes
              };
            }
            return option;
          });
          
          // Update state with server data
          setPollOptions(updatedOptions);
          setTotalVotes(pollResults.total_votes);
          
          if (pollResults.total_votes > 0) {
            setHasVoted(true);
          }
        }
      } catch (error) {
        setError('Error loading poll results. Please try again later.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchPollData();
    
    return () => {
      isMounted = false;
    };
  }, [poll?.id]);

  // The original useEffect for checking saved votes
  useEffect(() => {
    // Check if user has already voted
    if (!poll) return;
    
    let isMounted = true;
    
    const checkForSavedVote = async () => {
      try {
        const savedVote = localStorage.getItem(`poll_vote_${poll.id}`);
        
        if (savedVote && isMounted) {
          console.log("Found saved vote:", savedVote);
          setUserVote(savedVote);
          setSelectedOption(savedVote);
          setHasVoted(true);
        }
      } catch (error) {
        console.error('Error checking for saved vote:', error);
      }
    };
    
    checkForSavedVote();
    
    return () => {
      isMounted = false;
    };
  }, [poll?.id]);

  const handleOptionSelect = (optionId: string) => {
    if (!isEditing && hasVoted) return;
    setSelectedOption(optionId);
  };

  const handleVote = async () => {
    if (!selectedOption || !userId || !poll) return;
    
    // Check if user profile is complete before voting
    if (!userGender || !userGroupClass) {
      setHasProfileError(true);
      setError(t('poll.completeProfileRequired') || 'Please complete your profile before voting');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setHasProfileError(false);
    
    try {
      // Find the option index from the selectedOption ID
      const selectedIndex = pollOptions.findIndex(opt => opt.id === selectedOption);
      if (selectedIndex === -1) {
        throw new Error('Selected option not found');
      }
      
      console.log('Submitting vote:', {
        pollId: poll.id,
        userId,
        selectedIndex,
        optionId: selectedOption,
        currentVoteCounts: pollOptions.map(o => ({ id: o.id, text: o.option_text, votes: o.votes }))
      });
      
      // Use the submitPollResponseAction which is designed for this purpose
      const success = await submitPollResponseAction(
        poll.id,
        userId,
        selectedIndex
      );
      
      if (!success) {
        throw new Error('Failed to submit poll response');
      }
      
      console.log('Vote submitted successfully');
      
      // Create a deep copy of the poll options to update
      const updatedOptions = [...pollOptions];
      
      // Update the selected option's vote count
      const updatedOption = { 
        ...updatedOptions[selectedIndex],
        votes: updatedOptions[selectedIndex].votes + 1 
      };
      updatedOptions[selectedIndex] = updatedOption;
      
      // If editing, decrease count from previous option
      if (isEditing && userVote) {
        const previousIndex = updatedOptions.findIndex(opt => opt.id === userVote);
        if (previousIndex !== -1 && previousIndex !== selectedIndex) {
          updatedOptions[previousIndex] = {
            ...updatedOptions[previousIndex],
            votes: Math.max(0, updatedOptions[previousIndex].votes - 1)
          };
        }
      }
      
      // Calculate new total votes
      const newTotalVotes = isEditing ? totalVotes : totalVotes + 1;
      
      // Log the update for debugging
      console.log('Updating UI with:', {
        newTotalVotes,
        updatedOptions: updatedOptions.map(o => ({ id: o.id, text: o.option_text, votes: o.votes }))
      });
      
      // Update state with new data
      setPollOptions(updatedOptions);
      setTotalVotes(newTotalVotes);
      
      // Save the vote to localStorage with timestamp to help with caching
      try {
        localStorage.setItem(`poll_vote_${poll.id}`, selectedOption);
        localStorage.setItem(`poll_vote_time_${poll.id}`, Date.now().toString());
      } catch (storageError) {
        console.error('Error saving vote to localStorage:', storageError);
      }
      
      // Update component state
      setUserVote(selectedOption);
      setHasVoted(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Error voting:', err);
      setError(t('polls.voteError') || 'Error submitting your vote. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeVote = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedOption(userVote);
  };

  // Function to get percentage with safeguards
  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    const percentage = Math.round((votes / totalVotes) * 100);
    console.log(`Calculating percentage: ${votes}/${totalVotes} = ${percentage}%`);
    return percentage;
  };

  // Return null if poll is undefined
  if (!poll) return null;

  return (
    <div className="bg-indigo-950/50 rounded-lg p-6 border border-indigo-800/30">
      <h3 className={`text-xl font-semibold text-white mb-4 ${isRtl ? 'text-right' : ''}`}>
        {poll.question || (t('poll.noQuestionAvailable') || "No question available")}
      </h3>

      {/* Show profile error message if needed */}
      {hasProfileError && (
        <div className="mb-6 bg-amber-900/30 text-amber-300 p-4 rounded-lg border border-amber-800/30 flex flex-col">
          <div className="flex items-center mb-2">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span className="font-medium">{t('poll.completeProfileRequired') || 'Complete your profile to vote'}</span>
          </div>
          <p className="mb-3 text-sm">
            {t('poll.profileRequiredMessage') || 'You must set your gender and class/group before you can vote in polls.'}
          </p>
          <Link 
            href="/dashboard/profile" 
            className="self-start px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 text-amber-100 rounded-lg transition-colors text-sm"
          >
            {t('poll.updateProfile') || 'Update Profile'}
          </Link>
        </div>
      )}

      <div className={`space-y-5 mb-6 ${isRtl ? 'rtl-container' : ''}`}>
        {pollOptions.map((option, index) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOption === option.id;
          const isUserVote = userVote === option.id;
          
          return (
            <div 
              key={`poll-option-${option.id || index}`} 
              className={`relative ${isRtl ? 'text-right' : ''}`}
            >
              <div 
                className={`
                  p-6 rounded-lg border transition-all cursor-pointer
                  ${isEditing || !hasVoted 
                    ? 'hover:border-indigo-500 hover:bg-indigo-900/30' 
                    : 'pointer-events-none'
                  }
                  ${isSelected 
                    ? 'border-indigo-500 bg-indigo-900/30' 
                    : 'border-indigo-800/30 bg-indigo-950/70'
                  }
                `}
                onClick={() => handleOptionSelect(option.id)}
              >
                <div className={`flex items-center justify-between mb-3 ${isRtl ? 'rtl-poll-spacing' : ''}`}>
                  <div className={`flex items-center ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                    <div 
                      className={`
                        w-5 h-5 rounded-full border flex items-center justify-center
                        ${isSelected 
                          ? 'border-indigo-500 bg-indigo-500/30' 
                          : 'border-indigo-600'
                        }
                        ${isRtl ? 'ml-4' : 'mr-4'}
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-indigo-300" />}
                    </div>
                    <span className={`text-indigo-200 ${isRtl ? 'rtl-text' : ''}`}>{option.option_text}</span>
                  </div>
                  
                  {hasVoted && (
                    <div className={`flex items-center ${isRtl ? 'mr-3' : ''}`}>
                      <span className="text-indigo-300 font-medium">{percentage}%</span>
                      {isUserVote && !isEditing && (
                        <span key="your-vote" className={`${isRtl ? 'mr-3' : 'ml-3'} text-xs bg-indigo-700/50 px-3 py-1 rounded-full text-indigo-300`}>
                          {t('poll.yourVote') || 'Your vote'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {hasVoted && (
                  <div key={`progress-${option.id}`} className="w-full bg-indigo-900/30 rounded-full h-3 mt-3">
                    <div 
                      className="bg-indigo-500 h-3 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div key="error-message" className="text-red-400 mb-4 p-3 bg-red-900/20 rounded-lg border border-red-800/30">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="text-indigo-300 text-sm">
          <BarChart className={`inline-block w-4 h-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
          {totalVotes} {t('poll.votes') || 'votes'}
        </div>

        <div className={`flex ${isRtl ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
          {!hasVoted && (
            <button
              key="vote-button"
              disabled={!selectedOption || submitting}
              onClick={handleVote}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${!selectedOption || submitting
                  ? 'bg-indigo-900/40 text-indigo-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }
              `}
            >
              {submitting ? (
                <span>{t('poll.submitting') || 'Submitting...'}</span>
              ) : (
                <span>{t('poll.vote') || 'Vote'}</span>
              )}
            </button>
          )}

          {hasVoted && !isEditing && (
            <button
              key="change-vote-button"
              onClick={handleChangeVote}
              className="flex items-center px-4 py-2 rounded-lg font-medium bg-indigo-800/30 hover:bg-indigo-700/40 text-indigo-300 transition-colors"
            >
              <Edit2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('poll.changeVote') || 'Change Vote'}
            </button>
          )}

          {isEditing && (
            <>
              <button
                key="cancel-button"
                onClick={cancelEdit}
                className="px-4 py-2 rounded-lg font-medium bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50 transition-colors"
              >
                {t('poll.cancel') || 'Cancel'}
              </button>
              
              <button
                key="confirm-button"
                disabled={!selectedOption || selectedOption === userVote || submitting}
                onClick={handleVote}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${!selectedOption || selectedOption === userVote || submitting
                    ? 'bg-indigo-900/40 text-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }
                `}
              >
                {submitting ? (t('poll.submitting') || "Submitting...") : (t('poll.confirm') || "Confirm")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple error boundary component
function ErrorBoundary({ fallback, children }: { fallback: React.ReactNode, children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  // Reset error state when children change
  useEffect(() => {
    setHasError(false);
  }, [children]);
  
  if (hasError) {
    return <>{fallback}</>;
  }
  
  // Use try/catch to detect errors in rendering
  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Error rendering component:', error);
    // Update state in useEffect to avoid state updates during render
    useEffect(() => {
      setHasError(true);
    }, []);
    // Return children during this render to avoid inconsistencies
    return <>{children}</>;
  }
}