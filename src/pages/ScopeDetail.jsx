import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

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

  useEffect(() => { fetchScope() }, [id])

  const fetchScope = async () => {
    const { data } = await supabase
      .from("scope_baselines")
      .select("*, opportunities(name, accounts(name))")
      .eq("id", id).single()
    setScope(data)
    setLoading(false)
  }

  const updateStatus = async (status) => {
    setSaving(true)
    await supabase.from("scope_baselines")
      .update({ approval_status: status, updated_at: new Date() }).eq("id", id)
    setScope(prev => ({ ...prev, approval_status: status }))
    setSaving(false)
  }

  if (loading || !scope) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Scope" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 64px)", color: "#64748b" }}>{loading ? "Loading..." : "Scope record not found."}</div>
      </main>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "workstreams", label: "Workstreams" },
    { id: "details", label: "Scope Details" },
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

        <button onClick={() => navigate('/scope')}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer",
            fontSize: "14px", padding: 0, marginBottom: "16px" }}>
          ← Back to Scope
        </button>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {scope?.name || "Scope Record"}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              🏢 {scope?.opportunities?.accounts?.name} — {scope?.opportunities?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
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
              {[
                { label: "Hour Range", value: `${scope?.estimated_hours_min || 0}–${scope?.estimated_hours_max || 0} hrs` },
                { label: "Confidence Score", value: `${scope?.confidence_score || 0}%`,
                  color: (scope?.confidence_score || 0) >= 75 ? "#10b981" : (scope?.confidence_score || 0) >= 60 ? "#f59e0b" : "#ef4444" },
                { label: "Risk Level", value: scope?.risk_level || "medium", textTransform: "capitalize" },
                { label: "Onsite Days", value: scope?.onsite_days || 0 },
                { label: "Version", value: `v${scope?.version || 1}` },
                { label: "Status", value: scope?.approval_status?.replace(/_/g, " ") || "draft",
                  color: statusColors[scope?.approval_status], textTransform: "capitalize" }
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>{item.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600",
                    color: item.color || "#1e293b",
                    textTransform: item.textTransform || "none" }}>
                    {item.value}
                  </span>
                </div>
              ))}
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
            {scope?.team_recommendation && (
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  Team Recommendation
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{scope.team_recommendation}</p>
              </div>
            )}
            {scope?.phase_plan && (
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  Phase Plan
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{scope.phase_plan}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "workstreams" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Workstream Hours
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(workstreams).map(([key, hours]) => {
                const pct = totalHours > 0 ? Math.round((parseInt(hours) / totalHours) * 100) : 0
                return (
                  <div key={key} style={{ padding: "12px 16px", backgroundColor: "#f8fafc",
                    borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      marginBottom: "6px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500", color: "#374151",
                        textTransform: "capitalize" }}>
                        {key.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                        {hours} hrs ({pct}%)
                      </span>
                    </div>
                    <div style={{ backgroundColor: "#e2e8f0", borderRadius: "4px",
                      height: "6px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%",
                        backgroundColor: "#3b82f6", transition: "width 0.3s" }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ padding: "12px 16px", backgroundColor: "#1e293b",
                borderRadius: "8px", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>TOTAL</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "white" }}>
                  {totalHours} hrs
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div>
            {[
              { label: "Included Modules", value: scope?.included_modules },
              { label: "Excluded Modules", value: scope?.excluded_modules },
              { label: "Assumptions", value: scope?.assumptions },
              { label: "Exclusions", value: scope?.exclusions },
              { label: "Risks", value: scope?.risks },
              { label: "Notes", value: scope?.notes }
            ].map(item => item.value && (
              <div key={item.label} style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  {item.label}
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{item.value}</p>
              </div>
            ))}
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
