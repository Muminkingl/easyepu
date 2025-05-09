-- Function to forcefully delete all non-creator members from a presentation group
-- This bypasses RLS and uses direct SQL to ensure deletion happens

CREATE OR REPLACE FUNCTION force_delete_members(p_group_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of function creator
AS $$
BEGIN
  -- Direct deletion of all non-creator members
  DELETE FROM presentation_group_members
  WHERE group_id = p_group_id
  AND is_creator = false;
  
  -- Log the operation for audit purposes
  INSERT INTO audit_logs (action, table_name, record_id, details, performed_by)
  VALUES (
    'FORCE_DELETE',
    'presentation_group_members',
    p_group_id,
    'Forcefully deleted all non-creator members from group',
    current_user
  );
  
  -- Return nothing as this is just a procedure
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE NOTICE 'Error in force_delete_members: %', SQLERRM;
    -- Re-raise the exception
    RAISE;
END;
$$; 