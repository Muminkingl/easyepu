'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserData } from '@/hooks/useUserData';
import { updateUserGender } from '@/lib/actions';
import { useTranslations } from '@/lib/i18n';
import { AlertCircle, CheckCircle, Shield, X, User, Loader2, ChevronDown, HeartHandshake, LockIcon } from 'lucide-react';

interface GenderFormProps {
  userId?: string;
  initialGender?: string;
  onUpdate?: () => void;
  onSuccess?: () => void;
}

export default function GenderForm({ userId, initialGender, onUpdate, onSuccess }: GenderFormProps) {
  const { user } = useUser();
  const { userData, updateUserGender } = useUserData();
  const { t, dir } = useTranslations();
  const [gender, setGender] = useState(initialGender || userData?.gender || 'male');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(!!initialGender || !!userData?.gender);

  // Update gender when userData changes
  useEffect(() => {
    if (userData?.gender) {
      setGender(userData.gender);
      setIsLocked(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setError("Gender cannot be changed once set.");
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess(false);
    setShowSuccessIcon(false);

    try {
      if (!user && !userId) throw new Error('User not authenticated');
      const effectiveUserId = userId || user?.id || '';
      
      // First update in the database via server action
      const actionResult = await updateUserGender(effectiveUserId, gender);
      
      // Check if server action failed
      if (!actionResult) {
        throw new Error(t('profile.genderInfo.updateFailed') || 'Failed to update gender on the server');
      }
      
      // Now update local state by using the hook's function
      if (typeof updateUserGender === 'function') {
        await updateUserGender(gender);
      }
      
      setSuccess(true);
      setShowSuccessIcon(true);
      setIsLocked(true);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating gender:', err);
      setError(err instanceof Error ? err.message : 'Failed to update gender');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => {
    setError('');
  };

  const handleGenderSelect = (selectedGender: string) => {
    setGender(selectedGender);
    setSelectOpen(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-indigo-900/30 backdrop-blur-sm shadow-xl rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl border border-indigo-800/30 relative">
        {isLocked && (
          <div className="absolute inset-0 bg-indigo-900/70 backdrop-blur-sm rounded-2xl z-10 flex flex-col items-center justify-center">
            <div className="bg-red-800/50 p-3 rounded-full border-2 border-red-500/50 mb-3">
              <LockIcon className="h-8 w-8 text-red-300" />
            </div>
          </div>
        )}
        
        <div className="mb-6 text-center">
          <h2 className={`text-2xl font-bold text-white mb-1 ${dir === 'rtl' ? 'text-center' : ''}`}>
            {t('profile.genderInfo.title')}
          </h2>
          <p className={`text-indigo-300 text-sm ${dir === 'rtl' ? 'text-center' : ''}`}>
            {t('profile.genderInfo.description')}
          </p>
        </div>
        
        {success && (
          <div className="mb-6 p-4 bg-green-800/30 backdrop-blur-sm text-green-300 rounded-xl flex items-center border border-green-700/30 shadow-sm animate-fadeIn">
            <CheckCircle className={`h-6 w-6 ${dir === 'rtl' ? 'ml-4' : 'mr-3'} text-green-400`} />
            <span className={`font-medium ${dir === 'rtl' ? 'text-right' : ''}`}>
              {t('profile.contactInfo.updatedSuccessfully')}
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
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-indigo-800/30 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-indigo-700/30">
            <label htmlFor="gender" className={`block text-sm font-medium text-indigo-300 mb-2 flex items-center ${dir === 'rtl' ? 'flex-row-reverse justify-end' : ''}`}>
              <HeartHandshake className={`h-4 w-4 ${dir === 'rtl' ? 'ml-3' : 'mr-2'} text-indigo-400`} />
              {t('profile.gender')}
            </label>
            
            <div className="relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => !isLocked && setSelectOpen(!selectOpen)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left border rounded-xl shadow-sm transition-all duration-200 ${
                    isLocked 
                      ? 'border-indigo-700/30 opacity-75 bg-indigo-800/20' 
                      : selectOpen 
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-800/30' 
                        : 'border-indigo-700/30 hover:border-indigo-600/50 bg-indigo-800/20'
                  } ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                  disabled={loading || isLocked}
                >
                  <div className={`flex items-center ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-4 h-4 rounded-full ${dir === 'rtl' ? 'ml-4' : 'mr-3'} ${gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}`}></div>
                    <span className="font-medium text-white">{gender === 'male' ? t('poll.gender.men').replace(': {count}', '') : t('poll.gender.women').replace(': {count}', '')}</span>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-indigo-400 transition-transform duration-200 ${selectOpen ? 'transform rotate-180' : ''}`} />
                </button>
                
                {selectOpen && (
                  <div className="absolute left-0 right-0 mt-1 border border-indigo-700/30 rounded-xl bg-indigo-900/50 backdrop-blur-sm shadow-lg z-10 overflow-hidden animate-slideDown">
                    <div 
                      className={`px-4 py-3 flex items-center cursor-pointer transition-colors duration-200 ${gender === 'male' ? 'bg-indigo-800/50' : 'hover:bg-indigo-800/30'}`}
                      onClick={() => handleGenderSelect('male')}
                    >
                      <div className={`w-4 h-4 rounded-full bg-blue-500 ${dir === 'rtl' ? 'ml-4' : 'mr-3'}`}></div>
                      <span className={`font-medium ${gender === 'male' ? 'text-white' : 'text-indigo-200'}`}>
                        {t('poll.gender.men').replace(': {count}', '')}
                      </span>
                      {gender === 'male' && <CheckCircle className={`h-4 w-4 ml-auto text-indigo-400 ${dir === 'rtl' ? 'mr-auto ml-0' : ''}`} />}
                    </div>
                    <div 
                      className={`px-4 py-3 flex items-center cursor-pointer transition-colors duration-200 ${gender === 'female' ? 'bg-indigo-800/50' : 'hover:bg-indigo-800/30'}`}
                      onClick={() => handleGenderSelect('female')}
                    >
                      <div className={`w-4 h-4 rounded-full bg-pink-500 ${dir === 'rtl' ? 'ml-4' : 'mr-3'}`}></div>
                      <span className={`font-medium ${gender === 'female' ? 'text-white' : 'text-indigo-200'}`}>
                        {t('poll.gender.women').replace(': {count}', '')}
                      </span>
                      {gender === 'female' && <CheckCircle className={`h-4 w-4 ml-auto text-indigo-400 ${dir === 'rtl' ? 'mr-auto ml-0' : ''}`} />}
                    </div>
                  </div>
                )}
              </div>
              
              {showSuccessIcon && !selectOpen && (
                <div className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              )}
            </div>
            
            <input 
              type="hidden" 
              name="gender" 
              value={gender}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || isLocked}
            className={`w-full flex items-center justify-center py-3 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-opacity-30 transition-all duration-300 text-white font-medium shadow-md ${
              isLocked
                ? 'bg-indigo-900/50 cursor-not-allowed opacity-60 border border-indigo-700/30'
                : success 
                  ? 'bg-gradient-to-r from-green-700 to-emerald-800 hover:from-green-600 hover:to-emerald-700 focus:ring-green-500/30 shadow-green-600/20' 
                  : 'bg-gradient-to-r from-indigo-700 to-purple-800 hover:from-indigo-600 hover:to-purple-700 focus:ring-indigo-500/30 shadow-indigo-600/20'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isLocked ? (
              <div className="flex items-center">
                <LockIcon className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'}`} />
              </div>
            ) : loading ? (
              <div className="flex items-center">
                <Loader2 className={`animate-spin h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'}`} />
                <span>{t('profile.contactInfo.updating')}</span>
              </div>
            ) : success ? (
              <div className="flex items-center">
                <CheckCircle className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'}`} />
                <span>{t('profile.contactInfo.updatedSuccessfully')}</span>
              </div>
            ) : (
              <span>{t('poll.updateVote')}</span>
            )}
          </button>
        </form>
        
        <div className={`mt-6 bg-indigo-800/30 backdrop-blur-sm p-4 rounded-xl border border-indigo-700/30 ${dir === 'rtl' ? 'text-right' : ''}`}>
          <div className={`flex items-start ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Shield className={`h-5 w-5 text-indigo-400 mt-0.5 ${dir === 'rtl' ? 'ml-4' : 'mr-3'} flex-shrink-0`} />
            <p className="text-sm text-indigo-300">
              {t('poll.completeProfileMessage')}
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}