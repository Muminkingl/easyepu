-- Add file columns to presentation_groups table if they don't exist

-- Check if presentation_file_url column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_groups' AND column_name = 'presentation_file_url') THEN
        ALTER TABLE presentation_groups ADD COLUMN presentation_file_url TEXT;
    END IF;
END $$;

-- Check if presentation_file_name column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_groups' AND column_name = 'presentation_file_name') THEN
        ALTER TABLE presentation_groups ADD COLUMN presentation_file_name TEXT;
    END IF;
END $$;

-- Also add file_url and file_name columns for future compatibility
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_groups' AND column_name = 'file_url') THEN
        ALTER TABLE presentation_groups ADD COLUMN file_url TEXT;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_groups' AND column_name = 'file_name') THEN
        ALTER TABLE presentation_groups ADD COLUMN file_name TEXT;
    END IF;
END $$;

-- If both column types exist, migrate data from presentation_file_url to file_url if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_groups' AND column_name = 'presentation_file_url')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'presentation_groups' AND column_name = 'file_url') THEN
        
        -- Update file_url with presentation_file_url values where file_url is null
        UPDATE presentation_groups 
        SET file_url = presentation_file_url, 
            file_name = presentation_file_name
        WHERE presentation_file_url IS NOT NULL 
          AND file_url IS NULL;
    END IF;
END $$;

-- Display the current table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'presentation_groups'
ORDER BY ordinal_position; 