-- ============================================================
-- Demo Data for Partner Presentation (Safe Version)
-- Run this in Supabase SQL Editor
-- Uses simple inserts that skip on conflict
-- ============================================================

-- CUSTOMERS
INSERT INTO accounts (id, name, industry, website, phone, address, city, state, zip, status, notes)
SELECT 'a0000001-0000-0000-0000-000000000001', 'Apex Sheet Metal', 'Manufacturing', 'www.apexsheetmetal.com', '(555) 100-2001', '1200 Industrial Blvd', 'Detroit', 'MI', '48201', 'active', 'Key strategic customer. 3 facilities across Michigan.'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 'a0000001-0000-0000-0000-000000000001');

INSERT INTO accounts (id, name, industry, website, phone, address, city, state, zip, status, notes)
SELECT 'a0000001-0000-0000-0000-000000000002', 'Summit Fabrication Inc', 'Manufacturing', 'www.summitfab.com', '(555) 200-3002', '450 Precision Way', 'Cleveland', 'OH', '44101', 'active', 'Growing account with expansion plans for Q3.'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 'a0000001-0000-0000-0000-000000000002');

INSERT INTO accounts (id, name, industry, website, phone, address, city, state, zip, status, notes)
SELECT 'a0000001-0000-0000-0000-000000000003', 'Pacific Metalworks', 'Aerospace', 'www.pacificmetalworks.com', '(555) 300-4003', '8900 Aerospace Dr', 'Seattle', 'WA', '98101', 'prospect', 'Evaluating ERP solutions. Decision expected by end of month.'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 'a0000001-0000-0000-0000-000000000003');

INSERT INTO accounts (id, name, industry, website, phone, address, city, state, zip, status, notes)
SELECT 'a0000001-0000-0000-0000-000000000004', 'Midwest Precision Parts', 'Automotive', 'www.midwestprecision.com', '(555) 400-5004', '2300 Motor Ave', 'Indianapolis', 'IN', '46201', 'active', 'Tier 2 automotive supplier. 150+ employees.'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 'a0000001-0000-0000-0000-000000000004');

INSERT INTO accounts (id, name, industry, website, phone, address, city, state, zip, status, notes)
SELECT 'a0000001-0000-0000-0000-000000000005', 'Coastal CNC Solutions', 'Defense', 'www.coastalcnc.com', '(555) 500-6005', '700 Harbor Blvd', 'Norfolk', 'VA', '23501', 'active', 'ITAR compliant facility. High-security requirements.'
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE id = 'a0000001-0000-0000-0000-000000000005');

-- CONTACTS (without role constraint - use NULL if role column has CHECK)
INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Mike Johnson', 'VP Operations', 'mike.j@apexsheetmetal.com', '(555) 100-2010', 'Primary decision maker. Prefers email.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000001');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Sarah Chen', 'IT Director', 'sarah.c@apexsheetmetal.com', '(555) 100-2011', 'Technical lead for ERP evaluation.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000002');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Tom Williams', 'Plant Manager', 'tom.w@apexsheetmetal.com', '(555) 100-2012', 'Main plant floor contact.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000003');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'Lisa Park', 'CEO', 'lisa@summitfab.com', '(555) 200-3010', 'Hands-on CEO involved in all major decisions.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000004');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'James Rivera', 'Operations Manager', 'james.r@summitfab.com', '(555) 200-3011', 'Internal champion for the project.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000005');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'David Kim', 'CTO', 'david.k@pacificmetalworks.com', '(555) 300-4010', NULL
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000006');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000004', 'Amanda Foster', 'Plant Manager', 'amanda.f@midwestprecision.com', '(555) 400-5010', 'Very engaged. Attended 3 demos.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000007');

INSERT INTO contacts (id, account_id, name, title, email, phone, notes)
SELECT 'cc000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000005', 'Robert Hayes', 'Director of IT', 'robert.h@coastalcnc.com', '(555) 500-6010', 'Security-focused. Needs ITAR compliance proof.'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = 'cc000001-0000-0000-0000-000000000008');

-- OPPORTUNITIES (without sales_owner_id which may not exist)
INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes)
SELECT '00000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Apex Full ERP Implementation', 'converted', 'new_implementation', 'high', 185000, '2026-02-15', '2026-08-01', 'Multi-site rollout. Phase 1: Main plant. Phase 2: Secondary facilities.'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE id = '00000001-0000-0000-0000-000000000001');

INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes)
SELECT '00000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000002', 'Summit Fab - ERP Upgrade', 'qualified', 'upgrade', 'medium', 95000, '2026-04-30', '2026-10-15', 'Upgrading from legacy system. Need data migration plan.'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE id = '00000001-0000-0000-0000-000000000002');

INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes)
SELECT '00000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000003', 'Pacific MW - New Implementation', 'qualified', 'new_implementation', 'high', 220000, '2026-05-15', '2026-12-01', 'Aerospace compliance requirements. Complex BOM structures.'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE id = '00000001-0000-0000-0000-000000000003');

INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes)
SELECT '00000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000004', 'Midwest - Integration Project', 'approved', 'integration', 'medium', 65000, '2026-03-31', '2026-07-15', 'EDI integration with 3 OEM customers.'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE id = '00000001-0000-0000-0000-000000000004');

INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes)
SELECT '00000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000005', 'Coastal CNC - Expansion Modules', 'qualified', 'expansion', 'low', 45000, '2026-06-30', '2026-09-01', 'Adding quality and scheduling modules.'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE id = '00000001-0000-0000-0000-000000000005');

INSERT INTO opportunities (id, account_id, name, stage, opportunity_type, urgency, estimated_value, target_close_date, target_golive_date, notes)
SELECT '00000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000001', 'Apex Phase 2 - Secondary Plant', 'new', 'expansion', 'medium', 75000, '2026-09-30', '2027-03-01', 'Rollout to secondary plant after Phase 1 go-live.'
WHERE NOT EXISTS (SELECT 1 FROM opportunities WHERE id = '00000001-0000-0000-0000-000000000006');

-- DISCOVERY RECORDS
INSERT INTO discovery_records (id, opportunity_id, status, complexity_score, notes)
SELECT 'dd000001-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'completed', 78, 'Full discovery completed. Complex BOM with 5 levels. 3 work centers.'
WHERE NOT EXISTS (SELECT 1 FROM discovery_records WHERE id = 'dd000001-0000-0000-0000-000000000001');

INSERT INTO discovery_records (id, opportunity_id, status, complexity_score, notes)
SELECT 'dd000001-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000002', 'completed', 45, 'Standard upgrade path. Data migration from legacy system is main concern.'
WHERE NOT EXISTS (SELECT 1 FROM discovery_records WHERE id = 'dd000001-0000-0000-0000-000000000002');

INSERT INTO discovery_records (id, opportunity_id, status, complexity_score, notes)
SELECT 'dd000001-0000-0000-0000-000000000003', '00000001-0000-0000-0000-000000000003', 'in_progress', 85, 'Aerospace compliance adds complexity. AS9100 requirements.'
WHERE NOT EXISTS (SELECT 1 FROM discovery_records WHERE id = 'dd000001-0000-0000-0000-000000000003');

-- SCOPES
INSERT INTO scopes (id, opportunity_id, name, risk_level, approval_status, workstream_hours, estimated_hours_min, estimated_hours_max, confidence_score, onsite_days, included_modules, assumptions, risks, team_recommendation)
SELECT '55000001-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', 'Apex Full Implementation - Scope v2', 'medium', 'approved',
  '{"discovery_design": 40, "data_preparation": 30, "configuration": 80, "advanced_setup": 25, "integrations": 20, "testing": 35, "training": 24, "project_management": 30, "golive_support": 16, "post_golive": 12}'::jsonb,
  280, 370, 75, 8,
  'Estimating, Quoting, Job Management, Scheduling, Purchasing, Inventory, Shipping, Invoicing, Quality Control',
  'Customer will provide clean data exports by Week 3. Key users available 20 hrs/week during config phase.',
  'Complex BOM may require additional config time. Legacy data quality is unknown.',
  '1 Senior Consultant (lead), 1 Consultant (config), 1 Data Specialist (migration)'
WHERE NOT EXISTS (SELECT 1 FROM scopes WHERE id = '55000001-0000-0000-0000-000000000001');

INSERT INTO scopes (id, opportunity_id, name, risk_level, approval_status, workstream_hours, estimated_hours_min, estimated_hours_max, confidence_score, onsite_days, included_modules, assumptions, risks, team_recommendation)
SELECT '55000001-0000-0000-0000-000000000002', '00000001-0000-0000-0000-000000000002', 'Summit Fab Upgrade Scope', 'low', 'submitted',
  '{"discovery_design": 20, "data_preparation": 40, "configuration": 30, "testing": 20, "training": 16, "project_management": 16, "golive_support": 8}'::jsonb,
  135, 170, 80, 4,
  'Full system upgrade with data migration from legacy ERP',
  'Current system data can be exported to CSV. No custom integrations needed.',
  'Data quality from legacy system is the primary risk.',
  '1 Senior Consultant, 1 Data Migration Specialist'
WHERE NOT EXISTS (SELECT 1 FROM scopes WHERE id = '55000001-0000-0000-0000-000000000002');

-- PROJECTS
INSERT INTO projects (id, account_id, opportunity_id, scope_id, name, status, health, start_date, planned_end_date, golive_target, budget_hours, budget_cost)
SELECT 'bb000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', '00000001-0000-0000-0000-000000000001', '55000001-0000-0000-0000-000000000001', 'Apex ERP Implementation', 'configuration', 'green', '2026-02-01', '2026-07-15', '2026-08-01', 320, 48000
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 'bb000001-0000-0000-0000-000000000001');

INSERT INTO projects (id, account_id, opportunity_id, name, status, health, start_date, planned_end_date, golive_target, budget_hours, budget_cost)
SELECT 'bb000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000004', '00000001-0000-0000-0000-000000000004', 'Midwest EDI Integration', 'testing', 'yellow', '2026-01-15', '2026-05-30', '2026-07-15', 120, 18000
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 'bb000001-0000-0000-0000-000000000002');

-- MILESTONES
INSERT INTO milestones (id, project_id, name, status, due_date)
SELECT v.* FROM (VALUES
  ('ee000001-0000-0000-0000-000000000001'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Project Kickoff', 'completed', '2026-02-05'::date),
  ('ee000001-0000-0000-0000-000000000002'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Discovery & Design Complete', 'completed', '2026-03-01'::date),
  ('ee000001-0000-0000-0000-000000000003'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Data Migration Complete', 'completed', '2026-03-15'::date),
  ('ee000001-0000-0000-0000-000000000004'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Core Configuration Complete', 'pending', '2026-04-15'::date),
  ('ee000001-0000-0000-0000-000000000005'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'UAT Start', 'pending', '2026-05-01'::date),
  ('ee000001-0000-0000-0000-000000000006'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'UAT Complete & Sign-off', 'pending', '2026-06-01'::date),
  ('ee000001-0000-0000-0000-000000000007'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Training Complete', 'pending', '2026-06-15'::date),
  ('ee000001-0000-0000-0000-000000000008'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Go-Live', 'pending', '2026-08-01'::date),
  ('ee000001-0000-0000-0000-000000000009'::uuid, 'bb000001-0000-0000-0000-000000000002'::uuid, 'EDI Mapping Complete', 'completed', '2026-02-15'::date),
  ('ee000001-0000-0000-0000-000000000010'::uuid, 'bb000001-0000-0000-0000-000000000002'::uuid, 'Integration Testing', 'pending', '2026-03-20'::date),
  ('ee000001-0000-0000-0000-000000000011'::uuid, 'bb000001-0000-0000-0000-000000000002'::uuid, 'OEM Partner Testing', 'pending', '2026-04-15'::date)
) AS v(id, project_id, name, status, due_date)
WHERE NOT EXISTS (SELECT 1 FROM milestones WHERE id = v.id);

-- BLOCKERS
INSERT INTO blockers (id, project_id, title, severity, status)
SELECT v.* FROM (VALUES
  ('ff000001-0000-0000-0000-000000000001'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Legacy data export has duplicate part numbers', 'high', 'open'),
  ('ff000001-0000-0000-0000-000000000002'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, 'Custom quoting formula needs validation with sales team', 'medium', 'open'),
  ('ff000001-0000-0000-0000-000000000003'::uuid, 'bb000001-0000-0000-0000-000000000002'::uuid, 'OEM partner delayed EDI testing environment setup', 'critical', 'open'),
  ('ff000001-0000-0000-0000-000000000004'::uuid, 'bb000001-0000-0000-0000-000000000002'::uuid, 'ASN format mismatch with Ford requirements', 'high', 'resolved')
) AS v(id, project_id, title, severity, status)
WHERE NOT EXISTS (SELECT 1 FROM blockers WHERE id = v.id);

-- PROJECT PLAN TASKS
INSERT INTO project_plan_tasks (id, project_id, scope_id, name, phase, estimated_hours, status, priority, completion_pct, planned_start, planned_end, sort_order)
SELECT v.* FROM (VALUES
  ('aa000001-0000-0000-0000-000000000001'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Discovery & Requirements Gathering', 'discovery', 40::numeric, 'completed', 'high', 100, '2026-02-01'::date, '2026-02-21'::date, 0),
  ('aa000001-0000-0000-0000-000000000002'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Data Preparation & Migration', 'data_preparation', 30::numeric, 'completed', 'high', 100, '2026-02-15'::date, '2026-03-15'::date, 1),
  ('aa000001-0000-0000-0000-000000000003'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Core Module Configuration', 'configuration', 80::numeric, 'in_progress', 'high', 65, '2026-03-01'::date, '2026-04-30'::date, 2),
  ('aa000001-0000-0000-0000-000000000004'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Advanced Setup & Custom Workflows', 'advanced_setup', 25::numeric, 'not_started', 'medium', 0, '2026-04-15'::date, '2026-05-15'::date, 3),
  ('aa000001-0000-0000-0000-000000000005'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Integration Setup', 'integrations', 20::numeric, 'not_started', 'medium', 0, '2026-04-20'::date, '2026-05-20'::date, 4),
  ('aa000001-0000-0000-0000-000000000006'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'User Acceptance Testing', 'testing', 35::numeric, 'not_started', 'critical', 0, '2026-05-01'::date, '2026-06-01'::date, 5),
  ('aa000001-0000-0000-0000-000000000007'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'End User Training', 'training', 24::numeric, 'not_started', 'high', 0, '2026-06-01'::date, '2026-06-20'::date, 6),
  ('aa000001-0000-0000-0000-000000000008'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Project Management', 'project_management', 30::numeric, 'in_progress', 'medium', 50, '2026-02-01'::date, '2026-08-01'::date, 7),
  ('aa000001-0000-0000-0000-000000000009'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Go-Live Support', 'golive', 16::numeric, 'not_started', 'high', 0, '2026-07-25'::date, '2026-08-10'::date, 8),
  ('aa000001-0000-0000-0000-000000000010'::uuid, 'bb000001-0000-0000-0000-000000000001'::uuid, '55000001-0000-0000-0000-000000000001'::uuid, 'Post Go-Live Support', 'post_golive', 12::numeric, 'not_started', 'low', 0, '2026-08-10'::date, '2026-09-01'::date, 9)
) AS v(id, project_id, scope_id, name, phase, estimated_hours, status, priority, completion_pct, planned_start, planned_end, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM project_plan_tasks WHERE id = v.id);
