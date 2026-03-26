-- ============================================================
-- Project Plan Tasks Schema
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS project_plan_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scope_id UUID REFERENCES scope_baselines(id) ON DELETE SET NULL,

  -- Task identity
  name TEXT NOT NULL,
  description TEXT,
  phase TEXT CHECK (phase IN (
    'discovery', 'design', 'data_preparation', 'configuration',
    'advanced_setup', 'integrations', 'testing', 'training',
    'project_management', 'golive', 'post_golive'
  )),
  workstream TEXT,  -- links to scope workstream_hours keys

  -- Assignment
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_name TEXT,

  -- Scheduling
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,

  -- Effort
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,

  -- Progress & status
  status TEXT DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'completed', 'on_hold', 'blocked', 'cancelled'
  )),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  completion_pct INTEGER DEFAULT 0 CHECK (completion_pct >= 0 AND completion_pct <= 100),

  -- Dependencies
  dependency_task_id UUID REFERENCES project_plan_tasks(id) ON DELETE SET NULL,

  -- Ordering
  sort_order INTEGER DEFAULT 0,
  is_milestone BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Safe column additions for re-runs
DO $$ BEGIN
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS project_id UUID;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS scope_id UUID;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS phase TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS workstream TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS assigned_name TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS planned_start DATE;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS planned_end DATE;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS actual_start DATE;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS actual_end DATE;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS status TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS priority TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS completion_pct INTEGER;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS dependency_task_id UUID;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS sort_order INTEGER;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS created_by UUID;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
  ALTER TABLE project_plan_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
END $$;

-- RLS
ALTER TABLE project_plan_tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'project_plan_tasks_all_auth' AND tablename = 'project_plan_tasks') THEN
    CREATE POLICY project_plan_tasks_all_auth ON project_plan_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_plan_tasks_project ON project_plan_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_assigned ON project_plan_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_status ON project_plan_tasks(status);
