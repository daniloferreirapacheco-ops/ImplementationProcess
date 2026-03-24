-- Add missing columns to accounts table (if they don't exist)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS zip text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  title text,
  email text,
  phone text,
  role text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts (same pattern as other tables)
CREATE POLICY "Authenticated users can view contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (true);
