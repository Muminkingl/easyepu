'use client';

import { useEffect, useState } from 'react';
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
  updatePresentationGroupMembersAction,
  uploadPresentationFileAction,
  getGroupPresentationFileAction
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
  UserPlus,
  AlertTriangle,
  Upload,
  FileIcon,
  Presentation
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

type Group = {
  id: string | number;
  name: string;
  created_at: string;
  members: string[];
  creator: string;
  topic?: string;
};

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
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [topicText, setTopicText] = useState('');
  const [groupTopic, setGroupTopic] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileUploadError, setFileUploadError] = useState('');
  const [fileUploadSuccess, setFileUploadSuccess] = useState('');
  const [presentationFiles, setPresentationFiles] = useState<Map<number, { url: string; name: string }>>(new Map());

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
        let foundGroups = false;
        
        for (const section of data) {
          try {
          const groupId = await getUserPresentationGroupAction(user.id, section.id);
          if (groupId) {
            userGroupsMap.set(section.id, groupId);
              foundGroups = true;
              
              // Load presentation file for this group
              loadPresentationFile(groupId);
              
              // Also load group members
              loadGroupMembers(groupId);
            }
          } catch (error) {
            console.error(`Error loading user group for section ${section.id}:`, error);
          }
        }
        
        setMyGroups(userGroupsMap);
        
        // If we didn't find any groups through the normal method, try the fallback
        // This happens sometimes due to RLS issues
        if (!foundGroups && data.length > 0) {
          console.log("Trying fallback method to determine group membership");
          try {
            const fallbackGroups = new Map<number, number>();
            
            // Load all groups for the first section and check if the user is a member of any
            const firstSection = data[0];
            const allGroups = await getPresentationGroupsBySectionAction(firstSection.id);
            
            for (const group of allGroups) {
              const members = await getPresentationGroupMembersAction(Number(group.id));
              for (const member of members) {
                if (member.user_id === user.id) {
                  console.log(`Found user in group ${group.id} by direct member check`);
                  fallbackGroups.set(firstSection.id, Number(group.id));
                  
                  // Load presentation file for this group
                  loadPresentationFile(Number(group.id));
                  
                  // Store members
                  setGroupMembers(prev => new Map(prev).set(Number(group.id), members));
                }
              }
            }
            
            if (fallbackGroups.size > 0) {
              setMyGroups(fallbackGroups);
            }
          } catch (fallbackError) {
            console.error("Fallback method failed:", fallbackError);
          }
        }

        // Load groups for each section
        const groupsMap = new Map<number, PresentationGroup[]>();
        for (const section of data) {
          try {
          const sectionGroups = await getPresentationGroupsBySectionAction(section.id);
          groupsMap.set(section.id, sectionGroups);
          } catch (error) {
            console.error(`Error loading groups for section ${section.id}:`, error);
            groupsMap.set(section.id, []);
          }
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

    // Check if user is already in a group for this section
    if (myGroups.has(selectedSection.id)) {
      setErrorMessage('You are already in a group for this section.');
      setIsSubmitting(false);
      return;
    }

    // Check if user has set their gender and group class
    if (!userData?.gender || !userData?.group_class) {
      setErrorMessage(
        'You must set your gender and group class in your profile before creating a group. ' +
        'Please go to your profile page to update this information.'
      );
      setIsSubmitting(false);
      return;
    }

    // Validate topic field
    if (!groupTopic.trim()) {
      setErrorMessage(t('presentationGroupPage.topicCannotBeEmpty'));
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
      
      // Group name will be auto-generated with G1, G2, etc. format by the backend
      // Pass the topic in the notes field
      const groupId = await createPresentationGroupAction(
        user.id,
        selectedSection.id,
        null, // name will be auto-generated
        groupTopic.trim(), // use the topic field as notes
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
        setGroupTopic('');
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
      
      // Force a refresh of the sections and groups to ensure everything is up to date
      if (user?.id) {
        loadSections();
      }
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
      // Load presentation file
      loadPresentationFile(groupId);
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

    // Check if user has set their gender and group class
    if (!userData?.gender || !userData?.group_class) {
      setErrorMessage(
        'You must set your gender and group class in your profile before updating group details.'
      );
      setIsUpdating(false);
      return;
    }

    // Validate that the topic is not empty
    if (!editGroupNotes.trim()) {
      setErrorMessage(t('presentationGroupPage.topicCannotBeEmpty'));
      return;
    }

    setIsUpdating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Only allow editing notes (topic), not the group name (group name is auto-generated)
      const success = await updatePresentationGroupAction(
        user.id,
        editingGroupId,
        {
          name: null, // Don't update name
          notes: editGroupNotes.trim() // The notes field is used for the topic
        }
      );

      if (success) {
        setSuccessMessage('Group topic updated successfully!');
        // Reload groups to reflect changes
        await loadSections();
        // Exit edit mode
        setEditingGroupId(null);
      } else {
        setErrorMessage('Failed to update group topic. You may not have permission.');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      setErrorMessage('An error occurred while updating the group topic');
    } finally {
      setIsUpdating(false);
    }
  };

  // Load group members for editing
  const startEditingMembers = (groupId: number) => {
    // Check if user has set their gender and group class first
    if (!userData?.gender || !userData?.group_class) {
      setErrorMessage(
        'You must set your gender and group class in your profile before editing group members.'
      );
      return;
    }
    
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
    
    // Check if user has set their gender and group class
    if (!userData?.gender || !userData?.group_class) {
      setErrorMessage(
        'You must set your gender and group class in your profile before updating group members.'
      );
      return;
    }
    
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
      <div className="mb-6 bg-amber-900/30 text-amber-300 p-4 rounded-lg border border-amber-800/30 flex flex-col">
        <div className="flex items-center mb-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <span className="font-medium">{t('presentationGroupPage.profileRequired')}</span>
        </div>
        <p className="mb-3 text-sm">
          {t('presentationGroupPage.profileRequiredMessage')}
        </p>
            <Link 
              href="/dashboard/profile" 
          className="self-start px-4 py-2 bg-amber-800/50 hover:bg-amber-700/50 text-amber-100 rounded-lg transition-colors text-sm"
            >
              {t('presentationGroupPage.updateProfile')}
            </Link>
          </div>
    );
  };

  const createGroup = async (existingGroups: Group[], userId: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client is not initialized');
        return null;
      }
      
      const { data: newGroup, error: createError } = await supabase
        .from('presentation_groups')
        .insert([
          {
            name: `G${existingGroups.length + 1}`,
            members: [userId],
            creator: userId,
            topic: '',
          },
        ])
        .select()
        .single();

      if (createError) throw createError;
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  };

  const ExistingGroups = ({ groups, t }: { groups: Group[]; t: (key: string) => string }) => {
    const { user } = useUser();
    
    // Filter groups to only show the current user's groups
    const userGroups = groups.filter(group => 
      group.members.includes(user?.id || '') || group.creator === user?.id
    );

    const updateTopic = async (groupId: string, newTopic: string) => {
      try {
        if (!supabase) {
          console.error('Supabase client is not initialized');
          return false;
        }
        
        const { error } = await supabase
          .from('presentation_groups')
          .update({ topic: newTopic })
          .eq('id', groupId);

        if (error) throw error;
        setEditingTopic(null);
      } catch (error) {
        console.error('Error updating topic:', error);
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">{t('presentationGroupPage.existingGroups')}</h2>
        {userGroups.map((group) => (
          <div key={group.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">{group.name}</h3>
              {group.creator === user?.id && (
                <button
                  onClick={() => {
                    setEditingTopic(String(group.id));
                    setTopicText(group.topic || '');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {t('common.edit')}
                </button>
              )}
        </div>
            
            {editingTopic === group.id ? (
              <div className="mb-4">
                <input
                  type="text"
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  placeholder={t('presentationGroupPage.topicPlaceholder')}
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => updateTopic(String(group.id), topicText)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {t('common.save')}
                  </button>
                  <button
                    onClick={() => setEditingTopic(null)}
                    className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                <span className="font-medium">{t('presentationGroupPage.topic')}:</span>{' '}
                {group.topic || t('presentationGroupPage.topicOptional')}
              </div>
            )}

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">{t('presentationGroupPage.members')}:</h4>
              // ... existing members list code ...
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add new function to load presentation file for a group
  const loadPresentationFile = async (groupId: number) => {
    try {
      console.log(`Loading presentation file for group ${groupId}`);
      const fileData = await getGroupPresentationFileAction(groupId);
      
      if (fileData) {
        console.log(`File data loaded:`, fileData);
        setPresentationFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(groupId, fileData);
          return newMap;
        });
      } else {
        console.log(`No file data found for group ${groupId}`);
      }
    } catch (error) {
      console.error('Error loading presentation file:', error);
    }
  };

  // Enhanced handleFileUpload function with better error handling and file replacement
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, groupId: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setFileUploadError('');
    setFileUploadSuccess('');
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileUploadError(t('presentationGroupPage.fileTooBig'));
      return;
    }
    
    // Validate file type (only PowerPoint files)
    const validTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    if (!validTypes.includes(file.type)) {
      setFileUploadError(t('presentationGroupPage.invalidFileType'));
      return;
    }
    
    setUploadingFile(true);
    
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Create FormData for the file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user.id);
      formData.append('groupId', groupId.toString());
      
      // Use the server-side endpoint to handle the upload
      const response = await fetch('/api/upload-presentation', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFileUploadSuccess(t('presentationGroupPage.uploadSuccess'));
        
        // Immediately update the presentation file state for instant feedback
        setPresentationFiles(prev => new Map(prev).set(groupId, { 
          url: result.fileUrl, 
          name: result.fileName 
        }));
        
        // Reload sections to ensure database changes are reflected in the UI
        if (user?.id) {
          loadSections();
        }
      } else {
        setFileUploadError(result.error || t('presentationGroupPage.uploadError'));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileUploadError(t('presentationGroupPage.uploadError'));
    } finally {
      setUploadingFile(false);
      
      // Clear the input field so the same file can be selected again
      event.target.value = '';
    }
  };

  // Modified file rendering to prevent downloads
  const renderFileLink = (groupId: number) => {
    const fileData = presentationFiles.get(groupId);
    if (!fileData) return null;
    
    return (
      <div className="mt-4 p-3 bg-indigo-900/30 rounded-lg border border-indigo-800/30">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-indigo-200">{t('presentationGroupPage.uploadedPresentation')}:</h4>
          <div className="px-2 py-0.5 bg-green-600/30 rounded text-xs text-green-300 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            {t('presentationGroupPage.saved')}
          </div>
        </div>
        <div className="flex items-center">
          <FileIcon className="h-5 w-5 mr-2 text-indigo-300 flex-shrink-0" />
          <div className="text-indigo-300 text-sm truncate mr-2">
            {fileData.name}
          </div>
          <span className="text-xs text-indigo-400 ml-auto">
            {new Date(fileData.url.split('/').pop()?.split('-')[0] || '').toLocaleDateString()}
          </span>
        </div>
        <div className="mt-2 text-xs text-amber-300 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {t('presentationGroupPage.fileDownloadNotAllowed')}
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
                  <PlusCircle className="h-4 w-4 mr-2" />
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
        
        {/* Group Topic Section */}
        <div className="mb-4 bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-indigo-100">{t('presentationGroupPage.topic')}</h4>
            {!editingGroupId && (
              <button
                onClick={() => setEditingGroupId(Number(currentGroup.id))}
                className="px-3 py-1 bg-indigo-600/60 hover:bg-indigo-500/60 text-white rounded flex items-center text-sm"
              >
                <Edit className="h-3 w-3 mr-1" />
                {t('presentationGroupPage.editTopic')}
              </button>
            )}
          </div>
          
          {editingGroupId === Number(currentGroup.id) ? (
            <div>
              <textarea
                value={editGroupNotes}
                onChange={(e) => setEditGroupNotes(e.target.value)}
                placeholder={t('presentationGroupPage.topicPlaceholder')}
                rows={3}
                required
                className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-indigo-100 mb-2"
              />
              {errorMessage && errorMessage.includes('topic') && (
                <p className="text-red-400 text-sm mb-2">{t('presentationGroupPage.topicCannotBeEmpty')}</p>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (!editGroupNotes.trim()) {
                      setErrorMessage(t('presentationGroupPage.topicCannotBeEmpty'));
                      return;
                    }
                    saveGroupChanges();
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded flex items-center text-sm"
                >
                  <Save className="h-3 w-3 mr-1" />
                  {t('presentationGroupPage.saveTopic')}
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-3 py-1 bg-gray-600/60 hover:bg-gray-500/80 text-white rounded text-sm"
                >
                  {t('presentationGroupPage.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-700/20 rounded-lg text-indigo-200 text-sm">
              {currentGroup.notes ? (
                currentGroup.notes
              ) : (
                <span className="text-indigo-400">{t('presentationGroupPage.topicRequired')}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Presentation File Upload Section */}
        {!isEditing && !editingMembers && currentGroup && (
          <div className="mt-4 bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4">
            <h3 className="font-medium text-indigo-100 text-lg mb-3 flex items-center">
              <Presentation className="h-5 w-5 mr-2 text-indigo-400" />
              {t('presentationGroupPage.presentation')}
            </h3>
            
            {fileUploadError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800/30 rounded-lg text-red-100 flex items-center">
                <XCircle className="h-5 w-5 mr-2 text-red-400" />
                {fileUploadError}
              </div>
            )}
            
            {fileUploadSuccess && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-800/30 rounded-lg text-green-100 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                {fileUploadSuccess}
              </div>
            )}
            
            {/* Current File Display */}
            {presentationFiles.has(Number(currentGroup.id)) && (
              <div className="mb-4">
                {renderFileLink(Number(currentGroup.id))}
              </div>
            )}
            
            <div className="mb-3 p-3 bg-amber-800/30 text-amber-200 text-sm rounded-lg border border-amber-700/30">
              {presentationFiles.has(Number(currentGroup.id))
                ? t('presentationGroupPage.replaceNote')
                : t('presentationGroupPage.presentationNote')}
            </div>
            
            <label
              htmlFor={`file-upload-${currentGroup.id}`}
              className={`flex items-center justify-center p-4 border-2 border-dashed border-indigo-600/50 rounded-lg hover:bg-indigo-700/30 transition-colors cursor-pointer ${
                uploadingFile ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-indigo-400 mb-2" />
                <span className="font-medium text-indigo-200">
                  {presentationFiles.has(Number(currentGroup.id))
                    ? t('presentationGroupPage.replacePresentationFile')
                    : t('presentationGroupPage.uploadPresentation')}
                </span>
                <p className="text-xs text-indigo-400 mt-1">
                  PowerPoint files only (.ppt, .pptx), max 10MB
                </p>
                
                {uploadingFile && (
                  <div className="flex flex-col items-center mt-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                    <span className="text-sm text-indigo-300">
                      {t('presentationGroupPage.uploadingPresentation')}
                    </span>
                  </div>
                )}
              </div>
              <input
                id={`file-upload-${currentGroup.id}`}
                type="file"
                accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="hidden"
                onChange={(e) => handleFileUpload(e, Number(currentGroup.id))}
                disabled={uploadingFile}
              />
            </label>
          </div>
        )}
        
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
              
              {groupMembers.has(Number(currentGroup.id)) ? (
                <ul className="space-y-2">
                  {groupMembers.get(Number(currentGroup.id))!.map((member) => (
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
                          {t('presentationGroupPage.createNewGroup')}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Show form for creating a new group */}
                  {showJoinForm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 bg-indigo-800/30 rounded-lg border border-indigo-700/30 p-4"
                    >
                      {errorMessage && renderProfileRequiredError()}
                      
                      <form onSubmit={handleCreateGroup} className="space-y-4">
                        <div>
                          <label htmlFor="groupTopic" className="block text-sm font-medium text-indigo-200 mb-1">
                            {t('presentationGroupPage.topic')}
                            <span className="text-red-400 ml-1">*</span>
                          </label>
                          <input
                            id="groupTopic"
                            type="text"
                            value={groupTopic}
                            onChange={e => setGroupTopic(e.target.value)}
                            placeholder={t('presentationGroupPage.topicPlaceholder')}
                            className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70"
                            required
                          />
                          <p className="mt-1 text-xs text-indigo-400">
                            {t('presentationGroupPage.topicDescription')}
                          </p>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-indigo-200 mb-2 flex items-center">
                            <Users className="h-4 w-4 mr-2 text-indigo-400" />
                              {t('presentationGroupPage.groupMembers')}
                          </h4>
                          <p className="text-xs text-indigo-400 mb-3">
                            {t('presentationGroupPage.membersCount').replace('{current}', String(members.length + 1)).replace('{max}', String(selectedSection.max_members))}
                          </p>

                          {/* Current user (creator) */}
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
                                    className="w-full px-3 py-2 bg-indigo-700/30 border border-indigo-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70"
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

                        <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                            className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {t('presentationGroupPage.creatingGroup')}
                            </>
                          ) : (
                            <>
                                <UserGroup className="h-5 w-5 mr-2" />
                              {t('presentationGroupPage.createGroup')}
                            </>
                          )}
                        </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </>
              )}

              {/* List of existing groups */}
              <div className="mb-4">
                  <h3 className="text-lg font-medium text-indigo-100 mb-3">
                    {t('presentationGroupPage.existingGroups').replace('{section}', selectedSection.title)}
                  </h3>
                
                {groups.has(selectedSection.id) && groups.get(selectedSection.id)!.length > 0 ? (
                  <div className="space-y-3">
                    {groups.get(selectedSection.id)!
                      // Filter to only show the user's group
                      .filter(group => myGroups.has(selectedSection.id) && group.id === myGroups.get(selectedSection.id))
                      .map((group) => (
                      <div key={group.id} className="bg-indigo-800/30 rounded-lg border border-indigo-700/30 overflow-hidden">
                        <button
                          onClick={() => toggleGroupExpand(Number(group.id))}
                          className="w-full px-4 py-3 flex justify-between items-center hover:bg-indigo-700/20 transition-colors"
                        >
                          <div className="flex items-center">
                            <UserGroup className="h-5 w-5 mr-2 text-indigo-400" />
                            <div className="text-left">
                              <span className="font-medium text-indigo-100">{group.name || `Group ${group.id}`}</span>
                            <div className="text-xs text-indigo-300">
                              {t('presentationGroupPage.createdAt').replace('{date}', new Date(group.created_at).toLocaleDateString())}
                            </div>
                          </div>
                          </div>
                          {expandedGroup === Number(group.id) ? (
                            <ChevronUp className="h-5 w-5 text-indigo-400" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-indigo-400" />
                          )}
                        </button>
                        
                        {expandedGroup === Number(group.id) && (
                          <div className="p-4 border-t border-indigo-700/30">
                            {group.notes && (
                              <div className="mb-3 p-3 bg-indigo-700/20 rounded-lg text-indigo-200 text-sm">
                                {group.notes}
                              </div>
                            )}
                            
                            <h4 className="text-sm font-medium text-indigo-300 mt-3 mb-2">
                              {t('presentationGroupPage.members')}
                            </h4>
                            
                            {groupMembers.has(Number(group.id)) ? (
                              <ul className="space-y-2">
                                {groupMembers.get(Number(group.id))!.map((member) => (
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
                            
                            {/* Show presentation file if available */}
                            {renderFileLink(Number(group.id))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-indigo-800/30 rounded-lg border border-indigo-700/30">
                    <UserGroup className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
                    <p className="text-indigo-200">No groups have been created for this section yet.</p>
                </div>
              )}
              </div>
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