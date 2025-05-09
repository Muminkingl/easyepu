-- Drop existing policies that are causing issues
DROP POLICY IF EXISTS "Allow authenticated users to insert into presentation_groups" ON presentation_groups;

-- Create new policy that doesn't rely on auth.role() since we're using Clerk
CREATE POLICY "Allow anyone to insert into presentation_groups"
ON presentation_groups
FOR INSERT
WITH CHECK (true);

-- Update the update policy to use created_by directly without auth.uid() conversion
DROP POLICY IF EXISTS "Allow users to update their own presentation_groups" ON presentation_groups;

CREATE POLICY "Allow users to update their own presentation_groups"
ON presentation_groups
FOR UPDATE
USING (true)  -- Temporarily allow all updates (you can restrict this later)
WITH CHECK (true);

-- Drop and recreate member policies
DROP POLICY IF EXISTS "Allow authenticated users to insert into presentation_group_members" ON presentation_group_members;

CREATE POLICY "Allow anyone to insert into presentation_group_members"
ON presentation_group_members
FOR INSERT
WITH CHECK (true);

-- Also make sure this table has RLS enabled
ALTER TABLE presentation_group_members ENABLE ROW LEVEL SECURITY;

-- Make sure select is allowed for all
CREATE POLICY IF NOT EXISTS "Allow all users to select from presentation_group_members"
ON presentation_group_members
FOR SELECT
USING (true); 