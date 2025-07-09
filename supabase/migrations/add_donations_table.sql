-- Create donations table for tracking support payments
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paddle_checkout_id TEXT,
  user_id TEXT REFERENCES users(clerk_id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  tier TEXT,
  payment_method TEXT,
  email TEXT,
  receipt_url TEXT,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS donations_user_id_idx ON donations(user_id);

-- Create index for faster lookups by paddle_checkout_id
CREATE INDEX IF NOT EXISTS donations_paddle_checkout_id_idx ON donations(paddle_checkout_id);

-- Add RLS policies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all donations
CREATE POLICY admin_select_donations ON donations
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.clerk_id = auth.uid()
    AND (users.role = 'admin' OR users.role = 'owner')
  ));

-- Policy for users to view their own donations
CREATE POLICY user_select_own_donations ON donations
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy for the system (service role) to insert donations
CREATE POLICY system_insert_donations ON donations
  FOR INSERT
  WITH CHECK (true); 