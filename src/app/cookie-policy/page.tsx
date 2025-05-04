'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import LanguageSelector from '@/components/language';

export default function CookiePolicy() {
  const { t, dir, lang } = useTranslations();

  return (
    <div className={`min-h-screen bg-gradient-to-b from-black via-indigo-950 to-black text-white ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="w-full bg-black shadow-md shadow-indigo-500/10 fixed top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-indigo-400" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{t('header.title')}</span>
          </Link>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 pt-24">
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-md rounded-xl p-8 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t('cookiePolicy.title')}</h1>
          <p className="mb-8 text-center text-gray-400">{t('cookiePolicy.lastUpdated')}: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.introduction.title')}</h2>
              <p>{t('cookiePolicy.introduction.content')}</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.whatAreCookies.title')}</h2>
              <p className="mb-4">{t('cookiePolicy.whatAreCookies.content1')}</p>
              <p>{t('cookiePolicy.whatAreCookies.content2')}</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.whyUseCookies.title')}</h2>
              <p className="mb-4">{t('cookiePolicy.whyUseCookies.intro')}</p>
              <ul className="space-y-2 ml-4 list-disc list-inside">
                <li>{t('cookiePolicy.whyUseCookies.types.essential')}</li>
                <li>{t('cookiePolicy.whyUseCookies.types.performance')}</li>
                <li>{t('cookiePolicy.whyUseCookies.types.functional')}</li>
                <li>{t('cookiePolicy.whyUseCookies.types.analytics')}</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.cookiesWeUse.title')}</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{t('cookiePolicy.cookiesWeUse.essential.title')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white/5 rounded-lg">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.name')}</th>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.purpose')}</th>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.duration')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.essential.authSession.name')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.essential.authSession.purpose')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.essential.authSession.duration')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{t('cookiePolicy.cookiesWeUse.performance.title')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white/5 rounded-lg">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.name')}</th>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.purpose')}</th>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.duration')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.performance.ga.name')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.performance.ga.purpose')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.performance.ga.duration')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.performance.gid.name')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.performance.gid.purpose')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.performance.gid.duration')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{t('cookiePolicy.cookiesWeUse.functional.title')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white/5 rounded-lg">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.name')}</th>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.purpose')}</th>
                        <th className="px-4 py-2 text-left">{t('cookiePolicy.cookiesWeUse.essential.duration')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.functional.userPreferences.name')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.functional.userPreferences.purpose')}</td>
                        <td className="px-4 py-2 border-t border-white/10">{t('cookiePolicy.cookiesWeUse.functional.userPreferences.duration')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.control.title')}</h2>
              <p className="mb-4">{t('cookiePolicy.control.content1')}</p>
              <p>{t('cookiePolicy.control.content2')}</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.changes.title')}</h2>
              <p>{t('cookiePolicy.changes.content')}</p>
            </section>
            
            <section>
              <h2 className="text-xl font-semibold mb-4">{t('cookiePolicy.contact.title')}</h2>
              <p className="mb-4">{t('cookiePolicy.contact.content')}</p>
              <ul className="space-y-2">
                <li>
                  <strong>{t('cookiePolicy.contact.telegram')}:</strong> 
                  <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline ml-2">@RtxMumin</a>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-white/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} {t('header.title')}. {t('footer.copyright')}
          </p>
          <div className="mt-4">
            <Link href="/" className="text-gray-400 hover:text-indigo-400 transition-colors">
              {t('common.backToHome')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 