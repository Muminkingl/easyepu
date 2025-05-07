-- Create a function to update presentation file that bypasses RLS
CREATE OR REPLACE FUNCTION update_presentation_file(
  p_group_id INTEGER,
  p_file_url TEXT,
  p_file_name TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update both column naming conventions to ensure compatibility
  UPDATE presentation_groups
  SET presentation_file_url = p_file_url,
      presentation_file_name = p_file_name,
      file_url = p_file_url,
      file_name = p_file_name,
      updated_at = NOW()
  WHERE id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to execute raw SQL for emergency fixes
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT) RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check the file data for a specific group
CREATE OR REPLACE FUNCTION check_presentation_file(p_group_id INTEGER)
RETURNS TABLE (
  file_url TEXT,
  file_name TEXT,
  presentation_file_url TEXT,
  presentation_file_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg.file_url,
    pg.file_name,
    pg.presentation_file_url,
    pg.presentation_file_name
  FROM presentation_groups pg
  WHERE pg.id = p_group_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view that shows presentation files for debugging
CREATE OR REPLACE VIEW presentation_files_view AS
SELECT 
  pg.id,
  pg.name,
  pg.created_by,
  pg.file_url,
  pg.file_name,
  pg.presentation_file_url,
  pg.presentation_file_name,
  pg.updated_at
FROM presentation_groups pg;

-- Grant permissions on the view
GRANT SELECT ON presentation_files_view TO service_role;
GRANT SELECT ON presentation_files_view TO authenticated;

-- Function to force-update a specific group's file data (for admin use)
CREATE OR REPLACE FUNCTION force_update_presentation_file(
  p_group_id INTEGER,
  p_file_url TEXT,
  p_file_name TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_success BOOLEAN := FALSE;
BEGIN
  -- Try to update both naming conventions
  UPDATE presentation_groups
  SET presentation_file_url = p_file_url,
      presentation_file_name = p_file_name,
      file_url = p_file_url,
      file_name = p_file_name,
      updated_at = NOW()
  WHERE id = p_group_id;
  
  IF FOUND THEN
    v_success := TRUE;
  END IF;
  
  RETURN v_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 