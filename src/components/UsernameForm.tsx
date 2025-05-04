'use client';

import { useState, useEffect } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useTranslations } from '@/lib/i18n';
import { LockIcon, Edit2, Check } from 'lucide-react';

export default function UsernameForm() {
  const { userData, updateUsername } = useUserData();
  const [username, setUsername] = useState(userData?.username || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { t, dir } = useTranslations();
  const [alreadySet, setAlreadySet] = useState(false);

  useEffect(() => {
    if (userData?.username) {
      setUsername(userData.username);
      setAlreadySet(true);
    }
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess('');
    
    // Validate username
    if (!username.trim()) {
      setError(t('username.errors.empty') || 'Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setError(t('username.errors.tooShort') || 'Username must be at least 3 characters long');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError(t('username.errors.invalidChars') || 'Username can only contain letters, numbers, and underscores');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await updateUsername(username);
      if (success) {
        setSuccess(t('username.success') || 'Username updated successfully!');
        setAlreadySet(true);
        setIsEditing(false);
      } else {
        setError(t('username.errors.taken') || 'This username is already taken or there was an error.');
      }
    } catch (err) {
      setError(t('username.errors.failed') || 'Failed to update username. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (alreadySet && !isEditing) {
    return (
      <div className="bg-indigo-900/30 backdrop-blur-sm rounded-lg p-6 w-full border border-indigo-800/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{t('username.title') || 'Username'}</h3>
          <div className="flex items-center bg-indigo-800/40 px-3 py-1 rounded-full text-indigo-300 text-sm border border-indigo-700/30">
            <LockIcon className="h-3.5 w-3.5 mr-1.5" />
            <span>{t('username.locked') || 'Locked'}</span>
          </div>
        </div>
        
        <div className="flex items-center bg-indigo-800/30 p-4 rounded-lg border border-indigo-700/30">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-indigo-300 mb-1">
              {t('username.current') || 'Current Username'}
            </label>
            <div className="text-xl font-medium text-indigo-100">@{username}</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-amber-900/30 border border-amber-800/30 rounded-lg">
          <p className="text-amber-200 text-sm">
            {t('username.cannotChange') || 'Your username has been set and cannot be changed. This helps maintain consistency across the platform.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-indigo-900/30 backdrop-blur-sm rounded-lg p-6 w-full border border-indigo-800/30">
      <h3 className="text-lg font-semibold text-white mb-4">{t('username.setUsername') || 'Set Your Username'}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-indigo-300 mb-1">
            {t('username.usernameLabel') || 'Username'}
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-indigo-400">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-8 block w-full rounded-md bg-indigo-800/30 border-indigo-700/50 text-indigo-100 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/30 focus:ring-opacity-50"
              placeholder={t('username.placeholder') || "your_username"}
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-indigo-400">
            {t('username.oneTimeWarning') || 'Important: You can only set your username once. After setting, it cannot be changed.'}
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/30 border border-red-800/30 p-3 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-900/30 border border-green-800/30 p-3 rounded-lg">
            <p className="text-green-300 text-sm">{success}</p>
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('username.saving') || 'Saving...'}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('username.save') || 'Save Username'}
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 bg-blue-900/30 border border-blue-800/30 p-3 rounded-lg">
          <p className="text-blue-300 text-sm">
            {t('username.important') || 'Your username will be visible to other users and will be used across the platform.'}
          </p>
        </div>
      </form>
    </div>
  );
} 