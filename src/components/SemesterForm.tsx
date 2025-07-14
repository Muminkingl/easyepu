'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserData } from '@/hooks/useUserData';
import { AlertCircle, CheckCircle, Loader2, ChevronDown, BookOpen, LockIcon } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

interface SemesterFormProps {
  userId?: string;
  initialSemester?: number;
  onUpdate?: () => void;
  onSuccess?: () => void;
  required?: boolean;
}

export default function SemesterForm({ userId, initialSemester, onUpdate, onSuccess, required = false }: SemesterFormProps) {
  const { user } = useUser();
  const { userData, updateUserSemester, isAdmin } = useUserData();
  const { t, dir } = useTranslations();
  const [semester, setSemester] = useState<number | null>(initialSemester || userData?.semester || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Update semester when userData changes
  useEffect(() => {
    if (userData?.semester) {
      setSemester(userData.semester);
    }
  }, [userData]);

  // Reset success message after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  // Update isLocked value based on data - lock for everyone once selected
  useEffect(() => {
    // Semester is locked if it has been selected (semester_selected is true)
    setIsLocked(!!userData?.semester_selected);
    
    // Removed admin override - admins can't change semester once it's set either
  }, [userData?.semester_selected, required]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError(t('profile.semesterInfo.updateFailed') || "Semester cannot be changed once set.");
      return;
    }
    
    // Validate that semester is selected
    if (semester === null) {
      setError(t('profile.semesterInfo.selectSemesterFirst') || "Please select a semester first.");
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    setShowSuccessIcon(false);

    try {
      if (!user && !userId) throw new Error('User not authenticated');
      const effectiveUserId = userId || user?.id || '';
      
      // Use the updateUserSemester from the hook
      const result = await updateUserSemester(semester);
      
      if (!result) {
        throw new Error(t('profile.semesterInfo.updateFailed') || 'Failed to update semester on the server');
      }
      
      setSuccess(true);
      setShowSuccessIcon(true);
      setIsLocked(true); // Lock the form after successful submission
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating semester:', err);
      setError(err instanceof Error ? err.message : 'Failed to update semester');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => {
    setError('');
  };

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="max-w-md mx-auto">
      <div className={`bg-indigo-900/30 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl border border-indigo-800/30 relative ${required ? 'ring-2 ring-indigo-500 animate-pulse' : ''}`}>
        {isLocked && (
          <div className="absolute inset-0 bg-indigo-900/70 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center">
            <div className="bg-red-800/50 p-3 rounded-full border-2 border-red-500/50">
              <LockIcon className="h-8 w-8 text-red-300" />
            </div>
          </div>
        )}
        
        <div className="mb-6 text-center">
          <h2 className={`text-2xl font-bold text-white mb-1 ${dir === 'rtl' ? 'text-center' : ''}`}>
            {t('profile.semesterInfo.title') || 'Select Semester'}
          </h2>
          <p className={`text-indigo-300 text-sm ${dir === 'rtl' ? 'text-center' : ''}`}>
            {t('profile.semesterInfo.description') || 'Please select your current semester to see relevant content.'}
          </p>
          {required && (
            <div className="mt-3 p-3 bg-indigo-800/40 rounded-lg border border-indigo-700/50">
              <p className="text-indigo-200 text-sm font-medium">
                {t('profile.semesterInfo.requiredMessage') || 'You must select your semester before accessing other features.'}
              </p>
            </div>
          )}
        </div>
        
        {success && (
          <div className="mb-6 p-4 bg-green-800/30 backdrop-blur-sm text-green-300 rounded-xl flex items-center border border-green-700/30 shadow-sm animate-fadeIn">
            <CheckCircle className={`h-6 w-6 ${dir === 'rtl' ? 'ml-4' : 'mr-3'} text-green-400`} />
            <span className={`font-medium ${dir === 'rtl' ? 'text-right' : ''}`}>
              {t('profile.contactInfo.updatedSuccessfully') || 'Semester updated successfully'}
            </span>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 backdrop-blur-sm text-red-300 rounded-xl flex items-center justify-between border border-red-700/30 shadow-sm animate-fadeIn">
            <div className="flex items-center">
              <AlertCircle className={`h-6 w-6 ${dir === 'rtl' ? 'ml-4' : 'mr-3'} text-red-400`} />
              <span className={`font-medium ${dir === 'rtl' ? 'text-right' : ''}`}>{error}</span>
            </div>
            <button 
              onClick={closeError}
              className="text-red-400 hover:text-red-300 focus:outline-none p-1 rounded-full hover:bg-red-800/50 transition-colors duration-200"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-indigo-800/30 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-700/30">
            <label className={`block text-sm font-medium text-indigo-300 mb-3 flex items-center ${dir === 'rtl' ? 'flex-row-reverse justify-end' : ''}`}>
              <BookOpen className={`h-4 w-4 ${dir === 'rtl' ? 'ml-3' : 'mr-2'} text-indigo-400`} />
              {t('profile.semester') || 'Choose your semester (1-8)'}
            </label>
            
            <div className="grid grid-cols-4 gap-2">
              {semesters.map((sem) => (
                <div
                  key={sem}
                  onClick={() => !isLocked && setSemester(sem)} 
                  className={`flex items-center justify-center px-2 py-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    semester === sem 
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-indigo-800/20 border-indigo-700/30 text-indigo-200 hover:bg-indigo-800/40'
                  } ${isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'}`}
                >
                  <span className="font-medium text-center text-lg">
                    {sem}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-indigo-400">
              {semester !== null ? `Selected: Semester ${semester}` : "Click on a semester number to select"}
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl font-medium transition-all duration-200 ${
                loading 
                  ? 'bg-indigo-700/50 cursor-not-allowed' 
                  : isLocked
                  ? 'bg-indigo-800/30 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/20'
              } text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-900`}
              disabled={loading || isLocked}
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className={`animate-spin h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  <span>{t('common.saving') || 'Saving...'}</span>
                </div>
              ) : isLocked ? (
                <div className="flex items-center justify-center">
                  <LockIcon className="h-5 w-5 text-indigo-400" />
                </div>
              ) : (
                t('common.save') || 'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}