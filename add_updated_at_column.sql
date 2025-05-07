-- Add updated_at column to presentation_groups table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'presentation_groups' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE presentation_groups 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$; 