-- Add semester field to users table
ALTER TABLE users ADD COLUMN semester INTEGER DEFAULT 1;

-- Add semester fields to content tables
ALTER TABLE courses ADD COLUMN semester INTEGER DEFAULT 1;
ALTER TABLE announcements ADD COLUMN semester INTEGER DEFAULT 1;
ALTER TABLE polls ADD COLUMN semester INTEGER DEFAULT 1;
ALTER TABLE presentation_sections ADD COLUMN semester INTEGER DEFAULT 1; 