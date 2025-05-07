-- Enable RLS on the presentation_groups table
ALTER TABLE presentation_groups ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all users to select from presentation_groups
CREATE POLICY "Allow all users to select from presentation_groups"
ON presentation_groups
FOR SELECT
USING (true);

-- Create a policy to allow authenticated users to insert into presentation_groups
CREATE POLICY "Allow authenticated users to insert into presentation_groups"
ON presentation_groups
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create a policy to allow users to update their own groups
CREATE POLICY "Allow users to update their own presentation_groups"
ON presentation_groups
FOR UPDATE
USING (auth.uid()::text = created_by)
WITH CHECK (auth.uid()::text = created_by);

-- Create a policy to allow admins to update any group
CREATE POLICY "Allow admins to update any presentation_group"
ON presentation_groups
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.clerk_id = auth.uid()::text 
    AND users.role = 'admin'
  )
);

-- Enable RLS on the presentation_group_members table
ALTER TABLE presentation_group_members ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all users to select from presentation_group_members
CREATE POLICY "Allow all users to select from presentation_group_members"
ON presentation_group_members
FOR SELECT
USING (true);

-- Create a policy to allow authenticated users to insert into presentation_group_members
CREATE POLICY "Allow authenticated users to insert into presentation_group_members"
ON presentation_group_members
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Create a policy to allow group creators to update members
CREATE POLICY "Allow group creators to update presentation_group_members"
ON presentation_group_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM presentation_group_members pgm
    WHERE pgm.group_id = presentation_group_members.group_id
    AND pgm.user_id = auth.uid()::text
    AND pgm.is_creator = true
  )
);

-- Create a policy to allow group creators to delete members
CREATE POLICY "Allow group creators to delete presentation_group_members"
ON presentation_group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM presentation_group_members pgm
    WHERE pgm.group_id = presentation_group_members.group_id
    AND pgm.user_id = auth.uid()::text
    AND pgm.is_creator = true
  )
); 