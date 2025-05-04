'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { updateUserPhoneNumber } from '@/lib/actions';
import { useUserData } from '@/hooks/useUserData';
import { useTranslations } from '@/lib/i18n';
import { AlertCircle, CheckCircle, Shield, X, Phone, Loader2 } from 'lucide-react';

interface PhoneNumberFormProps {
  userId?: string;
  initialPhoneNumber?: string;
  onUpdate?: () => void;
  onSuccess?: () => void;
}

export default function PhoneNumberForm({ userId, initialPhoneNumber, onUpdate, onSuccess }: PhoneNumberFormProps) {
  const { user } = useUser();
  const { userData, updatePhoneNumber } = useUserData();
  const { t, dir } = useTranslations();
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || userData?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);

  // Update phoneNumber when userData changes
  useEffect(() => {
    if (userData?.phone_number) {
      setPhoneNumber(userData.phone_number);
    }
  }, [userData]);

  // Reset success message after 5 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (success) {
      timer = setTimeout(() => {
        setSuccess(false);
      }, 5000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setShowSuccessIcon(false);

    try {
      if (!user && !userId) throw new Error('User not authenticated');
      const effectiveUserId = userId || user?.id || '';
      
      // Validate the phone number format
      const phoneRegex = /^07\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Phone number must be in the format 07XXXXXXXXX (11 digits starting with 07)');
      }
      
      // First update in the database via server action
      await updateUserPhoneNumber(effectiveUserId, phoneNumber);
      
      // Then update the local state via the hook
      const success = await updatePhoneNumber(phoneNumber);
      if (!success) {
        throw new Error('Failed to update local state');
      }
      
      setSuccess(true);
      setShowSuccessIcon(true);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Call the onUpdate callback if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error updating phone number:', err);
      setError(err instanceof Error ? err.message : 'Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => {
    setError('');
  };

  return (
    <div className="bg-indigo-900/20 backdrop-blur-sm rounded-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-lg border border-indigo-800/30">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Phone className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'} text-indigo-400`} />
        {t('profile.contactInfo.updatePhoneNumber')}
      </h2>
      
      <div className="bg-red-900/30 backdrop-blur-sm border-l-4 border-red-500 text-red-300 p-4 mb-4 rounded-md shadow-sm">
        <div className="flex items-start">
          <Shield className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'} mt-0.5 text-red-400`} />
          <p className={`font-bold ${dir === 'rtl' ? 'text-right' : ''}`}>{t('profile.contactInfo.adminWarning')}</p>
        </div>
      </div>
      
      {success && (
        <div className="mb-4 p-3 bg-green-800/30 backdrop-blur-sm text-green-300 rounded-md flex items-center border border-green-700/30">
          <CheckCircle className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'} text-green-400`} />
          <span>{t('profile.contactInfo.success')}</span>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 backdrop-blur-sm text-red-300 rounded-md flex items-center justify-between border border-red-700/30">
          <div className="flex items-center">
            <AlertCircle className={`h-5 w-5 ${dir === 'rtl' ? 'ml-3' : 'mr-2'} text-red-400`} />
            <span>{error}</span>
          </div>
          <button 
            onClick={closeError}
            className="text-red-400 hover:text-red-300 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className={`block text-sm font-medium text-indigo-300 mb-1 ${dir === 'rtl' ? 'text-right' : ''}`}>
            {t('profile.contactInfo.phoneNumber')}
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phoneNumber"
              placeholder="07XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className={`w-full px-3 py-2 border border-indigo-700/50 bg-indigo-900/30 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 placeholder-indigo-400/70 ${dir === 'rtl' ? 'text-right' : ''}`}
              required
              disabled={loading}
            />
            {showSuccessIcon && (
              <div className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            )}
          </div>
          <p className={`mt-1 text-sm text-indigo-400 ${dir === 'rtl' ? 'text-right' : ''}`}>
            {t('profile.contactInfo.phoneNumberFormat')}
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
            success 
              ? 'bg-green-700 hover:bg-green-600 focus:ring-green-500 text-white' 
              : 'bg-indigo-700 hover:bg-indigo-600 focus:ring-indigo-500 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              {t('profile.contactInfo.updating')}
            </>
          ) : success ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              {t('profile.contactInfo.updatedSuccessfully')}
            </>
          ) : (
            t('profile.contactInfo.updatePhoneNumber')
          )}
        </button>
      </form>
      
      <div className={`mt-4 bg-indigo-800/30 backdrop-blur-sm p-3 rounded-md border border-indigo-700/30 ${dir === 'rtl' ? 'text-right' : ''}`}>
        <p className="text-sm text-indigo-300">
          {t('profile.contactInfo.adminNote')}
        </p>
      </div>
    </div>
  );
}