-- ============================================================
-- ROI Discovery & Calculator Schema
-- Run in Supabase SQL Editor after the main schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS roi_discoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,

  -- Section 1: Business Volume
  annual_revenue NUMERIC,
  estimates_per_month NUMERIC,
  jobs_per_month NUMERIC,
  on_time_delivery_pct NUMERIC,
  num_estimators NUMERIC,
  num_csr NUMERIC,
  num_planners NUMERIC,
  num_schedulers NUMERIC,
  num_production_managers NUMERIC,
  num_production_staff NUMERIC,
  num_locations NUMERIC,

  -- Section 2: Estimating
  minutes_per_simple_estimate NUMERIC,
  minutes_per_complex_estimate NUMERIC,
  pct_jobs_estimated NUMERIC,
  estimate_method TEXT,
  markup_consistent BOOLEAN,
  freight_in_estimates BOOLEAN,
  estimate_conversion_pct NUMERIC,
  avg_revisions_per_job NUMERIC,
  rates_update_frequency TEXT,
  commission_in_estimates BOOLEAN,
  has_underpriced_customers BOOLEAN,
  estimating_notes TEXT,

  -- Section 3: Job Entry & Planning
  job_creation_method TEXT,
  minutes_per_job_entry NUMERIC,
  same_person_estimates_enters BOOLEAN,
  uses_gang_shell_stock BOOLEAN,
  reprint_history_reused BOOLEAN,
  alterations_captured BOOLEAN,
  shipping_communication TEXT,
  internal_jobs_tracked BOOLEAN,
  job_entry_notes TEXT,

  -- Section 4: Scheduling
  schedule_method TEXT,
  schedule_update_frequency TEXT,
  all_departments_scheduled BOOLEAN,
  num_shifts NUMERIC,
  avg_turnaround_days NUMERIC,
  machine_substitution_frequent BOOLEAN,
  scheduling_notes TEXT,

  -- Section 5: Materials & Purchasing
  purchasing_centralized BOOLEAN,
  min_max_inventory_managed BOOLEAN,
  stock_reserved_for_jobs BOOLEAN,
  fifo_enforced BOOLEAN,
  inventory_count_frequency TEXT,
  damaged_inventory_tracked BOOLEAN,
  material_conversion_needed BOOLEAN,
  consignment_items BOOLEAN,
  paper_waste_pct NUMERIC,
  outside_services_tracked BOOLEAN,
  materials_notes TEXT,

  -- Section 6: Job Costing & Margin
  costing_model TEXT,
  wip_valuation_method TEXT,
  pre_bill_cost_review BOOLEAN,
  actual_vs_estimated_compared BOOLEAN,
  freight_billing_method TEXT,
  cost_analyzed_per_job BOOLEAN,
  pct_jobs_profitable_but_not NUMERIC,
  costing_notes TEXT,

  -- Section 7: AR & Billing
  pre_invoice_review BOOLEAN,
  multi_job_invoicing BOOLEAN,
  sales_tax_manual BOOLEAN,
  payment_terms TEXT,
  avg_dso_days NUMERIC,
  deposits_tracked BOOLEAN,
  annual_bad_debt NUMERIC,
  billing_notes TEXT,

  -- Section 8: Reporting
  monthly_close_days NUMERIC,
  real_time_job_margin BOOLEAN,
  customer_profitability_visible BOOLEAN,
  kpi_tracking_method TEXT,
  shop_floor_visibility BOOLEAN,
  reporting_notes TEXT,

  -- Section 9: Current Systems
  current_systems TEXT,
  double_entry_systems NUMERIC,
  spreadsheet_processes BOOLEAN,
  annual_software_cost NUMERIC,
  systems_notes TEXT,

  -- Section 10: ROI Quantification Inputs
  estimator_hourly_rate NUMERIC,
  csr_planner_hourly_rate NUMERIC,
  material_waste_pct_actual NUMERIC,
  material_waste_pct_target NUMERIC,
  unbilled_alterations_monthly NUMERIC,
  unbilled_freight_monthly NUMERIC,
  late_delivery_penalties_annual NUMERIC,
  annual_writeoffs NUMERIC,

  -- Calculated ROI outputs (stored for reporting)
  roi_estimating_savings NUMERIC,
  roi_job_entry_savings NUMERIC,
  roi_material_savings NUMERIC,
  roi_revenue_recovered NUMERIC,
  roi_billing_savings NUMERIC,
  roi_total_annual NUMERIC,
  roi_pct NUMERIC,
  roi_payback_months NUMERIC,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'complete')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE roi_discoveries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roi_discoveries_all_authenticated' AND tablename = 'roi_discoveries') THEN
    CREATE POLICY roi_discoveries_all_authenticated ON roi_discoveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
