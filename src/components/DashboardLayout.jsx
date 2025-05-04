'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side only rendering to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setSidebarCollapsed(window.innerWidth < 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add a simple skeleton loader for server-side rendering
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gradient-to-b from-black via-indigo-950 to-black">
        <div className="w-16 bg-indigo-900" /> {/* Sidebar placeholder */}
        <div className="flex-1">
          <div className="p-4 md:p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-indigo-800/30 rounded w-1/4"></div>
              <div className="h-32 bg-indigo-800/30 rounded"></div>
              <div className="h-64 bg-indigo-800/30 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-black via-indigo-950 to-black text-white">
      {/* Background effect elements similar to landing page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Grid pattern overlay */}
        <div className="fixed inset-0 opacity-10 pointer-events-none" 
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}>
        </div>
        
        {/* Gradient blurs */}
        <div className="absolute top-0 left-0 w-full h-full transform -translate-y-1/2 translate-x-1/4">
          <div className="absolute w-96 h-96 bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-full h-full transform translate-y-1/2 -translate-x-1/4">
          <div className="absolute w-96 h-96 bg-indigo-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>
      </div>

      <Sidebar />
      
      {/* Main content area - responsive to sidebar state */}
      <div className={`relative z-10 flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} sm:ml-0 md:${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {children}
      </div>
    </div>
  );
} 