import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import { useToast } from "../components/Toast"

export default function NewProject() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const scopeId = searchParams.get("scope")
  const oppId = searchParams.get("opportunity")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [opportunities, setOpportunities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [scopeData, setScopeData] = useState(null)
  const [form, setForm] = useState({
    name: "",
    opportunity_id: oppId || "",
    account_id: "",
    start_date: "",
    planned_end_date: "",
    golive_target: "",
    notes: "",
    status: "not_started",
    health: "green",
    budget_hours: "",
    budget_cost: "",
    scope_id: scopeId || ""
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: opps }, { data: accs }] = await Promise.all([
      supabase.from("opportunities").select("id, name, account_id, accounts(name)").eq("stage", "approved"),
      supabase.from("accounts").select("id, name").order("name")
    ])
    setOpportunities(opps || [])
    setAccounts(accs || [])

    // Auto-populate from scope if linked
    if (scopeId) {
      const { data: scope } = await supabase.from("scopes")
        .select("*, opportunities(name, account_id, accounts(name))")
        .eq("id", scopeId).single()
      if (scope) {
        setScopeData(scope)
        const ws = scope.workstream_hours || {}
        const totalHours = Object.values(ws).reduce((a, b) => a + (Number(b) || 0), 0)
        const avgRate = 150 // default rate
        setForm(prev => ({
          ...prev,
          name: scope.name ? `${scope.opportunities?.accounts?.name || ""} — ${scope.name}`.trim() : prev.name,
          opportunity_id: scope.opportunity_id || prev.opportunity_id,
          account_id: scope.opportunities?.account_id || prev.account_id,
          budget_hours: totalHours || prev.budget_hours,
          budget_cost: totalHours * avgRate || prev.budget_cost,
          notes: scope.team_recommendation ? `Scope: ${scope.name}\n${scope.team_recommendation}` : prev.notes,
          scope_id: scopeId
        }))
      }
    } else if (oppId) {
      // Auto-fill account from opportunity
      const opp = (opps || []).find(o => o.id === oppId)
      if (opp) {
        setForm(prev => ({ ...prev, account_id: opp.account_id || prev.account_id }))
      }
    }
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name || !form.account_id) {
      setError("Project name and account are required")
      return
    }
    setLoading(true)
    setError("")
    try {
      const payload = { ...form, created_by: profile?.id }
      if (!payload.opportunity_id) payload.opportunity_id = null
      if (!payload.start_date) payload.start_date = null
      if (!payload.planned_end_date) payload.planned_end_date = null
      if (!payload.golive_target) payload.golive_target = null
      if (!payload.notes) payload.notes = null
      if (!payload.scope_id) payload.scope_id = null
      payload.budget_hours = payload.budget_hours ? Number(payload.budget_hours) : null
      payload.budget_cost = payload.budget_cost ? Number(payload.budget_cost) : null
      const { data, error: err } = await supabase
        .from("projects")
        .insert(payload)
        .select().single()
      if (err) throw err

      // Auto-generate task templates from scope workstreams
      if (scopeData && scopeData.workstream_hours) {
        const ws = scopeData.workstream_hours
        const phaseMap = {
          discovery_design: "Discovery", configuration: "Configuration",
          integration: "Integration", testing: "Testing", training: "Handoff",
          data_migration: "Configuration", go_live: "Handoff",
          project_management: "Discovery", customization: "Configuration",
          reporting: "Configuration"
        }
        const taskPayload = Object.entries(ws).map(([key, hours], i) => ({
          project_id: data.id,
          phase: phaseMap[key] || "Configuration",
          name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          estimated_hours: Number(hours) || 0,
          enabled: true,
          sort_order: i,
          created_by: profile?.id
        }))
        if (taskPayload.length > 0) {
          await supabase.from("task_templates").insert(taskPayload)
        }
      }

      // Auto-generate plan tasks from scope workstreams
      if (scopeData && scopeData.workstream_hours) {
        const ws = scopeData.workstream_hours
        const planPhaseMap = {
          discovery_design: "discovery", data_preparation: "data_preparation",
          configuration: "configuration", advanced_setup: "advanced_setup",
          integrations: "integrations", testing: "testing", training: "training",
          project_management: "project_management", golive_support: "golive",
          post_golive: "post_golive"
        }
        const planTasks = Object.entries(ws).map(([key, hours], i) => ({
          project_id: data.id,
          scope_id: payload.scope_id,
          name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          phase: planPhaseMap[key] || "configuration",
          workstream: key,
          estimated_hours: Number(hours) || 0,
          status: "not_started",
          priority: "medium",
          completion_pct: 0,
          sort_order: i,
          created_by: profile?.id,
        }))
        if (planTasks.length > 0) {
          await supabase.from("project_plan_tasks").insert(planTasks)
        }
      }

      toast("Project created successfully")
      navigate(`/projects/${data.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/projects")} style={{ color: "#94a3b8", cursor: "pointer" }}>Projects</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>New Project</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            New Project
          </h1>
        </div>

        {scopeData && (
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0",
            padding: "14px 18px", borderRadius: "8px", marginBottom: "16px",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: "#166534" }}>
                Creating from approved scope: {scopeData.name}
              </p>
              <p style={{ margin: 0, fontSize: "12px", color: "#15803d" }}>
                Budget hours and cost auto-populated from scope workstreams ({Object.keys(scopeData.workstream_hours || {}).length} workstreams, {Object.values(scopeData.workstream_hours || {}).reduce((a, b) => a + (Number(b) || 0), 0)}h total).
                Task templates will be auto-generated.
              </p>
            </div>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "12px",
              backgroundColor: "#dcfce7", color: "#166534", fontWeight: "600" }}>Scope Linked</span>
          </div>
        )}

        {error && <div style={{ backgroundColor: "#fee2e2", color: "#dc2626",
          padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}

        <div style={{ backgroundColor: "white", borderRadius: "12px",
          padding: "24px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Project Name *</label>
              <input value={form.name} onChange={e => update("name", e.target.value)}
                placeholder="e.g. Acme Printing - Full Implementation"
                style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Account *</label>
              <select value={form.account_id} onChange={e => update("account_id", e.target.value)}
                style={inputStyle}>
                <option value="">Select account...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Linked Opportunity</label>
              <select value={form.opportunity_id} onChange={e => update("opportunity_id", e.target.value)}
                style={inputStyle}>
                <option value="">Select opportunity (optional)...</option>
                {opportunities.map(o => (
                  <option key={o.id} value={o.id}>{o.accounts?.name} — {o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={form.start_date}
                onChange={e => update("start_date", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Planned End Date</label>
              <input type="date" value={form.planned_end_date}
                onChange={e => update("planned_end_date", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Go-Live Target</label>
              <input type="date" value={form.golive_target}
                onChange={e => update("golive_target", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Initial Status</label>
              <select value={form.status} onChange={e => update("status", e.target.value)}
                style={inputStyle}>
                <option value="not_started">Not Started</option>
                <option value="kickoff_planned">Kickoff Planned</option>
                <option value="discovery_design">Discovery / Design</option>
                <option value="configuration">Configuration</option>
                <option value="testing">Testing</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Budget Hours</label>
              <input type="number" min="0" step="1" value={form.budget_hours}
                onChange={e => update("budget_hours", e.target.value)}
                placeholder="e.g. 200" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Budget Cost ($)</label>
              <input type="number" min="0" step="0.01" value={form.budget_cost}
                onChange={e => update("budget_cost", e.target.value)}
                placeholder="e.g. 30000" style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
                placeholder="Any initial notes about this project..."
                rows={4} style={{ ...inputStyle, resize: "vertical" }} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            style={{ width: "100%", padding: "14px", backgroundColor: "#3b82f6",
              color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
              fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, marginTop: "20px" }}>
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </main>
    </div>
  )
}
