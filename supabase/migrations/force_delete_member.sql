-- Force Delete Member Function
-- This function bypasses RLS and forcefully deletes presentation group members
-- It uses multiple approaches to ensure deletion succeeds

CREATE OR REPLACE FUNCTION force_delete_member(p_member_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This runs with the privileges of the function creator
AS $$
DECLARE
  success BOOLEAN := FALSE;
  member_exists BOOLEAN;
BEGIN
  -- Check if member exists
  SELECT EXISTS(
    SELECT 1 FROM presentation_group_members WHERE id = p_member_id
  ) INTO member_exists;
  
  IF NOT member_exists THEN
    -- Member doesn't exist, consider it a success
    RETURN TRUE;
  END IF;
  
  -- Attempt direct deletion with no conditions
  BEGIN
    DELETE FROM presentation_group_members WHERE id = p_member_id;
    
    -- Verify if member was deleted
    SELECT NOT EXISTS(
      SELECT 1 FROM presentation_group_members WHERE id = p_member_id
    ) INTO success;
    
    IF success THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'First deletion attempt failed: %', SQLERRM;
      -- Continue to alternative methods
  END;
  
  -- If first attempt failed, try a more specific approach
  BEGIN
    DELETE FROM presentation_group_members 
    WHERE id = p_member_id 
    AND is_creator = FALSE; -- Only delete non-creators as a safety measure
    
    -- Verify again
    SELECT NOT EXISTS(
      SELECT 1 FROM presentation_group_members WHERE id = p_member_id
    ) INTO success;
    
    IF success THEN
      RETURN TRUE;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Second deletion attempt failed: %', SQLERRM;
      -- Continue to alternative methods
  END;
  
  -- Return the result
  RETURN success;
END;
$$; 