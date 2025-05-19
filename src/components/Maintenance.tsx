'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';

interface MaintenanceProps {
  returnUrl: string;
  returnText?: string;
}

export default function Maintenance({ returnUrl, returnText }: MaintenanceProps) {
  const { t } = useTranslations();
  
  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-indigo-900/30 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-indigo-800/30">
        <div className="px-6 py-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-indigo-800/50 rounded-full flex items-center justify-center border border-indigo-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-indigo-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{t('maintenance.title')}</h2>
          <p className="text-xl text-indigo-200 mb-4">{t('maintenance.subtitle')}</p>
          <div className="text-indigo-300 max-w-lg mx-auto mb-6">
            <p>{t('maintenance.message')}</p>
          </div>
          <Link 
            href={returnUrl} 
            className="inline-flex items-center px-5 py-3 bg-indigo-700 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            {returnText || t('maintenance.returnButton')}
          </Link>
        </div>
      </div>
    </div>
  );
} 