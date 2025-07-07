'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';

export default function AnnouncementsPage() {
  const router = useRouter();
  const { t } = useTranslations();
  
  // Immediately redirect to dashboard
  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  // Render a loading message until redirect completes
  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-950/90">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
        <p className="mt-4 text-indigo-300">{t('common.loading')}</p>
      </div>
    </div>
  );
} 