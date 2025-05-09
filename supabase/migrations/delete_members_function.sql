-- Create a function to delete all non-creator members from a group
CREATE OR REPLACE FUNCTION delete_all_group_members(
    p_group_id INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- This will run with the permissions of the function creator
AS $$
BEGIN
    -- Delete all non-creator members for the group
    DELETE FROM presentation_group_members
    WHERE group_id = p_group_id
    AND is_creator = false;
END;
$$;

-- Function to delete specific members from a group
CREATE OR REPLACE FUNCTION delete_specific_group_members(
    p_group_id INTEGER,
    p_member_ids INTEGER[]
) RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete specific members
    DELETE FROM presentation_group_members
    WHERE group_id = p_group_id
    AND id = ANY(p_member_ids)
    AND is_creator = false;
END;
$$;

-- More powerful function that forces deletion with error handling
CREATE OR REPLACE FUNCTION force_delete_members(
    p_group_id INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Try to delete with multiple approaches
    BEGIN
        -- First approach - direct delete
        DELETE FROM presentation_group_members
        WHERE group_id = p_group_id
        AND is_creator = false;
        
        -- Check if any non-creator members remain
        IF NOT EXISTS (
            SELECT 1 FROM presentation_group_members
            WHERE group_id = p_group_id
            AND is_creator = false
        ) THEN
            success := TRUE;
        END IF;
        
        -- If first approach failed, try another method
        IF NOT success THEN
            -- Second approach - delete one by one
            FOR member_record IN 
                SELECT id FROM presentation_group_members
                WHERE group_id = p_group_id
                AND is_creator = false
            LOOP
                BEGIN
                    DELETE FROM presentation_group_members
                    WHERE id = member_record.id;
                EXCEPTION
                    WHEN OTHERS THEN
                        -- Log but continue with next
                        RAISE NOTICE 'Failed to delete member %: %', 
                            member_record.id, SQLERRM;
                END;
            END LOOP;
            
            -- Check success again
            IF NOT EXISTS (
                SELECT 1 FROM presentation_group_members
                WHERE group_id = p_group_id
                AND is_creator = false
            ) THEN
                success := TRUE;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error in force_delete_members: %', SQLERRM;
            success := FALSE;
    END;
    
    RETURN success;
END;
$$; 