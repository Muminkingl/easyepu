'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/i18n';
import Link from 'next/link';
import { ShieldCheckIcon, LockClosedIcon, HeartIcon, TrophyIcon } from '@heroicons/react/24/outline';

export default function PerksPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const { t } = useTranslations();
  const [selectedTier, setSelectedTier] = useState<'small' | 'medium' | 'large' | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paddleLoaded, setPaddleLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);
  
  // Define perks tiers with their amounts, badges, and Paddle price IDs
  const perksTiers = {
    small: {
      title: t('supportUs.supportOptions.small.title'),
      amount: t('supportUs.supportOptions.small.amount'),
      description: t('supportUs.supportOptions.small.description'),
      badge: "Bronze",
      paddlePriceId: 'pri_01jzntv9f0nzhep61rtyp6twbv', // New Basic Support
      paddleProductId: 'pro_01jznttvzjzd8016xfjpcwb1nw'
    },
    medium: {
      title: t('supportUs.supportOptions.medium.title'),
      amount: t('supportUs.supportOptions.medium.amount'),
      description: t('supportUs.supportOptions.medium.description'),
      badge: "Gold",
      paddlePriceId: 'pri_01jznb6ttvbb0qpzam4af9ea79', // Standard Support
      paddleProductId: 'pro_01jznb6787tp3923bq6v57xg6f'
    },
    large: {
      title: t('supportUs.supportOptions.large.title'),
      amount: t('supportUs.supportOptions.large.amount'),
      description: t('supportUs.supportOptions.large.description'),
      badge: "Diamond",
      paddlePriceId: 'pri_01jzndryfds2spn3bej1fverrw', // Premium Support
      paddleProductId: 'pro_01jznb76sms82992nyyw6w1y75'
    }
  };

  const handlePerkClick = (tier: 'small' | 'medium' | 'large') => {
    setSelectedTier(tier);
    setShowConfirm(true);
  };

  // Load Paddle.js script - simplified since we're not using the iframe checkout
  const loadPaddleScript = () => {
    return new Promise((resolve) => {
      // We don't actually need to load the script for redirect checkout
      // but keeping this to maintain the flow and in case we need it later
      setPaddleLoaded(true);
      resolve(true);
    });
  };

  // Load Paddle script on component mount
  useEffect(() => {
    setMounted(true);
    
    loadPaddleScript()
      .then(() => {
        setPaddleLoaded(true);
        console.log('Paddle loaded successfully');
      })
      .catch((error) => {
        console.error('Error loading Paddle:', error);
        // Fallback to direct URL method if Paddle.js fails
        setPaddleLoaded(true);
      });
  }, []);

  // Get the base URL safely
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // Fallback for server-side rendering
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
    }
    
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  };

  // Handle the confirm action with Paddle.js (recommended) or direct URL fallback
  const handleConfirm = () => {
    if (!selectedTier || !mounted) return;
    
    setIsLoading(true);
    
    try {
      const priceId = perksTiers[selectedTier].paddlePriceId;
      const productId = perksTiers[selectedTier].paddleProductId;
      const customerEmail = user?.primaryEmailAddress?.emailAddress || '';
      const baseUrl = getBaseUrl();

      // Use direct URL method (more reliable than iframe)
      console.log('Using direct URL checkout');
      
      const customData = encodeURIComponent(JSON.stringify({
        userId: user?.id,
        tierSelected: selectedTier
      }));
      
      // Using the exact format from Paddle documentation
      // https://developer.paddle.com/
      const domain = process.env.NODE_ENV === 'development' ? 'sandbox-checkout.paddle.com' : 'checkout.paddle.com';
      
      // Try alternative URL format based on Paddle Classic format
      // This might be more compatible with sandbox environment
      const checkoutUrl = `https://${domain}/checkout/${priceId}`;
      
      console.log("Redirecting to Paddle checkout:", checkoutUrl);
      
      // Redirect to the checkout URL
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Error processing checkout:', error);
      setIsLoading(false);
      setShowConfirm(false);
      
      // Show error message to user
      alert('There was an error processing your payment. Please try again.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <TrophyIcon className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('supportUs.title')}</h1>
        <p className="text-xl text-gray-600">{t('supportUs.subtitle')}</p>
        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">{t('supportUs.description')}</p>
      </div>

      {/* Privacy Information */}
      <div className="bg-indigo-50 rounded-lg p-6 mb-12 border border-indigo-100 flex items-start">
        <div className="mr-4 mt-1">
          <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-indigo-900">{t('supportUs.privacyTitle')}</h3>
          <p className="text-indigo-700 text-sm mt-1">{t('supportUs.privacyDescription')}</p>
        </div>
      </div>

      {/* Perks Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {(['small', 'medium', 'large'] as const).map((tier) => (
          <div 
            key={tier}
            className={`border rounded-lg p-6 transition-all hover:shadow-md cursor-pointer ${
              selectedTier === tier ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500 ring-opacity-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedTier(tier)}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-lg">{perksTiers[tier].title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                tier === 'small' ? 'bg-amber-100 text-amber-800' : 
                tier === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {perksTiers[tier].badge} Badge
              </span>
            </div>
            <p className="text-2xl font-bold text-indigo-600 mb-3">{perksTiers[tier].amount}</p>
            <p className="text-gray-600 mb-4">{perksTiers[tier].description}</p>
            
            {/* Badge Preview */}
            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
              <div className={`w-5 h-5 rounded-full mr-2 ${
                tier === 'small' ? 'bg-amber-600' : 
                tier === 'medium' ? 'bg-yellow-500' : 
                'bg-blue-500'
              }`}></div>
              <span className="text-sm text-gray-600">
                Username <span className="font-medium">({perksTiers[tier].badge})</span>
              </span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePerkClick(tier);
              }}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
              disabled={!paddleLoaded}
            >
              {!paddleLoaded ? t('common.loading') : t('supportUs.supportButton')}
            </button>
          </div>
        ))}
      </div>

      {/* Payment Processors Logo */}
      <div className="flex flex-col items-center gap-6 opacity-70">
        <div className="text-sm text-center text-gray-500">
          <LockClosedIcon className="h-5 w-5 mx-auto mb-1" />
          <p>Secured by Paddle</p>
        </div>
        
        {/* Development-only message - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 mt-3 border-t pt-3">
            <p>Testing in development mode: Use card number <code>4242 4242 4242 4242</code>, any future expiry date, and any CVC.</p>
            <a 
              href="https://developer.paddle.com/getting-started/sandbox#test-cards"
              target="_blank"
              rel="noopener noreferrer" 
              className="text-indigo-500 hover:underline"
            >
              View Paddle test cards documentation
            </a>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-3">{t('supportUs.confirmTitle')}</h3>
            <p className="mb-2">You're about to unlock the {perksTiers[selectedTier].badge} Badge for {perksTiers[selectedTier].amount}</p>
            <p className="text-sm text-gray-600 mb-4">{t('supportUs.redirectNotice')}</p>
            
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md mb-4 text-blue-700">
              <LockClosedIcon className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{t('supportUs.securePayment')}</p>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleConfirm}
                className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                disabled={isLoading || !paddleLoaded}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                    <span>{t('common.processing')}</span>
                  </>
                ) : (
                  <span>{t('common.continue')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// We don't need the full Paddle interface anymore, just a placeholder in case we need it in future
declare global {
  interface Window {
    Paddle?: any;
  }
}