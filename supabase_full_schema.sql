-- ============================================================
-- Implementation Process - Full Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- This script uses CREATE TABLE IF NOT EXISTS and
-- ALTER TABLE ADD COLUMN IF NOT EXISTS to be safe to re-run.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_select_authenticated' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_select_authenticated ON profiles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'profiles_update_own' AND tablename = 'profiles') THEN
    CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
  END IF;
END $$;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. ACCOUNTS (Customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns if they don't exist (safe for re-runs)
DO $$ BEGIN
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS industry TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS state TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS zip TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'accounts_all_authenticated' AND tablename = 'accounts') THEN
    CREATE POLICY accounts_all_authenticated ON accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 3. CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('decision_maker', 'champion', 'technical', 'end_user', 'influencer', 'other')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS role TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_select_authenticated' AND tablename = 'contacts') THEN
    CREATE POLICY contacts_select_authenticated ON contacts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_insert_authenticated' AND tablename = 'contacts') THEN
    CREATE POLICY contacts_insert_authenticated ON contacts FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_update_authenticated' AND tablename = 'contacts') THEN
    CREATE POLICY contacts_update_authenticated ON contacts FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_delete_authenticated' AND tablename = 'contacts') THEN
    CREATE POLICY contacts_delete_authenticated ON contacts FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ============================================================
-- 4. OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  opportunity_type TEXT CHECK (opportunity_type IN ('new_implementation', 'expansion', 'upgrade', 'migration', 'integration')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  estimated_value NUMERIC,
  target_close_date DATE,
  target_golive_date DATE,
  requested_modules TEXT[],
  early_risk_indicators TEXT[],
  notes TEXT,
  qualification_score NUMERIC,
  complexity_level TEXT CHECK (complexity_level IN ('low', 'medium', 'high')),
  discovery_depth TEXT CHECK (discovery_depth IN ('light', 'standard', 'deep')),
  sales_owner_id UUID REFERENCES auth.users(id),
  stage TEXT DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'discovery_required', 'approved', 'closed_lost', 'converted')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS opportunity_type TEXT;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS urgency TEXT;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS target_close_date DATE;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS target_golive_date DATE;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS requested_modules TEXT[];
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS early_risk_indicators TEXT[];
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS qualification_score NUMERIC;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS complexity_level TEXT;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS discovery_depth TEXT;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS sales_owner_id UUID;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new';
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'opportunities_all_authenticated' AND tablename = 'opportunities') THEN
    CREATE POLICY opportunities_all_authenticated ON opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 5. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  start_date DATE,
  planned_end_date DATE,
  golive_target DATE,
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'kickoff_planned', 'discovery_design', 'configuration',
    'integration', 'testing', 'readiness_review', 'golive_planned',
    'hypercare', 'handoff_to_support', 'closed', 'at_risk', 'blocked', 'on_hold'
  )),
  health TEXT DEFAULT 'grey' CHECK (health IN ('green', 'yellow', 'red', 'grey')),
  notes TEXT,
  readiness_score NUMERIC,
  budget_hours NUMERIC,
  budget_cost NUMERIC,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS opportunity_id UUID;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_end_date DATE;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS golive_target DATE;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS health TEXT DEFAULT 'grey';
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS readiness_score NUMERIC;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_hours NUMERIC;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_cost NUMERIC;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'projects_all_authenticated' AND tablename = 'projects') THEN
    CREATE POLICY projects_all_authenticated ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 6. MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE milestones ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE milestones ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE milestones ADD COLUMN IF NOT EXISTS due_date DATE;
  ALTER TABLE milestones ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
  ALTER TABLE milestones ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE milestones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'milestones_all_authenticated' AND tablename = 'milestones') THEN
    CREATE POLICY milestones_all_authenticated ON milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 7. BLOCKERS
-- ============================================================
CREATE TABLE IF NOT EXISTS blockers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE blockers ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE blockers ADD COLUMN IF NOT EXISTS title TEXT;
  ALTER TABLE blockers ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium';
  ALTER TABLE blockers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
  ALTER TABLE blockers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE blockers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE blockers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blockers_all_authenticated' AND tablename = 'blockers') THEN
    CREATE POLICY blockers_all_authenticated ON blockers FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 8. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'Commercial Print', 'Packaging / Labels', 'Wide Format / Signage',
    'Books / Publishing', 'Direct Mail', 'Forms / NCR',
    'Promotional / Specialty', 'Digital / Variable Data',
    'Transactional', 'Apparel / Textile', 'Other'
  )),
  description TEXT,
  complexity TEXT CHECK (complexity IN ('low', 'medium', 'high')),
  volume TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE products ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS complexity TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS volume TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'products_all_authenticated' AND tablename = 'products') THEN
    CREATE POLICY products_all_authenticated ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 9. MACHINES
-- ============================================================
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  machine_type TEXT CHECK (machine_type IN (
    'Offset Press', 'Digital Press', 'Wide Format', 'Cutting / Finishing',
    'Binding / Stitching', 'Folding', 'Mailing / Inserting', 'Packaging',
    'Labeling', 'Inkjet', 'Engraving / Laser', 'Other'
  )),
  brand TEXT NOT NULL,
  model TEXT,
  year INTEGER,
  max_format TEXT,
  colors TEXT,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  complexity_signal TEXT CHECK (complexity_signal IN ('low', 'medium', 'high')),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS account_id UUID;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS machine_type TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS brand TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS model TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS year INTEGER;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS max_format TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS colors TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS complexity_signal TEXT;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS updated_by UUID;
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE machines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'machines_all_authenticated' AND tablename = 'machines') THEN
    CREATE POLICY machines_all_authenticated ON machines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 10. TASK TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT,
  phase TEXT,
  enabled BOOLEAN DEFAULT true,
  sort_order INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS phase TEXT;
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS sort_order INTEGER;
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_templates_all_authenticated' AND tablename = 'task_templates') THEN
    CREATE POLICY task_templates_all_authenticated ON task_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 11. TIME ENTRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  task_name TEXT NOT NULL,
  date DATE,
  hours NUMERIC NOT NULL,
  rate NUMERIC,
  cost NUMERIC,
  user_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS user_id UUID;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS task_name TEXT;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS date DATE;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS hours NUMERIC;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS rate NUMERIC;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS cost NUMERIC;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS user_name TEXT;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'time_entries_all_authenticated' AND tablename = 'time_entries') THEN
    CREATE POLICY time_entries_all_authenticated ON time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 12. DISCOVERY RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS discovery_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  business_segment TEXT,
  number_of_locations INTEGER,
  number_of_estimators INTEGER,
  process_maturity TEXT CHECK (process_maturity IN ('advanced', 'intermediate', 'basic', 'unknown')),
  key_pain_points TEXT,
  product_families TEXT[],
  workflow_notes TEXT,
  current_systems TEXT,
  integration_needs TEXT,
  data_readiness TEXT CHECK (data_readiness IN ('ready', 'partial', 'poor', 'unknown')),
  reporting_needs TEXT,
  decision_maker TEXT,
  sme_contacts TEXT,
  meeting_cadence TEXT,
  missing_information TEXT,
  specialist_review_required BOOLEAN DEFAULT false,
  complexity_score NUMERIC,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('in_progress', 'completed', 'blocked', 'not_started')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS opportunity_id UUID;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS business_segment TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS number_of_locations INTEGER;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS number_of_estimators INTEGER;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS process_maturity TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS key_pain_points TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS product_families TEXT[];
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS workflow_notes TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS current_systems TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS integration_needs TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS data_readiness TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS reporting_needs TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS decision_maker TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS sme_contacts TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS meeting_cadence TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS missing_information TEXT;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS specialist_review_required BOOLEAN DEFAULT false;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS complexity_score NUMERIC;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE discovery_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE discovery_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'discovery_records_all_authenticated' AND tablename = 'discovery_records') THEN
    CREATE POLICY discovery_records_all_authenticated ON discovery_records FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 13. OPEN QUESTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS open_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovery_id UUID REFERENCES discovery_records(id) ON DELETE CASCADE,
  question TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  asked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE open_questions ADD COLUMN IF NOT EXISTS discovery_id UUID;
  ALTER TABLE open_questions ADD COLUMN IF NOT EXISTS question TEXT;
  ALTER TABLE open_questions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';
  ALTER TABLE open_questions ADD COLUMN IF NOT EXISTS asked_by UUID;
  ALTER TABLE open_questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE open_questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE open_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'open_questions_all_authenticated' AND tablename = 'open_questions') THEN
    CREATE POLICY open_questions_all_authenticated ON open_questions FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 14. SCOPE BASELINES
-- ============================================================
CREATE TABLE IF NOT EXISTS scope_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  discovery_id UUID REFERENCES discovery_records(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  included_modules TEXT,
  excluded_modules TEXT,
  assumptions TEXT,
  exclusions TEXT,
  risks TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  onsite_days INTEGER,
  notes TEXT,
  team_recommendation TEXT,
  phase_plan TEXT,
  workstream_hours JSONB,
  estimated_hours_min NUMERIC,
  estimated_hours_max NUMERIC,
  confidence_score NUMERIC,
  approval_status TEXT DEFAULT 'draft' CHECK (approval_status IN ('draft', 'submitted', 'in_review', 'changes_required', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS opportunity_id UUID;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS discovery_id UUID;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS included_modules TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS excluded_modules TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS assumptions TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS exclusions TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS risks TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS risk_level TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS onsite_days INTEGER;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS team_recommendation TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS phase_plan TEXT;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS workstream_hours JSONB;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS estimated_hours_min NUMERIC;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS estimated_hours_max NUMERIC;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS confidence_score NUMERIC;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'draft';
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE scope_baselines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE scope_baselines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'scope_baselines_all_authenticated' AND tablename = 'scope_baselines') THEN
    CREATE POLICY scope_baselines_all_authenticated ON scope_baselines FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 15. TEST CYCLES
-- ============================================================
CREATE TABLE IF NOT EXISTS test_cycles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'passed', 'failed', 'blocked')),
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  completion_percentage NUMERIC DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS start_date DATE;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS end_date DATE;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS pass_count INTEGER DEFAULT 0;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS fail_count INTEGER DEFAULT 0;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS completion_percentage NUMERIC DEFAULT 0;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS owner_id UUID;
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE test_cycles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE test_cycles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'test_cycles_all_authenticated' AND tablename = 'test_cycles') THEN
    CREATE POLICY test_cycles_all_authenticated ON test_cycles FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 16. TEST CASES
-- ============================================================
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cycle_id UUID REFERENCES test_cycles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scenario TEXT,
  expected_result TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS cycle_id UUID;
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS scenario TEXT;
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expected_result TEXT;
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS severity TEXT;
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
END $$;

ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'test_cases_all_authenticated' AND tablename = 'test_cases') THEN
    CREATE POLICY test_cases_all_authenticated ON test_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 17. HANDOFF PACKAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS handoff_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  delivered_modules TEXT[],
  environment_notes TEXT,
  known_issues TEXT,
  open_risks TEXT,
  support_instructions TEXT,
  escalation_map TEXT,
  approval_status TEXT DEFAULT 'not_started' CHECK (approval_status IN ('not_started', 'in_preparation', 'awaiting_review', 'approved', 'completed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

DO $$ BEGIN
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS delivered_modules TEXT[];
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS environment_notes TEXT;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS known_issues TEXT;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS open_risks TEXT;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS support_instructions TEXT;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS escalation_map TEXT;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'not_started';
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  ALTER TABLE handoff_packages ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
END $$;

ALTER TABLE handoff_packages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'handoff_packages_all_authenticated' AND tablename = 'handoff_packages') THEN
    CREATE POLICY handoff_packages_all_authenticated ON handoff_packages FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- REFRESH SCHEMA CACHE
-- ============================================================
-- After running this script, go to Supabase Dashboard:
-- Settings > API > Click "Reload" to refresh the schema cache
-- Or call: NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- DONE! All 17 tables created/updated with RLS policies.
-- ============================================================
