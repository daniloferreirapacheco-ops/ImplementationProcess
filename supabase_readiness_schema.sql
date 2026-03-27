-- ============================================================
-- Go-Live Readiness & Test Tracking Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Test checklist items per project
CREATE TABLE IF NOT EXISTS readiness_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'not_tested' CHECK (status IN ('not_tested', 'passed', 'failed', 'blocked', 'skipped')),
  priority TEXT DEFAULT 'required' CHECK (priority IN ('required', 'recommended', 'optional')),
  tester_name TEXT,
  tested_at TIMESTAMPTZ,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE readiness_checks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'readiness_checks' AND policyname = 'readiness_checks_all') THEN
    CREATE POLICY readiness_checks_all ON readiness_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON readiness_checks TO authenticated;
CREATE INDEX IF NOT EXISTS idx_readiness_project ON readiness_checks(project_id);

-- Go-live sign-offs per project
CREATE TABLE IF NOT EXISTS golive_signoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  role TEXT NOT NULL,
  signer_name TEXT,
  signed BOOLEAN DEFAULT false,
  signed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE golive_signoffs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'golive_signoffs' AND policyname = 'golive_signoffs_all') THEN
    CREATE POLICY golive_signoffs_all ON golive_signoffs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON golive_signoffs TO authenticated;

NOTIFY pgrst, 'reload schema';
