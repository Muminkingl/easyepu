import { supabase } from './supabase';
import { put, del } from '@vercel/blob';

/**
 * Upload a presentation file to Vercel Blob
 * @param file The file to upload
 * @param groupId The presentation group ID
 * @returns A promise that resolves to the file URL if successful, or null if failed
 */
export async function uploadPresentationFile(file: File, groupId: number): Promise<string | null> {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `presentations/${groupId}/${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });
    
    // Return the URL to the uploaded file
    return blob.url;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Update the presentation file URL for a group in the database
 * @param groupId The presentation group ID
 * @param fileUrl The URL of the uploaded file
 * @param fileName The original file name
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function updateGroupPresentationFile(
  groupId: number,
  fileUrl: string,
  fileName: string
): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return false;
    }

    // First, check what fields exist in the database
    const { data: columnInfo, error: columnError } = await supabase
      .from('presentation_groups')
      .select('*')
      .eq('id', groupId)
      .limit(1)
      .single();
    
    if (columnError) {
      console.error('Error checking database structure:', columnError);
      return false;
    }
    
    // First try: Use the custom RLS-bypassing function
    try {
      const { error: funcError } = await supabase.rpc('update_presentation_file', {
        p_group_id: groupId,
        p_file_url: fileUrl,
        p_file_name: fileName
      });
      
      if (!funcError) {
        // Verify the update worked
        const { data: verification } = await supabase.rpc('check_presentation_file', {
          p_group_id: groupId
        });
        
        if (verification && (verification.file_url || verification.presentation_file_url)) {
          return true;
        }
      } else {
        console.error('Error using update function:', funcError);
      }
    } catch (funcError) {
      console.error('Function call error:', funcError);
    }
    
    // Second try: Standard update with both column types
    try {
      const { error: updateError } = await supabase
      .from('presentation_groups')
      .update({
        presentation_file_url: fileUrl,
        presentation_file_name: fileName,
          file_url: fileUrl, 
          file_name: fileName,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

      if (!updateError) {
        return true;
      } else {
        console.error('Update error:', updateError);
      }
    } catch (updateError) {
      console.error('Update operation error:', updateError);
    }
    
    // Last resort: Try force update function
    try {
      const { data: forceResult, error: forceError } = await supabase.rpc('force_update_presentation_file', {
        p_group_id: groupId,
        p_file_url: fileUrl,
        p_file_name: fileName
      });
      
      if (!forceError && forceResult) {
    return true;
      } else {
        console.error('Force update error:', forceError);
      }
    } catch (forceError) {
      console.error('Force update error:', forceError);
    }
    
    console.error('All update attempts failed');
    return false;
  } catch (error) {
    console.error('Error updating file record:', error);
    return false;
  }
}

/**
 * Get the presentation file for a group
 * @param groupId The presentation group ID
 * @returns A promise that resolves to the file URL and name if successful, or null if failed
 */
export async function getGroupPresentationFile(
  groupId: number
): Promise<{ url: string; name: string } | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    // Try to use the direct query function first
    try {
      const { data: fileData, error: fileError } = await supabase.rpc('check_presentation_file', {
        p_group_id: groupId
      });
      
      if (!fileError && fileData && fileData.length > 0) {
        // Check both column types
        if (fileData[0].file_url && fileData[0].file_name) {
          return {
            url: fileData[0].file_url,
            name: fileData[0].file_name
          };
        } else if (fileData[0].presentation_file_url && fileData[0].presentation_file_name) {
          return {
            url: fileData[0].presentation_file_url,
            name: fileData[0].presentation_file_name
          };
        }
      }
    } catch (funcError) {
      console.error('Function query error:', funcError);
    }
    
    // Fallback to standard query
    try {
      // Try both possible column naming conventions
    const { data, error } = await supabase
      .from('presentation_groups')
        .select('*')
      .eq('id', groupId)
      .single();

    if (error) {
        console.error('Error fetching group data:', error);
      return null;
    }

      // Check if we have file data in either column format
      if (data.file_url && data.file_name) {
        return {
          url: data.file_url,
          name: data.file_name
        };
      } else if (data.presentation_file_url && data.presentation_file_name) {
        return {
          url: data.presentation_file_url,
          name: data.presentation_file_name
        };
      }
      
      return null;
    } catch (queryError) {
      console.error('Query error:', queryError);
      return null;
    }
  } catch (error) {
    console.error('Error fetching file:', error);
    return null;
  }
}

/**
 * Delete a presentation file from storage
 * @param fileUrl The URL of the file to delete
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function deletePresentationFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl) {
      console.error('No file URL provided for deletion');
      return false;
    }
    
    // Import the del function from @vercel/blob
    const { del } = await import('@vercel/blob');
    
    // Use the Vercel Blob SDK's del function to delete the file
    await del(fileUrl);
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Upload a course file to Vercel Blob
 * @param file The file to upload
 * @param courseId The course ID
 * @returns A promise that resolves to the file URL if successful, or null if failed
 */
export async function uploadCourseFile(file: File, courseId: string): Promise<string | null> {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `courses/${courseId}/${timestamp}-${file.name}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });
    
    // Return the URL to the uploaded file
    return blob.url;
  } catch (error) {
    console.error('Error uploading course file:', error);
    return null;
  }
}

/**
 * Update the course file URL in the database
 * @param courseId The course ID
 * @param fileUrl The URL of the uploaded file
 * @param fileName The original file name
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function updateCourseFile(
  courseId: string,
  fileUrl: string,
  fileName: string
): Promise<boolean> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return false;
    }

    const { error } = await supabase
      .from('courses')
      .update({
        file_url: fileUrl,
        file_name: fileName,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId);

    if (error) {
      console.error('Error updating course file record:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating course file record:', error);
    return false;
  }
}

/**
 * Get the file for a course
 * @param courseId The course ID
 * @returns A promise that resolves to the file URL and name if successful, or null if failed
 */
export async function getCourseFile(
  courseId: string
): Promise<{ url: string; name: string } | null> {
  try {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    const { data, error } = await supabase
      .from('courses')
      .select('file_url, file_name')
      .eq('id', courseId)
      .single();

    if (error) {
      console.error('Error fetching course file data:', error);
      return null;
    }

    if (data.file_url && data.file_name) {
      return {
        url: data.file_url,
        name: data.file_name
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching course file:', error);
    return null;
  }
}

/**
 * Delete a course file from storage
 * @param fileUrl The URL of the file to delete
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function deleteCourseFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl) {
      console.error('No file URL provided for deletion');
      return false;
    }
    
    await del(fileUrl);
    
    return true;
  } catch (error) {
    console.error('Error deleting course file:', error);
    return false;
  }
} 