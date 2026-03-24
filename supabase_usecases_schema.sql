-- ============================================================
-- Use Cases & Testing Schema
-- Run in Supabase SQL Editor after the main schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USE CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS use_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  module TEXT,
  workflow_area TEXT,
  type_tags TEXT[],
  owner TEXT,
  tester TEXT,
  priority TEXT DEFAULT 'Standard' CHECK (priority IN ('Critical', 'Standard')),
  cycle_id UUID,
  status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Not Started', 'In Progress', 'Passed', 'Failed', 'Blocked')),
  description TEXT,
  expected_steps TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS module TEXT;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS workflow_area TEXT;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS type_tags TEXT[];
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS owner TEXT;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS tester TEXT;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Standard';
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS cycle_id UUID;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Draft';
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS expected_steps TEXT[];
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE use_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'use_cases_all_authenticated' AND tablename = 'use_cases') THEN
    CREATE POLICY use_cases_all_authenticated ON use_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- USE CASE TEST CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS use_case_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expected_outcome TEXT,
  result TEXT CHECK (result IN ('Pass', 'Fail')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Complete', 'Blocked', 'Pending')),
  tester TEXT,
  evidence_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS use_case_id UUID;
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS expected_outcome TEXT;
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS result TEXT;
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS tester TEXT;
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS evidence_notes TEXT;
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE use_case_tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE use_case_tests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'use_case_tests_all_authenticated' AND tablename = 'use_case_tests') THEN
    CREATE POLICY use_case_tests_all_authenticated ON use_case_tests FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- DEFECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS defects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id UUID REFERENCES use_case_tests(id) ON DELETE SET NULL,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Ready to Retest', 'Resolved')),
  description TEXT,
  steps_to_reproduce TEXT,
  expected_result TEXT,
  actual_result TEXT,
  impact TEXT,
  logged_by TEXT,
  assigned_to TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  activity_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS test_case_id UUID;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS use_case_id UUID;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'Medium';
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS steps_to_reproduce TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS expected_result TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS actual_result TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS impact TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS logged_by TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS assigned_to TEXT;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS logged_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]';
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE defects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE defects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'defects_all_authenticated' AND tablename = 'defects') THEN
    CREATE POLICY defects_all_authenticated ON defects FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- USE CASE CYCLES (extends test_cycles or standalone)
-- ============================================================
CREATE TABLE IF NOT EXISTS uc_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  owner TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Complete', 'Closed')),
  use_case_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS owner TEXT;
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS start_date DATE;
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS end_date DATE;
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Planned';
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS use_case_ids UUID[];
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE uc_cycles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE uc_cycles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uc_cycles_all_authenticated' AND tablename = 'uc_cycles') THEN
    CREATE POLICY uc_cycles_all_authenticated ON uc_cycles FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- SIGNOFFS
-- ============================================================
CREATE TABLE IF NOT EXISTS uc_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  use_case_id UUID REFERENCES use_cases(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_role TEXT,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE uc_signoffs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'uc_signoffs_all_authenticated' AND tablename = 'uc_signoffs') THEN
    CREATE POLICY uc_signoffs_all_authenticated ON uc_signoffs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
