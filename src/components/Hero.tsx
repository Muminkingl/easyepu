'use client';

import { useState, useEffect } from 'react';
import { SignInButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

export default function Hero() {
  const [mounted, setMounted] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const [animateHero, setAnimateHero] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Add animation effect after component mounts
    const timer = setTimeout(() => setAnimateHero(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative bg-gradient-to-b from-white to-indigo-50 overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-100 rounded-full opacity-30 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
          {/* Left content section */}
          <div className={`flex flex-col justify-center px-4 py-16 sm:px-6 lg:px-8 transition-all duration-700 ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="inline-block mb-4 px-4 py-1.5 bg-indigo-100 rounded-full">
              <span className="text-sm font-medium text-indigo-800">EasyEPU Platform</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Easy</span>
              <span className="block text-indigo-600 mt-1">EPU</span>
            </h1>
            
            <p className="mt-6 text-lg text-gray-600 max-w-lg">
              Stay connected with campus life - receive real-time updates about events, academic announcements, and opportunities directly on your dashboard.
            </p>
            
            <div className="mt-8 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
              {mounted && isLoaded ? (
                !isSignedIn ? (
                  <SignInButton mode="modal">
                    <button className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all duration-300">
                      <span>Get started</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </SignInButton>
                ) : (
                  <Link href="/dashboard" className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all duration-300">
                    <span>Go to Dashboard</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                )
              ) : (
                <button disabled className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-400">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </button>
              )}
              
              <Link href="#features" className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 transition-all duration-300">
                Learn more
              </Link>
            </div>
            
            <div className="mt-8 flex items-center text-sm text-gray-500">
              <div className="flex -space-x-1 overflow-hidden">
                <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="/api/placeholder/24/24" alt="Student avatar" />
                <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="/api/placeholder/24/24" alt="Student avatar" />
                <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white" src="/api/placeholder/24/24" alt="Student avatar" />
              </div>
              <span className="ml-2">Joined by 2000+ EPU students</span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">100+</div>
                <div className="text-xs text-gray-500">Daily Updates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">15+</div>
                <div className="text-xs text-gray-500">Departments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">24/7</div>
                <div className="text-xs text-gray-500">Availability</div>
              </div>
            </div>
          </div>

          {/* Right image/illustration section */}
          <div className={`relative flex items-center justify-center p-4 transition-all duration-1000 delay-300 ${animateHero ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative w-full max-w-lg">
              {/* Modern UI effect with gradient borders */}
              <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              
              {/* Mock UI */}
              <div className="relative bg-white rounded-2xl shadow-xl p-2 overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-t-lg border-b border-gray-100">
                  <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="w-48 h-4 bg-gray-200 rounded-md"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded-md"></div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  {/* Mock dashboard content */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="w-32 h-6 bg-indigo-100 rounded-md"></div>
                    <div className="w-8 h-8 bg-indigo-100 rounded-full"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Announcement items */}
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="p-3 bg-gray-50 rounded-lg flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex-shrink-0"></div>
                        <div className="ml-3 flex-grow">
                          <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="w-2/3 h-3 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="h-px bg-gray-100"></div>
                    
                    {/* Action buttons */}
                    <div className="flex justify-center space-x-2">
                      <div className="w-24 h-8 bg-indigo-500 rounded-md"></div>
                      <div className="w-24 h-8 bg-gray-200 rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-auto">
          <path fill="#EEF2FF" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,154.7C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
}