'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Poll, PollResults, getPollResults, getUserPollResponse, getUserProfile } from '@/lib/supabase';
import { submitPollResponseAction, getPollByIdAction } from '@/lib/actions';
import { ChartBarIcon, ClockIcon, CheckCircleIcon, LockIcon, AlertTriangleIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';

interface PollComponentProps {
  poll: Poll;
  compact?: boolean;
}

export default function PollComponent({ poll: initialPoll, compact = false }: PollComponentProps) {
  const { user } = useUser();
  const { t, lang: locale, dir } = useTranslations();
  const isRtl = dir === 'rtl';
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [results, setResults] = useState<PollResults | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempSelectedOption, setTempSelectedOption] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [userGroupClass, setUserGroupClass] = useState<string | null>(null);
  const [hasProfileError, setHasProfileError] = useState(false);

  // Load poll results and check if user has voted
  useEffect(() => {
    async function loadPollData() {
      if (!user || !poll) return;

      try {
        // Get results
        const pollResults = await getPollResults(poll.id);
        if (pollResults) {
          setResults(pollResults);
        }

        // Check if user has voted and what they voted for
        const userResponse = await getUserPollResponse(poll.id, user.id);
        if (userResponse !== null) {
          setSelectedOption(userResponse);
          setTempSelectedOption(userResponse);
          setHasVoted(true);
        }

        // Fetch user profile to get gender and group_class
        const userProfile = await getUserProfile(user.id);
        if (userProfile) {
          setUserGender(userProfile.gender || null);
          setUserGroupClass(userProfile.group_class || null);
          
          // Check if gender and group_class are set
          const missingProfileInfo = !userProfile.gender || !userProfile.group_class;
          setHasProfileError(missingProfileInfo);
        } else {
          setUserGender(null);
          setUserGroupClass(null);
          setHasProfileError(true);
        }
      } catch (err) {
        console.error('Error loading poll data:', err);
        setError(t('poll.errorSubmitting'));
      }
    }

    loadPollData();
  }, [poll, user, t]);

  // Set up auto-refresh for poll data, results, and user votes
  useEffect(() => {
    // Only set up auto-refresh if there's a user and poll
    if (!user || !poll) return;

    // Don't auto-refresh if the user is currently editing their vote
    if (isEditing) return;

    // Immediately load the latest poll status when the component mounts
    async function refreshPollStatus() {
      if (isRefreshing) return; // Skip if already refreshing
      
      setIsRefreshing(true);
      try {
        // First fetch the latest poll data to check if it's still active
        const latestPoll = await getPollByIdAction(poll.id);
        
        if (latestPoll) {
          // Only update state if there's an actual change to avoid unnecessary re-renders
          if (latestPoll.is_active !== poll.is_active) {
            console.log("Poll status changed:", latestPoll.is_active ? "Active" : "Inactive");
            setPoll(latestPoll);
          }
        }

        // Update poll results
        const pollResults = await getPollResults(poll.id);
        if (pollResults) {
          setResults(pollResults);
        }

        // Check for changes in the user's vote
        if (!user) return; // Early return if no user

        const userResponse = await getUserPollResponse(poll.id, user.id);
        if (userResponse !== null && !isEditing) {
          setSelectedOption(userResponse);
          setTempSelectedOption(userResponse);
          setHasVoted(true);
        } else if (userResponse === null && hasVoted) {
          // Edge case: vote was deleted
          setSelectedOption(null);
          setTempSelectedOption(null);
          setHasVoted(false);
        }
      } catch (err) {
        console.error('Error refreshing poll data:', err);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Run immediately and then on interval
    refreshPollStatus();
    
    const intervalId = setInterval(refreshPollStatus, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [poll.id, user, hasVoted, isEditing, isRefreshing, poll.is_active]);

  const handleVote = async () => {
    if (!user || selectedOption === null || !poll.is_active) return;

    // Check if user has set their gender and group class
    if (!userGender || !userGroupClass) {
      setHasProfileError(true);
      setError(t('poll.completeProfileRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setHasProfileError(false);

    try {
      const success = await submitPollResponseAction(poll.id, user.id, selectedOption);
      
      if (success) {
        setHasVoted(true);
        setIsEditing(false);
        
        // Refresh results
        const updatedResults = await getPollResults(poll.id);
        if (updatedResults) {
          setResults(updatedResults);
        }
      } else {
        throw new Error(t('poll.errorSubmitting'));
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(t('poll.errorSubmitting'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = () => {
    if (hasVoted && !hasEnded) {
      setIsEditing(true);
      setTempSelectedOption(selectedOption);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setTempSelectedOption(selectedOption);
  };

  const confirmVoteChange = async () => {
    if (!user || tempSelectedOption === null) return;
    
    // Check if user has set their gender and group class
    if (!userGender || !userGroupClass) {
      setHasProfileError(true);
      setError(t('poll.completeProfileRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    setHasProfileError(false);

    try {
      const success = await submitPollResponseAction(poll.id, user.id, tempSelectedOption);
      
      if (success) {
        setSelectedOption(tempSelectedOption);
        setHasVoted(true);
        setIsEditing(false);
        
        // Refresh results
        const updatedResults = await getPollResults(poll.id);
        if (updatedResults) {
          setResults(updatedResults);
        }
      } else {
        throw new Error(t('poll.errorUpdating'));
      }
    } catch (err) {
      console.error('Error updating vote:', err);
      setError(t('poll.errorUpdating'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!poll) return null;

  // Calculate if poll has ended
  const hasEnded = !poll.is_active || (poll.ends_at && new Date(poll.ends_at) < new Date());

  return (
    <div className={`bg-indigo-900/20 backdrop-blur-sm rounded-lg border border-indigo-800/30 shadow-sm ${compact ? 'p-3' : 'p-4'} ${isRtl ? 'text-right' : 'text-left'}`}>
      <div className={`flex items-center mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <ChartBarIcon className={`h-5 w-5 text-indigo-400 ${isRtl ? 'ml-2' : 'mr-2'}`} />
        <h3 className={`font-semibold text-white ${compact ? 'text-base' : 'text-lg'}`}>
          {poll.title}
        </h3>
      </div>

      {poll.description && (
        <p className="text-indigo-300 mb-4 text-sm">{poll.description}</p>
      )}

      {hasProfileError && !compact && (
        <div className="relative bg-indigo-900/30 backdrop-blur-sm rounded-lg p-6 border border-indigo-800/40 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-700/10"></div>
          <div className="relative z-10">
            <div className="flex items-start">
              <div className="bg-amber-900/50 rounded-full p-3 flex-shrink-0">
                <AlertTriangleIcon className="h-6 w-6 text-amber-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-semibold text-amber-100 mb-2">
                  {t('poll.completeProfileRequired')}
                </h3>
                <p className="text-amber-200 mb-4">
                  {t('poll.completeProfileMessage')}
                </p>
                <Link href="/dashboard/profile" 
                  className="inline-flex items-center px-4 py-2 border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 rounded-lg transition-colors duration-200"
                >
                  {t('poll.updateProfile')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !hasProfileError && (
        <div className="mb-4 bg-red-900/30 text-red-300 p-2 rounded-md text-sm border border-red-800/30">
          {error}
        </div>
      )}

      {hasEnded && (
        <div className={`mb-4 bg-amber-900/30 text-amber-300 p-2 rounded-md text-sm flex items-center border border-amber-800/30 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <LockIcon className={`h-4 w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
          {t('poll.inactive')}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {poll.options.map((option, index) => {
          const isSelected = isEditing ? tempSelectedOption === index : selectedOption === index;
          
          return (
            <button
              key={index}
              onClick={() => {
                if (!hasEnded) {
                  if (isEditing) {
                    setTempSelectedOption(index);
                  } else if (!hasVoted) {
                    setSelectedOption(index);
                  }
                }
              }}
              disabled={hasEnded || (!isEditing && hasVoted)}
              className={`w-full p-2 rounded-md flex items-center justify-between transition-all border 
                ${isSelected
                  ? 'bg-indigo-600/30 border-indigo-500' 
                  : 'bg-indigo-900/20 border-indigo-800/30 hover:bg-indigo-800/30'
                } ${hasEnded || (!isEditing && hasVoted) ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className={`text-white text-sm ${isRtl ? 'ml-auto' : 'mr-auto'}`}>{option}</span>
              {isSelected && (
                <CheckCircleIcon className="h-5 w-5 text-indigo-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Poll Information */}
      <div className={`text-xs text-indigo-400 mb-4 flex flex-col space-y-1 ${isRtl ? 'items-end' : 'items-start'}`}>
        {poll.ends_at ? (
          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <ClockIcon className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
            {hasEnded 
              ? t('poll.ended', { date: new Date(poll.ends_at).toLocaleDateString(locale) })
              : t('poll.ends', { date: new Date(poll.ends_at).toLocaleDateString(locale) })
            }
          </div>
        ) : (
          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <ClockIcon className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
            {t('poll.noEndDate')}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!hasEnded && !hasVoted && !isEditing && (
        <button
          onClick={handleVote}
          disabled={selectedOption === null || isSubmitting || hasProfileError}
          className={`w-full py-2 px-4 rounded-md font-medium ${isRtl ? 'text-right' : 'text-left'}
            ${selectedOption === null || isSubmitting || hasProfileError
              ? 'bg-indigo-800/30 text-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
            } transition-colors`}
        >
          {isSubmitting ? t('poll.submitting') : t('poll.submitVote')}
        </button>
      )}

      {!hasEnded && isEditing && (
        <div className={`flex space-x-2 ${isRtl ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <button
            onClick={cancelEditing}
            className="flex-1 py-2 px-4 bg-indigo-900/50 text-indigo-300 rounded-md font-medium hover:bg-indigo-800/50 transition-colors"
          >
            {t('poll.cancel')}
          </button>
          <button
            onClick={confirmVoteChange}
            disabled={tempSelectedOption === null || isSubmitting || hasProfileError}
            className={`flex-1 py-2 px-4 rounded-md font-medium
              ${tempSelectedOption === null || isSubmitting || hasProfileError
                ? 'bg-indigo-800/30 text-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
              } transition-colors`}
          >
            {isSubmitting ? t('poll.updating') : t('poll.updateVote')}
          </button>
        </div>
      )}

      {!hasEnded && hasVoted && !isEditing && (
        <button
          onClick={startEditing}
          className="w-full py-2 px-4 bg-indigo-900/50 text-indigo-300 rounded-md font-medium hover:bg-indigo-800/50 transition-colors"
        >
          {t('poll.changeVote')}
        </button>
      )}

      {/* Show Results if available */}
      {results && (hasVoted || hasEnded) && (
        <div className="mt-6">
          <div className={`flex justify-between items-center text-sm text-indigo-300 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <h4 className="font-medium">{t('poll.totalVotes', { count: results.total_votes })}</h4>
            {results.votes_by_gender && (
              <div className={`flex items-center text-xs space-x-2 ${isRtl ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <span className="bg-indigo-900/50 px-2 py-0.5 rounded-full">
                  {t('poll.gender.men', { count: results.votes_by_gender.male || 0 })}
                </span>
                <span className="bg-indigo-900/50 px-2 py-0.5 rounded-full">
                  {t('poll.gender.women', { count: results.votes_by_gender.female || 0 })}
                </span>
                <span className="bg-indigo-900/50 px-2 py-0.5 rounded-full">
                  {t('poll.gender.other', { count: results.votes_by_gender.other || 0 })}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {poll.options.map((option, index) => {
              // Handle different possible structures of the results object
              let voteCount = 0;
              if (results.votes_by_option) {
                voteCount = results.votes_by_option[index] || 0;
              } else if (results.options && results.options[index]) {
                voteCount = results.options[index].votes || 0;
              }
              
              const percentage = results.total_votes > 0 
                ? Math.round((voteCount / results.total_votes) * 100) 
                : 0;
              
              return (
                <div key={index} className="space-y-1">
                  <div className={`flex justify-between text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="text-indigo-300">{option}</span>
                    <span className="text-indigo-300">{percentage}% ({voteCount})</span>
                  </div>
                  <div className="w-full bg-indigo-900/50 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 