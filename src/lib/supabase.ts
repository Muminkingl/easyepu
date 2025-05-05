import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase environment variables are set
const isSupabaseConfigured = supabaseUrl && supabaseKey;

// Initialize Supabase client conditionally
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Types for user roles
export type UserRole = 'admin' | 'student';

// Type for user data
export type UserData = {
  clerk_id: string;
  email: string;
  username?: string | null;
  phone_number?: string | null;
  gender?: string | null;
  group_class?: string | null;
  role?: UserRole;
  created_at?: string;
};

// Type for announcements
export type Announcement = {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  important: boolean;
  target_audience: string;
};

// Type for polls
export type Poll = {
  id: string;
  announcement_id: string;
  title: string;
  description: string | null;
  options: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ends_at: string | null;
};

// Type for poll responses
export type PollResponse = {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: number;
  created_at: string;
  username?: string | null;
  email?: string | null;
  gender?: string | null;
  group_class?: string | null;
};

// Type for poll results
export type PollResults = {
  total_votes: number;
  options: {
    text: string;
    votes: number;
    percentage: number;
  }[];
  // Add optional fields that may be used in the UI
  votes_by_gender?: {
    male: number;
    female: number;
    other: number;
  };
  votes_by_option?: Record<number, number>;
};

// Enhanced PollResults type to include user information
export type EnhancedPollResults = PollResults & {
  user_data?: {
    user_id: string;
    selected_option: number;
    gender?: string;
    email?: string;
    username?: string | null;
    group_class?: string | null;
  }[];
};

// Type for courses
export type Course = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  background_color: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  active: boolean;
  instructor_name: string | null;
  instructor_title: string | null;
  instructor_email: string | null;
  instructor_image: string | null;
};

// Type for course sections
export type CourseSection = {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// Type for course files
export type CourseFile = {
  id: string;
  section_id: string;
  title: string;
  file_type: string;
  file_size: string;
  file_url: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// Type for tracking course progress
export type CourseProgress = {
  id: string;
  user_id: string;
  course_id: string;
  file_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Add these types to the existing types section
export type PresentationSection = {
  id: number;
  title: string;
  description: string | null;
  max_members: number;
  created_at: string;
  created_by: string;
  active: boolean;
};

export type PresentationGroup = {
  id: number;
  section_id: number;
  name: string | null;
  created_at: string;
  created_by: string;
  notes: string | null;
};

export type PresentationGroupMember = {
  id: number;
  group_id: number;
  user_id: string | null;
  name: string;
  email: string | null;
  is_creator: boolean;
  joined_at: string;
};

// Function to get user data from Supabase
export async function getUserData(clerkId: string): Promise<UserData | null> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();
    
    if (error) {
      // Log more detailed error info
      console.error('Error fetching user data:', error.message);
      return null;
    }
    
    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching user data:', errorMessage);
    return null;
  }
}

// Function to get all users from Supabase
export async function getAllUsers(): Promise<UserData[]> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching all users:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching all users:', errorMessage);
    return [];
  }
}

// Function to get user role from Supabase
export async function getUserRole(clerkId: string): Promise<UserRole> {
  try {
    // First try to get user data by Clerk ID
    const userData = await getUserData(clerkId);
    
    if (userData) {
      return userData.role || 'student';
    } else {
      return 'student';
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching user role:', errorMessage);
    return 'student'; // Default to student on error
  }
}

// Function to get user role by email
export async function getUserRoleByEmail(email: string): Promise<UserRole> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return 'student';
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .single();
    
    if (error) {
      console.error('Error getting role by email:', error.message);
      return 'student';
    }
    
    return data?.role || 'student';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error getting role by email:', errorMessage);
    return 'student';
  }
}

// Function to update username
export async function updateUsername(clerkId: string, username: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Check if username is already taken
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('clerk_id')
      .eq('username', username)
      .not('clerk_id', 'eq', clerkId)
      .single();

    if (existingUser) {
      console.error('Username already taken');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({
        username,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkId);

    if (error) {
      console.error('Error updating username:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating username:', errorMessage);
    return false;
  }
}

// Function to update phone number
export async function updatePhoneNumber(clerkId: string, phoneNumber: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Safety check for parameters
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      console.error('Invalid phone number parameter');
      return false;
    }
    
    if (!clerkId || typeof clerkId !== 'string') {
      console.error('Invalid clerkId parameter');
      return false;
    }
    
    // More thorough sanitization - keep only digits
    const sanitizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    // Handle various phone formats
    let finalPhoneNumber = sanitizedPhoneNumber;
    
    // If number starts with 964 (country code for Iraq), remove it
    if (sanitizedPhoneNumber.startsWith('964')) {
      finalPhoneNumber = '0' + sanitizedPhoneNumber.substring(3);
    } 
    // If number doesn't start with 0, add it
    else if (!sanitizedPhoneNumber.startsWith('0') && sanitizedPhoneNumber.length > 0) {
      finalPhoneNumber = '0' + sanitizedPhoneNumber;
    }
    
    // Ensure it starts with 07
    if (finalPhoneNumber.length > 0 && !finalPhoneNumber.startsWith('07')) {
      if (finalPhoneNumber.startsWith('0')) {
        finalPhoneNumber = '07' + finalPhoneNumber.substring(1);
      } else {
        finalPhoneNumber = '07' + finalPhoneNumber;
      }
    }
    
    // Validate Iraq phone number format (starts with 07 and has 11 digits)
    const phoneRegex = /^07\d{9}$/;
    if (!phoneRegex.test(finalPhoneNumber)) {
      console.error('Invalid phone number format. Must start with 07 and have 11 digits total.');
      return false;
    }

    const { error } = await supabase
      .from('users')
      .update({
        phone_number: finalPhoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', clerkId);

    if (error) {
      console.error('Supabase update error:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating phone number:', errorMessage);
    return false;
  }
}

// Function to update gender
export async function updateGender(clerkId: string, gender: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }
    
    const { error } = await supabase
      .from('users')
      .update({ gender })
      .eq('clerk_id', clerkId);
    
    if (error) {
      console.error('Error updating user gender:', error.message);
      return false;
    }
    
    return true;
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating user gender:', errorMessage);
    return false;
  }
}

// Function to update group class
export async function updateGroupClass(clerkId: string, groupClass: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }
    
    const { error } = await supabase
      .from('users')
      .update({ group_class: groupClass })
      .eq('clerk_id', clerkId);
    
    if (error) {
      console.error('Error updating user group class:', error.message);
      return false;
    }
    
    return true;
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error updating user group class:', errorMessage);
    return false;
  }
}

// Function to create or update user in Supabase
export async function upsertUser(userData: UserData): Promise<boolean> {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables. User will not be saved to database.');
      return false;
    }
    
    // First check if the 'users' table exists
    const { error: tableCheckError } = await supabase
      .from('users')
      .select('clerk_id')
      .limit(1)
      .throwOnError();
    
    if (tableCheckError) {
      // Handle error without accessing potentially non-existent properties
      console.error('Table check error:', JSON.stringify(tableCheckError));
      console.warn('The users table might not exist in your Supabase database');
      return false;
    }
    
    // Check if user already exists and get their current role
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('clerk_id', userData.clerk_id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected for new users
      console.error('Error fetching existing user:', fetchError.message);
    }
    
    // Only update the role if it's explicitly provided, otherwise preserve the existing role
    const roleToUse = userData.role || (existingUser?.role || 'student');
    
    const { error } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: userData.clerk_id,
          email: userData.email,
          username: userData.username,
          phone_number: userData.phone_number,
          gender: userData.gender,
          role: roleToUse,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'clerk_id' }
      );
    
    if (error) {
      console.error('Error upserting user:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error upserting user:', errorMessage);
    return false;
  }
}

// Function to get all announcements
export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getAnnouncements:', errorMessage);
    return [];
  }
}

// Function to create a new announcement
export async function createAnnouncement(
  title: string,
  content: string,
  createdBy: string,
  published: boolean = false,
  important: boolean = false,
  targetAudience: string = 'all'
): Promise<string | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        created_by: createdBy,
        published,
        important,
        target_audience: targetAudience,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating announcement:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in createAnnouncement:', errorMessage);
    return null;
  }
}

// Function to update an announcement
export async function updateAnnouncement(
  id: string,
  updates: Partial<Omit<Announcement, 'id' | 'created_by' | 'created_at'>>
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { error } = await supabase
      .from('announcements')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating announcement:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updateAnnouncement:', errorMessage);
    return false;
  }
}

// Function to delete an announcement
export async function deleteAnnouncement(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting announcement:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deleteAnnouncement:', errorMessage);
    return false;
  }
}

// Function to get all courses
export async function getCourses(): Promise<Course[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('active', true)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getCourses:', errorMessage);
    return [];
  }
}

// Function to get all courses for admin, including inactive ones
export async function getAdminCourses(): Promise<Course[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching admin courses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getAdminCourses:', errorMessage);
    return [];
  }
}

// Function to get a single course by ID
export async function getCourseById(id: string): Promise<Course | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching course:', error);
      return null;
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getCourseById:', errorMessage);
    return null;
  }
}

// Function to create a new course
export async function createCourse(
  title: string,
  description: string | null,
  imageUrl: string | null,
  backgroundColor: string,
  createdBy: string,
  instructorName: string | null = null,
  instructorTitle: string | null = null,
  instructorEmail: string | null = null,
  instructorImage: string | null = null
): Promise<string | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    console.log('Creating course with creator ID:', createdBy);

    // Get user role first to check if admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, clerk_id')
      .eq('clerk_id', createdBy)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }

    if (userData?.role !== 'admin') {
      console.error('User is not an admin. Role:', userData?.role);
      return null;
    }

    // Direct insert bypassing RLS
    const { data, error } = await supabase
      .from('courses')
      .insert({
        title,
        description, 
        image_url: imageUrl,
        background_color: backgroundColor,
        created_by: createdBy,
        instructor_name: instructorName,
        instructor_title: instructorTitle,
        instructor_email: instructorEmail,
        instructor_image: instructorImage
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating course:', error);
      
      // Fallback: Try direct SQL insert if RLS is the issue
      const { data: sqlData, error: sqlError } = await supabase
        .rpc('insert_course', {
          p_title: title,
          p_description: description,
          p_image_url: imageUrl,
          p_background_color: backgroundColor,
          p_created_by: createdBy,
          p_instructor_name: instructorName,
          p_instructor_title: instructorTitle,
          p_instructor_email: instructorEmail,
          p_instructor_image: instructorImage
        });
      
      if (sqlError) {
        console.error('Fallback SQL insert also failed:', sqlError);
        return null;
      }
      
      return sqlData;
    }

    return data?.id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in createCourse:', errorMessage);
    return null;
  }
}

// Function to update a course
export async function updateCourse(
  id: string,
  updates: Partial<Omit<Course, 'id' | 'created_by' | 'created_at'>>
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { error } = await supabase
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating course:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updateCourse:', errorMessage);
    return false;
  }
}

// Function to delete a course
export async function deleteCourse(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deleteCourse:', errorMessage);
    return false;
  }
}

// Debug function to check user role and auth status
export async function debugUserAuth(userId: string): Promise<any> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return { error: 'Supabase not configured' };
    }

    // 1. Check if the user exists in the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return { 
        error: 'Failed to fetch user data',
        details: userError,
        userId
      };
    }

    // 2. Get current auth status
    const { data: sessionData } = await supabase.auth.getSession();
    
    // 3. Check RLS verification directly
    const { data: rlsCheckData, error: rlsCheckError } = await supabase.rpc(
      'check_is_admin', 
      { user_id: userId }
    );

    return {
      userData,
      authStatus: {
        hasSession: !!sessionData?.session,
        userId: sessionData?.session?.user?.id || null,
      },
      rlsCheck: {
        result: rlsCheckData,
        error: rlsCheckError
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in debugUserAuth:', errorMessage);
    return { error: errorMessage };
  }
}

// Function to create a poll
export async function createPoll(
  announcementId: string,
  title: string,
  options: string[],
  description: string | null = null,
  isActive: boolean = true,
  endsAt: string | null = null
): Promise<string | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('polls')
      .insert({
        announcement_id: announcementId,
        title,
        description,
        options,
        is_active: isActive,
        ends_at: endsAt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating poll:', error.message);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating poll:', errorMessage);
    return null;
  }
}

// Function to update a poll
export async function updatePoll(
  id: string,
  updates: Partial<Omit<Poll, 'id' | 'announcement_id' | 'created_at'>>
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { error } = await supabase
      .from('polls')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating poll:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updatePoll:', errorMessage);
    return false;
  }
}

// Function to delete a poll
export async function deletePoll(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting poll:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deletePoll:', errorMessage);
    return false;
  }
}

// Function to get a poll by ID
export async function getPollById(id: string): Promise<Poll | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    // Query the poll without the problematic options call
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching poll by ID:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching poll by ID:', errorMessage);
    return null;
  }
}

// Function to get a poll by announcement ID
export async function getPollByAnnouncementId(announcementId: string): Promise<Poll | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('announcement_id', announcementId)
      .single();

    if (error) {
      console.error('Error fetching poll by announcement ID:', error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching poll by announcement ID:', errorMessage);
    return null;
  }
}

// Function to submit a poll response
export async function submitPollResponse(
  pollId: string,
  userId: string,
  response: string,
  username?: string | null,
  email?: string | null,
  gender?: string | null,
  groupClass?: string | null
): Promise<boolean> {
  try {
    // Always require at least userId and response
    if (!pollId || !userId || !response || !supabase) {
      console.error('Missing required fields for poll response or supabase client not initialized');
      return false;
    }

    // Get the user data to ensure we have the most up-to-date username
    const userData = await getUserData(userId);
    
    // Prepare insert data with all available user information
    const responseData = {
      selected_option: response,
      username: username || userData?.username || null,
      email: email || userData?.email || null,
      gender: gender || userData?.gender || null,
      group_class: groupClass || userData?.group_class || null
    };

    // Check if the user has already voted for this poll
    const { data: existingVote, error: checkError } = await supabase
      .from('poll_responses')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    let result;
    
    if (existingVote) {
      // User already voted - update their vote
      result = await supabase
        .from('poll_responses')
        .update(responseData)
        .eq('poll_id', pollId)
        .eq('user_id', userId);
    } else {
      // User hasn't voted yet - insert new vote
      result = await supabase
        .from('poll_responses')
        .insert([{
          poll_id: pollId,
          user_id: userId,
          created_at: new Date().toISOString(),
          ...responseData
        }]);
    }

    if (result.error) {
      console.error('Error submitting poll response:', result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception in submitPollResponse:', error);
    return false;
  }
}

// Function to get poll results
export async function getPollResults(pollId: string): Promise<PollResults | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    // First get the poll
    const poll = await getPollById(pollId);
    if (!poll) {
      console.warn('Cannot get results - poll not found');
      // Return empty results structure instead of null
      return {
        total_votes: 0,
        options: []
      };
    }

    // Get all responses
    const { data: responses, error } = await supabase
      .from('poll_responses')
      .select('selected_option')
      .eq('poll_id', pollId);

    if (error) {
      console.error('Error fetching poll responses:', error.message);
      return null;
    }

    // Calculate results
    const totalVotes = responses.length;
    const optionCounts = new Map<number, number>();
    
    // Initialize counts for all options to 0
    poll.options.forEach((_, index) => {
      optionCounts.set(index, 0);
    });

    // Count votes for each option
    responses.forEach(response => {
      const currentCount = optionCounts.get(response.selected_option) || 0;
      optionCounts.set(response.selected_option, currentCount + 1);
    });

    // Format results
    const results: PollResults = {
      total_votes: totalVotes,
      options: poll.options.map((text, index) => {
        const votes = optionCounts.get(index) || 0;
        const percentage = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
        return { text, votes, percentage };
      })
    };
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error getting poll results:', errorMessage);
    return null;
  }
}

// Function to get detailed poll results with user data
export async function getDetailedPollResults(pollId: string): Promise<EnhancedPollResults | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }
    
    // First get the poll
    const poll = await getPollById(pollId);
    if (!poll) {
      console.warn('Cannot get detailed results - poll not found');
      
      // Return a minimal structure instead of null to avoid errors in the UI
      return {
        total_votes: 0,
        options: [],
        user_data: []
      };
    }
    
    // Verify poll has options
    if (!poll.options || !Array.isArray(poll.options) || poll.options.length === 0) {
      console.warn('Poll has no valid options:', pollId);
      
      // Return a minimal structure with poll title but no options
      return {
        total_votes: 0,
        options: [],
        user_data: []
      };
    }
    
    // Step 1: Get poll responses
    const { data: responses, error: responsesError } = await supabase
      .from('poll_responses')
      .select('*')
      .eq('poll_id', pollId);
    
    if (responsesError) {
      console.error('Error fetching poll responses:', responsesError.message);
      // Return a structure with poll data but no responses
      return {
        total_votes: 0,
        options: poll.options.map((text, index) => ({ text, votes: 0, percentage: 0 })),
        user_data: []
      };
    }
    
    // Handle case when responses is null or undefined
    const validResponses = responses || [];
    
    // Calculate results
    const totalVotes = validResponses.length;
    const optionCounts = new Map<number, number>();
    
    // Initialize counts for all options to 0
    poll.options.forEach((_, index) => {
      optionCounts.set(index, 0);
    });
    
    // Count votes for each option
    validResponses.forEach(response => {
      // Ensure the selected option is a valid index
      if (response.selected_option >= 0 && response.selected_option < poll.options.length) {
        const currentCount = optionCounts.get(response.selected_option) || 0;
        optionCounts.set(response.selected_option, currentCount + 1);
      }
    });
    
    // Create user data array directly from responses
    const userData = validResponses.map(response => {
      return {
        user_id: response.user_id,
        selected_option: response.selected_option,
        gender: response.gender || undefined,
        email: response.email || undefined,
        username: response.username || null,
        group_class: response.group_class || null
      };
    });
    
    // For backward compatibility, if we have responses without usernames (old votes),
    // try to look up the user data from the users table
    const usersNeedingData = userData.filter(user => !user.username);
    
    if (usersNeedingData.length > 0) {
      const clerkIds = usersNeedingData.map(user => user.user_id);
      
      // Get all relevant users in a single query
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('clerk_id, gender, email, username, group_class')
        .in('clerk_id', clerkIds);
      
      if (!usersError && users) {
        // Create a map for faster lookup
        const userMap = new Map();
        users.forEach(user => {
          userMap.set(user.clerk_id, user);
        });
        
        // Update user data with looked up information
        userData.forEach((user, index) => {
          if (!user.username) {
            const lookupUser = userMap.get(user.user_id);
            if (lookupUser) {
              userData[index] = {
                ...user,
                gender: lookupUser.gender || user.gender,
                email: lookupUser.email || user.email,
                username: lookupUser.username || user.username,
                group_class: lookupUser.group_class || user.group_class
          };
            }
          }
        });
      }
    }
    
    // Format results
    const results: EnhancedPollResults = {
      total_votes: totalVotes,
      options: poll.options.map((text, index) => {
        const votes = optionCounts.get(index) || 0;
        const percentage = totalVotes > 0 ? Math.round(votes / totalVotes * 100) : 0;
        return { text, votes, percentage };
      }),
      user_data: userData
    };
    
    return results;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error getting detailed poll results:', errorMessage);
    return null;
  }
}

// Function to check if a user has voted in a poll
export async function hasUserVoted(pollId: string, userId: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { data, error } = await supabase
      .from('poll_responses')
      .select('id')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if user voted:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in hasUserVoted:', errorMessage);
    return false;
  }
}

// Function to get user's selected option
export async function getUserPollResponse(pollId: string, userId: string): Promise<number | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('poll_responses')
      .select('selected_option')
      .eq('poll_id', pollId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching user poll response:', error);
      }
      return null;
    }

    return data?.selected_option ?? null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getUserPollResponse:', errorMessage);
    return null;
  }
}

// Function to get user profile data
export async function getUserProfile(userId: string): Promise<UserData | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error);
      }
      return null;
    }

    return data as UserData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getUserProfile:', errorMessage);
    return null;
  }
}

// Function to get course sections
export async function getCourseSections(courseId: string): Promise<CourseSection[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('course_sections')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course sections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getCourseSections:', errorMessage);
    return [];
  }
}

// Function to get course files by section
export async function getCourseFiles(sectionId: string): Promise<CourseFile[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('course_files')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching course files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getCourseFiles:', errorMessage);
    return [];
  }
}

// Function to get all files for a course
export async function getAllCourseFiles(courseId: string): Promise<CourseFile[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    // Get all sections for the course
    const sections = await getCourseSections(courseId);
    
    if (sections.length === 0) {
      return [];
    }

    // Get files for all sections
    const sectionIds = sections.map(section => section.id);
    
    const { data, error } = await supabase
      .from('course_files')
      .select('*')
      .in('section_id', sectionIds)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching all course files:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getAllCourseFiles:', errorMessage);
    return [];
  }
}

// Function to create a course section
export async function createCourseSection(
  courseId: string,
  title: string,
  orderIndex: number = 0
): Promise<string | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('course_sections')
      .insert({
        course_id: courseId,
        title,
        order_index: orderIndex,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating course section:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in createCourseSection:', errorMessage);
    return null;
  }
}

// Function to create a course file
export async function createCourseFile(
  sectionId: string,
  title: string,
  fileType: string,
  fileSize: string,
  fileUrl: string | null = null,
  orderIndex: number = 0
): Promise<string | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    const { data, error } = await supabase
      .from('course_files')
      .insert({
        section_id: sectionId,
        title,
        file_type: fileType,
        file_size: fileSize,
        file_url: fileUrl,
        order_index: orderIndex,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating course file:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in createCourseFile:', errorMessage);
    return null;
  }
}

// Function to update course progress for a user
export async function updateCourseProgress(
  userId: string,
  courseId: string,
  fileId: string,
  completed: boolean
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    const { data: existingProgress, error: checkError } = await supabase
      .from('course_progress')
      .select('id, completed')
      .eq('user_id', userId)
      .eq('file_id', fileId)
      .single();

    // If record already exists, update it
    if (existingProgress) {
      // If completion status hasn't changed, no need to update
      if (existingProgress.completed === completed) {
        return true;
      }

      const { error } = await supabase
        .from('course_progress')
        .update({
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProgress.id);

      if (error) {
        console.error('Error updating course progress:', error);
        return false;
      }

      return true;
    } 
    // Otherwise create a new progress record
    else {
      const { error } = await supabase
        .from('course_progress')
        .insert({
          user_id: userId,
          course_id: courseId,
          file_id: fileId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        });

      if (error) {
        console.error('Error creating course progress:', error);
        return false;
      }

      return true;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updateCourseProgress:', errorMessage);
    return false;
  }
}

// Function to get course progress for a user
export async function getUserCourseProgress(userId: string, courseId: string): Promise<CourseProgress[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching user course progress:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getUserCourseProgress:', errorMessage);
    return [];
  }
}

// Function to delete a course section
export async function deleteCourseSection(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // First delete all files in the section
    const { error: filesError } = await supabase
      .from('course_files')
      .delete()
      .eq('section_id', id);

    if (filesError) {
      console.error('Error deleting section files:', filesError);
      return false;
    }

    // Then delete the section itself
    const { error } = await supabase
      .from('course_sections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course section:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deleteCourseSection:', errorMessage);
    return false;
  }
}

// Function to delete a course file
export async function deleteCourseFile(id: string): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Delete the file
    const { error } = await supabase
      .from('course_files')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting course file:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deleteCourseFile:', errorMessage);
    return false;
  }
}

// Function to create a new presentation section (admin only)
export async function createPresentationSection(
  adminId: string,
  title: string,
  maxMembers: number,
  description: string | null = null
): Promise<number | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    // Check if user is admin
    const userRole = await getUserRole(adminId);
    if (userRole !== 'admin') {
      console.error('Only admins can create presentation sections');
      return null;
    }

    const { data, error } = await supabase
      .from('presentation_sections')
      .insert({
        title,
        description,
        max_members: maxMembers,
        created_by: adminId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating presentation section:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in createPresentationSection:', errorMessage);
    return null;
  }
}

// Function to get all presentation sections
export async function getPresentationSections(activeOnly: boolean = true): Promise<PresentationSection[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    let query = supabase
      .from('presentation_sections')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (activeOnly) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching presentation sections:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getPresentationSections:', errorMessage);
    return [];
  }
}

// Function to create a presentation group (student)
export async function createPresentationGroup(
  userId: string,
  sectionId: number,
  groupName: string | null = null,
  notes: string | null = null,
  members: { name: string; email?: string | null }[] = []
): Promise<number | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    // Get the section to check max members
    const { data: section, error: sectionError } = await supabase
      .from('presentation_sections')
      .select('max_members')
      .eq('id', sectionId)
      .single();

    if (sectionError) {
      console.error('Error fetching section:', sectionError);
      return null;
    }

    if (!section) {
      console.error('Section not found');
      return null;
    }

    // Check if the number of members is valid
    if (members.length > section.max_members) {
      console.error(`Too many members. Maximum allowed is ${section.max_members}`);
      return null;
    }

    // Get all existing groups in this section to determine the next group number
    const { data: existingGroups, error: groupsError } = await supabase
      .from('presentation_groups')
      .select('id, name')
      .eq('section_id', sectionId);
    
    if (groupsError) {
      console.error('Error fetching existing groups:', groupsError);
      return null;
    }
    
    // Generate automatic group name (G1, G2, etc.)
    // First, find the highest existing group number
    let highestGroupNum = 0;
    if (existingGroups && existingGroups.length > 0) {
      existingGroups.forEach(group => {
        if (group.name && group.name.startsWith('G')) {
          const numPart = parseInt(group.name.substring(1));
          if (!isNaN(numPart) && numPart > highestGroupNum) {
            highestGroupNum = numPart;
          }
        }
      });
    }
    
    // Set the name to G1, G2, etc. - always use auto-generated name regardless of input
    const autoGroupName = `G${highestGroupNum + 1}`;

    // Start a transaction to insert group and members
    const { data: userData } = await supabase
      .from('users')
      .select('email, username')
      .eq('clerk_id', userId)
      .single();

    // Insert the group with auto-generated name
    const { data: groupData, error: groupError } = await supabase
      .from('presentation_groups')
      .insert({
        section_id: sectionId,
        name: autoGroupName, // Always use the auto-generated name
        created_by: userId,
        notes, // Keep notes field for compatibility, even if UI doesn't show it
      })
      .select('id')
      .single();

    if (groupError) {
      console.error('Error creating presentation group:', groupError);
      return null;
    }

    const groupId = groupData?.id;
    if (!groupId) {
      console.error('Failed to get group ID');
      return null;
    }

    // Add creator as first member
    const creatorMember = {
      group_id: groupId,
      user_id: userId,
      name: userData?.username || 'Unknown User',
      email: userData?.email || null,
      is_creator: true,
    };

    // Add creator and other members
    const allMembers = [
      creatorMember,
      ...members.map(member => ({
        group_id: groupId,
        user_id: null, // External members
        name: member.name,
        email: member.email || null,
        is_creator: false,
      }))
    ];

    const { error: membersError } = await supabase
      .from('presentation_group_members')
      .insert(allMembers);

    if (membersError) {
      console.error('Error adding group members:', membersError);
      // Roll back by deleting the group
      await supabase
        .from('presentation_groups')
        .delete()
        .eq('id', groupId);
      return null;
    }

    return groupId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in createPresentationGroup:', errorMessage);
    return null;
  }
}

// Function to get presentation groups for a section
export async function getPresentationGroupsBySection(sectionId: number): Promise<PresentationGroup[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('presentation_groups')
      .select('*')
      .eq('section_id', sectionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching presentation groups:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getPresentationGroupsBySection:', errorMessage);
    return [];
  }
}

// Function to get members of a presentation group
export async function getPresentationGroupMembers(groupId: number): Promise<PresentationGroupMember[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return [];
    }

    const { data, error } = await supabase
      .from('presentation_group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('is_creator', { ascending: false });

    if (error) {
      console.error('Error fetching presentation group members:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getPresentationGroupMembers:', errorMessage);
    return [];
  }
}

// Function to check if user is already in a group for a section
export async function getUserPresentationGroup(userId: string, sectionId: number): Promise<number | null> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return null;
    }

    // First get groups in this section
    const { data: groups, error: groupsError } = await supabase
      .from('presentation_groups')
      .select('id')
      .eq('section_id', sectionId);

    if (groupsError) {
      console.error('Error fetching presentation groups:', groupsError);
      return null;
    }

    if (!groups || groups.length === 0) {
      return null;
    }

    // Now check if user is in any of these groups
    const groupIds = groups.map(g => g.id);
    const { data: membership, error: membershipError } = await supabase
      .from('presentation_group_members')
      .select('group_id')
      .eq('user_id', userId)
      .in('group_id', groupIds)
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected if not in group
      console.error('Error checking user membership:', membershipError);
      return null;
    }

    return membership?.group_id || null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in getUserPresentationGroup:', errorMessage);
    return null;
  }
}

// Function to update a presentation section (admin only)
export async function updatePresentationSection(
  adminId: string,
  sectionId: number,
  updates: {
    title?: string;
    description?: string | null;
    max_members?: number;
    active?: boolean;
  }
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Check if user is admin
    const userRole = await getUserRole(adminId);
    if (userRole !== 'admin') {
      console.error('Only admins can update presentation sections');
      return false;
    }

    const { error } = await supabase
      .from('presentation_sections')
      .update({
        ...updates,
      })
      .eq('id', sectionId);

    if (error) {
      console.error('Error updating presentation section:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updatePresentationSection:', errorMessage);
    return false;
  }
}

// Function to delete a presentation section (admin only)
export async function deletePresentationSection(
  adminId: string,
  sectionId: number
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Check if user is admin
    const userRole = await getUserRole(adminId);
    if (userRole !== 'admin') {
      console.error('Only admins can delete presentation sections');
      return false;
    }

    // First check if there are groups in this section
    const { data: groups, error: groupsError } = await supabase
      .from('presentation_groups')
      .select('id')
      .eq('section_id', sectionId);

    if (groupsError) {
      console.error('Error checking for existing groups:', groupsError);
      return false;
    }

    // If there are groups, we need to delete them first (cascading delete)
    if (groups && groups.length > 0) {
      const groupIds = groups.map(g => g.id);
      
      // 1. First delete all group members for these groups
      const { error: membersDeleteError } = await supabase
        .from('presentation_group_members')
        .delete()
        .in('group_id', groupIds);
        
      if (membersDeleteError) {
        console.error('Error deleting group members:', membersDeleteError);
        return false;
      }
      
      // 2. Then delete all the groups themselves
      const { error: groupsDeleteError } = await supabase
        .from('presentation_groups')
        .delete()
        .in('id', groupIds);
        
      if (groupsDeleteError) {
        console.error('Error deleting groups:', groupsDeleteError);
        return false;
      }
    }

    // 3. Finally delete the section itself
    const { error } = await supabase
      .from('presentation_sections')
      .delete()
      .eq('id', sectionId);

    if (error) {
      console.error('Error deleting presentation section:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in deletePresentationSection:', errorMessage);
    return false;
  }
}

// Function to update a presentation group (student)
export async function updatePresentationGroup(
  userId: string,
  groupId: number,
  updates: {
    name?: string | null;
    notes?: string | null;
  }
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Check if user is the creator of the group
    const { data: membership, error: membershipError } = await supabase
      .from('presentation_group_members')
      .select('user_id, is_creator')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      console.error('Error checking user membership:', membershipError);
      return false;
    }

    if (!membership || !membership.is_creator) {
      console.error('User is not the creator of this group');
      return false;
    }

    // Update the group
    const { error } = await supabase
      .from('presentation_groups')
      .update(updates)
      .eq('id', groupId);

    if (error) {
      console.error('Error updating presentation group:', error);
      return false;
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updatePresentationGroup:', errorMessage);
    return false;
  }
}

// Function to update presentation group members
export async function updatePresentationGroupMembers(
  userId: string,
  groupId: number,
  members: { id?: number; name: string; email?: string | null }[]
): Promise<boolean> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured: Missing environment variables.');
      return false;
    }

    // Check if user is the creator of the group
    const { data: membership, error: membershipError } = await supabase
      .from('presentation_group_members')
      .select('user_id, is_creator')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();

    if (membershipError) {
      console.error('Error checking user membership:', membershipError);
      return false;
    }

    if (!membership || !membership.is_creator) {
      console.error('User is not the creator of this group');
      return false;
    }

    // Get current members to identify which ones to remove
    const { data: currentMembers, error: currentMembersError } = await supabase
      .from('presentation_group_members')
      .select('id, name, email, is_creator')
      .eq('group_id', groupId);

    if (currentMembersError) {
      console.error('Error fetching current members:', currentMembersError);
      return false;
    }

    // Find the creator member that shouldn't be modified
    const creatorMember = currentMembers?.find(m => m.is_creator) || null;
    if (!creatorMember) {
      console.error('No creator found for this group');
      return false;
    }

    // Filter out the creator from the list so we don't modify it
    const nonCreatorMembers = currentMembers?.filter(m => !m.is_creator) || [];
    
    // Members to remove: members in DB that aren't in the new list
    const memberIdsToKeep = members.map(m => m.id).filter(id => id !== undefined);
    const membersToRemove = nonCreatorMembers.filter(m => !memberIdsToKeep.includes(m.id));
    
    // Members to update: members with IDs that exist in both lists
    const membersToUpdate = members.filter(m => m.id !== undefined);
    
    // Members to add: members without IDs (new members)
    const membersToAdd = members
      .filter(m => !m.id)
      .map(m => ({
        group_id: groupId,
        user_id: null, // External members
        name: m.name,
        email: m.email || null,
        is_creator: false
      }));

    // Start a transaction to update the members
    
    // 1. Remove members that are not in the new list
    if (membersToRemove.length > 0) {
      const removeIds = membersToRemove.map(m => m.id);
      const { error: removeError } = await supabase
        .from('presentation_group_members')
        .delete()
        .in('id', removeIds);

      if (removeError) {
        console.error('Error removing members:', removeError);
        return false;
      }
    }

    // 2. Update existing members
    for (const member of membersToUpdate) {
      const { error: updateError } = await supabase
        .from('presentation_group_members')
        .update({
          name: member.name,
          email: member.email || null
        })
        .eq('id', member.id);

      if (updateError) {
        console.error('Error updating member:', updateError);
        return false;
      }
    }

    // 3. Add new members
    if (membersToAdd.length > 0) {
      const { error: addError } = await supabase
        .from('presentation_group_members')
        .insert(membersToAdd);

      if (addError) {
        console.error('Error adding new members:', addError);
        return false;
      }
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in updatePresentationGroupMembers:', errorMessage);
    return false;
  }
}