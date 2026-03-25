-- ============================================================
-- Supabase Improvements Schema
-- Tables: project_team, project_notes, change_requests, meetings
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. project_team — Team assignment to projects
-- ============================================================
CREATE TABLE IF NOT EXISTS project_team (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('pm', 'consultant', 'sales', 'support', 'specialist', 'developer')),
  email TEXT,
  start_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_team_all_access"
  ON project_team
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. project_notes — Activity / notes log
-- ============================================================
CREATE TABLE IF NOT EXISTS project_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  author_name TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_notes_all_access"
  ON project_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. change_requests — Scope change tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID REFERENCES scope_baselines(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  impact_hours NUMERIC,
  impact_cost NUMERIC,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  requested_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "change_requests_all_access"
  ON change_requests
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. meetings — Meeting / communication log
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE,
  attendees TEXT[],
  notes TEXT,
  action_items JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_all_access"
  ON meetings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
