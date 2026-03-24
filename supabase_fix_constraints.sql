-- ============================================================
-- FIX: Remove NOT NULL constraints on all optional columns
-- Run this in Supabase SQL Editor to fix insert errors
-- ============================================================

-- ============================================================
-- CONTACTS - drop leftover columns & fix nullable fields
-- ============================================================
ALTER TABLE contacts DROP COLUMN IF EXISTS full_name;
ALTER TABLE contacts ALTER COLUMN title DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN email DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN role DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE contacts ALTER COLUMN updated_at DROP NOT NULL;

-- ============================================================
-- ACCOUNTS - fix nullable fields
-- ============================================================
ALTER TABLE accounts ALTER COLUMN industry DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN website DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN address DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN city DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN state DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN zip DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN status DROP NOT NULL;
ALTER TABLE accounts ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- OPPORTUNITIES - fix nullable fields
-- ============================================================
ALTER TABLE opportunities ALTER COLUMN opportunity_type DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN urgency DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN estimated_value DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN target_close_date DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN target_golive_date DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN requested_modules DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN early_risk_indicators DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN qualification_score DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN complexity_level DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN discovery_depth DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN sales_owner_id DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN stage DROP NOT NULL;
ALTER TABLE opportunities ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- PROJECTS - fix nullable fields
-- ============================================================
ALTER TABLE projects ALTER COLUMN account_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN opportunity_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN scope_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN planned_end_date DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN golive_target DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN status DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN health DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN readiness_score DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- MILESTONES - fix nullable fields
-- ============================================================
ALTER TABLE milestones ALTER COLUMN due_date DROP NOT NULL;
ALTER TABLE milestones ALTER COLUMN status DROP NOT NULL;

-- ============================================================
-- BLOCKERS - fix nullable fields
-- ============================================================
ALTER TABLE blockers ALTER COLUMN severity DROP NOT NULL;
ALTER TABLE blockers ALTER COLUMN status DROP NOT NULL;

-- ============================================================
-- PRODUCTS - fix nullable fields
-- ============================================================
ALTER TABLE products ALTER COLUMN category DROP NOT NULL;
ALTER TABLE products ALTER COLUMN description DROP NOT NULL;
ALTER TABLE products ALTER COLUMN complexity DROP NOT NULL;
ALTER TABLE products ALTER COLUMN volume DROP NOT NULL;
ALTER TABLE products ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE products ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE products ALTER COLUMN updated_by DROP NOT NULL;

-- ============================================================
-- MACHINES - fix nullable fields
-- ============================================================
ALTER TABLE machines ALTER COLUMN machine_type DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN brand DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN model DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN year DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN max_format DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN colors DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN active DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN complexity_signal DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE machines ALTER COLUMN updated_by DROP NOT NULL;

-- ============================================================
-- TASK TEMPLATES - fix nullable fields
-- ============================================================
ALTER TABLE task_templates ALTER COLUMN name DROP NOT NULL;
ALTER TABLE task_templates ALTER COLUMN phase DROP NOT NULL;
ALTER TABLE task_templates ALTER COLUMN enabled DROP NOT NULL;
ALTER TABLE task_templates ALTER COLUMN sort_order DROP NOT NULL;
ALTER TABLE task_templates ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- TIME ENTRIES - fix nullable fields
-- ============================================================
ALTER TABLE time_entries ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN date DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN rate DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN cost DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN user_name DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE time_entries ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- DISCOVERY RECORDS - fix nullable fields
-- ============================================================
ALTER TABLE discovery_records ALTER COLUMN opportunity_id DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN business_segment DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN number_of_locations DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN number_of_estimators DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN process_maturity DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN key_pain_points DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN product_families DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN workflow_notes DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN current_systems DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN integration_needs DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN data_readiness DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN reporting_needs DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN decision_maker DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN sme_contacts DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN meeting_cadence DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN missing_information DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN specialist_review_required DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN complexity_score DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN status DROP NOT NULL;
ALTER TABLE discovery_records ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- OPEN QUESTIONS - fix nullable fields
-- ============================================================
ALTER TABLE open_questions ALTER COLUMN question DROP NOT NULL;
ALTER TABLE open_questions ALTER COLUMN status DROP NOT NULL;
ALTER TABLE open_questions ALTER COLUMN asked_by DROP NOT NULL;

-- ============================================================
-- SCOPE BASELINES - fix nullable fields
-- ============================================================
ALTER TABLE scope_baselines ALTER COLUMN opportunity_id DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN discovery_id DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN included_modules DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN excluded_modules DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN assumptions DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN exclusions DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN risks DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN risk_level DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN onsite_days DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN team_recommendation DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN phase_plan DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN workstream_hours DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN estimated_hours_min DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN estimated_hours_max DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN confidence_score DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN approval_status DROP NOT NULL;
ALTER TABLE scope_baselines ALTER COLUMN created_by DROP NOT NULL;

-- ============================================================
-- TEST CYCLES - fix nullable fields
-- ============================================================
ALTER TABLE test_cycles ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN start_date DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN end_date DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN notes DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN status DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN pass_count DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN fail_count DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN completion_percentage DROP NOT NULL;
ALTER TABLE test_cycles ALTER COLUMN owner_id DROP NOT NULL;

-- ============================================================
-- TEST CASES - fix nullable fields
-- ============================================================
ALTER TABLE test_cases ALTER COLUMN cycle_id DROP NOT NULL;
ALTER TABLE test_cases ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE test_cases ALTER COLUMN scenario DROP NOT NULL;
ALTER TABLE test_cases ALTER COLUMN expected_result DROP NOT NULL;
ALTER TABLE test_cases ALTER COLUMN severity DROP NOT NULL;
ALTER TABLE test_cases ALTER COLUMN status DROP NOT NULL;

-- ============================================================
-- HANDOFF PACKAGES - fix nullable fields
-- ============================================================
ALTER TABLE handoff_packages ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN delivered_modules DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN environment_notes DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN known_issues DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN open_risks DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN support_instructions DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN escalation_map DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN approval_status DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE handoff_packages ALTER COLUMN completed_at DROP NOT NULL;

-- ============================================================
-- ADD MISSING COLUMNS
-- ============================================================

-- task_templates: missing estimated_hours and is_custom
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;

-- ============================================================
-- REFRESH SCHEMA CACHE
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- DONE! All NOT NULL constraints removed from optional fields.
