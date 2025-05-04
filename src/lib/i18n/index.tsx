'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import enTranslations from './en.json';
import kuTranslations from './ku.json';

// Define available languages
export const languages = {
  en: { name: 'English', dir: 'ltr' },
  ku: { name: 'کوردی سۆرانی', dir: 'rtl' }
};

// Type for translation object
export type TranslationsType = typeof enTranslations;

// Get translations based on language code
export const getTranslations = (lang: string): TranslationsType => {
  switch (lang) {
    case 'ku':
      return kuTranslations as TranslationsType;
    case 'en':
    default:
      return enTranslations;
  }
};

// Get nested translation value by key path
export const getTranslationByPath = (translations: TranslationsType, path: string, defaultValue?: string, returnObject: boolean = false): string | any => {
  const keys = path.split('.');
  let result: any = translations;
  
  // Map special cases for our flat structure to nested structure
  if (path.startsWith('home.features')) return translations.header?.features || 'Features';
  if (path.startsWith('home.faq')) return translations.header?.faq || 'FAQ';
  if (path.startsWith('common.dashboard')) return translations.header?.dashboard || 'Dashboard';
  if (path.startsWith('common.login')) return translations.header?.login || 'Login';
  if (path.startsWith('home.hero.title1')) return translations.hero?.title?.line1 || 'Your University Life';
  if (path.startsWith('home.hero.title2')) return translations.hero?.title?.line2 || 'Made Effortless';
  if (path.startsWith('home.hero.subtitle')) return translations.hero?.description || 'A student-centered platform that simplifies everything from course management to university announcements - all in one beautiful interface.';
  if (path.startsWith('home.hero.dashboardButton')) return translations.hero?.goToDashboard || 'Go to Dashboard';
  if (path.startsWith('home.hero.startButton')) return translations.hero?.getStarted || 'Get Started Now';
  if (path.startsWith('home.hero.learnMoreButton')) return translations.hero?.learnMore || 'Learn More';
  if (path.startsWith('home.cta.signUpButton')) return translations.cta?.signUp || 'Sign Up with EPU Email';
  if (path.startsWith('home.cta.dashboardButton')) return translations.hero?.goToDashboard || 'Go to Dashboard';
  if (path.startsWith('home.cta.learnMoreButton')) return translations.hero?.learnMore || 'Learn More';
  if (path.startsWith('footer.links.legal')) return translations.footer?.links?.legal || 'Legal';
  if (path.startsWith('footer.links.privacyPolicy')) return translations.footer?.links?.privacyPolicy || 'Privacy Policy';
  if (path.startsWith('footer.links.terms')) return translations.footer?.links?.terms || 'Terms of Service';
  if (path.startsWith('footer.links.cookiePolicy')) return translations.footer?.links?.cookiePolicy || 'Cookie Policy';
  if (path.startsWith('footer.copyright')) return translations.footer?.copyright || 'All rights reserved';
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return defaultValue !== undefined ? defaultValue : path; // Return default or path if translation not found
    }
  }
  
  if (returnObject) {
    return result;
  }
  
  return typeof result === 'string' ? result : (defaultValue !== undefined ? defaultValue : path);
};

// Custom hook to use translations
export const useTranslations = () => {
  const pathname = usePathname();
  const [lang, setLang] = useState<string>('en');
  const [translations, setTranslations] = useState<TranslationsType>(enTranslations);
  const [dir, setDir] = useState<string>('ltr');

  // Load language preference from localStorage on client side
  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLang(savedLang);
    setTranslations(getTranslations(savedLang));
    setDir(languages[savedLang as keyof typeof languages]?.dir || 'ltr');
    
    // Set direction attribute on document
    document.documentElement.dir = languages[savedLang as keyof typeof languages]?.dir || 'ltr';
    document.documentElement.lang = savedLang;
  }, []);

  // Function to change language
  const changeLang = (newLang: string) => {
    if (newLang in languages) {
      localStorage.setItem('language', newLang);
      setLang(newLang);
      setTranslations(getTranslations(newLang));
      setDir(languages[newLang as keyof typeof languages]?.dir || 'ltr');
      
      // Update document attributes
      document.documentElement.dir = languages[newLang as keyof typeof languages]?.dir || 'ltr';
      document.documentElement.lang = newLang;
      
      // Force reload to apply translations throughout the page
      window.location.reload();
    }
  };

  // Helper function to get translations by key
  const t = (key: string, defaultValue?: string, returnObject: boolean = false): string | any => {
    return getTranslationByPath(translations, key, defaultValue, returnObject);
  };

  return {
    lang,
    translations,
    t,
    changeLang,
    dir,
    languages
  };
}; 