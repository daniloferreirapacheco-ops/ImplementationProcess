-- ============================================================
-- Demo Data for Partner Presentation
-- Run this in Supabase SQL Editor after all schema tables exist
-- ============================================================

-- Get the current user ID for created_by fields
DO $$
DECLARE
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users LIMIT 1;

  -- ============================================================
  -- CUSTOMERS
  -- ============================================================
  INSERT INTO accounts (id, name, industry, website, phone, address, city, state, zip, status, notes) VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Apex Sheet Metal', 'Manufacturing', 'www.apexsheetmetal.com', '(555) 100-2001', '1200 Industrial Blvd', 'Detroit', 'MI', '48201', 'active', 'Key strategic customer. 3 facilities across Michigan.'),
    ('a0000001-0000-0000-0000-000000000002', 'Summit Fabrication Inc', 'Manufacturing', 'www.summitfab.com', '(555) 200-3002', '450 Precision Way', 'Cleveland', 'OH', '44101', 'active', 'Growing account with expansion plans for Q3.'),
    ('a0000001-0000-0000-0000-000000000003', 'Pacific Metalworks', 'Aerospace', 'www.pacificmetalworks.com', '(555) 300-4003', '8900 Aerospace Dr', 'Seattle', 'WA', '98101', 'prospect', 'Evaluating ERP solutions. Decision expected by end of month.'),
    ('a0000001-0000-0000-0000-000000000004', 'Midwest Precision Parts', 'Automotive', 'www.midwestprecision.com', '(555) 400-5004', '2300 Motor Ave', 'Indianapolis', 'IN', '46201', 'active', 'Tier 2 automotive supplier. 150+ employees.'),
    ('a0000001-0000-0000-0000-000000000005', 'Coastal CNC Solutions', 'Defense', 'www.coastalcnc.com', '(555) 500-6005', '700 Harbor Blvd', 'Norfolk', 'VA', '23501', 'active', 'ITAR compliant facility. High-security requirements.')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- CONTACTS
  -- ============================================================
  INSERT INTO contacts (id, account_id, name, title, email, phone, role, notes) VALUES
    ('c0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Mike Johnson', 'VP Operations', 'mike.j@apexsheetmetal.com', '(555) 100-2010', 'decision_maker', 'Primary decision maker. Prefers email.'),
    ('c0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Sarah Chen', 'IT Director', 'sarah.c@apexsheetmetal.com', '(555) 100-2011', 'technical', 'Technical lead for ERP evaluation.'),
    ('c0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Tom Williams', 'Plant Manager', 'tom.w@apexsheetmetal.com', '(555) 100-2012', 'end_user', 'Main plant floor contact.'),
    ('c0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Lisa Park', 'CEO', 'lisa@summitfab.com', '(555) 200-3010', 'decision_maker', 'Hands-on CEO involved in all major decisions.'),
    ('c0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'James Rivera', 'Operations Manager', 'james.r@summitfab.com', '(555) 200-3011', 'champion', 'Internal champion for the project.'),
    ('c0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'David Kim', 'CTO', 'david.k@pacificmetalworks.com', '(555) 300-4010', 'decision_maker', NULL),
    ('c0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'Amanda Foster', 'Plant Manager', 'amanda.f@midwestprecision.com', '(555) 400-5010', 'champion', 'Very engaged. Attended 3 demos.'),
    ('c0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 'Robert Hayes', 'Director of IT', 'robert.h@coastalcnc.com', '(555) 500-6010', 'technical', 'Security-focused. Needs ITAR compliance proof.')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- OPPORTUNITIES
  -- ============================================================
  INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes, sales_owner_id, created_by) VALUES
    ('o0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Apex Full ERP Implementation', 'converted', 'new_implementation', 'high', 185000, '2026-02-15', '2026-08-01', 'Multi-site rollout. Phase 1: Main plant. Phase 2: Secondary facilities.', uid, uid),
    ('o0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Summit Fab - ERP Upgrade', 'ready_for_scope', 'upgrade', 'medium', 95000, '2026-04-30', '2026-10-15', 'Upgrading from legacy system. Need data migration plan.', uid, uid),
    ('o0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Pacific MW - New Implementation', 'discovery_in_progress', 'new_implementation', 'high', 220000, '2026-05-15', '2026-12-01', 'Aerospace compliance requirements. Complex BOM structures.', uid, uid),
    ('o0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Midwest - Integration Project', 'approved', 'integration', 'medium', 65000, '2026-03-31', '2026-07-15', 'EDI integration with 3 OEM customers.', uid, uid),
    ('o0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Coastal CNC - Expansion Modules', 'qualified', 'expansion', 'low', 45000, '2026-06-30', '2026-09-01', 'Adding quality and scheduling modules.', uid, uid),
    ('o0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'Apex Phase 2 - Secondary Plant', 'new', 'expansion', 'medium', 75000, '2026-09-30', '2027-03-01', 'Rollout to secondary plant after Phase 1 go-live.', uid, uid)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- DISCOVERY RECORDS
  -- ============================================================
  INSERT INTO discovery_records (id, opportunity_id, status, complexity_score, notes, created_by) VALUES
    ('d0000001-0000-0000-0000-000000000001', 'o0000001-0000-0000-0000-000000000001', 'completed', 78, 'Full discovery completed. Complex BOM with 5 levels. 3 work centers. Need custom quoting module.', uid),
    ('d0000001-0000-0000-0000-000000000002', 'o0000001-0000-0000-0000-000000000002', 'completed', 45, 'Standard upgrade path. Data migration from legacy system is main concern.', uid),
    ('d0000001-0000-0000-0000-000000000003', 'o0000001-0000-0000-0000-000000000003', 'in_progress', 85, 'Aerospace compliance adds complexity. AS9100 requirements. Lot traceability needed.', uid)
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

  -- ============================================================
  -- SCOPES
  -- ============================================================
  INSERT INTO scopes (id, opportunity_id, discovery_id, name, risk_level, approval_status, workstream_hours, estimated_hours_min, estimated_hours_max, confidence_score, onsite_days, included_modules, assumptions, risks, team_recommendation, created_by) VALUES
    ('s0000001-0000-0000-0000-000000000001', 'o0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'Apex Full Implementation - Scope v2', 'medium', 'approved',
     '{"discovery_design": 40, "data_preparation": 30, "configuration": 80, "advanced_setup": 25, "integrations": 20, "testing": 35, "training": 24, "project_management": 30, "golive_support": 16, "post_golive": 12}',
     280, 370, 75, 8,
     'Estimating, Quoting, Job Management, Scheduling, Purchasing, Inventory, Shipping, Invoicing, Quality Control',
     'Customer will provide clean data exports by Week 3. Key users available 20 hrs/week during config phase.',
     'Complex BOM may require additional config time. Legacy data quality is unknown.',
     '1 Senior Consultant (lead), 1 Consultant (config), 1 Data Specialist (migration)',
     uid),
    ('s0000001-0000-0000-0000-000000000002', 'o0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000002', 'Summit Fab Upgrade Scope', 'low', 'submitted',
     '{"discovery_design": 20, "data_preparation": 40, "configuration": 30, "testing": 20, "training": 16, "project_management": 16, "golive_support": 8}',
     135, 170, 80, 4,
     'Full system upgrade with data migration from legacy ERP',
     'Current system data can be exported to CSV. No custom integrations needed.',
     'Data quality from legacy system is the primary risk.',
     '1 Senior Consultant, 1 Data Migration Specialist',
     uid)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- PROJECTS
  -- ============================================================
  INSERT INTO projects (id, account_id, opportunity_id, scope_id, name, status, health, start_date, planned_end_date, golive_target, budget_hours, budget_cost, created_by) VALUES
    ('p0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'o0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Apex ERP Implementation', 'configuration', 'green', '2026-02-01', '2026-07-15', '2026-08-01', 320, 48000, uid),
    ('p0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', 'o0000001-0000-0000-0000-000000000004', NULL, 'Midwest EDI Integration', 'testing', 'yellow', '2026-01-15', '2026-05-30', '2026-07-15', 120, 18000, uid)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- MILESTONES
  -- ============================================================
  INSERT INTO milestones (id, project_id, name, status, due_date) VALUES
    ('m0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 'Project Kickoff', 'completed', '2026-02-05'),
    ('m0000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000001', 'Discovery & Design Complete', 'completed', '2026-03-01'),
    ('m0000001-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000001', 'Data Migration Complete', 'completed', '2026-03-15'),
    ('m0000001-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000001', 'Core Configuration Complete', 'pending', '2026-04-15'),
    ('m0000001-0000-0000-0000-000000000005', 'p0000001-0000-0000-0000-000000000001', 'UAT Start', 'pending', '2026-05-01'),
    ('m0000001-0000-0000-0000-000000000006', 'p0000001-0000-0000-0000-000000000001', 'UAT Complete & Sign-off', 'pending', '2026-06-01'),
    ('m0000001-0000-0000-0000-000000000007', 'p0000001-0000-0000-0000-000000000001', 'Training Complete', 'pending', '2026-06-15'),
    ('m0000001-0000-0000-0000-000000000008', 'p0000001-0000-0000-0000-000000000001', 'Go-Live', 'pending', '2026-08-01'),
    ('m0000001-0000-0000-0000-000000000009', 'p0000001-0000-0000-0000-000000000002', 'EDI Mapping Complete', 'completed', '2026-02-15'),
    ('m0000001-0000-0000-0000-000000000010', 'p0000001-0000-0000-0000-000000000002', 'Integration Testing', 'pending', '2026-03-20'),
    ('m0000001-0000-0000-0000-000000000011', 'p0000001-0000-0000-0000-000000000002', 'OEM Partner Testing', 'pending', '2026-04-15')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

  -- ============================================================
  -- BLOCKERS
  -- ============================================================
  INSERT INTO blockers (id, project_id, title, severity, status) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 'Legacy data export has duplicate part numbers', 'high', 'open'),
    ('b0000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000001', 'Custom quoting formula needs validation with sales team', 'medium', 'open'),
    ('b0000001-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000002', 'OEM partner delayed EDI testing environment setup', 'critical', 'open'),
    ('b0000001-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000002', 'ASN format mismatch with Ford requirements', 'high', 'resolved')
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

  -- ============================================================
  -- PROJECT PLAN TASKS
  -- ============================================================
  INSERT INTO project_plan_tasks (id, project_id, scope_id, name, phase, estimated_hours, status, priority, completion_pct, planned_start, planned_end, sort_order, created_by) VALUES
    ('t0000001-0000-0000-0000-000000000001', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Discovery & Requirements Gathering', 'discovery', 40, 'completed', 'high', 100, '2026-02-01', '2026-02-21', 0, uid),
    ('t0000001-0000-0000-0000-000000000002', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Data Preparation & Migration', 'data_preparation', 30, 'completed', 'high', 100, '2026-02-15', '2026-03-15', 1, uid),
    ('t0000001-0000-0000-0000-000000000003', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Core Module Configuration', 'configuration', 80, 'in_progress', 'high', 65, '2026-03-01', '2026-04-30', 2, uid),
    ('t0000001-0000-0000-0000-000000000004', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Advanced Setup & Custom Workflows', 'advanced_setup', 25, 'not_started', 'medium', 0, '2026-04-15', '2026-05-15', 3, uid),
    ('t0000001-0000-0000-0000-000000000005', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Integration Setup', 'integrations', 20, 'not_started', 'medium', 0, '2026-04-20', '2026-05-20', 4, uid),
    ('t0000001-0000-0000-0000-000000000006', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'User Acceptance Testing', 'testing', 35, 'not_started', 'critical', 0, '2026-05-01', '2026-06-01', 5, uid),
    ('t0000001-0000-0000-0000-000000000007', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'End User Training', 'training', 24, 'not_started', 'high', 0, '2026-06-01', '2026-06-20', 6, uid),
    ('t0000001-0000-0000-0000-000000000008', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Project Management', 'project_management', 30, 'in_progress', 'medium', 50, '2026-02-01', '2026-08-01', 7, uid),
    ('t0000001-0000-0000-0000-000000000009', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Go-Live Support', 'golive', 16, 'not_started', 'high', 0, '2026-07-25', '2026-08-10', 8, uid),
    ('t0000001-0000-0000-0000-000000000010', 'p0000001-0000-0000-0000-000000000001', 's0000001-0000-0000-0000-000000000001', 'Post Go-Live Support', 'post_golive', 12, 'not_started', 'low', 0, '2026-08-10', '2026-09-01', 9, uid)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

END $$;
