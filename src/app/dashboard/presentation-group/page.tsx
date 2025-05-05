'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserData } from '@/hooks/useUserData';
import { motion } from 'framer-motion';
import { 
  getPresentationSectionsAction, 
  createPresentationGroupAction,
  getPresentationGroupsBySectionAction,
  getPresentationGroupMembersAction,
  getUserPresentationGroupAction,
  updatePresentationGroupAction,
  updatePresentationGroupMembersAction
} from '@/lib/actions';
import type { 
  PresentationSection, 
  PresentationGroup,
  PresentationGroupMember
} from '@/lib/supabase';
import { 
  Users2 as UserGroup, 
  PlusCircle, 
  Trash2, 
  Users, 
  ChevronDown, 
  ChevronUp,
  RefreshCw,
  BarChart4,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';

export default function PresentationGroupPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userData, isLoading: userDataLoading } = useUserData();
  const { t } = useTranslations();
  const [mounted, setMounted] = useState(false);
  const [sections, setSections] = useState<PresentationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<PresentationSection | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [notes, setNotes] = useState('');
  const [members, setMembers] = useState<{ name: string }[]>([{ name: '' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [myGroups, setMyGroups] = useState<Map<number, number>>(new Map()); // sectionId -> groupId
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<Map<number, PresentationGroupMember[]>>(new Map());
  const [groups, setGroups] = useState<Map<number, PresentationGroup[]>>(new Map()); // sectionId -> groups
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupNotes, setEditGroupNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingMembers, setEditingMembers] = useState(false);
  const [membersList, setMembersList] = useState<{ id?: number; name: string }[]>([]);
  const [isUpdatingMembers, setIsUpdatingMembers] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      loadSections();
    }
  }, [isLoaded, isSignedIn, user]);

  const loadSections = async () => {
    try {
      setRefreshing(true);
      const data = await getPresentationSectionsAction(true);
      setSections(data);
      
      // Load user's groups for each section
      if (user?.id) {
        const userGroupsMap = new Map<number, number>();
        
        for (const section of data) {
          const groupId = await getUserPresentationGroupAction(user.id, section.id);
          if (groupId) {
            userGroupsMap.set(section.id, groupId);
          }
        }
        
        setMyGroups(userGroupsMap);

        // Load groups for each section
        const groupsMap = new Map<number, PresentationGroup[]>();
        for (const section of data) {
          const sectionGroups = await getPresentationGroupsBySectionAction(section.id);
          groupsMap.set(section.id, sectionGroups);
        }
        setGroups(groupsMap);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading presentation sections:', error);
      setErrorMessage('Failed to load presentation sections');
    } finally {
      setRefreshing(false);
    }
  };

  const loadGroupMembers = async (groupId: number) => {
    try {
      const members = await getPresentationGroupMembersAction(groupId);
      setGroupMembers(prev => new Map(prev).set(groupId, members));
    } catch (error) {
      console.error('Error loading group members:', error);
    }
  };

  const handleSectionSelect = (section: PresentationSection) => {
    setSelectedSection(section);
    setShowJoinForm(false);
    setGroupName('');
    setNotes('');
    setMembers([{ name: '' }]);
    setSuccessMessage('');
    setErrorMessage('');
    
    // If user has a group in this section, load its members
    const groupId = myGroups.get(section.id);
    if (groupId && !groupMembers.has(groupId)) {
      loadGroupMembers(groupId);
    }
  };

  const handleToggleJoinForm = () => {
    setShowJoinForm(prev => !prev);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleAddMember = () => {
    if (!selectedSection) return;
    
    // Check if we've reached the max members limit
    if (members.length >= selectedSection.max_members - 1) { // -1 for the creator
      setErrorMessage(`Maximum ${selectedSection.max_members} members allowed (including you)`);
      return;
    }
    
    setMembers([...members, { name: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: 'name', value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !user?.id) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Check if user has set their gender and group class
    if (!userData?.gender || !userData?.group_class) {
      setErrorMessage(
        'You must set your gender and group class in your profile before creating a group. ' +
        'Please go to your profile page to update this information.'
      );
      setIsSubmitting(false);
      return;
    }

    // Validate form
    if (members.some(m => !m.name.trim())) {
      setErrorMessage('All member names are required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Filter out empty members
      const validMembers = members.filter(m => m.name.trim());
      
      // Group name and notes are no longer needed - they'll be handled automatically by the backend
      const groupId = await createPresentationGroupAction(
        user.id,
        selectedSection.id,
        null, // name will be auto-generated
        null, // no notes
        validMembers.map(m => ({ name: m.name })) // only include name for members
      );

      if (groupId) {
        setSuccessMessage('Group created successfully!');
        // Update our list of groups the user is in
        setMyGroups(new Map(myGroups).set(selectedSection.id, groupId));
        
        // Load the groups for this section again to update the list
        const sectionGroups = await getPresentationGroupsBySectionAction(selectedSection.id);
        setGroups(new Map(groups).set(selectedSection.id, sectionGroups));
        
        // Reset form
        setShowJoinForm(false);
        setGroupName('');
        setNotes('');
        setMembers([{ name: '' }]);
        // Load the group members
        await loadGroupMembers(groupId);
      } else {
        setErrorMessage('Failed to create group. You may already be in a group for this section.');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      setErrorMessage('An error occurred while creating the group');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroupExpand = (groupId: number) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      // Load group members if not already loaded
      if (!groupMembers.has(groupId)) {
        loadGroupMembers(groupId);
      }
    }
  };

  // Load group details for editing
  const startEditingGroup = async (groupId: number) => {
    const currentGroup = groups.get(selectedSection!.id)?.find(g => g.id === groupId);
    if (currentGroup) {
      setEditingGroupId(groupId);
      // No longer setting editGroupName since the name is auto-generated and read-only
      setEditGroupNotes(currentGroup.notes || '');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingGroupId(null);
    setEditGroupName('');
    setEditGroupNotes('');
  };

  // Save edited group
  const saveGroupChanges = async () => {
    if (!user?.id || !editingGroupId) return;

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Only allow editing notes, not the group name (group name is auto-generated)
      const success = await updatePresentationGroupAction(
        user.id,
        editingGroupId,
        {
          name: null, // Don't update name
          notes: editGroupNotes.trim() || null
        }
      );

      if (success) {
        setSuccessMessage('Group details updated successfully!');
        // Reload groups to reflect changes
        await loadSections();
        // Exit edit mode
        setEditingGroupId(null);
      } else {
        setErrorMessage('Failed to update group. You may not have permission.');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      setErrorMessage('An error occurred while updating the group');
    } finally {
      setIsUpdating(false);
    }
  };

  // Load group members for editing
  const startEditingMembers = (groupId: number) => {
    if (!groupMembers.has(groupId)) {
      loadGroupMembers(groupId);
    }
    
    const members = groupMembers.get(groupId) || [];
    
    // Filter out the creator and map to the format we need
    const nonCreatorMembers = members
      .filter(m => !m.is_creator)
      .map(m => ({
        id: m.id,
        name: m.name
      }));
    
    setMembersList(nonCreatorMembers);
    setEditingMembers(true);
  };

  // Cancel editing members
  const cancelEditingMembers = () => {
    setEditingMembers(false);
    setMembersList([]);
  };

  // Add a new member to the edit list
  const addMember = () => {
    if (!selectedSection) return;
    
    // Check if we've reached the max members limit
    if (membersList.length >= selectedSection.max_members - 1) { // -1 for the creator
      setErrorMessage(`Maximum ${selectedSection.max_members} members allowed (including you)`);
      return;
    }
    
    setMembersList([...membersList, { name: '' }]);
  };

  // Remove a member from the edit list
  const removeMember = (index: number) => {
    const newMembersList = [...membersList];
    newMembersList.splice(index, 1);
    setMembersList(newMembersList);
  };

  // Handle member field changes
  const handleExistingMemberChange = (index: number, field: 'name', value: string) => {
    const newMembersList = [...membersList];
    newMembersList[index] = { ...newMembersList[index], [field]: value };
    setMembersList(newMembersList);
  };

  // Save member changes
  const saveMemberChanges = async () => {
    if (!user?.id || !selectedSection || !myGroups.has(selectedSection.id)) return;
    
    const groupId = myGroups.get(selectedSection.id)!;
    
    // Validate members
    if (membersList.some(m => !m.name.trim())) {
      setErrorMessage('All member names are required');
      return;
    }
    
    setIsUpdatingMembers(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const success = await updatePresentationGroupMembersAction(
        user.id,
        groupId,
        membersList
      );
      
      if (success) {
        setSuccessMessage('Group members updated successfully!');
        // Reload the group members to reflect changes
        await loadGroupMembers(groupId);
        // Exit editing mode
        setEditingMembers(false);
      } else {
        setErrorMessage('Failed to update group members. You may not have permission.');
      }
    } catch (error) {
      console.error('Error updating group members:', error);
      setErrorMessage('An error occurred while updating the group members');
    } finally {
      setIsUpdatingMembers(false);
    }
  };

  // Add a custom error component that shows a link to the profile
  const renderProfileRequiredError = () => {
    if (!errorMessage.includes('gender') && !errorMessage.includes('group class')) {
      return (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800/30 rounded-lg text-red-100">
          <p>{errorMessage}</p>
        </div>
      );
    }
    
    return (
      <div className="mb-4 p-4 bg-red-900/30 border border-red-800/30 rounded-lg text-red-100">
        <div className="flex items-start">
          <XCircle className="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="font-medium">{t('presentationGroupPage.profileRequired')}</p>
            <Link 
              href="/dashboard/profile" 
              className="mt-2 inline-block px-3 py-1.5 bg-indigo-600/80 text-white text-xs font-medium rounded hover:bg-indigo-500/80 transition-colors"
            >
              {t('presentationGroupPage.updateProfile')}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted || !isLoaded || userDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">Please sign in to view this page.</p>
      </div>
    );
  }

  // Update the section where we show the user's current group
  // Add an edit button and edit form when in edit mode
  const renderUserGroup = () => {
    if (!selectedSection || !myGroups.has(selectedSection.id)) return null;
    
    const groupId = myGroups.get(selectedSection.id)!;
    const currentGroup = groups.get(selectedSection.id)?.find(g => g.id === groupId);
    const isEditing = editingGroupId === groupId;
    
    if (!currentGroup) return null; // Add safety check for currentGroup
    
    return (
      <div className="mb-6">
        <div className="bg-green-900/20 text-green-100 p-4 rounded-lg border border-green-800/30 mb-4 flex justify-between items-start">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
            <span className="font-medium">
              {t('presentationGroupPage.yourGroup')}: <strong>{currentGroup.name}</strong>
            </span>
          </div>
          <div className="flex space-x-2">
            {!isEditing && !editingMembers && (
              <>
                <button
                  onClick={() => startEditingMembers(groupId)}
                  className="p-2 bg-indigo-700/30 hover:bg-indigo-600/40 rounded text-indigo-200 flex items-center text-sm"
                >
                  <Users className="h-4 w-4 mr-1" />
                  {t('presentationGroupPage.editMembers')}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Editing Group Details */}
        {isEditing ? (
          <div className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4 mb-4">
            <h3 className="text-lg font-medium text-indigo-100 mb-3">{t('presentationGroupPage.editGroupDetails')}</h3>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1">
                  {t('presentationGroupPage.groupName')}
                </label>
                <div className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg text-indigo-100">
                  {currentGroup?.name || ''}
                  <span className="ml-2 text-xs bg-indigo-600/50 text-indigo-200 px-2 py-0.5 rounded-full">
                    {t('presentationGroupPage.autoGenerated')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-indigo-400">
                  {t('presentationGroupPage.groupNameCannotBeChanged')}
                </p>
              </div>
              
              <div>
                <label htmlFor="editGroupNotes" className="block text-sm font-medium text-indigo-200 mb-1">
                  {t('presentationGroupPage.notes')}
                </label>
                <textarea
                  id="editGroupNotes"
                  value={editGroupNotes}
                  onChange={(e) => setEditGroupNotes(e.target.value)}
                  placeholder={t('presentationGroupPage.notesPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-100"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={saveGroupChanges}
                disabled={isUpdating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('presentationGroupPage.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('presentationGroupPage.saveChanges')}
                  </>
                )}
              </button>
              
              <button
                onClick={cancelEditing}
                className="px-4 py-2 bg-gray-600/60 hover:bg-gray-500/80 text-white rounded-lg"
              >
                {t('presentationGroupPage.cancel')}
              </button>
            </div>
          </div>
        ) : null}

        {/* Editing Group Members */}
        {editingMembers ? (
          <div className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4 mb-4">
            <h3 className="text-lg font-medium text-indigo-100 mb-3">{t('presentationGroupPage.editGroupMembers')}</h3>
            
            <div className="mb-4">
              <div className="p-3 bg-indigo-700/20 border border-indigo-700/30 rounded-lg mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                    <span className="text-white font-medium text-sm">
                      {userData?.username?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-indigo-100">
                      {userData?.username || user?.firstName || 'You'}
                      <span className="ml-2 text-xs bg-indigo-600/50 text-indigo-200 px-2 py-0.5 rounded-full">
                        {t('presentationGroupPage.youCreator')}
                      </span>
                    </div>
                    <div className="text-xs text-indigo-300">{user?.primaryEmailAddress?.emailAddress}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                {membersList.map((member, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleExistingMemberChange(index, 'name', e.target.value)}
                        placeholder={t('presentationGroupPage.memberName')}
                        className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70 mb-2"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="mt-1 p-2 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              {membersList.length < selectedSection.max_members - 1 && (
                <button
                  type="button"
                  onClick={addMember}
                  className="mt-3 px-3 py-2 bg-indigo-700/50 text-indigo-200 rounded-lg hover:bg-indigo-600/50 transition-colors flex items-center text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('presentationGroupPage.addMember')}
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={saveMemberChanges}
                disabled={isUpdatingMembers}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center disabled:opacity-50"
              >
                {isUpdatingMembers ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('presentationGroupPage.saving')}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('presentationGroupPage.saveChanges')}
                  </>
                )}
              </button>
              
              <button
                onClick={cancelEditingMembers}
                className="px-4 py-2 bg-gray-600/60 hover:bg-gray-500/80 text-white rounded-lg"
              >
                {t('presentationGroupPage.cancel')}
              </button>
            </div>
          </div>
        ) : null}
        
        {/* Group Details */}
        {!isEditing && !editingMembers && currentGroup && (
          <div className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 overflow-hidden">
            <div className="p-4">
              <h3 className="font-medium text-indigo-100 text-lg mb-2">
                {currentGroup.name || `Group ${currentGroup.id}`}
              </h3>
              
              {currentGroup.notes && (
                <div className="mb-3 p-3 bg-indigo-700/20 rounded-lg text-indigo-200 text-sm">
                  {currentGroup.notes}
                </div>
              )}
              
              <h4 className="text-sm font-medium text-indigo-300 mt-4 mb-2">
                {t('presentationGroupPage.members')}
              </h4>
              
              {groupMembers.has(groupId) ? (
                <ul className="space-y-2">
                  {groupMembers.get(groupId)!.map((member) => (
                    <li 
                      key={member.id} 
                      className="flex items-center p-2 rounded bg-indigo-700/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                        <span className="text-white font-medium text-xs">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-indigo-100">
                          {member.name}
                          {member.is_creator && (
                            <span className="ml-2 text-xs bg-indigo-600/50 text-indigo-200 px-1.5 py-0.5 rounded-full">
                              {t('presentationGroupPage.creator')}
                            </span>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex justify-center items-center h-16">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">{t('presentationGroupPage.title')}</h1>
          <p className="text-indigo-300">
            {t('presentationGroupPage.subtitle')}
          </p>
        </div>
        <button
          onClick={loadSections}
          disabled={refreshing}
          className="px-4 py-2 bg-indigo-700/60 border border-indigo-600/50 rounded-lg text-white hover:bg-indigo-600/80 transition-colors disabled:opacity-50 flex items-center"
        >
          {refreshing ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {t('presentationGroupPage.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sections List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 shadow-xl p-6"
        >
          <h2 className="text-xl font-semibold text-indigo-100 mb-4 flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-indigo-400" />
            {t('presentationGroupPage.availableSections')}
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : sections.length === 0 ? (
            <div className="text-center p-8 bg-indigo-800/30 rounded-lg border border-indigo-700/30">
              <UserGroup className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
              <p className="text-indigo-200">{t('presentationGroupPage.noSectionsAvailable')}</p>
              <p className="text-sm text-indigo-400 mt-1">{t('presentationGroupPage.checkBackLater')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionSelect(section)}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                    selectedSection?.id === section.id
                      ? 'bg-indigo-700/60 text-white border border-indigo-600/50'
                      : 'bg-indigo-800/30 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-700/30'
                  }`}
                >
                  <div className="flex items-center">
                    <UserGroup className="h-5 w-5 mr-2" />
                    <div>
                      <span className="font-medium block">{section.title}</span>
                      <span className="text-xs text-indigo-300">{t('presentationGroupPage.maxMembers').replace('{count}', String(section.max_members))}</span>
                    </div>
                  </div>
                  {myGroups.has(section.id) && (
                    <div className="flex items-center px-2 py-1 bg-green-800/30 text-green-300 rounded text-xs font-medium">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('presentationGroupPage.joined')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Selected Section Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 shadow-xl p-6 md:col-span-2"
        >
          {selectedSection ? (
            <div>
              <h2 className="text-xl font-semibold text-indigo-100 mb-1">{selectedSection.title}</h2>
              {selectedSection.description && (
                <p className="text-indigo-300 mb-4">{selectedSection.description}</p>
              )}
              
              <div className="flex items-center mb-4 p-3 bg-indigo-800/30 rounded-lg border border-indigo-700/30">
                <Users className="h-5 w-5 text-indigo-400 mr-2" />
                <span className="text-indigo-200">{t('presentationGroupPage.maxMembersPerGroup').replace('{count}', String(selectedSection.max_members))}</span>
              </div>

              {/* Success/Error Messages */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-800/30 rounded-lg text-green-100 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                  {successMessage}
                </div>
              )}
              
              {errorMessage && renderProfileRequiredError()}

              {/* User's Current Group for this Section */}
              {myGroups.has(selectedSection.id) ? (
                renderUserGroup()
              ) : (
                <>
                  <div className="mb-6">
                    <button
                      onClick={handleToggleJoinForm}
                      className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                      {showJoinForm ? (
                        <>
                          <ChevronUp className="h-5 w-5 mr-2" />
                          {t('presentationGroupPage.hideJoinForm')}
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-5 w-5 mr-2" />
                          {t('presentationGroupPage.createGroup')}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Group Form */}
                  {showJoinForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 overflow-hidden"
                    >
                      <form onSubmit={handleCreateGroup} className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4">
                        <h3 className="text-lg font-medium text-indigo-100 mb-4">{t('presentationGroupPage.createNewGroup')}</h3>
                        
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-indigo-200">
                              {t('presentationGroupPage.groupMembers')}
                            </label>
                            <span className="text-xs text-indigo-300">
                              {t('presentationGroupPage.membersCount')
                                .replace('{current}', String(members.length + 1))
                                .replace('{max}', String(selectedSection.max_members))}
                            </span>
                          </div>

                          <div className="p-3 bg-indigo-700/20 border border-indigo-700/30 rounded-lg mb-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3">
                                <span className="text-white font-medium text-sm">
                                  {userData?.username?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-indigo-100">
                                  {userData?.username || user?.firstName || 'You'}
                                  <span className="ml-2 text-xs bg-indigo-600/50 text-indigo-200 px-2 py-0.5 rounded-full">
                                    {t('presentationGroupPage.youCreator')}
                                  </span>
                                </div>
                                <div className="text-xs text-indigo-300">{user?.primaryEmailAddress?.emailAddress}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {members.map((member, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <div className="flex-1">
                                  <input
                                    type="text"
                                    value={member.name}
                                    onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                                    placeholder={t('presentationGroupPage.memberName')}
                                    className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70 mb-2"
                                    required
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(index)}
                                  className="mt-1 p-2 text-red-400 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {members.length < selectedSection.max_members - 1 && (
                            <button
                              type="button"
                              onClick={handleAddMember}
                              className="mt-3 px-3 py-2 bg-indigo-700/50 text-indigo-200 rounded-lg hover:bg-indigo-600/50 transition-colors flex items-center text-sm"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              {t('presentationGroupPage.addAnotherMember')}
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center"
                        >
                          {isSubmitting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t('presentationGroupPage.creatingGroup')}
                            </>
                          ) : (
                            <>
                              <PlusCircle className="h-5 w-5 mr-2" />
                              {t('presentationGroupPage.createGroup')}
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </>
              )}

              {/* Other Groups in this Section */}
              {groups.has(selectedSection.id) && groups.get(selectedSection.id)!.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-indigo-100 mb-3">
                    {t('presentationGroupPage.existingGroups').replace('{section}', selectedSection.title)}
                  </h3>
                  <div className="space-y-3">
                    {groups.get(selectedSection.id)!.map((group) => (
                      <div 
                        key={group.id} 
                        className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleGroupExpand(group.id)}
                          className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-indigo-700/30 transition-colors"
                        >
                          <div>
                            <span className="font-medium text-indigo-100">
                              {group.name || `Group ${group.id}`}
                            </span>
                            <div className="text-xs text-indigo-300">
                              {t('presentationGroupPage.createdAt').replace('{date}', new Date(group.created_at).toLocaleDateString())}
                            </div>
                          </div>
                          {expandedGroup === group.id ? (
                            <ChevronUp className="h-5 w-5 text-indigo-300" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-indigo-300" />
                          )}
                        </button>
                        
                        {expandedGroup === group.id && (
                          <div className="p-4 border-t border-indigo-700/30">
                            {group.notes && (
                              <div className="mb-3 p-3 bg-indigo-700/20 rounded-lg text-indigo-200 text-sm">
                                {group.notes}
                              </div>
                            )}
                            
                            <h4 className="text-sm font-medium text-indigo-200 mb-2">{t('presentationGroupPage.members')}</h4>
                            {groupMembers.has(group.id) ? (
                              <ul className="space-y-2">
                                {groupMembers.get(group.id)!.map((member) => (
                                  <li 
                                    key={member.id} 
                                    className="flex items-center p-2 rounded bg-indigo-700/20"
                                  >
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                                      <span className="text-white font-medium text-xs">
                                        {member.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="text-sm">
                                      <span className="font-medium text-indigo-100">
                                        {member.name}
                                        {member.is_creator && (
                                          <span className="ml-2 text-xs bg-indigo-600/50 text-indigo-200 px-1.5 py-0.5 rounded-full">
                                            {t('presentationGroupPage.creator')}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="flex justify-center items-center h-16">
                                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <UserGroup className="h-12 w-12 text-indigo-500 mb-4" />
              <h3 className="text-lg font-medium text-indigo-200 mb-2">{t('presentationGroupPage.selectSection')}</h3>
              <p className="text-indigo-300">
                {t('presentationGroupPage.selectSectionDesc')}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 