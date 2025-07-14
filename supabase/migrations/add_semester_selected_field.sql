-- Add semester_selected field to users table
ALTER TABLE users ADD COLUMN semester_selected BOOLEAN DEFAULT FALSE;

-- Update existing records to indicate they have not explicitly selected a semester
UPDATE users SET semester_selected = FALSE; 