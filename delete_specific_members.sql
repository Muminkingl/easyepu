-- Direct SQL commands to delete specific problematic members
-- Run this in the Supabase SQL Editor

-- Delete member with ID 89
DELETE FROM presentation_group_members WHERE id = 89;

-- Delete member with ID 90
DELETE FROM presentation_group_members WHERE id = 90;

-- Alternative approach if the above doesn't work
DELETE FROM presentation_group_members 
WHERE group_id = 36 
AND is_creator = false 
AND (name = 'FARTTT' OR name = 'SHi');

-- Verify deletion worked
SELECT * FROM presentation_group_members 
WHERE id IN (89, 90) OR (group_id = 36 AND is_creator = false); 