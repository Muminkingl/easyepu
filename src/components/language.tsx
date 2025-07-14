'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { useTranslations, languages as availableLanguages } from '@/lib/i18n';
import Image from 'next/image';

type Language = {
  code: string;
  name: string;
  flagSrc: string;
};

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { lang, changeLang, dir } = useTranslations();

  // Languages available in the app
  const languages: Language[] = [
    { 
      code: 'en', 
      name: availableLanguages.en.name, 
      flagSrc: 'https://flagcdn.com/w20/gb.png'
    },
    { 
      code: 'ku', 
      name: availableLanguages.ku.name, 
      flagSrc: 'https://flagcdn.com/w20/tj.png'
    },
  ];

  useEffect(() => {
    // Get language from localStorage or default to 'en'
    const savedLang = localStorage.getItem('language') || 'en';
    setCurrentLang(savedLang);

    // Add click outside listener to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update currentLang when lang changes from the context
  useEffect(() => {
    if (lang) {
      setCurrentLang(lang);
    }
  }, [lang]);

  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLang) {
      setIsOpen(false);
      return;
    }
    
    setIsOpen(false);
    // Use the translation system's changeLang function
    changeLang(langCode);
  };

  const getCurrentLanguage = (): Language => {
    return languages.find(lang => lang.code === currentLang) || languages[0];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all duration-300 group"
        aria-label="Select language"
      >
        <img 
          src={getCurrentLanguage().flagSrc} 
          alt={`${getCurrentLanguage().code} flag`}
          className="w-5 h-auto rounded-sm"
        />
        <span className="text-sm font-medium text-indigo-300 group-hover:text-white transition-colors">
          {getCurrentLanguage().code.toUpperCase()}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-indigo-300 group-hover:text-white transition-all duration-300 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-48 rounded-lg shadow-lg bg-gray-900/90 backdrop-blur-lg border border-indigo-500/30 overflow-hidden z-50 transform origin-top transition-all duration-300 animate-in fade-in slide-in-from-top-5">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-indigo-600/30 transition-colors ${
                  currentLang === language.code ? 'bg-indigo-600/20 text-white' : 'text-gray-300'
                }`}
              >
                <div className={`flex items-center ${language.code === 'ku' ? 'space-x-4' : 'space-x-3'}`}>
                  <img 
                    src={language.flagSrc} 
                    alt={`${language.code} flag`}
                    className="w-6 h-auto rounded-sm flex-shrink-0"
                  />
                  <span className={`font-medium ${language.code === 'ku' ? 'pr-2' : ''}`}>
                    {language.name}
                  </span>
                </div>
                {currentLang === language.code && (
                  <Check className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}