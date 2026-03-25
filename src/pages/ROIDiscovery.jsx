import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import ROICalculatorPanel from "./ROICalculator"

const SECTIONS = [
  { id: "volume", label: "Business Volume", icon: "1" },
  { id: "estimating", label: "Estimating", icon: "2" },
  { id: "job_entry", label: "Job Entry & Planning", icon: "3" },
  { id: "scheduling", label: "Scheduling", icon: "4" },
  { id: "materials", label: "Materials & Purchasing", icon: "5" },
  { id: "costing", label: "Job Costing & Margin", icon: "6" },
  { id: "billing", label: "AR & Billing", icon: "7" },
  { id: "reporting", label: "Reporting & Visibility", icon: "8" },
  { id: "systems", label: "Current Systems", icon: "9" },
  { id: "quantification", label: "ROI Inputs", icon: "$" },
  { id: "calculator", label: "ROI Calculator", icon: "=" },
]

const pill = (status) => {
  const colors = { draft: { bg: "#f1f5f9", text: "#475569" }, in_progress: { bg: "#dbeafe", text: "#1e40af" }, complete: { bg: "#dcfce7", text: "#166534" } }
  const c = colors[status] || colors.draft
  return { display: "inline-block", fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px", backgroundColor: c.bg, color: c.text }
}

export default function ROIDiscovery() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState("volume")
  const [data, setData] = useState({})
  const [roiId, setRoiId] = useState(null)

  useEffect(() => { fetchData() }, [id])

  const fetchData = async () => {
    const { data: proj } = await supabase.from("projects").select("*, accounts(name)").eq("id", id).single()
    setProject(proj)

    const { data: rois } = await supabase.from("roi_discoveries").select("*").eq("project_id", id).limit(1)
    if (rois && rois.length > 0) {
      setData(rois[0])
      setRoiId(rois[0].id)
    }
    setLoading(false)
  }

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }))

  const save = async () => {
    setSaving(true)
    const payload = { ...data, project_id: id, account_id: project?.account_id, updated_at: new Date() }
    delete payload.id; delete payload.created_at
    if (!payload.created_by) payload.created_by = profile?.id

    if (roiId) {
      await supabase.from("roi_discoveries").update(payload).eq("id", roiId)
    } else {
      const { data: created } = await supabase.from("roi_discoveries").insert(payload).select().single()
      if (created) setRoiId(created.id)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "calc(100vh - 64px)", color: "#64748b" }}>Loading...</div>
      </main>
    </div>
  )

  const inputStyle = { width: "100%", padding: "9px 12px", border: "0.5px solid #d1d5db",
    borderRadius: "6px", fontSize: "13px", boxSizing: "border-box", backgroundColor: "white" }
  const labelStyle = { display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "4px" }
  const hintStyle = { fontSize: "11px", color: "#94a3b8", margin: "3px 0 0 0", lineHeight: "1.4" }
  const cardStyle = { backgroundColor: "white", borderRadius: "10px", border: "0.5px solid #e2e8f0", padding: "20px", marginBottom: "16px" }
  const sectionTitle = { fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }
  const sectionSub = { fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }

  const Field = ({ label, hint, field, type = "text", placeholder, options, wide }) => (
    <div style={wide ? { gridColumn: "1 / -1" } : {}}>
      <label style={labelStyle}>{label}</label>
      {type === "select" ? (
        <select value={data[field] || ""} onChange={e => update(field, e.target.value)} style={inputStyle}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "boolean" ? (
        <div style={{ display: "flex", gap: "8px" }}>
          {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map(o => (
            <button key={o.l} onClick={() => update(field, o.v)}
              style={{ padding: "7px 18px", fontSize: "13px", fontWeight: "500", borderRadius: "6px", cursor: "pointer",
                border: data[field] === o.v ? "1.5px solid #3b82f6" : "0.5px solid #d1d5db",
                backgroundColor: data[field] === o.v ? "#eff6ff" : "white",
                color: data[field] === o.v ? "#1e40af" : "#475569" }}>{o.l}</button>
          ))}
        </div>
      ) : type === "textarea" ? (
        <textarea value={data[field] || ""} onChange={e => update(field, e.target.value)}
          placeholder={placeholder} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
      ) : (
        <input type={type === "number" ? "number" : "text"} value={data[field] ?? ""}
          onChange={e => update(field, type === "number" ? e.target.value : e.target.value)}
          placeholder={placeholder} style={inputStyle}
          min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} />
      )}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", backgroundColor: "white", borderBottom: "0.5px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span onClick={() => navigate(`/projects/${id}`)} style={{ fontSize: "13px", color: "#3b82f6", cursor: "pointer", fontWeight: "500" }}>{project?.name}</span>
                <span style={{ fontSize: "12px", color: "#cbd5e1" }}>/</span>
                <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "600" }}>ROI Discovery</span>
              </div>
              <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>ROI Discovery & Calculator</h1>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={pill(data.status || "draft")}>{(data.status || "draft").replace("_", " ")}</span>
              <button onClick={save} disabled={saving}
                style={{ padding: "8px 20px", fontSize: "13px", fontWeight: "600", borderRadius: "6px", cursor: "pointer",
                  backgroundColor: "#3b82f6", color: "white", border: "none", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => navigate(`/projects/${id}`)}
                style={{ padding: "8px 16px", fontSize: "13px", fontWeight: "500", borderRadius: "6px", cursor: "pointer",
                  backgroundColor: "white", color: "#64748b", border: "0.5px solid #d1d5db" }}>
                Back
              </button>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left Nav */}
          <div style={{ width: "220px", minWidth: "220px", borderRight: "0.5px solid #e2e8f0",
            backgroundColor: "white", overflowY: "auto", padding: "12px 0" }}>
            {SECTIONS.map((s, i) => {
              const isCalc = s.id === "calculator"
              return (
                <div key={s.id} onClick={() => setActiveSection(s.id)}
                  style={{
                    padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                    borderLeft: activeSection === s.id ? "3px solid #3b82f6" : "3px solid transparent",
                    backgroundColor: activeSection === s.id ? "#eff6ff" : "transparent",
                  }}>
                  <span style={{ width: "24px", height: "24px", borderRadius: "6px", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700",
                    backgroundColor: isCalc ? "#10b981" : activeSection === s.id ? "#3b82f6" : "#e2e8f0",
                    color: isCalc || activeSection === s.id ? "white" : "#64748b" }}>{s.icon}</span>
                  <span style={{ fontSize: "13px", fontWeight: activeSection === s.id ? "600" : "500",
                    color: activeSection === s.id ? "#1e293b" : "#64748b" }}>{s.label}</span>
                </div>
              )
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

            {activeSection === "volume" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Business Volume</h2>
                <p style={sectionSub}>Baseline numbers that drive all ROI calculations. Every savings multiplies against these.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Annual Revenue ($)" field="annual_revenue" type="number" placeholder="e.g. 5000000" hint="Baseline for all % improvement calculations" />
                  <Field label="Estimates per Month" field="estimates_per_month" type="number" placeholder="e.g. 200" hint="Drives estimating time savings" />
                  <Field label="Jobs per Month" field="jobs_per_month" type="number" placeholder="e.g. 150" hint="Drives job entry, scheduling, and costing savings" />
                  <Field label="On-Time Delivery %" field="on_time_delivery_pct" type="number" placeholder="e.g. 85" hint="Late jobs = rush costs, penalties, churn" />
                  <Field label="Number of Estimators" field="num_estimators" type="number" placeholder="e.g. 3" />
                  <Field label="Number of CSRs" field="num_csr" type="number" placeholder="e.g. 4" />
                  <Field label="Number of Planners/Schedulers" field="num_planners" type="number" placeholder="e.g. 2" />
                  <Field label="Number of Production Staff" field="num_production_staff" type="number" placeholder="e.g. 25" />
                  <Field label="Number of Locations" field="num_locations" type="number" placeholder="e.g. 1" hint="Multi-site = multiplied inefficiency" />
                </div>
              </div>
            )}

            {activeSection === "estimating" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Estimating</h2>
                <p style={sectionSub}>Highest ROI area for most shops. Poor estimating = systematic margin leakage.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Minutes per Simple Estimate" field="minutes_per_simple_estimate" type="number" placeholder="e.g. 15" hint="Quantifies current estimating labor cost" />
                  <Field label="Minutes per Complex Estimate" field="minutes_per_complex_estimate" type="number" placeholder="e.g. 60" hint="Complex estimates drive the highest savings" />
                  <Field label="% Jobs Estimated (vs. price list)" field="pct_jobs_estimated" type="number" placeholder="e.g. 70" hint="Determines scope of estimating ROI" />
                  <Field label="Estimate Method" field="estimate_method" type="select" options={["Time and material", "Price list", "Mixed", "Other"]} hint="Identifies pricing accuracy gaps" />
                  <Field label="Are markups consistent across estimators?" field="markup_consistent" type="boolean" hint="Inconsistent markup = margin leakage" />
                  <Field label="Is freight included in estimates?" field="freight_in_estimates" type="boolean" hint="Unbilled freight is direct margin loss" />
                  <Field label="Estimate-to-Job Conversion %" field="estimate_conversion_pct" type="number" placeholder="e.g. 35" hint="Low conversion may indicate pricing problems" />
                  <Field label="Avg Revisions per Job" field="avg_revisions_per_job" type="number" placeholder="e.g. 2" hint="Re-estimating time is pure overhead" />
                  <Field label="How often are rates/standards updated?" field="rates_update_frequency" type="select" options={["Monthly", "Quarterly", "Annually", "Rarely/Never"]} hint="Stale rates = systematic underpricing" />
                  <Field label="Is commission calculated in estimates?" field="commission_in_estimates" type="boolean" hint="Manual commission = common errors" />
                  <Field label="Are there consistently under-priced customers?" field="has_underpriced_customers" type="boolean" hint="Hidden margin-negative relationships" />
                  <Field label="Notes" field="estimating_notes" type="textarea" placeholder="Any additional context about the estimating process..." wide />
                </div>
              </div>
            )}

            {activeSection === "job_entry" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Job Entry & Planning</h2>
                <p style={sectionSub}>Re-keying data is direct labor waste and a common source of errors.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Job Creation Method" field="job_creation_method" type="select" options={["Manual entry", "Re-keyed from estimate", "Electronic conversion", "Mixed"]} hint="Re-keying is direct labor waste and error risk" />
                  <Field label="Minutes per Job Entry" field="minutes_per_job_entry" type="number" placeholder="e.g. 20" hint="Quantifies planning overhead" />
                  <Field label="Same person estimates and enters jobs?" field="same_person_estimates_enters" type="boolean" hint="Handoff gaps = data loss and rework" />
                  <Field label="Uses gang/shell/stock jobs?" field="uses_gang_shell_stock" type="boolean" hint="Complexity that increases planning time if manual" />
                  <Field label="Is reprint history reused?" field="reprint_history_reused" type="boolean" hint="Re-entry of repeat jobs is quantifiable waste" />
                  <Field label="Are alterations consistently captured?" field="alterations_captured" type="boolean" hint="Uncaptured alterations = revenue leakage" />
                  <Field label="Shipping Communication Method" field="shipping_communication" type="select" options={["Manual/verbal", "Email", "System-driven", "Mixed"]} hint="Manual communication = errors and delays" />
                  <Field label="Are internal jobs tracked?" field="internal_jobs_tracked" type="boolean" hint="If not, true cost of internal work is invisible" />
                  <Field label="Notes" field="job_entry_notes" type="textarea" placeholder="Additional job entry context..." wide />
                </div>
              </div>
            )}

            {activeSection === "scheduling" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Scheduling</h2>
                <p style={sectionSub}>Manual scheduling = significant hidden labor cost. Partial scheduling misses bottlenecks.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Schedule Method" field="schedule_method" type="select" options={["Whiteboard/manual", "Spreadsheet", "Basic software", "Full MIS scheduling"]} hint="Manual scheduling = significant hidden cost" />
                  <Field label="Schedule Update Frequency" field="schedule_update_frequency" type="select" options={["Real-time", "Multiple times daily", "Daily", "Weekly"]} />
                  <Field label="All departments scheduled?" field="all_departments_scheduled" type="boolean" hint="Partial scheduling = constraint bottlenecks not visible" />
                  <Field label="Number of Shifts" field="num_shifts" type="number" placeholder="e.g. 2" hint="Multi-shift multiplies coordination cost" />
                  <Field label="Average Turnaround (days)" field="avg_turnaround_days" type="number" placeholder="e.g. 5" hint="Baseline for cycle time improvement" />
                  <Field label="Frequent machine substitutions?" field="machine_substitution_frequent" type="boolean" hint="Untracked substitutions = cost variance" />
                  <Field label="Notes" field="scheduling_notes" type="textarea" placeholder="Additional scheduling context..." wide />
                </div>
              </div>
            )}

            {activeSection === "materials" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Materials & Purchasing</h2>
                <p style={sectionSub}>Direct cost impact. Waste and emergency buying are often the largest hidden costs.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Is purchasing centralized?" field="purchasing_centralized" type="boolean" hint="Decentralized = price inconsistency, duplicate ordering" />
                  <Field label="Min/max inventory levels managed?" field="min_max_inventory_managed" type="boolean" hint="No min/max = emergency buying at premium prices" />
                  <Field label="Is stock reserved for jobs?" field="stock_reserved_for_jobs" type="boolean" hint="Unreserved stock = double-allocation and shortages" />
                  <Field label="FIFO enforced?" field="fifo_enforced" type="boolean" hint="Not enforced = material write-offs" />
                  <Field label="Inventory Count Frequency" field="inventory_count_frequency" type="select" options={["Daily", "Weekly", "Monthly", "Quarterly", "Annually"]} hint="Infrequent counting = carrying cost inaccuracy" />
                  <Field label="Damaged inventory tracked?" field="damaged_inventory_tracked" type="boolean" hint="Untracked damage = invisible cost" />
                  <Field label="Material conversion needed? (rolls to sheets)" field="material_conversion_needed" type="boolean" hint="Manual conversion = quantity errors" />
                  <Field label="Consignment items?" field="consignment_items" type="boolean" hint="Untracked consignment = vendor disputes" />
                  <Field label="Paper Waste / Spoilage %" field="paper_waste_pct" type="number" placeholder="e.g. 8" hint="Direct cost baseline for waste reduction ROI" />
                  <Field label="Outside services tracked against jobs?" field="outside_services_tracked" type="boolean" hint="Untracked outsourcing = job cost understatement" />
                  <Field label="Notes" field="materials_notes" type="textarea" placeholder="Additional materials context..." wide />
                </div>
              </div>
            )}

            {activeSection === "costing" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Job Costing & Margin Visibility</h2>
                <p style={sectionSub}>Highest strategic impact. Most shops have no real-time view of job-level profitability.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Costing Model" field="costing_model" type="select" options={["Standard cost", "Actual cost", "Estimated only", "Mixed"]} hint="Determines baseline accuracy of job cost data" />
                  <Field label="WIP Valuation Method" field="wip_valuation_method" type="select" options={["Labor + OH + Materials", "Materials only", "Not tracked", "Other"]} hint="Inaccurate WIP = inaccurate financials" />
                  <Field label="Pre-bill cost review done?" field="pre_bill_cost_review" type="boolean" hint="No review = billing errors and disputes" />
                  <Field label="Actual vs. estimated costs compared?" field="actual_vs_estimated_compared" type="boolean" hint="No variance analysis = estimating errors never corrected" />
                  <Field label="Freight Billing Method" field="freight_billing_method" type="select" options={["Included in sale price", "Billed separately", "Sometimes absorbed", "Not tracked"]} hint="Absorbed freight = direct margin loss" />
                  <Field label="Cost analyzed per individual job?" field="cost_analyzed_per_job" type="boolean" hint="Aggregate-only = no visibility to losing jobs" />
                  <Field label="% Jobs Estimated Profitable but Aren't" field="pct_jobs_profitable_but_not" type="number" placeholder="e.g. 15" hint="Quantifies the systematic estimating gap" />
                  <Field label="Notes" field="costing_notes" type="textarea" placeholder="Additional costing context..." wide />
                </div>
              </div>
            )}

            {activeSection === "billing" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Accounts Receivable & Billing</h2>
                <p style={sectionSub}>Revenue recovery. Unbilled alterations and freight are often invisible money left on the table.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Pre-invoice data review?" field="pre_invoice_review" type="boolean" hint="No review = billing errors that delay payment" />
                  <Field label="Multi-job invoicing used?" field="multi_job_invoicing" type="boolean" hint="Billing complexity = AR staff time" />
                  <Field label="Sales tax calculated manually?" field="sales_tax_manual" type="boolean" hint="Manual calculation = compliance risk" />
                  <Field label="Payment Terms" field="payment_terms" type="text" placeholder="e.g. Net 30" />
                  <Field label="Average DSO (days)" field="avg_dso_days" type="number" placeholder="e.g. 45" hint="High DSO = cash flow cost" />
                  <Field label="Deposits/prepayments tracked?" field="deposits_tracked" type="boolean" hint="Untracked deposits = cash application errors" />
                  <Field label="Annual Bad Debt / Write-offs ($)" field="annual_bad_debt" type="number" placeholder="e.g. 25000" hint="Billing accuracy directly affects collections" />
                  <Field label="Notes" field="billing_notes" type="textarea" placeholder="Additional billing context..." wide />
                </div>
              </div>
            )}

            {activeSection === "reporting" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Reporting & Visibility Gaps</h2>
                <p style={sectionSub}>Where decisions are made on incomplete data. Slow close = delayed decisions.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Monthly Financial Close (days)" field="monthly_close_days" type="number" placeholder="e.g. 10" hint="Slow close = delayed decisions and management overhead" />
                  <Field label="Real-time job margin available?" field="real_time_job_margin" type="boolean" hint="No real-time margin = can't intervene on losing jobs" />
                  <Field label="Customer profitability visible?" field="customer_profitability_visible" type="boolean" hint="Invisible profitability = blind strategic decisions" />
                  <Field label="KPI Tracking Method" field="kpi_tracking_method" type="select" options={["Manual/spreadsheets", "Basic reporting", "BI dashboards", "Not tracked"]} hint="Manual KPIs = lag, inaccuracy, staff time" />
                  <Field label="Shop floor visibility in real-time?" field="shop_floor_visibility" type="boolean" hint="No visibility = supervisors spend time gathering status" />
                  <Field label="Notes" field="reporting_notes" type="textarea" placeholder="Additional reporting context..." wide />
                </div>
              </div>
            )}

            {activeSection === "systems" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>Current System Landscape</h2>
                <p style={sectionSub}>Cost of the status quo. Re-keying across systems is a direct, quantifiable labor cost.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Current Systems in Use" field="current_systems" type="textarea" placeholder="List all systems: MIS, accounting, scheduling, spreadsheets..." hint="Establishes license cost savings and integration complexity" wide />
                  <Field label="Systems Requiring Double Data Entry" field="double_entry_systems" type="number" placeholder="e.g. 3" hint="Re-keying is a direct, quantifiable labor cost" />
                  <Field label="Processes managed in spreadsheets?" field="spreadsheet_processes" type="boolean" hint="Spreadsheet processes carry error risk and aren't scalable" />
                  <Field label="Annual Software Cost (all platforms, $)" field="annual_software_cost" type="number" placeholder="e.g. 50000" hint="Consolidation savings are a direct ROI line item" />
                  <Field label="Notes" field="systems_notes" type="textarea" placeholder="Additional systems context..." wide />
                </div>
              </div>
            )}

            {activeSection === "quantification" && (
              <div style={cardStyle}>
                <h2 style={sectionTitle}>ROI Quantification Inputs</h2>
                <p style={sectionSub}>These numbers feed directly into the ROI calculator. Ask these directly in discovery conversations.</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <Field label="Estimator Fully-Loaded Hourly Rate ($)" field="estimator_hourly_rate" type="number" placeholder="e.g. 75" hint="What an estimator costs the business per hour" />
                  <Field label="CSR/Planner Fully-Loaded Hourly Rate ($)" field="csr_planner_hourly_rate" type="number" placeholder="e.g. 55" hint="What a CSR/planner costs per hour" />
                  <Field label="Material Waste % (Actual)" field="material_waste_pct_actual" type="number" placeholder="e.g. 8" hint="Current spoilage rate across press types" />
                  <Field label="Material Waste % (Target)" field="material_waste_pct_target" type="number" placeholder="e.g. 5" hint="Realistic target with MIS optimization" />
                  <Field label="Unbilled Alterations ($/month)" field="unbilled_alterations_monthly" type="number" placeholder="e.g. 3000" hint="Alterations that go unbilled each month" />
                  <Field label="Unbilled Freight ($/month)" field="unbilled_freight_monthly" type="number" placeholder="e.g. 2000" hint="Freight not captured in job cost and invoice" />
                  <Field label="Late Delivery Penalties ($/year)" field="late_delivery_penalties_annual" type="number" placeholder="e.g. 15000" hint="Penalties or chargebacks for late delivery" />
                  <Field label="Annual Write-offs ($)" field="annual_writeoffs" type="number" placeholder="e.g. 20000" hint="Written off due to billing disputes or errors" />
                </div>
              </div>
            )}

            {activeSection === "calculator" && (
              <ROICalculatorPanel data={data} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
