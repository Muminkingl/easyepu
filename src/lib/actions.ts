'use server';

import { supabase } from './supabase';

import { 
  updatePhoneNumber, 
  updateGender, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  debugUserAuth, 
  createPoll, 
  updatePoll, 
  deletePoll, 
  submitPollResponse, 
  getDetailedPollResults, 
  getPollById, 
  Poll,
  getCourseSections,
  getCourseFiles,
  getAllCourseFiles,
  createCourseSection,
  createCourseFile,
  updateCourseProgress,
  getUserCourseProgress,
  CourseSection,
  CourseFile,
  CourseProgress,
  deleteCourseSection,
  deleteCourseFile,
  createPresentationSection,
  getPresentationSections,
  createPresentationGroup,
  getPresentationGroupsBySection,
  getPresentationGroupMembers,
  getUserPresentationGroup,
  updatePresentationSection,
  deletePresentationSection,
  updatePresentationGroup,
  updatePresentationGroupMembers,
  PresentationSection,
  PresentationGroup,
  PresentationGroupMember,
  getUserData,
  UserData,
  getPollResults,
  PollResults,
  updateUsername,
  updateGroupClass,
  getCourses,
  getCourseById,
  getPollByAnnouncementId
} from './supabase';

import { 
  uploadPresentationFile, 
  updateGroupPresentationFile, 
  getGroupPresentationFile,
  deletePresentationFile,
  uploadCourseFile,
  getCourseFile,
  updateCourseFile,
  deleteCourseFile as deleteCourseFileFromStorage,
  uploadSectionFile,
  deleteSectionFile
} from './storage';

/**
 * Updates a user's phone number in the database
 * @param userId The Clerk user ID
 * @param phoneNumber The new phone number to save
 * @returns A promise that resolves to true if the update was successful
 */
export async function updateUserPhoneNumber(userId: string, phoneNumber: string): Promise<boolean> {
  try {
    // Safety checks for parameters
    if (!userId || typeof userId !== 'string') {
      console.error('SERVER ACTION: Invalid userId');
      return false;
    }
    
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.error('SERVER ACTION: Invalid phone number');
      return false;
    }
    
    if (phoneNumber.length < 8) {
      console.error('SERVER ACTION: Phone number too short');
      return false;
    }
    
    // Call the database function with the correct parameters
    return await updatePhoneNumber(userId, phoneNumber);
  } catch (error) {
    console.error('Error in updateUserPhoneNumber action:', error);
    throw new Error('Failed to update phone number');
  }
}

/**
 * Updates a user's gender in the database
 * @param userId The Clerk user ID
 * @param gender The gender to save
 * @returns A promise that resolves to true if the update was successful
 */
export async function updateUserGender(userId: string, gender: string): Promise<boolean> {
  try {
    return await updateGender(userId, gender);
  } catch (error) {
    console.error('Error in updateUserGender action:', error);
    throw new Error('Failed to update gender');
  }
}

/**
 * Creates a new announcement in the database
 * @param userId The Clerk user ID of the creator
 * @param title The announcement title
 * @param content The announcement content
 * @param published Whether the announcement is published
 * @param important Whether the announcement is important
 * @param targetAudience The target audience for the announcement
 * @returns A promise that resolves to the announcement ID if successful, or null if failed
 */
export async function createAnnouncementAction(
  userId: string,
  title: string, 
  content: string,
  published: boolean = false,
  important: boolean = false,
  targetAudience: string = 'all'
): Promise<string | null> {
  try {
    return await createAnnouncement(
      title,
      content,
      userId,
      published,
      important,
      targetAudience
    );
  } catch (error) {
    console.error('Error in createAnnouncementAction:', error);
    throw new Error('Failed to create announcement');
  }
}

/**
 * Updates an existing announcement in the database
 * @param id The announcement ID
 * @param updates The fields to update
 * @returns A promise that resolves to true if the update was successful
 */
export async function updateAnnouncementAction(
  id: string,
  updates: {
    title?: string;
    content?: string;
    published?: boolean;
    important?: boolean;
    target_audience?: string;
  }
): Promise<boolean> {
  try {
    return await updateAnnouncement(id, updates);
  } catch (error) {
    console.error('Error in updateAnnouncementAction:', error);
    throw new Error('Failed to update announcement');
  }
}

/**
 * Deletes an announcement from the database
 * @param id The announcement ID
 * @returns A promise that resolves to true if the deletion was successful
 */
export async function deleteAnnouncementAction(id: string): Promise<boolean> {
  try {
    return await deleteAnnouncement(id);
  } catch (error) {
    console.error('Error in deleteAnnouncementAction:', error);
    throw new Error('Failed to delete announcement');
  }
}

/**
 * Creates a new course in the database
 * @param userId The Clerk user ID of the creator
 * @param title The course title
 * @param description The course description
 * @param imageUrl URL to the course image
 * @param backgroundColor Background color class for the course
 * @param instructorName Name of the course instructor
 * @param instructorTitle Title/position of the instructor
 * @param instructorEmail Email of the instructor
 * @param instructorImage URL to the instructor's profile image
 * @param semester The semester for which the course is created
 * @returns A promise that resolves to the course ID if successful, null otherwise
 */
export async function createCourseAction(
  userId: string,
  title: string,
  description: string | null = null,
  imageUrl: string | null = null,
  backgroundColor: string = 'bg-gray-300',
  instructorName: string | null = null,
  instructorTitle: string | null = null,
  instructorEmail: string | null = null,
  instructorImage: string | null = null,
  semester: number = 1
): Promise<string | null> {
  try {
    const result = await createCourse(
      title,
      description,
      imageUrl,
      backgroundColor,
      userId,
      instructorName,
      instructorTitle,
      instructorEmail,
      instructorImage,
      semester
    );
    
    if (!result) {
      console.error('Course creation failed - returned null from createCourse');
    }
    
    return result;
  } catch (error) {
    console.error('Error in createCourseAction:', error);
    throw new Error('Failed to create course');
  }
}

/**
 * Updates an existing course in the database
 * @param id The course ID
 * @param updates The fields to update
 * @returns A promise that resolves to true if the update was successful
 */
export async function updateCourseAction(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    image_url?: string | null;
    background_color?: string;
    active?: boolean;
    instructor_name?: string | null;
    instructor_title?: string | null;
    instructor_email?: string | null;
    instructor_image?: string | null;
  }
): Promise<boolean> {
  try {
    return await updateCourse(id, updates);
  } catch (error) {
    console.error('Error in updateCourseAction:', error);
    throw new Error('Failed to update course');
  }
}

/**
 * Deletes a course from the database
 * @param id The course ID
 * @returns A promise that resolves to true if the deletion was successful
 */
export async function deleteCourseAction(id: string): Promise<boolean> {
  try {
    return await deleteCourse(id);
  } catch (error) {
    console.error('Error in deleteCourseAction:', error);
    throw new Error('Failed to delete course');
  }
}

/**
 * Debug function to check user auth and admin status
 * @param userId The Clerk user ID 
 * @returns Debug information about user authorization
 */
export async function debugAdminAuth(userId: string): Promise<any> {
  try {
    return await debugUserAuth(userId);
  } catch (error) {
    console.error('Error in debugAdminAuth:', error);
    throw new Error('Failed to debug auth');
  }
}

/**
 * Creates a poll for an announcement
 * @param announcementId The announcement ID
 * @param title The poll title
 * @param options Array of option texts
 * @param description Optional description
 * @param isActive Whether the poll is active
 * @param endsAt Optional end date for the poll
 * @returns A promise that resolves to the poll ID if successful
 */
export async function createPollAction(
  announcementId: string,
  title: string,
  options: string[],
  description: string | null = null,
  isActive: boolean = true,
  endsAt: string | null = null
): Promise<string | null> {
  try {
    return await createPoll(
      announcementId,
      title,
      options,
      description,
      isActive,
      endsAt
    );
  } catch (error) {
    console.error('Error in createPollAction:', error);
    throw new Error('Failed to create poll');
  }
}

/**
 * Updates a poll
 * @param id The poll ID
 * @param updates The fields to update
 * @returns A promise that resolves to true if successful
 */
export async function updatePollAction(
  id: string,
  updates: {
    title?: string;
    description?: string | null;
    options?: string[];
    is_active?: boolean;
    ends_at?: string | null;
  }
): Promise<boolean> {
  try {
    return await updatePoll(id, updates);
  } catch (error) {
    console.error('Error in updatePollAction:', error);
    throw new Error('Failed to update poll');
  }
}

/**
 * Deletes a poll
 * @param id The poll ID
 * @returns A promise that resolves to true if successful
 */
export async function deletePollAction(id: string): Promise<boolean> {
  try {
    return await deletePoll(id);
  } catch (error) {
    console.error('Error in deletePollAction:', error);
    throw new Error('Failed to delete poll');
  }
}

/**
 * Submits a response to a poll
 * @param pollId The poll ID
 * @param userId The user ID
 * @param selectedOption The index of the selected option
 * @returns A promise that resolves to true if successful
 */
export async function submitPollResponseAction(
  pollId: string,
  userId: string,
  selectedOption: number
): Promise<boolean> {
  try {
    // First get the user data to ensure we have the most up-to-date information
    const userData = await getUserData(userId);
    
    // Submit poll response with all available user data
    return await submitPollResponse(
      pollId, 
      userId, 
      selectedOption.toString(),
      userData?.username,
      userData?.email,
      userData?.gender,
      userData?.group_class
    );
  } catch (error) {
    console.error('Error in submitPollResponseAction:', error);
    throw new Error('Failed to submit poll response');
  }
}

/**
 * Gets detailed poll results including user data for admin
 * @param pollId The poll ID
 * @returns A promise that resolves to the detailed poll results if successful
 */
export async function getDetailedPollResultsAction(pollId: string): Promise<any> {
  try {
    // Directly fetch detailed results with user data
    const detailedResults = await getDetailedPollResults(pollId);
    
    // Use fallback only if detailed results fail
    if (!detailedResults) {
      console.warn('Detailed poll results failed, falling back to basic results');
      
      try {
        const basicResults = await getPollResults(pollId);
        return {
          ...basicResults,
          user_data: [] // Empty user data for basic results
        };
      } catch (basicError) {
        console.error('Even basic poll results failed:', basicError);
        return {
          total_votes: 0,
          options: [],
          user_data: []
        };
      }
    }
    
    return detailedResults;
  } catch (error) {
    if (error instanceof Error) {
      // Only log error message, not full error object to reduce console spam
      console.error('Error in getDetailedPollResultsAction:', error.message);
    }
    // Return empty result object instead of throwing error
    return {
      total_votes: 0,
      options: [],
      user_data: []
    };
  }
}

/**
 * Gets a poll by ID
 * @param pollId The poll ID
 * @returns A promise that resolves to the poll if successful
 */
export async function getPollByIdAction(pollId: string): Promise<Poll | null> {
  try {
    // Simple fetch without cache key parameter
    return await getPollById(pollId);
  } catch (error) {
    console.error('Error in getPollByIdAction:', error);
    throw new Error('Failed to get poll');
  }
}

/**
 * Get course sections for a specific course
 * @param courseId The course ID
 * @returns A promise that resolves to an array of course sections
 */
export async function getCourseSectionsAction(courseId: string): Promise<CourseSection[]> {
  try {
    return await getCourseSections(courseId);
  } catch (error) {
    console.error('Error in getCourseSectionsAction:', error);
    throw new Error('Failed to get course sections');
  }
}

/**
 * Get files for a specific course section
 * @param sectionId The section ID
 * @returns A promise that resolves to an array of course files
 */
export async function getCourseFilesAction(sectionId: string): Promise<CourseFile[]> {
  try {
    return await getCourseFiles(sectionId);
  } catch (error) {
    console.error('Error in getCourseFilesAction:', error);
    throw new Error('Failed to get course files');
  }
}

/**
 * Get all files for a course
 * @param courseId The course ID
 * @returns A promise that resolves to an array of course files
 */
export async function getAllCourseFilesAction(courseId: string): Promise<CourseFile[]> {
  try {
    return await getAllCourseFiles(courseId);
  } catch (error) {
    console.error('Error in getAllCourseFilesAction:', error);
    throw new Error('Failed to get all course files');
  }
}

/**
 * Create a new course section
 * @param courseId The course ID
 * @param title The section title
 * @param orderIndex The order index (position) of the section
 * @returns A promise that resolves to the section ID if successful
 */
export async function createCourseSectionAction(
  courseId: string,
  title: string,
  orderIndex: number = 0
): Promise<string | null> {
  try {
    return await createCourseSection(courseId, title, orderIndex);
  } catch (error) {
    console.error('Error in createCourseSectionAction:', error);
    throw new Error('Failed to create course section');
  }
}

/**
 * Create a new course file
 * @param sectionId The section ID
 * @param title The file title
 * @param fileType The file type (extension)
 * @param fileSize The file size (formatted string)
 * @param fileUrl Optional URL to the file
 * @param orderIndex The order index (position) of the file
 * @returns A promise that resolves to the file ID if successful
 */
export async function createCourseFileAction(
  sectionId: string,
  title: string,
  fileType: string,
  fileSize: string,
  fileUrl: string | null = null,
  orderIndex: number = 0
): Promise<string | null> {
  try {
    return await createCourseFile(sectionId, title, fileType, fileSize, fileUrl, orderIndex);
  } catch (error) {
    console.error('Error in createCourseFileAction:', error);
    throw new Error('Failed to create course file');
  }
}

/**
 * Update course progress for a user
 * @param userId The user ID
 * @param courseId The course ID
 * @param fileId The file ID
 * @param completed Whether the file is completed
 * @returns A promise that resolves to true if successful
 */
export async function updateCourseProgressAction(
  userId: string,
  courseId: string,
  fileId: string,
  completed: boolean
): Promise<boolean> {
  try {
    return await updateCourseProgress(userId, courseId, fileId, completed);
  } catch (error) {
    console.error('Error in updateCourseProgressAction:', error);
    throw new Error('Failed to update course progress');
  }
}

/**
 * Get course progress for a user
 * @param userId The user ID
 * @param courseId The course ID
 * @returns A promise that resolves to an array of course progress objects
 */
export async function getUserCourseProgressAction(
  userId: string,
  courseId: string
): Promise<CourseProgress[]> {
  try {
    return await getUserCourseProgress(userId, courseId);
  } catch (error) {
    console.error('Error in getUserCourseProgressAction:', error);
    throw new Error('Failed to get user course progress');
  }
}

/**
 * Delete a course section and all its files
 * @param id The section ID
 * @returns A promise that resolves to true if the deletion was successful
 */
export async function deleteCourseSectionAction(id: string): Promise<boolean> {
  try {
    return await deleteCourseSection(id);
  } catch (error) {
    console.error('Error in deleteCourseSectionAction:', error);
    throw new Error('Failed to delete course section');
  }
}

/**
 * Delete a course file
 * @param id The file ID
 * @returns A promise that resolves to true if the deletion was successful
 */
export async function deleteCourseFileAction(id: string): Promise<boolean> {
  try {
    return await deleteCourseFileFromStorage(id);
  } catch (error) {
    console.error('Error in deleteCourseFileAction:', error);
    throw new Error('Failed to delete course file');
  }
}

/**
 * Function to create a new presentation section (admin)
 * @param adminId The admin ID
 * @param title The section title
 * @param maxMembers The maximum number of members in the section
 * @param description Optional section description
 * @param semester Optional semester number
 * @returns A promise that resolves to the section ID if successful, or null if failed
 */
export async function createPresentationSectionAction(
  adminId: string,
  title: string,
  maxMembers: number,
  description: string | null = null,
  semester: number | null = null
): Promise<number | null> {
  try {
    return await createPresentationSection(adminId, title, maxMembers, description, semester);
  } catch (error) {
    console.error('Error in createPresentationSectionAction:', error);
    throw new Error('Failed to create presentation section');
  }
}

/**
 * Function to get all presentation sections
 * @param activeOnly Whether to only get active sections
 * @param semester Optional semester filter
 * @returns A promise that resolves to an array of presentation sections
 */
export async function getPresentationSectionsAction(
  activeOnly: boolean = true,
  semester: number | null = null
): Promise<PresentationSection[]> {
  try {
    // Get the user role from context, using admin check function
    let userRole = 'student';
    
    // We can't get the user role here since we don't have the user ID
    // Instead, rely on the caller to pass the correct role if needed
    
    // Filter sections by semester when provided
    const sections = await getPresentationSections(activeOnly, semester);
    
    // Double check that we're filtering correctly when we have a semester filter
    if (semester !== null) {
      const mismatchSections = sections.filter(s => s.semester !== semester);
      if (mismatchSections.length > 0) {
        // Filter out sections with wrong semester (in case server filtering failed)
        const filteredSections = sections.filter(s => s.semester === semester);
        return filteredSections;
      }
    }
    
    return sections;
  } catch (error) {
    console.error('Error in getPresentationSectionsAction:', error);
    throw new Error('Failed to fetch presentation sections');
  }
}

/**
 * Function to create a presentation group (student)
 * @param userId The user ID
 * @param sectionId The section ID
 * @param groupName Optional group name
 * @param notes Optional group notes
 * @param members Array of member objects
 * @returns A promise that resolves to the group ID if successful, or null if failed
 */
export async function createPresentationGroupAction(
  userId: string,
  sectionId: number,
  groupName: string | null = null,
  notes: string | null = null,
  members: { name: string; email?: string | null }[] = []
): Promise<number | null> {
  try {
    // First check if the user is already in a group for this section
    const existingGroupId = await getUserPresentationGroupAction(userId, sectionId);
    if (existingGroupId) {
      // We'll now return null instead of the existing ID to indicate "failure to create"
      // This makes it clear to the UI that the user couldn't create a new group
      // The UI should check for group membership separately before attempting creation
      return null;
    }
    
    // If not in a group already, create a new one
    const result = await createPresentationGroup(userId, sectionId, groupName, notes, members);
    return result;
  } catch (error) {
    console.error('Error in createPresentationGroupAction:', error);
    throw new Error('Failed to create presentation group');
  }
}

/**
 * Function to get presentation groups by section
 * @param sectionId The section ID
 * @returns A promise that resolves to an array of presentation groups
 */
export async function getPresentationGroupsBySectionAction(
  sectionId: number
): Promise<PresentationGroup[]> {
  try {
    return await getPresentationGroupsBySection(sectionId);
  } catch (error) {
    console.error('Error in getPresentationGroupsBySectionAction:', error);
    throw new Error('Failed to fetch presentation groups');
  }
}

/**
 * Function to get members of a presentation group
 * @param groupId The group ID
 * @returns A promise that resolves to an array of presentation group members
 */
export async function getPresentationGroupMembersAction(
  groupId: number
): Promise<PresentationGroupMember[]> {
  try {
    return await getPresentationGroupMembers(groupId);
  } catch (error) {
    console.error('Error in getPresentationGroupMembersAction:', error);
    throw new Error('Failed to fetch presentation group members');
  }
}

/**
 * Function to check if user is already in a group for a section
 * @param userId The user ID
 * @param sectionId The section ID
 * @returns A promise that resolves to the group ID if successful, or null if failed
 */
export async function getUserPresentationGroupAction(
  userId: string,
  sectionId: number
): Promise<number | null> {
  try {
    return await getUserPresentationGroup(userId, sectionId);
  } catch (error) {
    console.error('Error in getUserPresentationGroupAction:', error);
    throw new Error('Failed to check user presentation group');
  }
}

/**
 * Function to update a presentation section (admin)
 * @param adminId The admin ID
 * @param sectionId The section ID
 * @param updates The updates to apply
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function updatePresentationSectionAction(
  adminId: string,
  sectionId: number,
  updates: {
    title?: string;
    description?: string | null;
    max_members?: number;
    active?: boolean;
    semester?: number | null;
  }
): Promise<boolean> {
  try {
    return await updatePresentationSection(adminId, sectionId, updates);
  } catch (error) {
    console.error('Error in updatePresentationSectionAction:', error);
    throw new Error('Failed to update presentation section');
  }
}

/**
 * Function to delete a presentation section (admin)
 * @param adminId The admin ID
 * @param sectionId The section ID
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function deletePresentationSectionAction(
  adminId: string,
  sectionId: number
): Promise<boolean> {
  try {
    return await deletePresentationSection(adminId, sectionId);
  } catch (error) {
    console.error('Error in deletePresentationSectionAction:', error);
    throw new Error('Failed to delete presentation section');
  }
}

/**
 * Function to update a presentation group (student)
 * @param userId The user ID (must be the group creator)
 * @param groupId The group ID
 * @param updates The updates to apply
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function updatePresentationGroupAction(
  userId: string,
  groupId: number,
  updates: {
    name?: string | null;
    notes?: string | null;
  }
): Promise<boolean> {
  try {
    return await updatePresentationGroup(userId, groupId, updates);
  } catch (error) {
    console.error('Error in updatePresentationGroupAction:', error);
    throw new Error('Failed to update presentation group');
  }
}

/**
 * Function to update presentation group members
 * @param userId The user ID (must be the group creator)
 * @param groupId The group ID
 * @param members The updated list of members
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function updatePresentationGroupMembersAction(
  userId: string,
  groupId: number,
  members: { id?: number; name: string; email?: string | null }[]
): Promise<boolean> {
  try {
    // First check which section this group belongs to so we can enforce member limits
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    // Get the section ID and max members limit
    const { data: groupData, error: groupError } = await supabase
      .from('presentation_groups')
      .select('section_id')
      .eq('id', groupId)
      .single();
      
    if (groupError || !groupData) {
      console.error('Error fetching group data:', groupError);
      return false;
    }
    
    const sectionId = groupData.section_id;
    
    const { data: sectionData, error: sectionError } = await supabase
      .from('presentation_sections')
      .select('max_members')
      .eq('id', sectionId)
      .single();
      
    if (sectionError || !sectionData) {
      console.error('Error fetching section data:', sectionError);
      return false;
    }
    
    // Check if the member count exceeds the maximum allowed
    // Remember that the creator counts as one member
    if (members.length + 1 > sectionData.max_members) {
      console.error(`Too many members. Maximum allowed is ${sectionData.max_members} (including creator)`);
      return false;
    }
    
    // Now update the members
    const success = await updatePresentationGroupMembers(userId, groupId, members);

    // If regular update failed, try a more direct approach using SQL
    if (!success) {
      console.log('Regular update failed, trying direct SQL update...');
      
      // First verify user is creator
      const { data: membership, error: membershipError } = await supabase
        .from('presentation_group_members')
        .select('user_id, is_creator')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership || !membership.is_creator) {
        console.error('Error verifying creator status for direct update');
        return false;
      }
      
      // Try updating each member directly through SQL
      let allSucceeded = true;
      
      for (const member of members) {
        if (member.id) {
          // Try to update existing member using direct SQL
          try {
            const { data, error } = await supabase.rpc('direct_update_member', {
              p_member_id: member.id,
              p_name: member.name.trim(),
              p_email: member.email || null
            });
            
            if (error) {
              console.error(`Direct SQL update failed for member ${member.id}:`, error);
              allSucceeded = false;
            } else {
              console.log(`Direct SQL update succeeded for member ${member.id}`);
            }
          } catch (directUpdateError) {
            console.error(`Exception in direct SQL update for member ${member.id}:`, directUpdateError);
            allSucceeded = false;
          }
        } else {
          // Try to insert new member using direct SQL
          try {
            const { data, error } = await supabase.rpc('direct_insert_member', {
              p_group_id: groupId,
              p_name: member.name.trim(),
              p_email: member.email || null
            });
            
            if (error) {
              console.error(`Direct SQL insert failed for new member:`, error);
              allSucceeded = false;
            } else {
              console.log(`Direct SQL insert succeeded for new member`);
            }
          } catch (directInsertError) {
            console.error(`Exception in direct SQL insert for new member:`, directInsertError);
            allSucceeded = false;
          }
        }
      }
      
      return allSucceeded;
    }
    
    return success;
  } catch (error) {
    console.error('Error in updatePresentationGroupMembersAction:', error);
    throw new Error('Failed to update presentation group members');
  }
}

/**
 * Function to get user data by clerk ID
 * @param clerkId The clerk ID of the user
 * @returns A promise that resolves to the user data if successful, or null if failed
 */
export async function getUserDataAction(clerkId: string): Promise<UserData | null> {
  try {
    return await getUserData(clerkId);
  } catch (error) {
    console.error('Error in getUserDataAction:', error);
    throw new Error('Failed to get user data');
  }
}

/**
 * Gets poll results 
 * @param pollId The poll ID
 * @returns A promise that resolves to the poll results if successful
 */
export async function getPollResultsAction(pollId: string): Promise<PollResults | null> {
  try {
    return await getPollResults(pollId);
  } catch (error) {
    console.error('Error in getPollResultsAction:', error);
    throw new Error('Failed to get poll results');
  }
}

/**
 * Function to upload a presentation file for a group
 * @param userId The user ID (must be the group creator)
 * @param groupId The group ID
 * @param file The file to upload
 * @returns A promise that resolves to the file URL if successful, or null if failed
 */
export async function uploadPresentationFileAction(
  userId: string,
  groupId: number,
  file: File
): Promise<string | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }
    
    // Check if user is in the group and is the creator
    const { data: membership, error: membershipError } = await supabase
      .from('presentation_group_members')
      .select('user_id, is_creator')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      console.error('Error checking user membership:', membershipError);
      return null;
    }

    if (!membership || !membership.is_creator) {
      console.error('User is not the creator of this group');
      return null;
    }

    // Upload the file to storage using our Firebase wrapper
    const fileUrl = await uploadPresentationFile(file, groupId);
    if (!fileUrl) {
      return null;
    }

    // Update the group with the file URL
    const success = await updateGroupPresentationFile(groupId, fileUrl, file.name);
    if (!success) {
      // If failed to update the group, try to delete the uploaded file
      await deletePresentationFile(fileUrl);
      return null;
    }

    return fileUrl;
  } catch (error) {
    console.error('Error in uploadPresentationFileAction:', error);
    return null;
  }
}

/**
 * Function to get a presentation file for a group
 * @param groupId The group ID
 * @returns A promise that resolves to the file URL and name if successful, or null if failed
 */
export async function getGroupPresentationFileAction(
  groupId: number
): Promise<{ url: string; name: string } | null> {
  try {
    return await getGroupPresentationFile(groupId);
  } catch (error) {
    console.error('Error in getGroupPresentationFileAction:', error);
    return null;
  }
}

/**
 * Function to upload a course file
 * @param userId The user ID (must be an admin and the course creator)
 * @param courseId The course ID
 * @param file The file to upload
 * @returns A promise that resolves to the file URL if successful, or null if failed
 */
export async function uploadCourseFileAction(
  userId: string,
  courseId: string,
  file: File
): Promise<string | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    // Check if user is an admin
    const { data: userData, error: userError } = await supabase
      .from('user_role')
      .select('user_id, role')
      .eq('user_id', userId)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      console.error('User is not an admin');
      return null;
    }

    // Check if user is the creator of the course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, created_by')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      console.error('Course not found');
      return null;
    }
    
    if (courseData.created_by !== userId) {
      console.error('User is not the creator of this course');
      return null;
    }

    // Upload the file to storage
    const fileUrl = await uploadCourseFile(file, courseId);
    if (!fileUrl) {
      return null;
    }

    // Update the course with the file URL
    const success = await updateCourseFile(courseId, fileUrl, file.name);
    if (!success) {
      // If failed to update the course, try to delete the uploaded file
      await deleteCourseFileFromStorage(fileUrl);
      return null;
    }

    return fileUrl;
  } catch (error) {
    console.error('Error in uploadCourseFileAction:', error);
    return null;
  }
}

/**
 * Function to get a course file
 * @param courseId The course ID
 * @returns A promise that resolves to the file URL and name if successful, or null if failed
 */
export async function getCourseFileAction(
  courseId: string
): Promise<{ url: string; name: string } | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }
    
    return await getCourseFile(courseId);
  } catch (error) {
    console.error('Error in getCourseFileAction:', error);
    return null;
  }
}

/**
 * Upload a section file
 * @param file The file to upload
 * @param sectionId The section ID
 * @returns A promise that resolves to the file data if successful
 */
export async function uploadSectionFileAction(
  file: File,
  sectionId: string
): Promise<{ url: string; type: string; size: string } | null> {
  try {
    // Call the storage function directly instead of using the API
    const result = await uploadSectionFile(file, sectionId);
    
    if (!result) {
      console.error('Failed to upload file using direct storage function');
      return null;
    }
    
    return result;
  } catch (error) {
    console.error('Error in uploadSectionFileAction:', error);
    return null;
  }
} 