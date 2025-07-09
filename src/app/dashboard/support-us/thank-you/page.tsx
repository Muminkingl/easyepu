'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { HeartIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function ThankYouPage() {
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-xl shadow-xl overflow-hidden p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            delay: 0.2,
            duration: 0.5,
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          className="mx-auto mb-6"
        >
          <div className="relative flex justify-center">
            <CheckCircleIcon className="h-20 w-20 text-green-500" />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
              }}
              className="absolute -right-1 -top-1"
            >
              <HeartIcon className="h-8 w-8 text-red-500 fill-red-500" />
            </motion.div>
          </div>
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          {t('supportUs.thankYou.title')}
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="text-gray-600 mb-8"
        >
          {t('supportUs.thankYou.message')}
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <Link 
            href="/dashboard" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-3 transition-colors"
          >
            {t('supportUs.thankYou.returnButton')}
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-8 pt-6 border-t border-gray-100"
        >
          <p className="text-sm text-gray-500">
            Transaction ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
} 