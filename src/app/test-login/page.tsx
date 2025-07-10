'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export default function TestLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Hardcoded credentials for testing - REMOVE IN PRODUCTION
    if (email === 'test@test.com' && password === 'test123') {
      // Set a simple cookie to indicate test authentication
      document.cookie = 'test_auth=true; path=/; max-age=3600';
      
      // Redirect to support-us (perks) page instead of dashboard
      setTimeout(() => {
        router.push('/dashboard/support-us');
      }, 1000);
    } else {
      setError('Invalid credentials. Use test@test.com / test123');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-indigo-950 to-black flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full py-4 px-6">
        <Link href="/" className="flex items-center space-x-2">
          <GraduationCap className="h-8 w-8 text-indigo-400" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">EASY EPU</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-md rounded-xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">Test Access Only</h1>
          <p className="text-indigo-300 mt-2">
            ⚠️ This page is for development testing only and will be removed before production.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              placeholder="test@test.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-700 bg-gray-900/50 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
              placeholder="test123"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login for Testing'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-indigo-300">
            Use credentials: test@test.com / test123
          </p>
        </div>
      </div>

      <div className="mt-8 text-center max-w-md">
        <p className="text-red-400 text-sm font-semibold">
          DEVELOPMENT TESTING ONLY
        </p>
        <p className="text-gray-400 text-xs mt-1">
          This login bypass is for development and review purposes only. 
          It will be removed before production deployment.
        </p>
      </div>
    </div>
  );
} 