import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "in_preparation", label: "In Preparation" },
  { value: "awaiting_review", label: "Awaiting Review" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" }
]

const statusColors = {
  not_started: "#94a3b8", in_preparation: "#f59e0b",
  awaiting_review: "#3b82f6", approved: "#10b981", completed: "#6366f1"
}

export default function HandoffDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [handoff, setHandoff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => { fetchHandoff() }, [id])

  const fetchHandoff = async () => {
    const { data } = await supabase
      .from("handoff_packages")
      .select("*, projects(name, accounts(name))")
      .eq("id", id).single()
    setHandoff(data)
    setLoading(false)
  }

  const updateStatus = async (status) => {
    setSaving(true)
    const updates = { approval_status: status, updated_at: new Date() }
    if (status === "completed") updates.completed_at = new Date()
    await supabase.from("handoff_packages").update(updates).eq("id", id)
    setHandoff(prev => ({ ...prev, approval_status: status }))
    setSaving(false)
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
        height: "calc(100vh - 64px)", color: "#64748b" }}>Loading...</div>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "approval", label: "Approval" }
  ]

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }

  const checklist = [
    { label: "Delivered modules documented", done: handoff?.delivered_modules?.length > 0 },
    { label: "Environment notes completed", done: !!handoff?.environment_notes },
    { label: "Known issues documented", done: !!handoff?.known_issues },
    { label: "Open risks listed", done: !!handoff?.open_risks },
    { label: "Support instructions provided", done: !!handoff?.support_instructions },
    { label: "Escalation map defined", done: !!handoff?.escalation_map },
  ]

  const completedItems = checklist.filter(c => c.done).length
  const readinessScore = Math.round((completedItems / checklist.length) * 100)

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <div style={{ padding: "32px", maxWidth: "1100px", margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {handoff?.projects?.name || "Handoff Package"}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              🏢 {handoff?.projects?.accounts?.name}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <select value={handoff?.approval_status || "not_started"}
              onChange={e => updateStatus(e.target.value)}
              disabled={saving}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", border: `2px solid ${statusColors[handoff?.approval_status] || "#94a3b8"}`,
                color: statusColors[handoff?.approval_status] || "#94a3b8",
                backgroundColor: "white", cursor: "pointer" }}>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ padding: "8px 18px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontSize: "14px", fontWeight: "500",
                backgroundColor: activeTab === tab.id ? "#14b8a6" : "#e2e8f0",
                color: activeTab === tab.id ? "white" : "#475569" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Handoff Readiness
              </h2>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ width: "100px", height: "100px", borderRadius: "50%",
                  backgroundColor: readinessScore >= 80 ? "#dcfce7" : readinessScore >= 50 ? "#fef3c7" : "#fee2e2",
                  border: `6px solid ${readinessScore >= 80 ? "#10b981" : readinessScore >= 50 ? "#f59e0b" : "#ef4444"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px" }}>
                  <span style={{ fontSize: "24px", fontWeight: "700",
                    color: readinessScore >= 80 ? "#10b981" : readinessScore >= 50 ? "#f59e0b" : "#ef4444" }}>
                    {readinessScore}%
                  </span>
                </div>
                <p style={{ color: "#64748b", fontSize: "14px", margin: 0 }}>
                  {completedItems} of {checklist.length} items complete
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {checklist.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px",
                    padding: "8px 12px", borderRadius: "6px",
                    backgroundColor: item.done ? "#f0fdf4" : "#fef2f2" }}>
                    <span style={{ fontSize: "16px" }}>{item.done ? "✅" : "❌"}</span>
                    <span style={{ fontSize: "13px", color: item.done ? "#166534" : "#dc2626" }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Delivered Modules
              </h2>
              {handoff?.delivered_modules?.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {handoff.delivered_modules.map((mod, i) => (
                    <span key={i} style={{ backgroundColor: "#f0fdfa", color: "#0f766e",
                      padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "500" }}>
                      {mod}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "14px" }}>No modules listed yet</p>
              )}

              <div style={{ marginTop: "20px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  Record Info
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Status</span>
                    <span style={{ fontSize: "13px", fontWeight: "600",
                      color: statusColors[handoff?.approval_status] || "#94a3b8",
                      textTransform: "capitalize" }}>
                      {handoff?.approval_status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>Created</span>
                    <span style={{ fontSize: "13px", color: "#1e293b" }}>
                      {handoff?.created_at ? new Date(handoff.created_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  {handoff?.completed_at && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", color: "#64748b" }}>Completed</span>
                      <span style={{ fontSize: "13px", color: "#10b981", fontWeight: "600" }}>
                        {new Date(handoff.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "details" && (
          <div>
            {[
              { label: "Environment & Configuration Notes", value: handoff?.environment_notes },
              { label: "Known Issues", value: handoff?.known_issues, warning: true },
              { label: "Open Risks", value: handoff?.open_risks, warning: true },
              { label: "Support Instructions", value: handoff?.support_instructions },
              { label: "Escalation Map", value: handoff?.escalation_map }
            ].map(item => (
              <div key={item.label} style={{ ...cardStyle,
                backgroundColor: item.warning && item.value ? "#fffbeb" : "white",
                borderColor: item.warning && item.value ? "#fde68a" : "#e2e8f0" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600",
                  color: item.warning && item.value ? "#92400e" : "#1e293b",
                  margin: "0 0 12px 0" }}>
                  {item.warning && item.value ? "⚠️ " : ""}{item.label}
                </h2>
                <p style={{ color: item.warning && item.value ? "#92400e" : "#475569",
                  lineHeight: "1.6", margin: 0 }}>
                  {item.value || <span style={{ color: "#94a3b8" }}>Not provided</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "approval" && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Approval Actions
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button onClick={() => updateStatus("in_preparation")}
                style={{ width: "100%", padding: "12px", backgroundColor: "#f59e0b",
                  color: "white", border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                📝 Mark In Preparation
              </button>
              <button onClick={() => updateStatus("awaiting_review")}
                style={{ width: "100%", padding: "12px", backgroundColor: "#3b82f6",
                  color: "white", border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                👀 Submit for Review
              </button>
              <button onClick={() => updateStatus("approved")}
                style={{ width: "100%", padding: "12px", backgroundColor: "#10b981",
                  color: "white", border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                ✅ Approve Handoff
              </button>
              <button onClick={() => updateStatus("completed")}
                style={{ width: "100%", padding: "12px", backgroundColor: "#6366f1",
                  color: "white", border: "none", borderRadius: "8px",
                  cursor: "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left" }}>
                🎉 Mark as Completed
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
