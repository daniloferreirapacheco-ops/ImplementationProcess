import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"

export default function NewProject() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [opportunities, setOpportunities] = useState([])
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({
    name: "",
    opportunity_id: "",
    account_id: "",
    start_date: "",
    planned_end_date: "",
    golive_target: "",
    notes: "",
    status: "not_started",
    health: "green"
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: opps }, { data: accs }] = await Promise.all([
      supabase.from("opportunities").select("id, name, accounts(name)").eq("stage", "approved"),
      supabase.from("accounts").select("id, name").order("name")
    ])
    setOpportunities(opps || [])
    setAccounts(accs || [])
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
      const payload = { ...form, created_by: profile.id }
      if (!payload.opportunity_id) payload.opportunity_id = null
      if (!payload.start_date) payload.start_date = null
      if (!payload.planned_end_date) payload.planned_end_date = null
      if (!payload.golive_target) payload.golive_target = null
      if (!payload.notes) payload.notes = null
      const { data, error: err } = await supabase
        .from("projects")
        .insert(payload)
        .select().single()
      if (err) throw err
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
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            New Project
          </h1>
          <button onClick={() => navigate("/projects")}
            style={{ backgroundColor: "transparent", border: "1px solid #d1d5db",
              color: "#64748b", padding: "8px 16px", borderRadius: "6px",
              cursor: "pointer", fontSize: "14px" }}>
            ← Back
          </button>
        </div>

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
