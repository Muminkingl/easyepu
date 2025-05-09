-- Direct, forceful function to delete a specific member by ID
-- This function bypasses RLS and deletes a specific member
CREATE OR REPLACE FUNCTION delete_specific_member_by_id(
    p_member_id INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Uses the privileges of the function creator
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Attempt a direct delete with no constraints
    DELETE FROM presentation_group_members
    WHERE id = p_member_id;
    
    -- Get the number of rows affected
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Return success if at least one row was affected
    RETURN deleted_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in delete_specific_member_by_id: %', SQLERRM;
        RETURN FALSE;
END;
$$; 