'use client';

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Book, GraduationCap, Bell, CheckCircle, Trophy, Briefcase, Shield, ClipboardList, Smile, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/components/language';
import { useTranslations } from '@/lib/i18n';
import Image from 'next/image';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const { t, dir, lang } = useTranslations();

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add effect to monitor language changes
  useEffect(() => {
    // This will run when language changes
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <main className={`min-h-screen overflow-x-hidden bg-gradient-to-b from-black via-indigo-950 to-black text-white ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* Hero section particles */}
      <div className="fixed inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div 
            key={i}
            className="absolute rounded-full bg-white opacity-10"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              boxShadow: '0 0 20px 2px rgba(255, 255, 255, 0.3)',
              animation: `float ${Math.random() * 10 + 20}s linear infinite`,
              animationDelay: `${Math.random() * 20}s`,
            }}
          ></div>
        ))}
      </div>
      
      {/* Animated background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full transform -translate-y-1/2 translate-x-1/4">
          <div className="absolute w-96 h-96 bg-purple-700 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        </div>
        <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2">
          <div className="absolute w-96 h-96 bg-indigo-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        <div className="absolute bottom-0 left-1/3 transform translate-y-1/2">
          <div className="absolute w-96 h-96 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 opacity-10 pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='0.4' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full backdrop-blur-lg z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-black/50 shadow-md shadow-indigo-500/10' : 'bg-transparent'}`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-indigo-400" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">EASY EPU</span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{t('home.features')}</a>
            <a href="#faq" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{t('home.faq')}</a>
          </div>
          <div className="flex items-center space-x-4">
            {mounted && <LanguageSelector />}
            {isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="text-sm bg-indigo-600/30 hover:bg-indigo-600/50 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 border border-indigo-500/30 hover:border-indigo-500/60"
                >
                  {t('common.dashboard')}
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm bg-indigo-600/30 hover:bg-indigo-600/50 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 border border-indigo-500/30 hover:border-indigo-500/60">
                  {t('common.login')}
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative z-10 text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">{t('home.hero.title1')}</span>
                <span className="inline-block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">{t('home.hero.title2')}</span>
              </h1>
              
              <p className="text-xl md:text-2xl font-light text-indigo-200 max-w-3xl mx-auto mb-12 leading-relaxed">
                {t('home.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                {isSignedIn ? (
                  <button 
                    onClick={goToDashboard}
                    className="group w-full sm:w-auto relative overflow-hidden px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center text-lg font-bold">
                      {t('home.hero.dashboardButton')}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="group w-full sm:w-auto relative overflow-hidden px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
                      <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative flex items-center justify-center text-lg font-bold">
                        {t('home.hero.startButton')}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
            
            {/* Hero image/mockup */}
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl transform scale-105"></div>
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10 backdrop-blur-sm">
                <div className="w-full bg-gradient-to-br from-gray-900 to-indigo-900 flex items-center justify-center">
                  <img 
                    src="https://i.imgur.com/1zzZC9f.png" 
                    alt="EASY EPU Dashboard" 
                    className="w-full h-auto"
                    style={{ display: 'block' }}
                  />
                </div>
              </div>
              
              {/* Tech circles */}
              <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold">JS</span>
              </div>
              <div className="absolute -bottom-10 left-14 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold">H</span>
              </div>
              <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold">R</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating badges */}
        <div className="absolute top-1/3 -left-16 transform -translate-y-1/2 rotate-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <p className="text-xs font-medium text-white">Instant Updates</p>
          </div>
        </div>
        <div className="absolute top-2/3 -right-20 transform -translate-y-1/2 -rotate-12">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10">
            <p className="text-xs font-medium text-white">User Friendly</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">98%</p>
              <p className="text-gray-400 mt-2">{t('stats.satisfactionRate')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">30+</p>
              <p className="text-gray-400 mt-2">{t('stats.activeStudents')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">3+</p>
              <p className="text-gray-400 mt-2">{t('stats.coursesManaged')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">24/7</p>
              <p className="text-gray-400 mt-2">{t('stats.supportAccess')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('features.sectionTitle')}</h2>
            <p className="text-xl text-indigo-300 max-w-2xl mx-auto">{t('features.sectionDescription')}</p>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Bell className="h-6 w-6" />,
                titleKey: "features.items.announcements.title",
                descriptionKey: "features.items.announcements.description"
              },
              {
                icon: <Book className="h-6 w-6" />,
                titleKey: "features.items.courseMaterials.title",
                descriptionKey: "features.items.courseMaterials.description"
              },
              {
                icon: <Shield className="h-6 w-6" />,
                titleKey: "features.items.security.title",
                descriptionKey: "features.items.security.description"
              },
              {
                icon: <ClipboardList className="h-6 w-6" />,
                titleKey: "features.items.activityLogs.title",
                descriptionKey: "features.items.activityLogs.description"
              },
              {
                icon: <Smile className="h-6 w-6" />,
                titleKey: "features.items.userFriendly.title",
                descriptionKey: "features.items.userFriendly.description"
              },
              {
                icon: <Cpu className="h-6 w-6" />,
                titleKey: "features.items.aiOrganization.title",
                descriptionKey: "features.items.aiOrganization.description"
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 group"
              >
                <div className="bg-indigo-600/20 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600/30 transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{t(feature.titleKey)}</h3>
                <p className="text-gray-400">{t(feature.descriptionKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('faq.sectionTitle')}</h2>
            <p className="text-xl text-indigo-300 max-w-2xl mx-auto">{t('faq.sectionDescription')}</p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Map through FAQ items */}
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-bold mb-3">{t(`faq.items.${index}.question`)}</h3>
                <p className="text-gray-400">{t(`faq.items.${index}.answer`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-3xl p-12 border border-indigo-500/30 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('cta.title')}</h2>
              <p className="text-xl text-indigo-200 mb-8">{t('cta.description')}</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                {isSignedIn ? (
                  <button 
                    onClick={goToDashboard}
                    className="group w-full sm:w-auto relative overflow-hidden px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="relative flex items-center justify-center text-lg font-bold">
                      {t('hero.goToDashboard')}
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="group w-full sm:w-auto relative overflow-hidden px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105">
                      <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                      <span className="relative flex items-center justify-center text-lg font-bold">
                        {t('cta.signUp')}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 md:py-16 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-8 w-8 text-indigo-400" />
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{t('header.title')}</span>
              </div>
              <p className="text-gray-400 mb-6">{t('footer.description')}</p>
              <div className="flex space-x-4">
                <a href="https://t.me/RtxMumin" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-indigo-600/50 transition-colors">
                  <span className="sr-only">Telegram</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.357 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">{t('footer.links.legal')}</h3>
              <ul className="space-y-3">
                <li><Link href="/privacy-policy" className="text-gray-400 hover:text-indigo-400 transition-colors">{t('footer.links.privacyPolicy')}</Link></li>
                <li><Link href="/terms-of-service" className="text-gray-400 hover:text-indigo-400 transition-colors">{t('footer.links.terms')}</Link></li>
                <li><Link href="/cookie-policy" className="text-gray-400 hover:text-indigo-400 transition-colors">{t('footer.links.cookiePolicy')}</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} {t('header.title')}. {t('footer.copyright')} <a href="https://t.me/RtxMumin" target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-400">RtxMumin</a>
            </p>
        </div>
      </div>
      </footer>
      
      {/* Add custom styling */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1); }
          66% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
} 