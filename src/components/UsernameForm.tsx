'use client';

import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';

export default function UsernameForm() {
  const { userData, updateUsername } = useUserData();
  const [username, setUsername] = useState(userData?.username || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError('');
    setSuccess('');
    
    // Validate username
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await updateUsername(username);
      if (success) {
        setSuccess('Username updated successfully!');
      } else {
        setError('This username is already taken or there was an error.');
      }
    } catch (err) {
      setError('Failed to update username. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Set Your Username</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              @
            </span>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="your_username"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Your username is optional and will be displayed to other users.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-3">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}
        
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 ${
              isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isLoading ? 'Saving...' : 'Save Username'}
          </button>
        </div>
      </form>
    </div>
  );
} 