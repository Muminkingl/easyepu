import React, { useState, useEffect } from 'react';
import { updateGroupMembers, forcePageRefresh } from '@/lib/memberUpdates';
import { PlusCircle, Trash2, Save } from 'lucide-react';

interface MemberEditorProps {
  groupId: number;
  userId: string;
  initialMembers: { id?: number; name: string; email?: string | null }[];
  maxMembers: number;
  onCancel: () => void;
  onSave: () => void;
}

const MemberEditor: React.FC<MemberEditorProps> = ({
  groupId,
  userId,
  initialMembers,
  maxMembers,
  onCancel,
  onSave
}) => {
  const [members, setMembers] = useState<{ id?: number; name: string; email?: string | null }[]>(initialMembers);
  const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Add member to the list
  const addMember = () => {
    // Check if we've reached the max members limit (accounting for the creator)
    const totalMemberCount = members.length + 1; // +1 for the creator
    
    if (totalMemberCount >= maxMembers) {
      setErrorMessage(`Maximum ${maxMembers} members allowed (including you as creator)`);
      return;
    }
    
    setMembers([...members, { name: '' }]);
  };
  
  // Remove a member from the list
  const removeMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };
  
  // Handle member field changes
  const handleMemberChange = (index: number, field: 'name', value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };
  
  // Save member changes - use direct Supabase call to avoid RPC errors
  const saveMemberChanges = async () => {
    // Validate all member names
    if (members.some(m => !m.name?.trim())) {
      setErrorMessage('All member names are required');
      return;
    }
    
    setIsUpdatingMembers(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Use direct import of supabase module to avoid RPC issues
      const result = await import('@/lib/supabase').then(async (module) => {
        return await module.updatePresentationGroupMembers(
          userId,
          groupId,
          members
        );
      });
      
      if (result) {
        setSuccessMessage('Group members updated successfully');
        
        // Call onSave callback so parent can exit editing mode
        onSave();
        
        // Removed automatic page refresh to allow error messages to be visible
      } else {
        setErrorMessage('Failed to update group members');
      }
    } catch (error) {
      console.error('Error saving member changes:', error);
      setErrorMessage('An error occurred while updating group members');
    } finally {
      setIsUpdatingMembers(false);
    }
  };
  
  return (
    <div className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 p-4 mb-4">
      <h3 className="text-lg font-medium text-indigo-100 mb-3">Edit Group Members</h3>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800/30 rounded-lg text-red-100">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-800/30 rounded-lg text-green-100">
          {successMessage}
        </div>
      )}
      
      <div className="space-y-3 mb-4">
        {members.map((member, index) => (
          <div key={`member-${member.id || index}`} className="flex items-start gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={member.name}
                onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                placeholder="Member name"
                className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70 mb-2"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => removeMember(index)}
              className="mt-1 p-2 text-red-400 hover:text-red-300 transition-colors"
              aria-label="Remove member"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mb-4">
        {members.length < maxMembers - 1 && (
          <button
            type="button"
            onClick={addMember}
            className="px-3 py-2 bg-indigo-700/50 text-indigo-200 rounded-lg hover:bg-indigo-600/50 transition-colors flex items-center text-sm"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Member
          </button>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={saveMemberChanges}
          disabled={isUpdatingMembers}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
        >
          {isUpdatingMembers ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={isUpdatingMembers}
          className="px-6 py-2 bg-gray-600/60 hover:bg-gray-500/80 text-white rounded-lg disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default MemberEditor; 