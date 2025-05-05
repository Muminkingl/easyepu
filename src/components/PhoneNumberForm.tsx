'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { updateUserPhoneNumber as updateUserPhoneNumberAction } from '@/lib/actions';
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
  const { userData, updateUserPhoneNumber: updateUserPhoneNumberHook } = useUserData();
  const { t, dir } = useTranslations();
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || userData?.phone_number || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [normalizedPreview, setNormalizedPreview] = useState('');

  // Update phoneNumber when userData changes
  useEffect(() => {
    if (userData?.phone_number) {
      setPhoneNumber(userData.phone_number);
    }
  }, [userData]);

  // Validate phone number on input change
  useEffect(() => {
    if (!phoneNumber) {
      setValidationError('');
      setNormalizedPreview('');
      return;
    }
    
    // More thorough sanitization - keep only digits
    const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if the number starts with 07 (after sanitization)
    if (!sanitizedPhoneNumber.startsWith('07')) {
      setValidationError(t('profile.contactInfo.phoneNumberError') || 
        'Phone number must be in the format 07XXXXXXXXX (11 digits starting with 07)');
      setNormalizedPreview('');
      return;
    }
    
    // If we get here, the number starts with 07, now check the length
    if (sanitizedPhoneNumber.length < 11) {
      setValidationError(t('profile.contactInfo.phoneNumberTooShort') || 
        'Phone number is too short');
      setNormalizedPreview('');
    } else if (sanitizedPhoneNumber.length > 11) {
      setValidationError(t('profile.contactInfo.phoneNumberTooLong') || 
        'Phone number is too long');
      setNormalizedPreview('');
    } else {
      // Number is valid: starts with 07 and is 11 digits
      setValidationError('');
      setNormalizedPreview(sanitizedPhoneNumber);
    }
  }, [phoneNumber, t]);

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

  // Handle phone number input with formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Keep all characters for now (preserve exactly what user typed)
    setPhoneNumber(inputValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    setShowSuccessIcon(false);

    try {
      if (!user && !userId) {
        setError(t('profile.contactInfo.notAuthenticated') || 'User not authenticated');
        return;
      }
      
      const effectiveUserId = userId || user?.id || '';
      
      // Use the direct value from the input field instead of the state
      let phoneNumberToUse = (document.getElementById('phoneNumber') as HTMLInputElement)?.value || phoneNumber;
      
      // More thorough sanitization - keep only digits
      const sanitizedPhoneNumber = phoneNumberToUse.replace(/\D/g, '');
      
      // Check if the number starts with 07
      if (!sanitizedPhoneNumber.startsWith('07')) {
        setError(t('profile.contactInfo.phoneNumberError') || 
          'Phone number must be in the format 07XXXXXXXXX (11 digits starting with 07)');
        setLoading(false);
        return;
      }
      
      // Validate the length
      if (sanitizedPhoneNumber.length !== 11) {
        if (sanitizedPhoneNumber.length < 11) {
          setError(t('profile.contactInfo.phoneNumberTooShort') || 'Phone number is too short');
        } else {
          setError(t('profile.contactInfo.phoneNumberTooLong') || 'Phone number is too long');
        }
        setLoading(false);
        return;
      }
      
      // Use ONLY the server action first, and wait for its result
      const actionResult = await updateUserPhoneNumberAction(effectiveUserId, sanitizedPhoneNumber);
      
      // Check if server action was successful
      if (!actionResult) {
        setError(t('profile.contactInfo.updateFailed') || 'Failed to update phone number on the server');
        return;
      }
      
      // Only after server action succeeds, update local state if needed
      if (typeof updateUserPhoneNumberHook === 'function') {
        // No need to await this since it's only updating local state
        updateUserPhoneNumberHook(sanitizedPhoneNumber);
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

      // Update normalized preview
      setNormalizedPreview(sanitizedPhoneNumber);
    } catch (err) {
      console.error('Error updating phone number:', err);
      setError(err instanceof Error ? err.message : t('profile.contactInfo.genericError') || 'Failed to update phone number');
      setSuccess(false);
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
              onChange={handlePhoneNumberChange}
              className={`w-full px-3 py-2 border ${validationError ? 'border-red-500 focus:ring-red-500' : 'border-indigo-700/50 focus:ring-indigo-500'} bg-indigo-900/30 text-white rounded-md focus:outline-none focus:ring-2 transition-all duration-200 placeholder-indigo-400/70 ${dir === 'rtl' ? 'text-right' : ''}`}
              required
              disabled={loading}
            />
            {showSuccessIcon && !validationError && (
              <div className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}>
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
            )}
            {validationError && (
              <div className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2`}>
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
            )}
          </div>
          {validationError ? (
            <p className={`mt-1 text-sm text-red-400 ${dir === 'rtl' ? 'text-right' : ''}`}>
              {validationError}
            </p>
          ) : (
            <div>
              <p className={`mt-1 text-sm text-indigo-400 ${dir === 'rtl' ? 'text-right' : ''}`}>
                {t('profile.contactInfo.phoneNumberFormat')}
              </p>
           
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading || !!validationError}
          className={`w-full flex items-center justify-center py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 ${
            success 
              ? 'bg-green-700 hover:bg-green-600 focus:ring-green-500 text-white' 
              : validationError
                ? 'bg-indigo-700/50 cursor-not-allowed text-white/70'
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