'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUser, SignInButton, SignOutButton, UserButton } from '@clerk/nextjs';
import LanguageSelector from '@/components/language';
import { useUserData } from "@/hooks/useUserData";
import { useTranslations } from '@/lib/i18n';
import { Phone, UserCircle, Shield } from 'lucide-react';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const { userData, isAdmin } = useUserData();
  const { t, dir, lang } = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Profile information component
  const ProfileInfo = () => {
    if (!isSignedIn || !user) return null;
    
    return (
      <div className={`flex ${dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'} items-center gap-2`}>
        {/* Removed phone_number, group_class, and admin badges */}
      </div>
    );
  };

  return (
    <nav className="bg-black text-white shadow-md shadow-indigo-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center mx-8">
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">EASY EPU</span>
            </Link>
            <div className="hidden sm:flex sm:space-x-10 sm:[&_a]:mx-4">
              <Link 
                href="/" 
                className="text-indigo-300 hover:text-indigo-200 inline-flex items-center px-1 pt-1 border-b-2 border-indigo-500 text-sm font-medium"
              >
                Home
              </Link>
              {mounted && isSignedIn && (
                <Link 
                  href="/dashboard" 
                  className="border-transparent text-indigo-300 hover:text-indigo-200 hover:border-indigo-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Profile info - kept for user name and email */}
            
            {mounted && (
              <div className="mx-6">
                <LanguageSelector />
              </div>
            )}
            {mounted && isLoaded && (
              <>
                {!isSignedIn ? (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-indigo-500/30 text-sm font-medium rounded-md text-white bg-indigo-600/30 hover:bg-indigo-600/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Login
                    </button>
                  </SignInButton>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className={`flex flex-col ${dir === 'rtl' ? 'items-end' : 'items-start'}`}>
                      <span className="text-sm font-medium text-white">
                        {user?.fullName}
                      </span>
                      <span className="text-xs text-gray-300">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                    <UserButton afterSignOutUrl="/" />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mounted && (
                <>
                  {!isMobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {mounted && isMobileMenuOpen && (
        <div className="sm:hidden bg-black">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="bg-indigo-900/30 border-indigo-500 text-indigo-300 block px-4 py-2 border-l-4 text-base font-medium"
            >
              Home
            </Link>
            {isSignedIn && (
              <Link
                href="/dashboard"
                className="border-transparent text-indigo-300 hover:bg-indigo-900/20 hover:border-indigo-400 hover:text-indigo-200 block px-4 py-2 border-l-4 text-base font-medium"
              >
                Dashboard
              </Link>
            )}
          </div>
          <div className="pt-4 pb-3 border-t border-indigo-800">
            <div className="px-4 py-2">
              <LanguageSelector />
            </div>
            <div className="mt-3 space-y-1">
              {mounted && isLoaded && !isSignedIn ? (
                <SignInButton mode="modal">
                  <button
                    className="block w-full text-left px-4 py-2 text-base font-medium text-white bg-indigo-600/30 hover:bg-indigo-600/50 rounded-md"
                  >
                    Login
                  </button>
                </SignInButton>
              ) : (
                <div className="px-4">
                  {/* Mobile Profile info - removed badges */}
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserButton afterSignOutUrl="/" />
                    </div>
                    <div className="mx-3">
                      <div className="text-base font-medium text-white">
                        {user?.fullName}
                      </div>
                      <div className="text-sm text-gray-300">
                        {user?.primaryEmailAddress?.emailAddress}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 