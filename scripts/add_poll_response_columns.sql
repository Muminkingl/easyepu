-- Function to add username column to poll_responses
CREATE OR REPLACE FUNCTION add_username_to_poll_responses()
RETURNS VOID AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'poll_responses'
    AND column_name = 'username'
  ) THEN
    -- Add the username column
    EXECUTE 'ALTER TABLE poll_responses ADD COLUMN username TEXT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add email column to poll_responses
CREATE OR REPLACE FUNCTION add_email_to_poll_responses()
RETURNS VOID AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'poll_responses'
    AND column_name = 'email'
  ) THEN
    -- Add the email column
    EXECUTE 'ALTER TABLE poll_responses ADD COLUMN email TEXT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add gender column to poll_responses
CREATE OR REPLACE FUNCTION add_gender_to_poll_responses()
RETURNS VOID AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'poll_responses'
    AND column_name = 'gender'
  ) THEN
    -- Add the gender column
    EXECUTE 'ALTER TABLE poll_responses ADD COLUMN gender TEXT';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to add group_class column to poll_responses
CREATE OR REPLACE FUNCTION add_group_class_to_poll_responses()
RETURNS VOID AS $$
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'poll_responses'
    AND column_name = 'group_class'
  ) THEN
    -- Add the group_class column
    EXECUTE 'ALTER TABLE poll_responses ADD COLUMN group_class TEXT';
  END IF;
END;
$$ LANGUAGE plpgsql; 