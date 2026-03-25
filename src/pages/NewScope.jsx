import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"

const workstreams = [
  { key: "discovery_design", label: "Discovery & Design", base: 40 },
  { key: "data_preparation", label: "Data Preparation", base: 20 },
  { key: "configuration", label: "Configuration", base: 60 },
  { key: "advanced_setup", label: "Advanced Setup", base: 20 },
  { key: "integrations", label: "Integrations", base: 0 },
  { key: "testing", label: "Testing", base: 30 },
  { key: "training", label: "Training", base: 20 },
  { key: "project_management", label: "Project Management", base: 20 },
  { key: "golive_support", label: "Go-Live Support", base: 16 },
  { key: "post_golive", label: "Post Go-Live Support", base: 8 }
]

const riskLevels = [
  { value: "low", label: "Low Risk", multiplier: 1.0 },
  { value: "medium", label: "Medium Risk", multiplier: 1.2 },
  { value: "high", label: "High Risk", multiplier: 1.5 }
]

export default function NewScope() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const discoveryId = searchParams.get("discovery")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [opportunities, setOpportunities] = useState([])
  const [discoveries, setDiscoveries] = useState([])
  const [hours, setHours] = useState(
    workstreams.reduce((acc, w) => ({ ...acc, [w.key]: w.base }), {})
  )
  const [form, setForm] = useState({
    name: "",
    opportunity_id: "",
    discovery_id: discoveryId || "",
    included_modules: "",
    excluded_modules: "",
    assumptions: "",
    exclusions: "",
    risks: "",
    risk_level: "medium",
    onsite_days: 0,
    notes: "",
    team_recommendation: "",
    phase_plan: ""
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [{ data: opps }, { data: discs }] = await Promise.all([
      supabase.from("opportunities").select("id, name, accounts(name)"),
      supabase.from("discovery_records").select("id, opportunities(name)")
    ])
    setOpportunities(opps || [])
    setDiscoveries(discs || [])
  }

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const updateHours = (key, value) => {
    setHours(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
  }

  const multiplier = riskLevels.find(r => r.value === form.risk_level)?.multiplier || 1.2

  const totalBase = Object.values(hours).reduce((a, b) => a + b, 0)
  const totalMin = Math.round(totalBase * 0.9)
  const totalMax = Math.round(totalBase * multiplier * 1.1)

  const confidenceScore = () => {
    if (form.risk_level === "low" && form.discovery_id) return 85
    if (form.risk_level === "medium" && form.discovery_id) return 70
    if (form.risk_level === "high") return 50
    return 60
  }

  const handleSubmit = async () => {
    if (!form.name || !form.opportunity_id) {
      setError("Scope name and opportunity are required")
      return
    }
    setLoading(true)
    setError("")
    try {
      const payload = {
        ...form,
        workstream_hours: hours,
        estimated_hours_min: totalMin,
        estimated_hours_max: totalMax,
        confidence_score: confidenceScore(),
        created_by: profile?.id
      }
      // Convert empty strings to null for UUID and optional fields
      if (!payload.discovery_id) payload.discovery_id = null
      if (!payload.included_modules) payload.included_modules = null
      if (!payload.excluded_modules) payload.excluded_modules = null
      if (!payload.assumptions) payload.assumptions = null
      if (!payload.exclusions) payload.exclusions = null
      if (!payload.risks) payload.risks = null
      if (!payload.team_recommendation) payload.team_recommendation = null
      if (!payload.phase_plan) payload.phase_plan = null
      const { data, error: err } = await supabase
        .from("scope_baselines")
        .insert(payload)
        .select().single()
      if (err) throw err
      navigate(`/scope/${data.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }
  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", marginBottom: "20px", border: "1px solid #e2e8f0" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Scope" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <button onClick={() => navigate("/scope")}
          style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
            fontSize: '14px', padding: 0, marginBottom: '8px' }}>
          ← Back to Scope
        </button>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            New Scope
          </h1>
        </div>

        {error && <div style={{ backgroundColor: "#fee2e2", color: "#dc2626",
          padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px" }}>
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Basic Information
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Scope Name *</label>
                  <input value={form.name} onChange={e => update("name", e.target.value)}
                    placeholder="e.g. Acme - Full Implementation Scope v1"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Opportunity *</label>
                  <select value={form.opportunity_id}
                    onChange={e => update("opportunity_id", e.target.value)} style={inputStyle}>
                    <option value="">Select opportunity...</option>
                    {opportunities.map(o => (
                      <option key={o.id} value={o.id}>{o.accounts?.name} — {o.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Linked Discovery</label>
                  <select value={form.discovery_id}
                    onChange={e => update("discovery_id", e.target.value)} style={inputStyle}>
                    <option value="">Select discovery (optional)...</option>
                    {discoveries.map(d => (
                      <option key={d.id} value={d.id}>{d.opportunities?.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Risk Level</label>
                  <select value={form.risk_level}
                    onChange={e => update("risk_level", e.target.value)} style={inputStyle}>
                    {riskLevels.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Onsite Days</label>
                  <input type="number" value={form.onsite_days}
                    onChange={e => update("onsite_days", parseInt(e.target.value) || 0)}
                    style={inputStyle} />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Workstream Hours
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {workstreams.map(w => (
                  <div key={w.key} style={{ display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "12px 16px",
                    backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151", flex: 1 }}>
                      {w.label}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <input type="number" value={hours[w.key]}
                        onChange={e => updateHours(w.key, e.target.value)}
                        style={{ width: "80px", padding: "6px 10px", border: "1px solid #d1d5db",
                          borderRadius: "6px", fontSize: "14px", textAlign: "center" }} />
                      <span style={{ fontSize: "13px", color: "#64748b", width: "30px" }}>hrs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Scope Details
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Included Modules", field: "included_modules", placeholder: "List all included modules and functionality..." },
                  { label: "Excluded Modules", field: "excluded_modules", placeholder: "List explicitly excluded items..." },
                  { label: "Assumptions", field: "assumptions", placeholder: "List key assumptions this scope is based on..." },
                  { label: "Exclusions", field: "exclusions", placeholder: "List explicit exclusions and out-of-scope items..." },
                  { label: "Risks", field: "risks", placeholder: "List known risks that could impact scope or timeline..." },
                  { label: "Phase Plan", field: "phase_plan", placeholder: "Describe the proposed phase structure..." },
                  { label: "Team Recommendation", field: "team_recommendation", placeholder: "Describe recommended team composition..." },
                  { label: "Notes", field: "notes", placeholder: "Any additional notes..." }
                ].map(item => (
                  <div key={item.field}>
                    <label style={labelStyle}>{item.label}</label>
                    <textarea value={form[item.field]}
                      onChange={e => update(item.field, e.target.value)}
                      placeholder={item.placeholder}
                      rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: "14px", backgroundColor: "#3b82f6",
                color: "white", border: "none", borderRadius: "8px", fontSize: "16px",
                fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating..." : "Create Scope"}
            </button>
          </div>

          <div>
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
              border: "1px solid #e2e8f0", position: "sticky", top: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Estimate Summary
              </h2>
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px 0" }}>HOUR RANGE</p>
                <p style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                  {totalMin}–{totalMax}
                </p>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>hours</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Base Hours</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{totalBase}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Risk Multiplier</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{multiplier}x</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Confidence</span>
                  <span style={{ fontSize: "13px", fontWeight: "600",
                    color: confidenceScore() >= 75 ? "#10b981" : confidenceScore() >= 60 ? "#f59e0b" : "#ef4444" }}>
                    {confidenceScore()}%
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 12px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Onsite Days</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{form.onsite_days}</span>
                </div>
              </div>
              <div style={{ backgroundColor: "#f0f9ff", borderRadius: "8px",
                padding: "12px", border: "1px solid #bae6fd" }}>
                <p style={{ fontSize: "12px", color: "#0369a1", margin: "0 0 8px 0", fontWeight: "600" }}>
                  WORKSTREAM BREAKDOWN
                </p>
                {workstreams.map(w => (
                  <div key={w.key} style={{ display: "flex", justifyContent: "space-between",
                    marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#0369a1" }}>{w.label}</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#0369a1" }}>
                      {hours[w.key]}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
