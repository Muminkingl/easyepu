import { useState, useEffect } from 'react';
import { useUserData } from './useUserData';
import { useTranslations } from '@/lib/i18n';
import { useRouter } from 'next/navigation';
import { LockIcon } from 'lucide-react';

/**
 * A hook to check if the user has selected a semester
 * Returns a lock component to display when the feature is locked
 */
export function useSemesterCheck() {
  const { userData, isLoading, isAdmin } = useUserData();
  const router = useRouter();
  const { t } = useTranslations();
  const [semesterSelected, setSemesterSelected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Only consider semester as selected if user has explicitly selected it
      // Check the semester_selected flag, regardless of admin status
      const hasSemester = userData && userData.semester_selected === true;
                          
      setSemesterSelected(hasSemester);
      setIsChecking(false);
      
      // For debugging
      console.log('Semester check:', {
        isAdmin,
        semester: userData?.semester,
        hasSemester,
        semester_selected: userData?.semester_selected
      });
    }
  }, [userData, isLoading, isAdmin]);

  // Navigate to profile to set semester
  const goToProfile = () => {
    router.push('/dashboard/profile');
  };

  // Component to display when a feature is locked
  const SemesterLock = () => (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-indigo-900/80 backdrop-blur-lg rounded-xl animate-fadeIn">
      <div className="bg-red-800/50 p-4 rounded-full border-2 border-red-500/50 mb-4">
        <LockIcon className="h-12 w-12 text-red-300" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 text-center">
        {t('profile.semesterInfo.locked') || 'Feature Locked'}
      </h3>
      <p className="text-indigo-200 mb-4 text-center max-w-md">
        {t('profile.semesterInfo.lockedMessage') || 
          'This feature is locked until you select your semester'}
      </p>
      <button
        onClick={goToProfile}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
      >
        {t('poll.updateProfile') || 'Update Profile'}
      </button>
    </div>
  );

  return {
    semesterSelected,
    isChecking,
    SemesterLock
  };
} 