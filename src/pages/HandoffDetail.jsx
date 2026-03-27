import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"
import usePageTitle from "../hooks/usePageTitle"
import { useToast } from "../components/Toast"

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

const defaultTrainingSessions = [
  { label: "Admin training", done: false },
  { label: "End-user training", done: false },
  { label: "Power-user / champion training", done: false },
  { label: "IT / technical training", done: false },
  { label: "Go-live walkthrough rehearsal", done: false }
]

export default function HandoffDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [handoff, setHandoff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const [milestones, setMilestones] = useState([])
  const { toast } = useToast()

  // Training & Readiness local state
  const [trainingSessions, setTrainingSessions] = useState(defaultTrainingSessions)
  const [userAcceptance, setUserAcceptance] = useState(false)
  const [goLiveDate, setGoLiveDate] = useState("")
  const [supportSLA, setSupportSLA] = useState("")

  usePageTitle(handoff?.projects?.name || 'Handoff')

  useEffect(() => { fetchHandoff() }, [id])

  const fetchHandoff = async () => {
    const { data } = await supabase
      .from("handoff_packages")
      .select("*, projects(id, name, status, health, accounts(name))")
      .eq("id", id).single()
    setHandoff(data)
    // Load milestones for readiness check
    if (data?.project_id) {
      const { data: miles } = await supabase.from("milestones").select("*").eq("project_id", data.project_id)
      setMilestones(miles || [])
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this handoff package? This cannot be undone.')) return
    await supabase.from("handoff_packages").delete().eq("id", id)
    toast("Handoff deleted")
    navigate('/handoff')
  }

  const updateStatus = async (status) => {
    setSaving(true)
    const updates = { approval_status: status, updated_at: new Date() }
    if (status === "completed") updates.completed_at = new Date()
    await supabase.from("handoff_packages").update(updates).eq("id", id)
    setHandoff(prev => ({ ...prev, approval_status: status }))
    // Auto-propagate: handoff approved → project to handoff_to_support, completed → closed
    if (handoff?.project_id) {
      if (status === "approved") {
        await supabase.from("projects").update({ status: "handoff_to_support", updated_at: new Date().toISOString() }).eq("id", handoff.project_id)
      } else if (status === "completed") {
        await supabase.from("projects").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", handoff.project_id)
      }
    }
    setSaving(false)
    toast(`Handoff ${status.replace(/_/g, ' ')}`)
  }

  const toggleTraining = (index) => {
    setTrainingSessions(prev =>
      prev.map((s, i) => i === index ? { ...s, done: !s.done } : s)
    )
  }

  if (loading || !handoff) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 64px)", color: "#64748b" }}>{loading ? "Loading..." : "Handoff package not found."}</div>
      </main>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "details", label: "Details" },
    { id: "training", label: "Training & Readiness" },
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
    { label: "Training completed", done: trainingSessions.every(s => s.done) },
    { label: "Data migration verified", done: !!handoff?.data_migration_verified },
    { label: "Go-live plan documented", done: !!goLiveDate },
    { label: "Rollback procedures defined", done: !!handoff?.rollback_procedures },
    { label: "Post-go-live support schedule set", done: !!supportSLA },
    { label: "All milestones completed", done: milestones.length > 0 && milestones.every(m => m.status === "completed") },
    { label: "Customer sign-off obtained", done: userAcceptance },
  ]

  const completedItems = checklist.filter(c => c.done).length
  const readinessScore = Math.round((completedItems / checklist.length) * 100)

  // --- Approval stepper helpers ---
  const stepperStages = statusOptions.map(s => s.value)
  const currentStageIndex = stepperStages.indexOf(handoff?.approval_status || "not_started")

  const stepperNode = (stage, index) => {
    const isCurrent = index === currentStageIndex
    const isCompleted = index < currentStageIndex
    const color = isCompleted || isCurrent ? statusColors[stage.value] : "#cbd5e1"
    return (
      <div key={stage.value} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          backgroundColor: isCompleted ? color : isCurrent ? "white" : "#f1f5f9",
          border: `3px solid ${color}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2, transition: "all 0.3s"
        }}>
          {isCompleted ? (
            <span style={{ color: "white", fontSize: "18px", fontWeight: "700" }}>&#10003;</span>
          ) : (
            <span style={{ color: isCurrent ? color : "#94a3b8", fontSize: "14px", fontWeight: "700" }}>{index + 1}</span>
          )}
        </div>
        <span style={{ marginTop: "8px", fontSize: "12px", fontWeight: isCurrent ? "700" : "500",
          color: isCurrent ? color : isCompleted ? "#334155" : "#94a3b8", textAlign: "center" }}>
          {stage.label}
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/handoff")} style={{ color: "#94a3b8", cursor: "pointer" }}>Handoff</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>{handoff?.projects?.name || "Handoff Package"}</span>
        </div>

        <button onClick={() => navigate('/handoff')}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer",
            fontSize: "14px", padding: 0, marginBottom: "16px" }}>
          ← Back to Handoff
        </button>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {handoff?.projects?.name || "Handoff Package"}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>
              {handoff?.projects?.accounts?.name}
              {handoff?.project_id && (
                <span onClick={() => navigate(`/projects/${handoff.project_id}`)}
                  style={{ marginLeft: "12px", color: "#3b82f6", cursor: "pointer", fontSize: "13px" }}>
                  View Project →
                </span>
              )}
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
                backgroundColor: activeTab === tab.id ? "#14b8a6" : "#e2e8f0",
                color: activeTab === tab.id ? "white" : "#475569" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================== OVERVIEW TAB ===================== */}
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
                    <span style={{ fontSize: "16px" }}>{item.done ? "\u2705" : "\u274C"}</span>
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

        {/* ===================== DETAILS TAB ===================== */}
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
                  {item.warning && item.value ? "\u26A0\uFE0F " : ""}{item.label}
                </h2>
                <p style={{ color: item.warning && item.value ? "#92400e" : "#475569",
                  lineHeight: "1.6", margin: 0 }}>
                  {item.value || <span style={{ color: "#94a3b8" }}>Not provided</span>}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ===================== TRAINING & READINESS TAB ===================== */}
        {activeTab === "training" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* Training Sessions */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Training Sessions
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
                {trainingSessions.filter(s => s.done).length} of {trainingSessions.length} sessions completed
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {trainingSessions.map((session, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: "12px",
                    padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
                    backgroundColor: session.done ? "#f0fdf4" : "#f8fafc",
                    border: `1px solid ${session.done ? "#bbf7d0" : "#e2e8f0"}`,
                    transition: "all 0.2s" }}>
                    <input type="checkbox" checked={session.done} onChange={() => toggleTraining(i)}
                      style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }} />
                    <span style={{ fontSize: "14px", fontWeight: "500",
                      color: session.done ? "#166534" : "#334155",
                      textDecoration: session.done ? "line-through" : "none" }}>
                      {session.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Readiness Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* User Acceptance */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  User Acceptance Confirmation
                </h2>
                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer",
                  padding: "14px 16px", borderRadius: "8px",
                  backgroundColor: userAcceptance ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${userAcceptance ? "#bbf7d0" : "#fecaca"}` }}>
                  <input type="checkbox" checked={userAcceptance} onChange={e => setUserAcceptance(e.target.checked)}
                    style={{ width: "20px", height: "20px", accentColor: "#10b981", cursor: "pointer" }} />
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "600",
                      color: userAcceptance ? "#166534" : "#991b1b" }}>
                      {userAcceptance ? "User acceptance confirmed" : "User acceptance not yet confirmed"}
                    </span>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                      End users have validated the solution meets their requirements
                    </p>
                  </div>
                </label>
              </div>

              {/* Go-Live Date */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Go-Live Date
                </h2>
                <input type="date" value={goLiveDate} onChange={e => setGoLiveDate(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid #e2e8f0", fontSize: "14px", color: "#334155",
                    boxSizing: "border-box" }} />
                {goLiveDate && (
                  <p style={{ fontSize: "13px", color: "#10b981", fontWeight: "600", marginTop: "8px", marginBottom: 0 }}>
                    Planned go-live: {new Date(goLiveDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                )}
              </div>

              {/* Support SLA Terms */}
              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Support SLA Terms
                </h2>
                <textarea value={supportSLA} onChange={e => setSupportSLA(e.target.value)}
                  placeholder="Define post-go-live support level agreements, response times, escalation paths..."
                  rows={5}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid #e2e8f0", fontSize: "14px", color: "#334155",
                    resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
              </div>
            </div>
          </div>
        )}

        {/* ===================== APPROVAL TAB ===================== */}
        {activeTab === "approval" && (
          <div>
            {/* Visual Workflow Stepper */}
            <div style={{ ...cardStyle, padding: "32px 24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 28px 0" }}>
                Approval Workflow
              </h2>
              <div style={{ position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                {/* Connector line behind the circles */}
                <div style={{
                  position: "absolute", top: "20px", left: "10%", right: "10%", height: "3px",
                  backgroundColor: "#e2e8f0", zIndex: 1
                }} />
                {/* Progress fill */}
                <div style={{
                  position: "absolute", top: "20px", left: "10%", height: "3px",
                  width: currentStageIndex >= 0 ? `${(currentStageIndex / (stepperStages.length - 1)) * 80}%` : "0%",
                  backgroundColor: statusColors[handoff?.approval_status] || "#94a3b8",
                  zIndex: 1, transition: "width 0.5s ease"
                }} />
                {statusOptions.map((stage, index) => stepperNode(stage, index))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
                Approval Actions
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button onClick={() => updateStatus("in_preparation")}
                  disabled={saving}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#f59e0b",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left",
                    opacity: handoff?.approval_status === "in_preparation" ? 0.5 : 1 }}>
                  Mark In Preparation
                </button>
                <button onClick={() => updateStatus("awaiting_review")}
                  disabled={saving}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#3b82f6",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left",
                    opacity: handoff?.approval_status === "awaiting_review" ? 0.5 : 1 }}>
                  Submit for Review
                </button>
                <button onClick={() => updateStatus("approved")}
                  disabled={saving}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#10b981",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left",
                    opacity: handoff?.approval_status === "approved" ? 0.5 : 1 }}>
                  Approve Handoff
                </button>
                <button onClick={() => updateStatus("completed")}
                  disabled={saving}
                  style={{ width: "100%", padding: "12px", backgroundColor: "#6366f1",
                    color: "white", border: "none", borderRadius: "8px",
                    cursor: saving ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", textAlign: "left",
                    opacity: handoff?.approval_status === "completed" ? 0.5 : 1 }}>
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Record Footer */}
        <div style={{ marginTop: "24px", padding: "12px 0", borderTop: "1px solid #e2e8f0", display: "flex", gap: "24px", fontSize: "11px", color: "#94a3b8" }}>
          <span>Created: {handoff?.created_at ? new Date(handoff.created_at).toLocaleString() : "—"}</span>
          <span>Updated: {handoff?.updated_at ? new Date(handoff.updated_at).toLocaleString() : "—"}</span>
          <span style={{ fontFamily: "monospace", fontSize: "10px" }}>ID: {handoff?.id?.substring(0, 8)}</span>
        </div>
      </main>
    </div>
  )
}
