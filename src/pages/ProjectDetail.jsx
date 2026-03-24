import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusOptions = [
  { value: "not_started", label: "Not Started" },
  { value: "kickoff_planned", label: "Kickoff Planned" },
  { value: "discovery_design", label: "Discovery / Design" },
  { value: "configuration", label: "Configuration" },
  { value: "integration", label: "Integration" },
  { value: "testing", label: "Testing" },
  { value: "readiness_review", label: "Readiness Review" },
  { value: "golive_planned", label: "Go-Live Planned" },
  { value: "hypercare", label: "Hypercare" },
  { value: "handoff_to_support", label: "Handoff to Support" },
  { value: "closed", label: "Closed" },
  { value: "at_risk", label: "At Risk" },
  { value: "blocked", label: "Blocked" },
  { value: "on_hold", label: "On Hold" }
]

const healthColors = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444", grey: "#94a3b8" }
const statusColors = {
  not_started: "#94a3b8", kickoff_planned: "#3b82f6",
  discovery_design: "#8b5cf6", configuration: "#f59e0b",
  integration: "#f97316", testing: "#06b6d4",
  readiness_review: "#ec4899", golive_planned: "#10b981",
  hypercare: "#6366f1", handoff_to_support: "#14b8a6",
  closed: "#64748b", at_risk: "#ef4444",
  blocked: "#dc2626", on_hold: "#78716c"
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [blockers, setBlockers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [newMilestone, setNewMilestone] = useState({ name: "", due_date: "" })
  const [newBlocker, setNewBlocker] = useState({ title: "", severity: "medium" })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    const [{ data: proj }, { data: miles }, { data: blocks }] = await Promise.all([
      supabase.from("projects").select("*, accounts(name)").eq("id", id).single(),
      supabase.from("milestones").select("*").eq("project_id", id).order("due_date"),
      supabase.from("blockers").select("*").eq("project_id", id).order("created_at", { ascending: false })
    ])
    setProject(proj)
    setMilestones(miles || [])
    setBlockers(blocks || [])
    setLoading(false)
  }

  const updateProject = async (field, value) => {
    setSaving(true)
    await supabase.from("projects").update({ [field]: value, updated_at: new Date() }).eq("id", id)
    setProject(prev => ({ ...prev, [field]: value }))
    setSaving(false)
  }

  const addMilestone = async () => {
    if (!newMilestone.name) return
    setSaving(true)
    const { data } = await supabase.from("milestones")
      .insert({ ...newMilestone, project_id: id }).select().single()
    setMilestones(prev => [...prev, data])
    setNewMilestone({ name: "", due_date: "" })
    setSaving(false)
  }

  const toggleMilestone = async (mId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed"
    await supabase.from("milestones").update({ status: newStatus }).eq("id", mId)
    setMilestones(prev => prev.map(m => m.id === mId ? { ...m, status: newStatus } : m))
  }

  const addBlocker = async () => {
    if (!newBlocker.title) return
    setSaving(true)
    const { data } = await supabase.from("blockers")
      .insert({ ...newBlocker, project_id: id }).select().single()
    setBlockers(prev => [data, ...prev])
    setNewBlocker({ title: "", severity: "medium" })
    setSaving(false)
  }

  const resolveBlocker = async (bId) => {
    await supabase.from("blockers").update({ status: "resolved" }).eq("id", bId)
    setBlockers(prev => prev.map(b => b.id === bId ? { ...b, status: "resolved" } : b))
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
          height: "calc(100vh - 64px)", color: "#64748b" }}>Loading...</div>
      </main>
    </div>
  )

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "milestones", label: `Milestones (${milestones.length})` },
    { id: "blockers", label: `Blockers (${blockers.filter(b => b.status === "open").length})` },
    { id: "testing", label: "Testing" },
    { id: "handoff", label: "Handoff" }
  ]

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }
  const inputStyle = { padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }

  const completedMilestones = milestones.filter(m => m.status === "completed").length
  const progress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px", maxWidth: "1420px" }}>

        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              {project?.name}
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>🏢 {project?.accounts?.name}</p>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["green", "yellow", "red"].map(h => (
                <button key={h} onClick={() => updateProject("health", h)}
                  style={{ width: "28px", height: "28px", borderRadius: "50%",
                    backgroundColor: healthColors[h], border: project?.health === h ? "3px solid #1a1a2e" : "2px solid white",
                    cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              ))}
            </div>
            <select value={project?.status || "not_started"}
              onChange={e => updateProject("status", e.target.value)}
              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "14px",
                fontWeight: "600", border: `2px solid ${statusColors[project?.status] || "#94a3b8"}`,
                color: statusColors[project?.status] || "#94a3b8",
                backgroundColor: "white", cursor: "pointer" }}>
              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
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
                Project Details
              </h2>
              {[
                { label: "Start Date", value: project?.start_date ? new Date(project.start_date).toLocaleDateString() : "Not set" },
                { label: "Planned End", value: project?.planned_end_date ? new Date(project.planned_end_date).toLocaleDateString() : "Not set" },
                { label: "Go-Live Target", value: project?.golive_target ? new Date(project.golive_target).toLocaleDateString() : "Not set" },
                { label: "Health", value: project?.health || "green" },
                { label: "Readiness Score", value: `${project?.readiness_score || 0}%` },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between",
                  padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "14px", color: "#64748b" }}>{item.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b",
                    textTransform: "capitalize" }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Progress
              </h2>
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "48px", fontWeight: "700",
                  color: progress >= 70 ? "#10b981" : progress >= 40 ? "#f59e0b" : "#64748b" }}>
                  {progress}%
                </div>
                <p style={{ color: "#64748b", margin: "8px 0 0 0" }}>
                  {completedMilestones} of {milestones.length} milestones completed
                </p>
                <div style={{ marginTop: "16px", backgroundColor: "#e2e8f0",
                  borderRadius: "8px", height: "12px", overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%",
                    backgroundColor: progress >= 70 ? "#10b981" : progress >= 40 ? "#f59e0b" : "#94a3b8",
                    transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#ef4444", margin: 0 }}>
                    {blockers.filter(b => b.status === "open").length}
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Open Blockers</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#f59e0b", margin: 0 }}>
                    {milestones.filter(m => m.status === "pending" && m.due_date && new Date(m.due_date) < new Date()).length}
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Overdue</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#10b981", margin: 0 }}>
                    {completedMilestones}
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>Completed</p>
                </div>
              </div>
            </div>
            {project?.notes && (
              <div style={{ ...cardStyle, gridColumn: "1 / -1" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 12px 0" }}>
                  Notes
                </h2>
                <p style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}>{project.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "milestones" && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Add Milestone
              </h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <input value={newMilestone.name}
                  onChange={e => setNewMilestone(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Milestone name..."
                  style={{ flex: 1, ...inputStyle }} />
                <input type="date" value={newMilestone.due_date}
                  onChange={e => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
                  style={{ width: "160px", ...inputStyle }} />
                <button onClick={addMilestone} disabled={saving}
                  style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px", whiteSpace: "nowrap" }}>
                  Add
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {milestones.map(m => {
                const isOverdue = m.status !== "completed" && m.due_date && new Date(m.due_date) < new Date()
                return (
                  <div key={m.id} style={{ ...cardStyle, marginBottom: 0,
                    borderLeft: `4px solid ${m.status === "completed" ? "#10b981" : isOverdue ? "#ef4444" : "#3b82f6"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <input type="checkbox" checked={m.status === "completed"}
                          onChange={() => toggleMilestone(m.id, m.status)}
                          style={{ width: "18px", height: "18px", cursor: "pointer" }} />
                        <div>
                          <p style={{ margin: 0, fontSize: "15px", fontWeight: "500",
                            color: m.status === "completed" ? "#94a3b8" : "#1e293b",
                            textDecoration: m.status === "completed" ? "line-through" : "none" }}>
                            {m.name}
                          </p>
                          {m.due_date && (
                            <p style={{ margin: "2px 0 0 0", fontSize: "12px",
                              color: isOverdue ? "#ef4444" : "#64748b" }}>
                              {isOverdue ? "⚠️ Overdue — " : ""}
                              Due: {new Date(m.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "12px",
                        backgroundColor: m.status === "completed" ? "#dcfce7" : isOverdue ? "#fee2e2" : "#eff6ff",
                        color: m.status === "completed" ? "#166534" : isOverdue ? "#dc2626" : "#1d4ed8",
                        fontWeight: "600", textTransform: "capitalize" }}>
                        {m.status}
                      </span>
                    </div>
                  </div>
                )
              })}
              {milestones.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No milestones yet — add your first one above
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "blockers" && (
          <div>
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Add Blocker
              </h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <input value={newBlocker.title}
                  onChange={e => setNewBlocker(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Describe the blocker..."
                  style={{ flex: 1, ...inputStyle }} />
                <select value={newBlocker.severity}
                  onChange={e => setNewBlocker(prev => ({ ...prev, severity: e.target.value }))}
                  style={{ width: "130px", ...inputStyle }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <button onClick={addBlocker} disabled={saving}
                  style={{ backgroundColor: "#ef4444", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px" }}>
                  Add
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {blockers.map(b => (
                <div key={b.id} style={{ ...cardStyle, marginBottom: 0,
                  borderLeft: `4px solid ${b.severity === "critical" ? "#dc2626" : b.severity === "high" ? "#ef4444" : b.severity === "medium" ? "#f59e0b" : "#94a3b8"}`,
                  opacity: b.status === "resolved" ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "15px", fontWeight: "500", color: "#1e293b",
                        textDecoration: b.status === "resolved" ? "line-through" : "none" }}>
                        {b.title}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#64748b",
                        textTransform: "capitalize" }}>
                        Severity: {b.severity}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "12px",
                        backgroundColor: b.status === "resolved" ? "#dcfce7" : "#fee2e2",
                        color: b.status === "resolved" ? "#166534" : "#dc2626",
                        fontWeight: "600" }}>
                        {b.status}
                      </span>
                      {b.status === "open" && (
                        <button onClick={() => resolveBlocker(b.id)}
                          style={{ backgroundColor: "#10b981", color: "white", border: "none",
                            padding: "4px 12px", borderRadius: "12px", cursor: "pointer",
                            fontSize: "12px", fontWeight: "600" }}>
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {blockers.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No blockers — great news! 🎉
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "testing" && (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🧪</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>
              Testing module coming soon
            </p>
            <button onClick={() => navigate("/testing")}
              style={{ backgroundColor: "#06b6d4", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Go to Testing Center
            </button>
          </div>
        )}

        {activeTab === "handoff" && (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🤝</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>
              Handoff module coming soon
            </p>
            <button onClick={() => navigate("/handoff")}
              style={{ backgroundColor: "#14b8a6", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Go to Handoff Center
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
