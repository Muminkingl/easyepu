'use client';

import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useTranslations } from '@/lib/i18n';
import { CheckCircle, Loader2 } from 'lucide-react';

interface GroupFormProps {
  userId: string;
  initialGroup?: string;
  onUpdate: () => void;
}

export default function GroupForm({ userId, initialGroup, onUpdate }: GroupFormProps) {
  const [group, setGroup] = useState<string>(initialGroup || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { updateUserGroup } = useUserData();
  const { t, dir } = useTranslations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setError('');

    try {
      const updateSuccess = await updateUserGroup(group);
      
      if (!updateSuccess) {
        throw new Error('Failed to update group class');
      }

      setSuccess(true);
      onUpdate();

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating group:', err);
      setError('Failed to update group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRtl = dir === 'rtl';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <p className={`text-indigo-300 mb-2 ${isRtl ? 'text-right' : ''}`}>
          {t('profile.groupInfo.description')}
        </p>
        <div className="space-y-2">
          {['A1', 'A2'].map((groupOption) => (
            <label 
              key={groupOption}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border 
                ${isRtl ? 'flex-row-reverse' : ''}
                ${group === groupOption 
                  ? 'bg-indigo-700/50 border-indigo-500/60 text-white' 
                  : 'bg-indigo-800/20 border-indigo-700/30 text-indigo-200 hover:bg-indigo-800/30'}`}
            >
              <input
                type="radio"
                name="group"
                value={groupOption}
                checked={group === groupOption}
                onChange={() => setGroup(groupOption)}
                className="sr-only"
              />
              <span className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center
                ${isRtl ? 'ml-3' : 'mr-3'}
                ${group === groupOption 
                  ? 'border-indigo-400 bg-indigo-500' 
                  : 'border-indigo-600'}`}
              >
                {group === groupOption && <span className="w-2 h-2 rounded-full bg-white"></span>}
              </span>
              <span>{groupOption}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className={`bg-rose-900/30 text-rose-300 p-3 rounded-lg border border-rose-700/40 text-sm ${isRtl ? 'text-right' : ''}`}>
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
          <button
            type="submit"
            disabled={isSubmitting || !group}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200
              ${!group || isSubmitting 
                ? 'bg-indigo-800/40 text-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <Loader2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'} animate-spin`} />
                {t('poll.submitting')}
              </span>
            ) : (
              t('poll.confirm')
            )}
          </button>
        </div>

        {success && (
          <span className={`flex items-center text-green-400 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
            <CheckCircle className={`w-4 h-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
            {t('profile.contactInfo.updatedSuccessfully')}
          </span>
        )}
      </div>
    </form>
  );
}