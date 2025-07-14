'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import LanguageSelector from '@/components/language';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t('footer.links.privacyPolicy')}</h1>
          
          {lang === 'en' ? (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Introduction</h2>
                <p>At Easy EPU, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our platform.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Information We Collect</h2>
                <p>We collect information that you provide directly to us, such as when you create an account, including:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Name and contact information</li>
                  <li>Academic details (course enrollment, grades, etc.)</li>
                  <li>Log data and usage information</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Personalize your experience</li>
                  <li>Send notifications about important updates</li>
                  <li>Monitor and analyze trends and usage</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Data Security</h2>
                <p>We implement appropriate security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Your Rights</h2>
                <p>You have the right to access, update, or delete your personal information at any time. You can do this through your account settings or by contacting us directly.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Changes to This Policy</h2>
                <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us at <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline">Telegram</a>.</p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">پێشەکی</h2>
                <p>لە ئیزی ئی یو، ئێمە پابەندین بە پاراستنی نهێنی زانیاریەکانت. ئەم سیاسەتی تایبەتمەندیە ڕوونی دەکاتەوە کە چۆن زانیاریەکانت کۆدەکەینەوە، بەکاریان دەهێنین و دەیانپارێزین کاتێک پلاتفۆرمەکەمان بەکاردەهێنیت.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">ئەو زانیاریانەی کۆیان دەکەینەوە</h2>
                <p>ئێمە ئەو زانیاریانە کۆدەکەینەوە کە ڕاستەوخۆ بۆمان دابین دەکەیت، وەک کاتێک ئەکاونتێک دروست دەکەیت، لەوانە:</p>
                <ul className="list-disc list-inside mr-4 mt-2">
                  <li>ناو و زانیاری پەیوەندی</li>
                  <li>وردەکاریە ئەکادیمیەکان (تۆمارکردن لە کۆرسەکان، نمرەکان، هتد)</li>
                  <li>داتای لۆگ و زانیاری بەکارهێنان</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">چۆن زانیاریەکانت بەکاردەهێنین</h2>
                <p>ئێمە ئەو زانیاریانەی کۆیان دەکەینەوە بەکاردەهێنین بۆ:</p>
                <ul className="list-disc list-inside mr-4 mt-2">
                  <li>دابینکردن، پاراستن و باشترکردنی خزمەتگوزاریەکانمان</li>
                  <li>تایبەتمەندکردنی ئەزموونت</li>
                  <li>ناردنی ئاگادارکردنەوە دەربارەی نوێکردنەوە گرنگەکان</li>
                  <li>چاودێریکردن و شیکردنەوەی ڕەوتەکان و بەکارهێنان</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">ئاسایشی داتا</h2>
                <p>ئێمە ڕێوشوێنی ئاسایشی گونجاو جێبەجێ دەکەین بۆ پاراستن لە دژی دەستگەیشتنی نەخوازراو، گۆڕانکاری، ئاشکراکردن، یان لەناوبردنی زانیاریە کەسیەکانت.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">مافەکانت</h2>
                <p>تۆ مافی دەستگەیشتن، نوێکردنەوە، یان سڕینەوەی زانیاریە کەسیەکانت هەیە لە هەر کاتێکدا. دەتوانیت ئەمە لە ڕێگەی ڕێکخستنەکانی ئەکاونتەکەتەوە یان بە پەیوەندیکردن بە ئێمەوە ڕاستەوخۆ ئەنجام بدەیت.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">گۆڕانکاریەکان لەم سیاسەتە</h2>
                <p>لەوانەیە سیاسەتی تایبەتمەندیمان لە کاتدا نوێ بکەینەوە. ئێمە لە هەر گۆڕانکارییەک ئاگادارت دەکەینەوە بە بڵاوکردنەوەی سیاسەتی تایبەتمەندی نوێ لەسەر ئەم لاپەڕەیە.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">پەیوەندیمان پێوە بکە</h2>
                <p>ئەگەر هەر پرسیارێکت هەیە دەربارەی ئەم سیاسەتی تایبەتمەندیە، تکایە پەیوەندیمان پێوە بکە لە <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline">تێلیگرام</a>.</p>
              </section>
            </div>
          )}
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