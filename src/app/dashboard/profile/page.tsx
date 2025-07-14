'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { checkEnvironmentVariables } from "@/lib/debugUtils";
import PhoneNumberForm from "@/components/PhoneNumberForm";
import GenderForm from "@/components/GenderForm";
import GroupForm from "@/components/GroupForm";
import SemesterForm from "@/components/SemesterForm";
import { getUserData } from '@/lib/supabase';
import { useTranslations } from '@/lib/i18n';
import { 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  UserCircle, 
  Mail, 
  Building, 
  Phone, 
  Loader2, 
  GraduationCap,
  Calendar,
  User,
  Users
} from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { userData, isLoading: isUserDataLoading, isAdmin, error: userDataError } = useUserData();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [envError, setEnvError] = useState(false);
  const [localUserData, setLocalUserData] = useState(userData);
  const { t, dir } = useTranslations();
  
  // Inject custom styles for RTL direction
  useEffect(() => {
    if (dir === 'rtl') {
      // Add a style element for better RTL spacing
      const style = document.createElement('style');
      style.textContent = `
        /* Fix icon spacing in RTL mode */
        [dir="rtl"] .profile-label-icon {
          margin-left: 0 !important;
          margin-right: 8px !important;
        }
        
        /* Fix label alignment in RTL mode */
        [dir="rtl"] .profile-label {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          text-align: right;
        }
        
        /* Fix verification badge in RTL mode */
        [dir="rtl"] .verified-badge {
          display: flex !important;
          align-items: center !important;
        }
        
        [dir="rtl"] .verified-badge svg {
          margin-right: 0 !important;
          margin-left: 4px !important;
        }
        
        /* Fix admin badge spacing in RTL mode */
        [dir="rtl"] .admin-badge {
          margin-right: 8px !important;
          margin-left: 0 !important;
        }
        
        /* Fix note section in RTL mode */
        [dir="rtl"] .note-section {
          display: flex;
        }
        
        [dir="rtl"] .note-content {
          margin-right: 12px !important;
          margin-left: 0 !important;
          text-align: right;
        }
        
        /* General RTL Fixes */
        [dir="rtl"] .card-heading-icon {
          margin-left: 8px !important;
          margin-right: 0 !important;
        }
        
        [dir="rtl"] .tag-icon {
          margin-left: 4px !important;
          margin-right: 0 !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [dir]);
  
  // Keep local state in sync with userData hook
  useEffect(() => {
    if (userData) {
      setLocalUserData(userData);
    }
  }, [userData]);
  
  // Function to refresh user data
  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      try {
        const freshData = await getUserData(user.id);
        if (freshData) {
          setLocalUserData(freshData);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  }, [user?.id]);
  
  // Check environment variables on component mount
  useEffect(() => {
    const envCheck = checkEnvironmentVariables();
    setEnvError(!envCheck);
  }, []);
  
  useEffect(() => {
    // If user is not logged in, redirect to home
    if (isLoaded && !isSignedIn) {
      router.push('/');
      return;
    }
    
    // If user email doesn't end with @epu.edu.iq, redirect to unauthorized
    // TEMPORARILY DISABLED FOR TESTING
    /*
    if (isLoaded && isSignedIn && user?.primaryEmailAddress?.emailAddress) {
      if (!user.primaryEmailAddress.emailAddress.endsWith('@epu.edu.iq')) {
        router.push('/unauthorized');
        return;
      }
      
      setLoading(false);
    }
    */
    
    // TEMPORARY CODE FOR TESTING - Allow all email domains
    if (isLoaded && isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, user, router, isUserDataLoading, isAdmin]);

  // Get first letter of name for avatar placeholder
  const getInitials = () => {
    if (!user?.fullName) return "U";
    return user.fullName.charAt(0).toUpperCase();
  };

  // Helper function for RTL-aware icon placement
  const renderIconWithText = (Icon: React.ElementType, text: React.ReactNode, iconClassName = "h-5 w-5 text-indigo-400", textClassName = "") => {
    return (
      <div className="flex items-center">
        {dir === 'rtl' ? (
          <>
            <span className={textClassName}>{text}</span>
            <Icon className={`${iconClassName} mr-0 ml-2 card-heading-icon`} />
          </>
        ) : (
          <>
            <Icon className={`${iconClassName} mr-2 ml-0 card-heading-icon`} />
            <span className={textClassName}>{text}</span>
          </>
        )}
      </div>
    );
  };

  if (loading || !isLoaded || !isSignedIn || isUserDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center p-8 rounded-xl max-w-md w-full bg-indigo-900/20 backdrop-blur-sm border border-indigo-800/30">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-indigo-800/30 border-t-indigo-400"></div>
          <p className="mt-6 text-lg text-white font-medium">{t('profile.loading') || 'Loading your profile...'}</p>
          <p className="mt-2 text-indigo-300">{t('profile.loadingDesc') || 'Please wait while we retrieve your information'}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Alerts Section */}
        {(envError || userDataError) && (
          <div className="mb-6 animate-fadeIn">
            {envError && (
              <div className="bg-amber-900/30 backdrop-blur-sm border border-amber-700/30 rounded-lg p-4 mb-4 shadow-sm flex items-start" role="alert">
                {dir === 'rtl' ? (
                  <>
                    <div className="flex-1">
                      <p className="font-medium text-amber-300">{t('profile.alerts.envVariableIssue') || 'Environment Variable Issue'}</p>
                      <p className="text-amber-400 mt-1">{t('profile.alerts.envVariableDesc') || 'Supabase environment variables are missing. Profile features may be limited.'}</p>
                    </div>
                    <AlertTriangle className="ml-3 mr-0 h-5 w-5 flex-shrink-0 text-amber-400" />
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-3 ml-0 h-5 w-5 flex-shrink-0 text-amber-400" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-300">{t('profile.alerts.envVariableIssue') || 'Environment Variable Issue'}</p>
                      <p className="text-amber-400 mt-1">{t('profile.alerts.envVariableDesc') || 'Supabase environment variables are missing. Profile features may be limited.'}</p>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {userDataError && (
              <div className="bg-rose-900/30 backdrop-blur-sm border border-rose-700/30 rounded-lg p-4 shadow-sm flex items-start" role="alert">
                {dir === 'rtl' ? (
                  <>
                    <div className="flex-1">
                      <p className="font-medium text-rose-300">{t('profile.alerts.dbConnectionIssue') || 'Database Connection Issue'}</p>
                      <p className="text-rose-400 mt-1">{t('profile.alerts.dbConnectionDesc') || 'There was a problem connecting to the user database. Profile features may be limited.'}</p>
                    </div>
                    <AlertTriangle className="ml-3 mr-0 h-5 w-5 flex-shrink-0 text-rose-400" />
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-3 ml-0 h-5 w-5 flex-shrink-0 text-rose-400" />
                    <div className="flex-1">
                      <p className="font-medium text-rose-300">{t('profile.alerts.dbConnectionIssue') || 'Database Connection Issue'}</p>
                      <p className="text-rose-400 mt-1">{t('profile.alerts.dbConnectionDesc') || 'There was a problem connecting to the user database. Profile features may be limited.'}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Profile Header */}
        <div className="relative mb-8 bg-gradient-to-br from-indigo-800/80 to-purple-900/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-indigo-700/50">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/pattern-bg.png')] bg-repeat opacity-20"></div>
          </div>
          
          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start text-white">
            <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
              {user?.imageUrl ? (
                <div className="h-28 w-28 md:h-32 md:w-32 rounded-full border-4 border-indigo-500/50 shadow-lg overflow-hidden">
                  <Image 
                    src={user.imageUrl} 
                    alt={user.fullName || "User"} 
                    width={128} 
                    height={128}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-28 w-28 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-indigo-600/80 to-purple-700/80 border-4 border-indigo-500/50 shadow-lg flex items-center justify-center">
                  <span className="text-4xl md:text-5xl font-bold text-white">{getInitials()}</span>
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.fullName || 'EPU Student'}</h1>
              <p className="text-lg font-medium text-indigo-200 mb-4">{user.primaryEmailAddress?.emailAddress}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-700/50 backdrop-blur-sm text-indigo-100 text-sm font-medium">
                  {dir === 'rtl' ? (
                    <>
                      <span>{localUserData?.role || 'Student'}</span>
                      <GraduationCap className="ml-0 mr-1 h-4 w-4 tag-icon" />
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-1 ml-0 h-4 w-4 tag-icon" />
                      <span>{localUserData?.role || 'Student'}</span>
                    </>
                  )}
                </span>
                
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-700/50 backdrop-blur-sm text-indigo-100 text-sm font-medium">
                  {dir === 'rtl' ? (
                    <>
                      <span>ICTE1</span>
                      <Building className="ml-0 mr-1 h-4 w-4 tag-icon" />
                    </>
                  ) : (
                    <>
                      <Building className="mr-1 ml-0 h-4 w-4 tag-icon" />
                      <span>ICTE1</span>
                    </>
                  )}
                </span>

                {localUserData?.phone_number && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-700/50 backdrop-blur-sm text-indigo-100 text-sm font-medium">
                    {dir === 'rtl' ? (
                      <>
                        <span>{localUserData.phone_number}</span>
                        <Phone className="ml-0 mr-1 h-4 w-4 tag-icon" />
                      </>
                    ) : (
                      <>
                        <Phone className="mr-1 ml-0 h-4 w-4 tag-icon" />
                        <span>{localUserData.phone_number}</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information Card */}
          <div className="lg:col-span-2">
            <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-indigo-800/30">
              <div className="border-b border-indigo-800/30 p-6">
                <h2 className="text-xl font-bold text-white">
                  {renderIconWithText(
                    UserCircle, 
                    t('profile.title') || 'Profile Information'
                  )}
                </h2>
                <p className="text-indigo-300 mt-1">{t('profile.description') || 'Your personal and academic information'}</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                    <div className="sm:w-1/3 mb-2 sm:mb-0">
                      <span className="text-sm font-medium text-indigo-300 profile-label">
                        {renderIconWithText(
                          UserCircle, 
                          t('profile.fullName') || 'Full Name', 
                          "h-4 w-4 text-indigo-400"
                        )}
                      </span>
                    </div>
                    <div className="sm:w-2/3">
                      <p className="text-lg font-medium text-white">{user.fullName || 'Not available'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                    <div className="sm:w-1/3 mb-2 sm:mb-0">
                      <span className="text-sm font-medium text-indigo-300 profile-label">
                        {renderIconWithText(
                          Mail, 
                          t('profile.email') || 'Email', 
                          "h-4 w-4 text-indigo-400"
                        )}
                      </span>
                    </div>
                    <div className="sm:w-2/3">
                      <p className="text-white break-words">{user.primaryEmailAddress?.emailAddress}</p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-green-800/50 text-green-200 text-xs">
                        {dir === 'rtl' ? (
                          <>
                            <span className="text-xs font-normal">{t('profile.verified') || 'Verified'}</span>
                            <CheckCircle className="h-3 w-3 ml-0 mr-1.5" />
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1.5 ml-0" />
                            <span className="text-xs font-normal">{t('profile.verified') || 'Verified'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                    <div className="sm:w-1/3 mb-2 sm:mb-0">
                      <span className="text-sm font-medium text-indigo-300 profile-label">
                        {renderIconWithText(
                          Shield, 
                          t('profile.accountType') || 'Account Type', 
                          "h-4 w-4 text-indigo-400"
                        )}
                      </span>
                    </div>
                    <div className="sm:w-2/3">
                      <div className="flex items-center">
                        <p className="text-white capitalize">
                          {localUserData?.role || 'Student'}
                        </p>
                        {localUserData?.role === 'admin' && (
                          <span className={`${dir === 'rtl' ? 'mr-2' : 'ml-2'} px-2 py-1 text-xs bg-indigo-700/50 text-indigo-200 rounded-full admin-badge`}>
                            {t('profile.admin') || 'Admin'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                    <div className="sm:w-1/3 mb-2 sm:mb-0">
                      <span className="text-sm font-medium text-indigo-300 profile-label">
                        {renderIconWithText(
                          Building, 
                          t('profile.department') || 'Department', 
                          "h-4 w-4 text-indigo-400"
                        )}
                      </span>
                    </div>
                    <div className="sm:w-2/3">
                      <p className="text-white">ICTE1</p>
                    </div>
                  </div>

                  {localUserData?.phone_number && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                      <div className="sm:w-1/3 mb-2 sm:mb-0">
                        <span className="text-sm font-medium text-indigo-300 profile-label">
                          {renderIconWithText(
                            Phone, 
                            t('profile.phoneNumber') || 'Phone Number', 
                            "h-4 w-4 text-indigo-400"
                          )}
                        </span>
                      </div>
                      <div className="sm:w-2/3">
                        <p className="text-white">{localUserData.phone_number}</p>
                      </div>
                    </div>
                  )}
                  
                  {localUserData?.gender && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                      <div className="sm:w-1/3 mb-2 sm:mb-0">
                        <span className="text-sm font-medium text-indigo-300 profile-label">
                          {renderIconWithText(
                            User, 
                            t('profile.gender') || 'Gender', 
                            "h-4 w-4 text-indigo-400"
                          )}
                        </span>
                      </div>
                      <div className="sm:w-2/3">
                        <p className="text-white capitalize">{localUserData.gender}</p>
                      </div>
                    </div>
                  )}

                  {localUserData?.group_class && (
                    <div className="flex flex-col sm:flex-row sm:items-center p-4 bg-indigo-800/20 backdrop-blur-sm rounded-lg transition-all duration-200 hover:bg-indigo-800/30 border border-indigo-700/30">
                      <div className="sm:w-1/3 mb-2 sm:mb-0">
                        <span className="text-sm font-medium text-indigo-300 profile-label">
                          {renderIconWithText(
                            Users, 
                            t('profile.groupClass') || 'Group Class', 
                            "h-4 w-4 text-indigo-400"
                          )}
                        </span>
                      </div>
                      <div className="sm:w-2/3">
                        <p className="text-white">{localUserData.group_class}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 bg-blue-900/30 backdrop-blur-sm p-4 rounded-lg border border-blue-500/40 shadow-sm">
                  <div className="flex items-start note-section">
                    {dir === 'rtl' ? (
                      <>
                        <div className={`${dir === 'rtl' ? 'mr-3' : 'ml-3'} note-content`}>
                          <p className="text-blue-200">
                            <span className="font-medium">{t('profile.note') || 'Note'}:</span> {t('profile.noteDesc') || 'Your profile information is synchronized with your EPU account. If you need to update your personal information, please contact the university administration.'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 mt-0.5">
                          <Calendar className="h-5 w-5 text-blue-300" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-shrink-0 mt-0.5">
                          <Calendar className="h-5 w-5 text-blue-300" />
                        </div>
                        <div className={`${dir === 'rtl' ? 'mr-3' : 'ml-3'} note-content`}>
                          <p className="text-blue-200">
                            <span className="font-medium">{t('profile.note') || 'Note'}:</span> {t('profile.noteDesc') || 'Your profile information is synchronized with your EPU account. If you need to update your personal information, please contact the university administration.'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Phone Number Form Card */}
          <div className="lg:col-span-1">
            <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-indigo-800/30 h-full">
              <div className="h-full flex flex-col">
                <div className="border-b border-indigo-800/30 p-6">
                  <h2 className="text-xl font-bold text-white">
                    {renderIconWithText(
                      Phone, 
                      t('profile.contactInfo.title') || 'Contact Information'
                    )}
                  </h2>
                  <p className="text-indigo-300 mt-1">{t('profile.contactInfo.description') || 'Update your contact details'}</p>
                </div>
                
                <div className="flex-1 p-6">
                  <PhoneNumberForm 
                    userId={user.id} 
                    initialPhoneNumber={localUserData?.phone_number || undefined} 
                    onUpdate={refreshUserData}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Gender Form Card */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-indigo-800/30 h-full">
              <div className="h-full flex flex-col">
                <div className="border-b border-indigo-800/30 p-6">
                  <h2 className="text-xl font-bold text-white">
                    {renderIconWithText(
                      User, 
                      t('profile.genderInfo.title') || 'Gender Information'
                    )}
                  </h2>
                  <p className="text-indigo-300 mt-1">{t('profile.genderInfo.description') || 'Set your gender identification'}</p>
                </div>
                
                <div className="flex-1 p-6">
                  <GenderForm 
                    userId={user.id} 
                    initialGender={localUserData?.gender || undefined} 
                    onUpdate={refreshUserData}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Group Form Card */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="bg-indigo-900/20 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-indigo-800/30 h-full">
              <div className="h-full flex flex-col">
                <div className="border-b border-indigo-800/30 p-6">
                  <h2 className="text-xl font-bold text-white">
                    {renderIconWithText(
                      Users, 
                      t('profile.groupInfo.title') || 'Group Selection'
                    )}
                  </h2>
                  <p className="text-indigo-300 mt-1">{t('profile.groupInfo.description') || 'Set your class group (A1 or A2)'}</p>
                </div>
                
                <div className="flex-1 p-6">
                  <GroupForm 
                    userId={user.id} 
                    initialGroup={localUserData?.group_class || undefined} 
                    onUpdate={refreshUserData}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Semester Information */}
        <div className="max-w-6xl mx-auto mb-6 overflow-hidden bg-indigo-900/30 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-800/30 divide-y divide-indigo-800/30">
          <div className="px-6 py-5">
            <h3 className="text-lg font-medium leading-6 text-white">
              {renderIconWithText(GraduationCap, t('profile.semesterInfo.heading') || 'Semester Information')}
            </h3>
            <p className="mt-1 text-sm text-indigo-300">
              {t('profile.semesterInfo.headingDescription') || 'Select your current semester to see relevant content'}
            </p>
          </div>
          <div className="px-6 py-5">
            <SemesterForm 
              userId={user.id} 
              initialSemester={localUserData?.semester || undefined} 
              onUpdate={refreshUserData}
              required={!localUserData?.semester}
            />
          </div>
        </div>
      </div>
    </main>
  );
}