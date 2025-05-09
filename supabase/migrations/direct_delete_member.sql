-- Super simple direct delete function
-- This directly deletes a member record with no constraints
CREATE OR REPLACE FUNCTION direct_delete_member(member_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with creator's permissions (typically admin)
AS $$
BEGIN
  -- Just do a direct delete
  DELETE FROM presentation_group_members
  WHERE id = member_id;
  
  -- Always return true (we don't care about the result here)
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't crash
    RAISE NOTICE 'Error in direct_delete_member: %', SQLERRM;
    RETURN FALSE;
END;
$$; 