'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from '@/lib/i18n';

const LanguageSelector = () => {
  const { lang, changeLang, languages, dir } = useTranslations();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className={`flex items-center ${dir === 'rtl' ? 'space-x-reverse' : 'space-x-2'}`}>
      <span className="text-sm text-white mr-2 font-medium">Language:</span>
      <div className="flex items-center gap-2">
        {Object.entries(languages).map(([code, { name }]) => (
          <button
            key={code}
            onClick={() => changeLang(code)}
            className={`relative px-3 py-1.5 text-sm rounded-md transition-all duration-300 ${
              lang === code
                ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                : 'bg-white/10 text-white hover:bg-indigo-600/50 font-medium border border-white/20 hover:border-indigo-400/40'
            }`}
          >
            {name}
            {lang === code && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector; 