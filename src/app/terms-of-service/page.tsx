'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';
import LanguageSelector from '@/components/language';

export default function TermsOfService() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">{t('footer.links.terms')}</h1>
          
          {lang === 'en' ? (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">Acceptance of Terms</h2>
                <p>By accessing or using the Easy EPU platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">User Accounts</h2>
                <p>To use certain features of the platform, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>Use the platform for any illegal purpose or in violation of any laws</li>
                  <li>Share your account credentials with others</li>
                  <li>Post or transmit harmful content or malware</li>
                  <li>Attempt to gain unauthorized access to any part of the platform</li>
                  <li>Engage in any activity that disrupts the platform's functionality</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
                <p>All content on the Easy EPU platform, including text, graphics, logos, and software, is the property of Easy EPU or its content suppliers and is protected by copyright and other intellectual property laws.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Refund Policy</h2>
                <p>The following refund policy applies to all perks purchases made on the Easy EPU platform:</p>
                <ul className="list-disc list-inside ml-4 mt-2">
                  <li>All perks purchases that unlock special badges (Bronze, Gold, and Diamond) are considered Digital Content.</li>
                  <li><strong>WHERE A PRODUCT IS DIGITAL CONTENT WHICH IS IMMEDIATELY MADE AVAILABLE, BY DOWNLOADING OR OTHERWISE ACQUIRING THE PRODUCT, YOU CONSENT TO IMMEDIATE PERFORMANCE OF THIS AGREEMENT AND ACKNOWLEDGE THAT YOU WILL LOSE YOUR RIGHT OF WITHDRAWAL FROM THIS AGREEMENT ONCE THE DOWNLOAD OR APPLICABLE TRANSMISSION OF THE DIGITAL CONTENT HAS BEGUN.</strong></li>
                  <li>As per Paddle's terms (our payment processor and Merchant of Record): "Refunds are provided at the sole discretion of Paddle and on a case-by-case basis and may be refused."</li>
                  <li>Paddle will refuse a refund request if they find evidence of fraud, refund abuse, or other manipulative behavior that entitles them to counterclaim the refund.</li>
                  <li>If you have made a purchase by mistake or in the wrong tier, please contact us within 14 days of the transaction.</li>
                  <li>If a refund is approved by Paddle, it will be processed through the original payment method used.</li>
                  <li>Badge and perks benefits will be removed if a refund is processed.</li>
                  <li>For technical issues related to payments or if your badge is not showing properly, please contact us immediately with relevant details.</li>
                </ul>
                <p className="mt-2">For any questions regarding our perks or refund policy, please contact us at <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline">Telegram</a>.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
                <p>Easy EPU shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use or inability to use the platform or services.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Termination</h2>
                <p>We may terminate or suspend your account and access to the platform immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Your continued use of the platform after any changes indicates your acceptance of the modified terms.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Contact</h2>
                <p>If you have any questions about these Terms of Service, please contact us at <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline">Telegram</a>.</p>
              </section>
            </div>
          ) : (
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-4">قبوڵکردنی مەرجەکان</h2>
                <p>بە دەستگەیشتن یان بەکارهێنانی پلاتفۆرمی ئیزی ئی پی یو، تۆ ڕازی دەبیت کە پابەند بیت بەم مەرجەکانی خزمەتگوزاری و هەموو یاسا و ڕێساکانەوە.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">ئەکاونتی بەکارهێنەران</h2>
                <p>بۆ بەکارهێنانی هەندێک تایبەتمەندی پلاتفۆرمەکە، پێویستە خۆت تۆمار بکەیت بۆ ئەکاونتێک. تۆ بەرپرسیاریت لە پاراستنی نهێنی زانیاری ئەکاونتەکەت و بۆ هەموو ئەو چالاکیانەی کە لەژێر ئەکاونتەکەتدا ڕوودەدەن.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">بەکارهێنانی قبوڵکراو</h2>
                <p>تۆ ڕازی دەبیت کە نەکەیت:</p>
                <ul className="list-disc list-inside mr-4 mt-2">
                  <li>بەکارهێنانی پلاتفۆرمەکە بۆ هەر مەبەستێکی نایاسایی یان بە پێشێلکردنی هەر یاسایەک</li>
                  <li>هاوبەشکردنی ناسنامەی ئەکاونتەکەت لەگەڵ کەسانی تر</li>
                  <li>بڵاوکردنەوە یان گواستنەوەی ناوەڕۆکی زیانبەخش یان مالوێر</li>
                  <li>هەوڵدان بۆ دەستگەیشتنی بێ مۆڵەت بە هەر بەشێکی پلاتفۆرمەکە</li>
                  <li>بەشداربوون لە هەر چالاکیەک کە کارکردنی پلاتفۆرمەکە تێکبدات</li>
                </ul>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">موڵکی هزری</h2>
                <p>هەموو ناوەڕۆکەکانی پلاتفۆرمی ئیزی ئی پی یو، لەوانە دەق، گرافیک، لۆگۆکان و سۆفتوێر، موڵکی ئیزی ئی پی یو یان دابینکەرانی ناوەڕۆکەکەیەتی و بە مافی چاپ و یاساکانی تری موڵکی هزری پارێزراوە.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">سیاسەتی گەڕاندنەوەی پارە</h2>
                <p>سیاسەتی گەڕاندنەوەی پارەی خوارەوە بۆ هەموو کڕینی پەرکەکان لە پلاتفۆرمی ئیزی ئی پی یو جێبەجێ دەکرێت:</p>
                <ul className="list-disc list-inside mr-4 mt-2">
                  <li>هەموو کڕینی پەرکەکان کە نیشانەی تایبەت دەکەنەوە (برۆنز، زێڕ، و ئەڵماس) بە ناوەڕۆکی دیجیتاڵ دادەنرێن.</li>
                  <li><strong>کاتێک بەرهەمێک ناوەڕۆکی دیجیتاڵە کە دەستبەجێ بەردەست دەکرێت، بە داگرتن یان بەدەستهێنانی بەرهەمەکە بە شێوەیەکی تر، تۆ ڕەزامەندی دەردەبڕیت بۆ جێبەجێکردنی دەستبەجێی ئەم ڕێککەوتننامەیە و دان بەوەدا دەنێیت کە مافی کشانەوەت لەم ڕێککەوتننامەیە لەدەست دەدەیت کاتێک داگرتنەکە یان گواستنەوەی پەیوەندیداری ناوەڕۆکی دیجیتاڵ دەست پێ دەکات.</strong></li>
                  <li>بە پێی مەرجەکانی Paddle (پرۆسیسۆری پارەدانەکەمان و بازرگانی تۆماری): "گەڕاندنەوەی پارە بە خواستی تەنهای Paddle دەبێت و لەسەر بنەمای حاڵەت بە حاڵەت و لەوانەیە ڕەت بکرێتەوە."</li>
                  <li>Paddle داواکاریی گەڕاندنەوەی پارە ڕەت دەکاتەوە ئەگەر بەڵگەی فێڵکردن، خراپ بەکارهێنانی گەڕاندنەوەی پارە، یان ڕەفتاری دەستکاری کراوی تر بدۆزێتەوە کە بواریان دەدات بەرهەڵستی داواکاری گەڕاندنەوەی پارەکە بکەن.</li>
                  <li>ئەگەر بە هەڵە یان لە ئاستێکی هەڵەدا کڕینت کردووە، تکایە لە ماوەی ٧ ڕۆژدا پەیوەندیمان پێوە بکە.</li>
                  <li>ئەگەر گەڕاندنەوەی پارەکە لەلایەن Paddle پەسەند کرا، لەڕێگەی هەمان شێوازی پارەدانی سەرەتایی جێبەجێ دەکرێت.</li>
                  <li>سوودەکانی نیشانە و پەرکەکان لادەبرێن ئەگەر پارەکە بگەڕێنرێتەوە.</li>
                  <li>بۆ کێشە تەکنیکیەکانی پەیوەست بە پارەدان یان ئەگەر نیشانەکەت بە دروستی دەرناکەوێت، تکایە دەستبەجێ پەیوەندیمان پێوە بکە لەگەڵ وردەکاریەکانی پەیوەندیدار.</li>
                </ul>
                <p className="mt-2">بۆ هەر پرسیارێک سەبارەت بە پەرکەکان یان سیاسەتی گەڕاندنەوەی پارەکەمان، تکایە پەیوەندیمان پێوە بکە لە <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline">تێلیگرام</a>.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">سنووری بەرپرسیارێتی</h2>
                <p>ئیزی ئی پی یو بەرپرسیار نابێت بۆ هیچ زیانێکی ناڕاستەوخۆ، لاوەکی، تایبەت، یان دەرئەنجامی کە لە بەکارهێنان یان توانانەبوونی بەکارهێنانی پلاتفۆرم یان خزمەتگوزاریەکان دەبێتەوە.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">کۆتایی هێنان</h2>
                <p>ئێمە دەتوانین ئەکاونتەکەت و دەستگەیشتن بە پلاتفۆرمەکە دەستبەجێ کۆتایی پێبهێنین یان هەڵیپەسێرین، بەبێ ئاگادارکردنەوەی پێشوەخت یان بەرپرسیارێتی، بۆ هەر هۆکارێک، لەوانە ئەگەر تۆ ئەم مەرجەکانی خزمەتگوزاریە پێشێل بکەیت.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">گۆڕانکاریەکان لە مەرجەکان</h2>
                <p>ئێمە مافی گۆڕینی ئەم مەرجانەمان هەیە لە هەر کاتێکدا. بەردەوامبوونی بەکارهێنانت بۆ پلاتفۆرمەکە دوای هەر گۆڕانکارییەک نیشانەی قبوڵکردنی مەرجە گۆڕاوەکانە.</p>
              </section>
              
              <section>
                <h2 className="text-xl font-semibold mb-4">پەیوەندی</h2>
                <p>ئەگەر هەر پرسیارێکت هەیە دەربارەی ئەم مەرجەکانی خزمەتگوزاریە، تکایە پەیوەندیمان پێوە بکە لە <a href="https://t.me/RtxMumin" className="text-indigo-400 hover:underline">تێلیگرام</a>.</p>
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