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

    // First check which columns exist in the table
    try {
      const { data: columnInfo, error: columnError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .limit(1)
        .single();
      
      if (columnError) {
        console.error('Error checking course columns:', columnError);
      } else {
        // Determine which columns to use
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString()
        };
        
        // If file_url/file_name columns exist, use them
        if ('file_url' in columnInfo) updateData.file_url = fileUrl;
        if ('file_name' in columnInfo) updateData.file_name = fileName;
        
        // If syllabus_url/syllabus_name columns exist as alternatives, use them
        if ('syllabus_url' in columnInfo) updateData.syllabus_url = fileUrl;
        if ('syllabus_name' in columnInfo) updateData.syllabus_name = fileName;
        
        // Update the record with the appropriate columns
        const { error: updateError } = await supabase
          .from('courses')
          .update(updateData)
          .eq('id', courseId);

        if (!updateError) {
          return true;
        }
        
        console.error('Error updating with dynamic columns:', updateError);
      }
    } catch (columnCheckError) {
      console.error('Error during column check:', columnCheckError);
    }

    // Traditional approach as fallback
    try {
      const { error } = await supabase
        .from('courses')
        .update({
          file_url: fileUrl,
          file_name: fileName,
          updated_at: new Date().toISOString()
        })
        .eq('id', courseId);

      if (!error) {
        return true;
      }
      
      console.error('Error updating course file record:', error);
    } catch (updateError) {
      console.error('Error in traditional update:', updateError);
    }

    return false;
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

    // First, try a general select to see what columns are actually available
    try {
      const { data: columnInfo, error: columnError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .limit(1)
        .single();
      
      if (columnError) {
        console.error('Error checking course columns:', columnError);
      } else if (columnInfo) {
        // Check which columns exist
        const hasFileUrl = 'file_url' in columnInfo;
        const hasFileName = 'file_name' in columnInfo;
        const hasSyllabusUrl = 'syllabus_url' in columnInfo;
        const hasSyllabusName = 'syllabus_name' in columnInfo;
        
        // If we have file_url and file_name, use those
        if (hasFileUrl && hasFileName && columnInfo.file_url && columnInfo.file_name) {
          return {
            url: columnInfo.file_url,
            name: columnInfo.file_name
          };
        }
        
        // If we have syllabus_url and syllabus_name, use those as alternatives
        if (hasSyllabusUrl && hasSyllabusName && columnInfo.syllabus_url && columnInfo.syllabus_name) {
          return {
            url: columnInfo.syllabus_url,
            name: columnInfo.syllabus_name
          };
        }
        
        // Check for any other potential file columns
        for (const [key, value] of Object.entries(columnInfo)) {
          if (
            (key.includes('file') || key.includes('document') || key.includes('attachment')) && 
            typeof value === 'string' && 
            (value.startsWith('http') || value.startsWith('blob:'))
          ) {
            // Found a URL-like value in a column with 'file' in the name
            const nameKey = key.replace('url', 'name');
            if (nameKey in columnInfo && typeof columnInfo[nameKey] === 'string') {
              return {
                url: value,
                name: columnInfo[nameKey] as string
              };
            } else {
              // If we can't find a matching name column, just use the URL with a generic name
              return {
                url: value,
                name: 'Course File'
              };
            }
          }
        }
      }
    } catch (lookupError) {
      console.error('Error during column exploration:', lookupError);
    }
    
    // Traditional approach as fallback - might fail with the error we're trying to fix
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('file_url, file_name')
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('Error fetching course file data:', error);
        return null;
      }

      if (data && data.file_url && data.file_name) {
        return {
          url: data.file_url,
          name: data.file_name
        };
      }
    } catch (queryError) {
      console.error('Error in traditional file query:', queryError);
    }
    
    // If we get here, we couldn't find file data
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

/**
 * Upload a course section file to Vercel Blob
 * @param file The file to upload
 * @param sectionId The section ID
 * @returns A promise that resolves to an object with file URL, type and size if successful, or null if failed
 */
export async function uploadSectionFile(file: File, sectionId: string): Promise<{ url: string, type: string, size: string } | null> {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `sections/${sectionId}/${timestamp}-${file.name}`;
    
    // Get file extension for type
    const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    
    // Calculate file size
    const fileSize = formatFileSize(file.size);

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });
    
    // Return the URL and metadata
    return {
      url: blob.url,
      type: fileType,
      size: fileSize
    };
  } catch (error) {
    console.error('Error uploading section file:', error);
    return null;
  }
}

/**
 * Format file size in a human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Delete a section file from storage
 * @param fileUrl The URL of the file to delete
 * @returns A promise that resolves to true if successful, or false if failed
 */
export async function deleteSectionFile(fileUrl: string): Promise<boolean> {
  try {
    if (!fileUrl) {
      console.error('No file URL provided for deletion');
      return false;
    }
    
    // Check if this is actually a Vercel Blob URL
    // Only attempt deletion for URLs that match Vercel Blob pattern
    const isVercelBlobUrl = fileUrl.includes('vercel-storage.com') || 
                            fileUrl.includes('blob.vercel.app');
    
    if (isVercelBlobUrl) {
      try {
        // Only try to delete if it looks like a Vercel URL
        await del(fileUrl);
        console.log('Successfully deleted file from Vercel Blob:', fileUrl);
      } catch (error: any) {
        // Cast to any to access toString() and check error message
        const errorMessage = error?.toString() || '';
        
        // If there's a token error, log it but don't fail the operation
        if (errorMessage.includes('No token found') || 
            errorMessage.includes('BLOB_READ_WRITE_TOKEN')) {
          console.warn('Cannot delete file from Vercel Blob due to missing token. File URL:', fileUrl);
          console.warn('Set up BLOB_READ_WRITE_TOKEN environment variable for file deletion.');
          
          // In development, we can still consider this a "success" as the database record will be removed
          if (process.env.NODE_ENV === 'development') {
            console.log('Running in development mode - considering delete successful despite token issue');
            return true;
          }
        } else {
          // For other errors, log and propagate
          console.error('Error deleting file from Vercel Blob:', error);
          throw error;
        }
      }
    } else if (fileUrl.startsWith('blob:') || fileUrl.startsWith('http://localhost')) {
      // For temporary blob URLs or local development URLs, no deletion needed
      console.log('Skipping deletion for temporary or local URL:', fileUrl);
    } else {
      // For other URLs (like external links), no deletion needed
      console.log('URL does not appear to be a Vercel Blob URL, skipping deletion:', fileUrl);
    }
    
    // Return true even if we couldn't delete the file - the database record will still be removed
    return true;
  } catch (error) {
    console.error('Error in deleteSectionFile:', error);
    // Return true anyway so database operations can continue
    return true;
  }
} 