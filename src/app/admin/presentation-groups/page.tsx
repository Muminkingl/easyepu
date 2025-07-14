"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import * as XLSX from 'xlsx';
import { 
  createPresentationSectionAction, 
  getPresentationSectionsAction,
  deletePresentationSectionAction,
  updatePresentationSectionAction,
  getPresentationGroupsBySectionAction,
  getPresentationGroupMembersAction,
  getUserDataAction,
  getGroupPresentationFileAction
} from "@/lib/actions";
import type { 
  PresentationSection, 
  PresentationGroup,
  PresentationGroupMember
} from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  PlusCircleIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  Users2 as UserGroup, 
  RefreshCw,
  Pencil,
  XCircle,
  ChevronDown,
  ChevronUp,
  User,
  Download,
  FileIcon,
  Presentation,
  AlertCircle
} from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { useTranslations } from "@/lib/i18n";

export default function PresentationGroupsAdminPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { userData, isAdmin } = useUserData();
  const { t } = useTranslations();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [maxMembers, setMaxMembers] = useState<number>(3);
  const [semester, setSemester] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sections, setSections] = useState<PresentationSection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [sectionGroups, setSectionGroups] = useState<Map<number, PresentationGroup[]>>(new Map());
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<Map<number, PresentationGroupMember[]>>(new Map());
  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [sectionDownloading, setSectionDownloading] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [presentationFiles, setPresentationFiles] = useState<Map<number, { url: string; name: string }>>(new Map());
  
  // Check if user has owner role for advanced admin privileges
  const isOwner = userData?.role === 'owner';

  // Update the useEffect hook to set mounted state and initialize semester
  useEffect(() => {
    setMounted(true);
    if (isLoaded && isSignedIn) {
      if (userData?.semester) {
        setSemester(userData.semester);
      }
      loadSections();
    }
  }, [isLoaded, isSignedIn, userData]);

  // Load presentation sections from the server
  const loadSections = async () => {
    try {
      setRefreshing(true);
      
      // For owner role, don't filter by semester (pass null)
      // For regular admins, filter by their selected semester
      const semesterFilter = isOwner ? null : (userData?.semester || null);
      
      const data = await getPresentationSectionsAction(false, semesterFilter);
      setSections(data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading presentation sections:", error);
      setErrorMessage("Failed to load presentation sections");
    } finally {
      setRefreshing(false);
    }
  };

  // Load groups for a section
  const loadGroupsForSection = async (sectionId: number) => {
    try {
      setLoadingGroups(true);
      const groups = await getPresentationGroupsBySectionAction(sectionId);
      setSectionGroups(prev => new Map(prev).set(sectionId, groups));
      setLoadingGroups(false);
    } catch (error) {
      console.error("Error loading section groups:", error);
      setLoadingGroups(false);
    }
  };

  // Load members for a group
  const loadGroupMembers = async (groupId: number) => {
    try {
      const members = await getPresentationGroupMembersAction(groupId);
      setGroupMembers(prev => new Map(prev).set(groupId, members));
    } catch (error) {
      console.error("Error loading group members:", error);
    }
  };

  // Load presentation file for a group
  const loadPresentationFile = async (groupId: number) => {
    try {
      const fileData = await getGroupPresentationFileAction(groupId);
      
      if (fileData) {
        setPresentationFiles(prev => {
          const newMap = new Map(prev);
          newMap.set(groupId, fileData);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error loading presentation file:', error);
    }
  };

  // Toggle section expansion
  const toggleSectionExpand = async (sectionId: number) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionId);
      // Load groups if not already loaded
      if (!sectionGroups.has(sectionId) || sectionGroups.get(sectionId)?.length === 0) {
        await loadGroupsForSection(sectionId);
      }
    }
  };

  // Toggle group expansion
  const toggleGroupExpand = async (groupId: number) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(groupId);
      // Load members if not already loaded
      if (!groupMembers.has(groupId)) {
        await loadGroupMembers(groupId);
      }
      // Load presentation file - always reload to ensure we have the latest
      await loadPresentationFile(groupId);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage("Title is required");
      setIsSubmitting(false);
      return;
    }

    if (maxMembers < 1) {
      setErrorMessage("Group must allow at least 1 member");
      setIsSubmitting(false);
      return;
    }

    // Ensure we're using the admin's current semester
    const currentSemester = userData?.semester || null;
    if (!currentSemester) {
      setErrorMessage("You must have a semester selected in your profile to create presentation sections");
      setIsSubmitting(false);
      return;
    }

    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      if (editMode && editingSectionId) {
        // Update existing section
        const success = await updatePresentationSectionAction(
          user.id,
          editingSectionId,
          {
            title: title.trim(),
            description: description.trim() || null,
            max_members: maxMembers,
            semester: currentSemester
          }
        );

        if (success) {
          setSuccessMessage("Presentation section updated successfully!");
          // Exit edit mode
          setEditMode(false);
          setEditingSectionId(null);
        } else {
          setErrorMessage("Failed to update presentation section");
        }
      } else {
        // Create new section
        const sectionId = await createPresentationSectionAction(
          user.id,
          title.trim(),
          maxMembers,
          description.trim() || null,
          currentSemester
        );

        if (sectionId) {
          setSuccessMessage("Presentation section created successfully!");
        } else {
          setErrorMessage("Failed to create presentation section");
        }
      }

      // Clear form
      setTitle("");
      setDescription("");
      setMaxMembers(3);
      // Reload sections
      loadSections();
    } catch (error) {
      console.error("Error with presentation section:", error);
      setErrorMessage("An error occurred while processing the presentation section");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle section edit
  const handleEdit = (section: PresentationSection) => {
    setTitle(section.title);
    setDescription(section.description || "");
    setMaxMembers(section.max_members);
    // Always use the currently selected semester from userData
    setSemester(userData?.semester || null);
    setEditMode(true);
    setEditingSectionId(section.id);
    setSuccessMessage("");
    setErrorMessage("");
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle section delete confirmation
  const confirmDelete = (sectionId: number) => {
    setDeleteConfirmation(sectionId);
  };

  // Handle section delete
  const handleDelete = async (sectionId: number) => {
    if (!user?.id) return;
    
    try {
      // First check if there are groups in this section
      if (!sectionGroups.has(sectionId)) {
        await loadGroupsForSection(sectionId);
      }
      
      const groups = sectionGroups.get(sectionId) || [];
      const hasGroups = groups.length > 0;
      
      const success = await deletePresentationSectionAction(user.id, sectionId);
      if (success) {
        if (hasGroups) {
          setSuccessMessage(`Section and ${groups.length} associated group${groups.length !== 1 ? 's' : ''} removed successfully`);
        } else {
        setSuccessMessage("Section removed successfully");
        }
        loadSections();
      } else {
        setErrorMessage("Failed to remove section");
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      setErrorMessage("An error occurred while removing the section");
    } finally {
      setDeleteConfirmation(null);
    }
  };

  // Renders the delete confirmation dialog
  const renderDeleteConfirmation = (section: PresentationSection) => {
    if (deleteConfirmation !== section.id) return null;
    
    // Check if there are groups in this section
    const groups = sectionGroups.get(section.id) || [];
    const hasGroups = groups.length > 0;
    
    return (
      <div className="absolute inset-0 bg-indigo-900/80 backdrop-blur-sm flex items-center justify-center z-10 p-4">
        <div className="bg-indigo-800 border border-indigo-600 rounded-lg shadow-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-bold text-indigo-50 mb-4">Confirm Deletion</h3>
          
          {hasGroups ? (
            <>
              <p className="text-indigo-200 mb-3">
                <strong className="text-red-400">Warning:</strong> This section contains {groups.length} group{groups.length !== 1 ? 's' : ''}.
              </p>
              <p className="text-indigo-200 mb-4">
                Deleting this section will permanently remove all associated groups and student data. This action cannot be undone.
              </p>
            </>
          ) : (
            <p className="text-indigo-200 mb-4">
              Are you sure you want to delete the section "{section.title}"? This action cannot be undone.
            </p>
          )}
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setDeleteConfirmation(null)}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(section.id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
            >
              {hasGroups ? "Delete Section & All Groups" : "Delete Section"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Cancel edit mode
  const cancelEdit = () => {
    setEditMode(false);
    setEditingSectionId(null);
    setTitle("");
    setDescription("");
    setMaxMembers(3);
    setSemester(userData?.semester || null);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Render section groups and members
  const renderSectionGroups = (section: PresentationSection) => {
    const isExpanded = expandedSection === section.id;
    const groups = sectionGroups.get(section.id) || [];
    
    return (
      <div className="mt-3">
        <button
          onClick={() => toggleSectionExpand(section.id)}
          className="w-full flex items-center justify-between p-2 bg-indigo-700/30 hover:bg-indigo-700/50 rounded-md text-indigo-100 text-sm transition-colors"
        >
          <span className="flex items-center">
            <UserGroup className="h-4 w-4 mr-2" />
            View Groups ({groups.length || "..."})
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-2 pl-2 border-l-2 border-indigo-700/30">
            {loadingGroups ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : groups.length === 0 ? (
              <div className="p-4 text-center text-indigo-300 bg-indigo-800/20 rounded-md">
                No groups have been created for this section yet.
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <div 
                    key={group.id}
                    className="border border-indigo-700/30 rounded-lg mb-3 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleGroupExpand(group.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-indigo-700/20 text-left transition-colors"
                    >
                      <div>
                        <div className="font-medium text-indigo-100">
                          {group.name || `Group ${group.id}`}
                        </div>
                        <div className="text-xs text-indigo-300">
                          Created: {new Date(group.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {expandedGroup === group.id ? (
                        <ChevronUp className="h-4 w-4 text-indigo-300" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-indigo-300" />
                      )}
                    </button>
                    
                    {expandedGroup === group.id && (
                      <div className="p-3 border-t border-indigo-700/20">
                        {/* Presentation File Download Section */}
                        {presentationFiles.has(group.id) ? (
                          <div className="mb-4 p-3 bg-indigo-700/20 rounded-lg">
                            <div className="flex flex-col">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <Presentation className="h-5 w-5 text-indigo-400 mr-2" />
                                  <div className="font-medium text-indigo-100">PowerPoint Presentation</div>
                                </div>
                                <span className="text-xs bg-green-600/30 px-2 py-0.5 rounded text-green-300 flex items-center">
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                  Available
                                </span>
                              </div>
                              
                              <div className="flex items-center text-xs text-indigo-300 mb-3">
                                <FileIcon className="h-4 w-4 mr-1 text-indigo-400 flex-shrink-0" />
                                <span className="truncate max-w-xs">
                                  {presentationFiles.get(group.id)?.name}
                                </span>
                                <span className="ml-auto">
                                  {new Date(presentationFiles.get(group.id)?.url.split('/').pop()?.split('-')[0] || '').toLocaleDateString()}
                                </span>
                              </div>
                              
                              <button
                                className="text-green-500 border-green-600/30 hover:bg-green-600/10 px-4 py-2 rounded-md"
                                onClick={() => {
                                  const fileData = presentationFiles.get(Number(group.id));
                                  if (!fileData) {
                                    return false;
                                  }
                                  handleDownloadFile(fileData.url, fileData.name);
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Presentation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 p-3 bg-indigo-700/10 rounded-lg">
                            <div className="flex items-center text-indigo-300">
                              <Presentation className="h-5 w-5 text-indigo-400 mr-2" />
                              <span>No presentation file uploaded yet</span>
                            </div>
                          </div>
                        )}
                        
                        {group.notes && (
                          <div className="mb-3 p-2 bg-indigo-700/20 rounded text-indigo-200 text-sm">
                            <strong>Topic:</strong> {group.notes}
                          </div>
                        )}
                        
                        <h4 className="text-sm font-medium text-indigo-200 mb-2">Members:</h4>
                        {groupMembers.has(group.id) ? (
                          <ul className="space-y-1.5">
                            {groupMembers.get(group.id)!.map(member => (
                              <li 
                                key={member.id}
                                className="flex items-center p-2 bg-indigo-700/10 rounded-md"
                              >
                                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center mr-2">
                                  <User className="h-4 w-4 text-indigo-100" />
                                </div>
                                <div>
                                  <div className="text-indigo-100 font-medium">
                                    {member.name}
                                    {member.is_creator && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-indigo-600/40 text-indigo-200 text-xs rounded-full">
                                        Creator
                                      </span>
                                    )}
                                  </div>
                                  {member.email && (
                                    <div className="text-xs text-indigo-300">{member.email}</div>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="flex justify-center py-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const downloadSectionGroupsAsExcel = async (section: PresentationSection) => {
    try {
      // Set the section as downloading
      setSectionDownloading(section.id);
      setIsDownloading(true);
      
      // Make sure we have the groups for this section
      if (!sectionGroups.has(section.id)) {
        await loadGroupsForSection(section.id);
      }
      
      const groups = sectionGroups.get(section.id) || [];
      
      // Load members for all groups if not already loaded
      for (const group of groups) {
        if (!groupMembers.has(group.id)) {
          await loadGroupMembers(group.id);
        }
      }
        
      // Create workbook and sheet
      const workbook = XLSX.utils.book_new();
      const sheetData = [
        // Header row - simplified to 3 columns
        ['Group Name', 'Name', 'Topic']
      ];
        
      // Add data rows
      for (const group of groups) {
        const members = groupMembers.get(group.id) || [];
        
        if (members.length === 0) {
          // Add a row with just the group info if no members
          sheetData.push([
            group.name || `Group ${group.id}`,
            '',
            group.notes || ''
          ]);
        } else {
          // Add a row for each member
          for (let i = 0; i < members.length; i++) {
            const member = members[i];
            sheetData.push([
              group.name || `Group ${group.id}`,  // Show group name for all rows
              member.name,
              group.notes || ''  // Show topic for all rows
            ]);
          }
        }
      }
        
      // Create sheet and add to workbook
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, `Section - ${section.title}`);
      
      // Generate and download the file using the blob method which is more reliable
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${section.title.replace(/[^a-zA-Z0-9]/g, '_')}_groups.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Set success message
      setSuccessMessage(`Downloaded data for ${groups.length} groups in ${section.title}`);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      setErrorMessage('Failed to generate Excel file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSectionDownloading(null);
      setIsDownloading(false);
    }
  };

  // Download presentation file
  const downloadFile = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadFile = (url: string, filename: string) => {
    // Use the downloadFile utility function
    downloadFile(url, filename);
  };

  // Generate semester options (1-8)
  const semesterOptions = Array.from({ length: 8 }, (_, i) => i + 1);

  // The form JSX should include the semester field
  const renderSemesterField = () => {
    if (!userData?.semester) {
      return (
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-800/30 rounded-lg">
          <p className="text-yellow-200 text-sm">
            You need to select a semester in your profile before creating presentation sections.
          </p>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-indigo-200 mb-1">
          Semester
        </label>
        <div className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-lg text-indigo-100">
          Semester {userData.semester}
        </div>
        <p className="mt-1 text-sm text-indigo-400">
          Presentation sections will be created for your currently selected semester.
        </p>
      </div>
    );
  };

  // Render sections with semester badges
  const renderSemesterBadge = (semesterNum: number | null) => {
    if (semesterNum === null) return null;
    
    return (
      <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium bg-indigo-900/30 text-indigo-200 rounded-full">
        Semester {semesterNum}
      </span>
    );
  };

  // Add console log to help with debugging
  useEffect(() => {
    if (userData) {
      console.log('User role in presentation groups admin:', userData.role);
    }
  }, [userData]);

  // Don't render anything on the server
  if (!mounted) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-indigo-100">Presentation Groups Management</h1>
          <p className="text-indigo-300 mt-1">
            Create and manage presentation groups for students
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
          Refresh
        </button>
      </div>

      {/* Semester info message */}
      {userData?.semester && (
        <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-700/30 rounded-lg flex items-start">
          <AlertCircle className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-indigo-100">
              You are currently in semester {userData.semester}
            </h3>
            <p className="text-sm text-indigo-300 mt-1">
              Groups are filtered to only show those for your selected semester. Create new groups in this semester to make them available to matching students.
            </p>
            <p className="text-sm text-indigo-300 mt-1">
              You can only create presentation sections for your currently selected semester.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create/Edit Presentation Section Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 shadow-xl p-6"
        >
          <h2 className="text-xl font-semibold text-indigo-100 mb-4">
            {editMode ? "Edit Presentation Section" : "Create New Presentation Section"}
          </h2>
          
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-800/30 rounded-lg text-green-100 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-400" />
              {successMessage}
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800/30 rounded-lg text-red-100 flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-red-400" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-indigo-200 mb-1">
                Section Title*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., ENGLISH, MATHEMATICS"
                className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70"
                required
              />
            </div>

            {/* Add semester field */}
            {renderSemesterField()}

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-indigo-200 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about this presentation section..."
                rows={3}
                className="w-full px-3 py-2 bg-indigo-800/30 border border-indigo-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-indigo-100 placeholder-indigo-400/70"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="maxMembers" className="block text-sm font-medium text-indigo-200 mb-1">
                Maximum Group Members*
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setMaxMembers(Math.max(1, maxMembers - 1))}
                  className="px-3 py-2 bg-indigo-800/50 border border-indigo-700/50 rounded-l-lg text-indigo-100 hover:bg-indigo-700/70 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  id="maxMembers"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="w-16 px-3 py-2 bg-indigo-800/30 border-y border-indigo-700/50 text-center text-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setMaxMembers(Math.min(10, maxMembers + 1))}
                  className="px-3 py-2 bg-indigo-800/50 border border-indigo-700/50 rounded-r-lg text-indigo-100 hover:bg-indigo-700/70 transition-colors"
                >
                  +
                </button>
                <span className="ml-3 text-sm text-indigo-300">students per group</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editMode ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    {editMode ? (
                      <>
                        <Pencil className="h-5 w-5 mr-2" />
                        Update Section
                      </>
                    ) : (
                      <>
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Create Section
                      </>
                    )}
                  </>
                )}
              </button>

              {editMode && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-600/60 text-white rounded-lg hover:bg-gray-500/80 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Existing Sections List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-indigo-900/40 backdrop-blur-sm rounded-xl border border-indigo-800/30 shadow-xl p-6"
        >
          <h2 className="text-xl font-semibold text-indigo-100 mb-1">
            Existing Sections
            {userData?.semester && (
              <span className="ml-2 text-base font-normal text-indigo-300">
                (Semester {userData.semester})
              </span>
            )}
          </h2>
          <p className="text-sm text-indigo-400 mb-4">
            Only showing presentation sections for your currently selected semester
          </p>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <UserGroup className="h-12 w-12 text-indigo-500 mb-4" />
              <h3 className="text-lg font-medium text-indigo-200 mb-2">No Presentation Sections Yet</h3>
              <p className="text-indigo-300">
                No presentation sections found for semester {userData?.semester}.
              </p>
              <p className="text-indigo-300 mt-2">
                Create your first presentation section using the form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-700 scrollbar-track-indigo-900/20">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="bg-indigo-800/30 border border-indigo-700/30 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-indigo-100">
                        {section.title}
                        {renderSemesterBadge(section.semester)}
                        {!section.active && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium bg-yellow-900/30 text-yellow-200 rounded-full">
                            Inactive
                          </span>
                        )}
                      </h3>
                      {section.description && (
                        <p className="text-sm text-indigo-300 mt-1">{section.description}</p>
                      )}
                      <div className="flex items-center mt-2 text-sm text-indigo-300">
                        <UserGroup className="h-4 w-4 mr-1" />
                        <span>{section.max_members} members max per group</span>
                      </div>
                      <div className="mt-2 text-xs text-indigo-400">
                        Created: {new Date(section.created_at).toLocaleDateString()}
                      </div>
                      
                      {renderSectionGroups(section)}
                    </div>
                    <div className="flex">
                      <button
                        onClick={() => downloadSectionGroupsAsExcel(section)}
                        disabled={isDownloading || sectionDownloading !== null}
                        className="p-1.5 hover:bg-green-700/50 rounded-full transition-colors"
                        title={`Download groups data for ${section.title}`}
                        aria-label="Download Excel"
                      >
                        {sectionDownloading === section.id ? (
                          <svg className="animate-spin h-5 w-5 text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-green-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(section)}
                        className="p-1.5 hover:bg-indigo-900/30 rounded-full transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-5 w-5 text-indigo-300" />
                      </button>
                      
                      {renderDeleteConfirmation(section)}
                      
                      <button
                        onClick={() => confirmDelete(section.id)}
                        className="p-1.5 hover:bg-red-900/30 rounded-full transition-colors ml-1"
                        aria-label="Delete"
                      >
                        <TrashIcon className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
} 