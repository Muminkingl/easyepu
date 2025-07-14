'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserData } from '@/hooks/useUserData';
import { useUser } from '@clerk/nextjs';
import { 
  UserIcon, 
  HomeIcon, 
  BellIcon, 
  BookOpenIcon,
  PresentationChartBarIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/lib/i18n';

// Type for navigation items
type NavItem = {
  nameKey: string;
  href: string;
  icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement> & { title?: string, titleId?: string }>;
  descriptionKey: string;
  exact?: boolean;
  count?: number;
};

// Custom event for sidebar toggle
declare global {
  interface WindowEventMap {
    'sidebarToggled': CustomEvent<{collapsed: boolean}>;
  }
}

// Dynamic navigation with default values
const getDefaultNavigation = (): NavItem[] => [
  { 
    nameKey: 'sidebar.dashboard', 
    href: '/dashboard', 
    icon: HomeIcon,
    descriptionKey: 'sidebar.dashboardDesc',
    exact: true
  },
  { 
    nameKey: 'sidebar.profile', 
    href: '/dashboard/profile', 
    icon: UserIcon,
    descriptionKey: 'sidebar.profileDesc'
  },
  { 
    nameKey: 'sidebar.courses', 
    href: '/dashboard/courses', 
    icon: BookOpenIcon,
    descriptionKey: 'sidebar.coursesDesc'
  },
  { 
    nameKey: 'sidebar.presentationGroup', 
    href: '/dashboard/presentation-group', 
    icon: PresentationChartBarIcon,
    descriptionKey: 'sidebar.presentationGroupDesc'
  },
  { 
    nameKey: 'sidebar.perks', 
    href: '/dashboard/support-us', 
    icon: HeartIcon,
    descriptionKey: 'sidebar.perksDesc'
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed on mobile
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // For mobile menu toggle
  const [mounted, setMounted] = useState(false);
  const { userData } = useUserData();
  const { user } = useUser();
  const [navigation, setNavigation] = useState(getDefaultNavigation());
  const { t, dir } = useTranslations();

  // Check if current path matches navigation item
  const isActivePath = (itemPath: string, exact = false) => {
    if (exact) return pathname === itemPath;
    return pathname.startsWith(itemPath);
  };

  // Handle client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
        setIsOpen(false);
      }
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to toggle sidebar and dispatch event for dashboard to listen
  const toggleSidebar = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    
    // Dispatch custom event for dashboard to respond to
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sidebarToggled', { 
        detail: { collapsed: newCollapsedState } 
      });
      window.dispatchEvent(event);
    }
  };

  // Function to toggle mobile menu and dispatch appropriate event
  const toggleMobileMenu = () => {
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    
    // Also dispatch sidebar toggle event for consistent behavior
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('sidebarToggled', { 
        detail: { collapsed: !newOpenState } 
      });
      window.dispatchEvent(event);
    }
  };

  // Function to get the ICTE level based on semester
  const getIcteLevel = (semester: number | null | undefined): string => {
    if (!semester) return '';
    
    if (semester <= 2) return 'ICTE 1';
    if (semester <= 4) return 'ICTE 2';
    if (semester <= 6) return 'ICTE 3';
    if (semester <= 8) return 'ICTE 4';
    
    return 'ICTE';
  };

  // Render user profile section in the bottom of the sidebar
  const renderUserProfile = () => {
    // Get display name - prioritize Clerk real name, then fall back to username, then email
    const displayName = user?.fullName || user?.firstName || userData?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || '';
    
    // Get user's profile image from Clerk or use fallback
    const profileImageUrl = user?.imageUrl || `/api/placeholder/40/40`;
    const profileInitial = user?.firstName?.charAt(0) || displayName.charAt(0) || 'U';
    
    // Get ICTE level based on semester
    const icteLevel = getIcteLevel(userData?.semester);
    
    if (collapsed && !isOpen) {
      return (
        <div className="relative">
          {user?.imageUrl ? (
            <img 
              src={profileImageUrl}
              alt={displayName} 
              className="h-8 w-8 rounded-full border-2 border-indigo-300 object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full border-2 border-indigo-300 bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">{profileInitial}</span>
            </div>
          )}
          <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-1 ring-white"></span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        {user?.imageUrl ? (
          <img 
            src={profileImageUrl}
            alt={displayName} 
            className="h-10 w-10 rounded-full border-2 border-indigo-300 object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full border-2 border-indigo-300 bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">{profileInitial}</span>
          </div>
        )}
        <div className="ml-3">
          {displayName && (
            <p className="text-sm font-medium text-white">{displayName}</p>
          )}
          <p className="text-xs text-indigo-300">{icteLevel}</p>
        </div>
      </div>
    );
  };

  // Don't render anything on the server
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile menu toggle button - fixed at the top */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-black text-white shadow-lg shadow-indigo-500/10"
          aria-label={t('sidebar.toggleMenu')}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      )}

      {/* Main sidebar */}
      <div 
        className={`bg-gradient-to-b from-black to-indigo-950 fixed left-0 top-0 bottom-0 z-40 transition-all duration-300 shadow-xl ${
          collapsed && !isOpen ? 'w-16' : 'w-64'
        } ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className={`flex flex-col h-full ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-700">
            {(!collapsed || isOpen) && (
              <div className="flex items-center">
                <div className="bg-white p-1 rounded-lg">
                  <div className="text-indigo-800 font-bold text-xl">EPU</div>
                </div>
                <span className={`text-xl font-semibold text-white ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>EASY</span>
              </div>
            )}
            {(collapsed && !isMobile && !isOpen) && (
              <div className="mx-auto mt-2">
                <div className="bg-white p-1 rounded-lg">
                  <div className="text-indigo-800 font-bold text-xl">E</div>
                </div>
              </div>
            )}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className={`p-1 rounded-full hover:bg-indigo-700 transition-colors text-white ${collapsed && isMobile ? 'mx-auto' : ''}`}
                aria-label={t('sidebar.toggleSidebar')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {collapsed ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  )}
                </svg>
              </button>
            )}
            {isMobile && isOpen && (
              <button
                onClick={toggleMobileMenu}
                className="p-1 rounded-full hover:bg-indigo-700 transition-colors text-white"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600 scrollbar-track-transparent">
            <nav className="px-2 py-4">
              <div className={`${!collapsed || isOpen ? 'mb-4 px-3' : 'mb-6'}`}>
                {(!collapsed || isOpen) && (
                  <h3 className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                    {t('sidebar.mainMenu')}
                  </h3>
                )}
              </div>
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = isActivePath(item.href, item.exact);
                  return (
                    <li 
                      key={item.nameKey} 
                      onMouseEnter={() => setHoveredItem(item.nameKey)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className="relative"
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'text-indigo-100 hover:bg-indigo-700'
                        } ${collapsed && !isOpen ? 'justify-center' : ''}`}
                      >
                        <span className="relative">
                          <item.icon
                            className={`h-5 w-5 ${isActive ? 'text-white' : 'text-indigo-200'}`}
                            aria-hidden="true"
                          />
                          {item.count && item.count > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                              {item.count}
                            </span>
                          )}
                        </span>
                        {(!collapsed || isOpen) && (
                          <span className={`${dir === 'rtl' ? 'mr-3' : 'ml-3'} flex-1`}>{t(item.nameKey)}</span>
                        )}
                        {(!collapsed || isOpen) && item.count && item.count > 0 && (
                          <span className="ml-auto inline-block py-0.5 px-2 text-xs rounded-full bg-indigo-500 text-white">
                            {item.count}
                          </span>
                        )}
                      </Link>
                      
                      {/* Tooltip for collapsed mode */}
                      {collapsed && !isOpen && hoveredItem === item.nameKey && !isMobile && (
                        <div className={`absolute ${dir === 'rtl' ? 'right-14' : 'left-14'} top-0 z-50 w-48 bg-white rounded-md shadow-lg py-1 text-sm text-gray-700`}>
                          <div className="px-3 py-2">
                            <p className="font-medium text-gray-900">{t(item.nameKey)}</p>
                            <p className="text-xs text-gray-500">{t(item.descriptionKey)}</p>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* User profile section at bottom */}
          <div className={`p-3 border-t border-indigo-700 bg-indigo-800 mt-auto ${collapsed && !isOpen ? 'flex justify-center' : ''}`}>
            {renderUserProfile()}
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        ></div>
      )}
    </>
  );
}