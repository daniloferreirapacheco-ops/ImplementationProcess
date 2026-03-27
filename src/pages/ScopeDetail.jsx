import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"
import { useToast } from "../components/Toast"

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In Review" },
  { value: "changes_required", label: "Changes Required" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }
]

const statusColors = {
  draft: "#94a3b8", submitted: "#3b82f6", in_review: "#f59e0b",
  changes_required: "#f97316", approved: "#10b981", rejected: "#ef4444"
}

export default function ScopeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [scope, setScope] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [openQuestions, setOpenQuestions] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [wsForm, setWsForm] = useState({})
  const { toast } = useToast()

  useEffect(() => { fetchScope() }, [id])

  const fetchScope = async () => {
    try {
      const { data } = await supabase
        .from("scopes")
        .select("*")
        .eq("id", id).single()
      setScope(data)
      if (data) {
        setForm({
          name: data.name || "", risk_level: data.risk_level || "medium",
          onsite_days: data.onsite_days || 0, included_modules: data.included_modules || "",
          excluded_modules: data.excluded_modules || "", assumptions: data.assumptions || "",
          exclusions: data.exclusions || "", risks: data.risks || "", notes: data.notes || "",
          team_recommendation: data.team_recommendation || "", phase_plan: data.phase_plan || "",
        })
        setWsForm(data.workstream_hours || {})
      }
      // Load open questions from linked discovery
      if (data?.discovery_id) {
        const { data: qs } = await supabase.from("open_questions").select("*")
          .eq("discovery_id", data.discovery_id).order("created_at", { ascending: false })
        setOpenQuestions(qs || [])
      } else if (data?.opportunity_id) {
        // Try to find discovery via opportunity
        const { data: disc } = await supabase.from("discovery_records").select("id")
          .eq("opportunity_id", data.opportunity_id).limit(1)
        if (disc && disc.length > 0) {
          const { data: qs } = await supabase.from("open_questions").select("*")
            .eq("discovery_id", disc[0].id).order("created_at", { ascending: false })
          setOpenQuestions(qs || [])
        }
      }
    } catch (err) {
      console.error("Error fetching scope:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status) => {
    setSaving(true)
    await supabase.from("scopes")
      .update({ approval_status: status, updated_at: new Date() }).eq("id", id)
    setScope(prev => ({ ...prev, approval_status: status }))
    // Auto-propagate: scope approved → advance opportunity stage
    if (status === "approved" && scope?.opportunity_id) {
      await supabase.from("opportunities")
        .update({ stage: "scope_approved", updated_at: new Date().toISOString() })
        .eq("id", scope.opportunity_id)
    }
    setSaving(false)
    toast(`Scope ${status.replace(/_/g, ' ')}`)
  }

  const riskLevels = [
    { value: "low", label: "Low Risk", multiplier: 1.0 },
    { value: "medium", label: "Medium Risk", multiplier: 1.2 },
    { value: "high", label: "High Risk", multiplier: 1.5 }
  ]

  const saveScope = async () => {
    setSaving(true)
    const totalBase = Object.values(wsForm).reduce((a, b) => a + (Number(b) || 0), 0)
    const multiplier = riskLevels.find(r => r.value === form.risk_level)?.multiplier || 1.2
    const payload = {
      ...form,
      workstream_hours: wsForm,
      estimated_hours_min: Math.round(totalBase * 0.9),
      estimated_hours_max: Math.round(totalBase * multiplier * 1.1),
      onsite_days: parseInt(form.onsite_days) || 0,
      updated_at: new Date().toISOString(),
    }
    // null out empty strings
    for (const k of ["included_modules", "excluded_modules", "assumptions", "exclusions", "risks", "notes", "team_recommendation", "phase_plan"]) {
      if (!payload[k]) payload[k] = null
    }
    await supabase.from("scopes").update(payload).eq("id", id)
    setScope(prev => ({ ...prev, ...payload }))
    setEditing(false)
    setSaving(false)
    toast("Scope saved successfully")
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this scope? This cannot be undone.')) return
    await supabase.from("scopes").delete().eq("id", id)
    toast("Scope deleted")
    navigate('/scope')
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const inputStyle = { width: "100%", padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }
  const labelStyle = { display: "block", marginBottom: "6px",
    fontWeight: "500", fontSize: "14px", color: "#374151" }

  if (loading || !scope) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Scope" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 64px)", color: "#64748b" }}>{loading ? "Loading..." : "Scope record not found."}</div>
      </main>
    </div>
  )

  const openQs = openQuestions.filter(q => q.status !== "closed")
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "workstreams", label: "Workstreams" },
    { id: "details", label: "Scope Details" },
    { id: "questions", label: `Questions (${openQs.length})` },
    { id: "approval", label: "Approval" }
  ]

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }

  const workstreams = scope?.workstream_hours || {}
  const totalHours = Object.values(workstreams).reduce((a, b) => a + (parseInt(b) || 0), 0)

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Scope" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/scope")} style={{ color: "#94a3b8", cursor: "pointer" }}>Scope</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>{scope?.name}</span>
        </div>

        <button onClick={() => navigate('/scope')}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer",
            fontSize: "14px", padding: 0, marginBottom: "16px" }}>
          ← Back to Scope
        </button>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            {editing ? (
              <input value={form.name} onChange={e => updateForm("name", e.target.value)}
                style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", border: "1px solid #d1d5db", borderRadius: "8px", padding: "6px 12px", width: "400px" }} />
            ) : (
              <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
                {scope?.name || "Scope Record"}
              </h1>
            )}
            <p style={{ color: "#64748b", margin: "4px 0 0" }}>
              🏢 {scope?.opportunities?.accounts?.name || ""} {scope?.opportunities?.name ? `— ${scope.opportunities.name}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                style={{ padding: "8px 18px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                Edit Scope
              </button>
            ) : (
              <>
                <button onClick={saveScope} disabled={saving}
                  style={{ padding: "8px 18px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button onClick={() => { setEditing(false); setForm({ name: scope.name || "", risk_level: scope.risk_level || "medium", onsite_days: scope.onsite_days || 0, included_modules: scope.included_modules || "", excluded_modules: scope.excluded_modules || "", assumptions: scope.assumptions || "", exclusions: scope.exclusions || "", risks: scope.risks || "", notes: scope.notes || "", team_recommendation: scope.team_recommendation || "", phase_plan: scope.phase_plan || "" }); setWsForm(scope.workstream_hours || {}) }}
                  style={{ padding: "8px 18px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                  Cancel
                </button>
              </>
            )}
            <select value={scope?.approval_status || "draft"}
              onChange={e => updateStatus(e.target.value)}
              disabled={saving}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", border: `2px solid ${statusColors[scope?.approval_status] || "#94a3b8"}`,
                color: statusColors[scope?.approval_status] || "#94a3b8",
                backgroundColor: "white", cursor: "pointer" }}>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {scope?.approval_status === "approved" && (
              <button onClick={() => navigate(`/projects/new?scope=${id}&opportunity=${scope?.opportunity_id || ""}`)}
                style={{ backgroundColor: "#10b981", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "8px", cursor: "pointer",
                  fontWeight: "600", fontSize: "14px" }}>
                Create Project from Scope
              </button>
            )}
            <button onClick={() => window.print()}
              style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              Print
            </button>
            <button onClick={handleDelete}
              style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              Delete
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 18px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontSize: "14px", fontWeight: "500",
                backgroundColor: activeTab === tab.id ? "#3b82f6" : "#e2e8f0",
                color: activeTab === tab.id ? "white" : "#475569" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Estimate Summary
              </h2>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <label style={labelStyle}>Risk Level</label>
                    <select value={form.risk_level} onChange={e => updateForm("risk_level", e.target.value)} style={inputStyle}>
                      {riskLevels.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Onsite Days</label>
                    <input type="number" value={form.onsite_days} onChange={e => updateForm("onsite_days", e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ padding: "10px", backgroundColor: "#f0f9ff", borderRadius: "8px", fontSize: "13px", color: "#0369a1" }}>
                    Hour range and confidence will be recalculated on save based on workstream hours and risk level.
                  </div>
                </div>
              ) : (
                [{label:"Hour Range",value:`${scope?.estimated_hours_min||0}–${scope?.estimated_hours_max||0} hrs`},
                  {label:"Confidence Score",value:`${scope?.confidence_score||0}%`,color:(scope?.confidence_score||0)>=75?"#10b981":(scope?.confidence_score||0)>=60?"#f59e0b":"#ef4444"},
                  {label:"Risk Level",value:scope?.risk_level||"medium",textTransform:"capitalize"},
                  {label:"Onsite Days",value:scope?.onsite_days||0},
                  {label:"Version",value:`v${scope?.version||1}`},
                  {label:"Status",value:scope?.approval_status?.replace(/_/g," ")||"draft",color:statusColors[scope?.approval_status],textTransform:"capitalize"}
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "14px", color: "#64748b" }}>{item.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: item.color || "#1e293b", textTransform: item.textTransform || "none" }}>{item.value}</span>
                  </div>
                ))
              )}
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Confidence Score
              </h2>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ width: "120px", height: "120px", borderRadius: "50%",
                  backgroundColor: (scope?.confidence_score || 0) >= 75 ? "#dcfce7" :
                    (scope?.confidence_score || 0) >= 60 ? "#fef3c7" : "#fee2e2",
                  border: `6px solid ${(scope?.confidence_score || 0) >= 75 ? "#10b981" :
                    (scope?.confidence_score || 0) >= 60 ? "#f59e0b" : "#ef4444"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px" }}>
                  <span style={{ fontSize: "32px", fontWeight: "700",
                    color: (scope?.confidence_score || 0) >= 75 ? "#10b981" :
                      (scope?.confidence_score || 0) >= 60 ? "#f59e0b" : "#ef4444" }}>
                    {scope?.confidence_score || 0}%
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  {(scope?.confidence_score || 0) >= 75 ? "High confidence — scope is well defined" :
                    (scope?.confidence_score || 0) >= 60 ? "Medium confidence — some gaps remain" :
                    "Low confidence — significant unknowns exist"}
                </p>
              </div>
            </div>
            {(editing || scope?.team_recommendation) && (
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>Team Recommendation</h2>
                {editing ? (
                  <textarea value={form.team_recommendation} onChange={e => updateForm("team_recommendation", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                ) : (
                  <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{scope.team_recommendation}</p>
                )}
              </div>
            )}
            {(editing || scope?.phase_plan) && (
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>Phase Plan</h2>
                {editing ? (
                  <textarea value={form.phase_plan} onChange={e => updateForm("phase_plan", e.target.value)} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                ) : (
                  <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{scope.phase_plan}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "workstreams" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Workstream Hours {editing && <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "400" }}>(click hours to edit)</span>}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(editing ? Object.entries(wsForm) : Object.entries(workstreams)).map(([key, hours]) => {
                const wsTotalHrs = Object.values(editing ? wsForm : workstreams).reduce((a, b) => a + (parseInt(b) || 0), 0)
                const pct = wsTotalHrs > 0 ? Math.round((parseInt(hours) / wsTotalHrs) * 100) : 0
                return (
                  <div key={key} style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151", textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      {editing ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input type="number" value={hours} onChange={e => setWsForm(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                            style={{ width: "70px", padding: "5px 8px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", textAlign: "center" }} />
                          <span style={{ fontSize: "12px", color: "#64748b" }}>hrs</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{hours} hrs ({pct}%)</span>
                      )}
                    </div>
                    <div style={{ backgroundColor: "#e2e8f0", borderRadius: "4px", height: "6px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "#3b82f6", transition: "width 0.3s" }} />
                    </div>
                  </div>
                )
              })}
              {editing && (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input id="newWsKey" placeholder="Workstream name (e.g. data_migration)" style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px" }} />
                  <button onClick={() => {
                    const inp = document.getElementById("newWsKey")
                    const key = inp.value.trim().toLowerCase().replace(/\s+/g, "_")
                    if (key && !wsForm[key]) { setWsForm(prev => ({ ...prev, [key]: 0 })); inp.value = "" }
                  }} style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                    + Add
                  </button>
                </div>
              )}
              <div style={{ padding: "12px 16px", backgroundColor: "#1e293b", borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>TOTAL</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>
                  {Object.values(editing ? wsForm : workstreams).reduce((a, b) => a + (parseInt(b) || 0), 0)} hrs
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div>
            {[
              { label: "Included Modules", field: "included_modules", placeholder: "List all included modules..." },
              { label: "Excluded Modules", field: "excluded_modules", placeholder: "List excluded items..." },
              { label: "Assumptions", field: "assumptions", placeholder: "Key assumptions..." },
              { label: "Exclusions", field: "exclusions", placeholder: "Out-of-scope items..." },
              { label: "Risks", field: "risks", placeholder: "Known risks..." },
              { label: "Notes", field: "notes", placeholder: "Additional notes..." },
            ].map(item => (editing || scope?.[item.field]) ? (
              <div key={item.label} style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  {item.label}
                </h2>
                {editing ? (
                  <textarea value={form[item.field]} onChange={e => updateForm(item.field, e.target.value)}
                    placeholder={item.placeholder} rows={3}
                    style={{ ...inputStyle, resize: "vertical" }} />
                ) : (
                  <p style={{ color: "#475569", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" }}>{scope[item.field]}</p>
                )}
              </div>
            ) : null)}
          </div>
        )}

        {activeTab === "questions" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
              Open Questions from Discovery
            </h2>
            {openQuestions.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: "24px" }}>No questions found from discovery.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {openQuestions.map(q => (
                  <div key={q.id} style={{ padding: "12px 16px", backgroundColor: q.status === "closed" ? "#f0fdf4" : "#fffbeb",
                    borderRadius: "8px", borderLeft: `3px solid ${q.status === "closed" ? "#10b981" : "#f59e0b"}` }}>
                    <p style={{ margin: 0, fontSize: "14px", color: "#1e293b" }}>{q.question}</p>
                    <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                      <span style={{ fontWeight: "600", color: q.status === "closed" ? "#10b981" : "#f59e0b" }}>
                        {q.status === "closed" ? "Resolved" : "Open"}
                      </span>
                      {q.answer && <span>Answer: {q.answer}</span>}
                      {q.created_at && <span>{new Date(q.created_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "approval" && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Approval Actions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button onClick={() => updateStatus("submitted")}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#3b82f6",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                  📤 Submit for Review
                </button>
                <button onClick={() => updateStatus("approved")}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#10b981",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                  ✅ Approve Scope
                </button>
                <button onClick={() => updateStatus("changes_required")}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#f97316",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                  🔄 Request Changes
                </button>
                <button onClick={() => updateStatus("rejected")}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#f8fafc",
                    color: "#ef4444", border: "1px solid #fecaca", borderRadius: "8px",
                    cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                  ✗ Reject Scope
                </button>
              </div>
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Record Info
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Created</span>
                  <span style={{ fontSize: "13px", color: "#1e293b" }}>
                    {scope?.created_at ? new Date(scope.created_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Version</span>
                  <span style={{ fontSize: "13px", color: "#1e293b" }}>v{scope?.version || 1}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>ID</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                    {scope?.id?.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
