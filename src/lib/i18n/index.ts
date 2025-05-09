'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import enTranslations from './en.json';
import kuTranslations from './ku.json';
import { memberManagementTranslations } from './member-management';

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
export const getTranslationByPath = (translations: TranslationsType, path: string): any => {
  const keys = path.split('.');
  let result: any = translations;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the path if translation not found
    }
  }
  
  return result; // Return any type of value (string, array, object)
};

// Custom hook to use translations
export const useTranslations = () => {
  const pathname = usePathname();
  const [lang, setLang] = useState<string>('en');
  const [translations, setTranslations] = useState<TranslationsType>(enTranslations);
  const [dir, setDir] = useState<string>('ltr');

  // Load language preference from localStorage on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('language') || 'en';
      setLang(savedLang);
      setTranslations(getTranslations(savedLang));
      setDir(languages[savedLang as keyof typeof languages]?.dir || 'ltr');
      
      // Set direction attribute on document
      document.documentElement.dir = languages[savedLang as keyof typeof languages]?.dir || 'ltr';
      document.documentElement.lang = savedLang;
    }
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
    }
  };

  // Helper function to get translations by key
  const t = (key: string, variables?: Record<string, any>): string => {
    let text = getTranslationByPath(translations, key);
    
    // Return early if text is not a string
    if (typeof text !== 'string') {
      return key;
    }
    
    // Replace variables in the text
    if (variables) {
      // Process each variable
      Object.entries(variables).forEach(([varName, value]) => {
        // Create a pattern to replace (e.g., {count} -> actual number)
        const pattern = new RegExp(`\\{${varName}\\}`, 'g');
        text = text.replace(pattern, String(value));
      });
    }
    
    return text;
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

// Merge all translations
const translations: { [key: string]: { [key: string]: string } } = {
  en: {
    ...enTranslations,
    ...memberManagementTranslations.en,
  },
  ar: {
    ...arTranslations,
    ...memberManagementTranslations.ar,
  },
  ku: {
    ...kuTranslations,
    ...memberManagementTranslations.ku,
  },
}; 