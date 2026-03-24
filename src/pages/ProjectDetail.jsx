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
  const [timeEntries, setTimeEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [newMilestone, setNewMilestone] = useState({ name: "", due_date: "" })
  const [newBlocker, setNewBlocker] = useState({ title: "", severity: "medium" })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    const [{ data: proj }, { data: miles }, { data: blocks }, { data: times }] = await Promise.all([
      supabase.from("projects").select("*, accounts(name)").eq("id", id).single(),
      supabase.from("milestones").select("*").eq("project_id", id).order("due_date"),
      supabase.from("blockers").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("time_entries").select("*").eq("project_id", id)
    ])
    setProject(proj)
    setMilestones(miles || [])
    setBlockers(blocks || [])
    setTimeEntries(times || [])
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project and all its milestones and blockers? This action cannot be undone.')) return
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (!error) navigate('/projects')
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
    { id: "usecases", label: "Use Cases & Testing" },
    { id: "testing", label: "Testing (Legacy)" },
    { id: "handoff", label: "Handoff" }
  ]

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0", marginBottom: "20px" }
  const inputStyle = { padding: "10px", border: "1px solid #d1d5db",
    borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }

  const completedMilestones = milestones.filter(m => m.status === "completed").length
  const progress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0

  // Cost calculations
  const totalHours = timeEntries.reduce((sum, t) => sum + (Number(t.hours) || 0), 0)
  const totalCost = timeEntries.reduce((sum, t) => sum + (Number(t.cost) || 0), 0)
  const budgetHours = Number(project?.budget_hours) || 0
  const budgetCost = Number(project?.budget_cost) || 0
  const hoursUsedPct = budgetHours > 0 ? Math.round((totalHours / budgetHours) * 100) : 0
  const costUsedPct = budgetCost > 0 ? Math.round((totalCost / budgetCost) * 100) : 0
  const hoursRemaining = budgetHours > 0 ? budgetHours - totalHours : null
  const costRemaining = budgetCost > 0 ? budgetCost - totalCost : null

  // Burn rate (avg cost per week based on project start)
  const startDate = project?.start_date ? new Date(project.start_date) : null
  const weeksElapsed = startDate ? Math.max(1, Math.round((new Date() - startDate) / (7 * 86400000))) : null
  const weeklyBurnRate = weeksElapsed ? totalCost / weeksElapsed : 0
  const weeksOfBudgetLeft = weeklyBurnRate > 0 && costRemaining !== null ? Math.round(costRemaining / weeklyBurnRate) : null

  // Auto risk score (0-100, higher = more risk)
  const openBlockers = blockers.filter(b => b.status === "open")
  const criticalBlockers = openBlockers.filter(b => b.severity === "critical").length
  const highBlockers = openBlockers.filter(b => b.severity === "high").length
  const overdueMilestones = milestones.filter(m => m.status === "pending" && m.due_date && new Date(m.due_date) < new Date()).length
  const riskScore = Math.min(100,
    (criticalBlockers * 25) +
    (highBlockers * 15) +
    (openBlockers.length * 5) +
    (overdueMilestones * 10) +
    (costUsedPct > 90 ? 20 : costUsedPct > 75 ? 10 : 0) +
    (hoursUsedPct > 90 ? 15 : hoursUsedPct > 75 ? 8 : 0) +
    (project?.health === "red" ? 15 : project?.health === "yellow" ? 5 : 0)
  )
  const riskLevel = riskScore >= 60 ? "Critical" : riskScore >= 35 ? "Elevated" : riskScore >= 15 ? "Moderate" : "Low"
  const riskColor = riskScore >= 60 ? "#dc2626" : riskScore >= 35 ? "#f59e0b" : riskScore >= 15 ? "#f97316" : "#10b981"

  const fmt = (n) => n != null ? `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "—"

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
            <button onClick={handleDelete}
              style={{ padding: "8px 16px", backgroundColor: "#fee2e2", color: "#dc2626",
                border: "1px solid #fecaca", borderRadius: "8px", cursor: "pointer",
                fontSize: "13px", fontWeight: "600" }}>
              Delete
            </button>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

            {/* Risk Score Card */}
            <div style={{ ...cardStyle, borderLeft: `4px solid ${riskColor}`, gridColumn: "1 / -1",
              display: "flex", alignItems: "center", gap: "24px", padding: "20px 24px" }}>
              <div style={{ minWidth: "80px", height: "80px", borderRadius: "50%",
                background: `conic-gradient(${riskColor} ${riskScore * 3.6}deg, #e2e8f0 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "22px", fontWeight: "700", color: riskColor }}>{riskScore}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                    Risk Score
                  </h2>
                  <span style={{ fontSize: "13px", fontWeight: "600", padding: "2px 10px",
                    borderRadius: "12px", backgroundColor: riskColor + "18", color: riskColor }}>
                    {riskLevel}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px", color: "#64748b" }}>
                  {criticalBlockers > 0 && <span style={{ color: "#dc2626", fontWeight: "600" }}>{criticalBlockers} critical blocker{criticalBlockers > 1 ? "s" : ""}</span>}
                  {highBlockers > 0 && <span style={{ color: "#ef4444", fontWeight: "600" }}>{highBlockers} high blocker{highBlockers > 1 ? "s" : ""}</span>}
                  {overdueMilestones > 0 && <span style={{ color: "#f59e0b", fontWeight: "600" }}>{overdueMilestones} overdue milestone{overdueMilestones > 1 ? "s" : ""}</span>}
                  {costUsedPct > 75 && <span style={{ color: costUsedPct > 90 ? "#dc2626" : "#f59e0b", fontWeight: "600" }}>{costUsedPct}% budget used</span>}
                  {riskScore === 0 && <span style={{ color: "#10b981", fontWeight: "600" }}>No risk signals detected</span>}
                </div>
              </div>
            </div>

            {/* Cost Tracker Card */}
            <div style={{ ...cardStyle, gridColumn: "1 / 3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Cost Tracker
                </h2>
                <button onClick={() => navigate("/time")}
                  style={{ fontSize: "12px", color: "#3b82f6", background: "none", border: "none",
                    cursor: "pointer", fontWeight: "500" }}>
                  View Time Entries →
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "16px" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>Cost Spent</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", color: costUsedPct > 90 ? "#dc2626" : "#1e293b", margin: 0 }}>{fmt(totalCost)}</p>
                  {budgetCost > 0 && <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>of {fmt(budgetCost)} budget</p>}
                </div>
                <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "16px" }}>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hours Used</p>
                  <p style={{ fontSize: "28px", fontWeight: "700", color: hoursUsedPct > 90 ? "#dc2626" : "#1e293b", margin: 0 }}>{totalHours.toFixed(1)}h</p>
                  {budgetHours > 0 && <p style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>of {budgetHours}h budget</p>}
                </div>
              </div>
              {/* Budget bars */}
              {budgetCost > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "#64748b" }}>Budget</span>
                    <span style={{ fontWeight: "600", color: costUsedPct > 90 ? "#dc2626" : costUsedPct > 75 ? "#f59e0b" : "#1e293b" }}>{costUsedPct}%</span>
                  </div>
                  <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, costUsedPct)}%`, height: "100%", borderRadius: "5px",
                      backgroundColor: costUsedPct > 90 ? "#dc2626" : costUsedPct > 75 ? "#f59e0b" : "#3b82f6",
                      transition: "width 0.3s" }} />
                  </div>
                </div>
              )}
              {budgetHours > 0 && (
                <div style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span style={{ color: "#64748b" }}>Hours</span>
                    <span style={{ fontWeight: "600", color: hoursUsedPct > 90 ? "#dc2626" : hoursUsedPct > 75 ? "#f59e0b" : "#1e293b" }}>{hoursUsedPct}%</span>
                  </div>
                  <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, hoursUsedPct)}%`, height: "100%", borderRadius: "5px",
                      backgroundColor: hoursUsedPct > 90 ? "#dc2626" : hoursUsedPct > 75 ? "#f59e0b" : "#10b981",
                      transition: "width 0.3s" }} />
                  </div>
                </div>
              )}
              {/* Burn rate & forecast */}
              <div style={{ display: "flex", gap: "16px", marginTop: "16px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                {weeklyBurnRate > 0 && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Weekly Burn</p>
                    <p style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{fmt(weeklyBurnRate)}/wk</p>
                  </div>
                )}
                {costRemaining !== null && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Remaining</p>
                    <p style={{ fontSize: "16px", fontWeight: "700", color: costRemaining < 0 ? "#dc2626" : "#1e293b", margin: 0 }}>{fmt(costRemaining)}</p>
                  </div>
                )}
                {weeksOfBudgetLeft !== null && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Runway</p>
                    <p style={{ fontSize: "16px", fontWeight: "700", color: weeksOfBudgetLeft <= 2 ? "#dc2626" : weeksOfBudgetLeft <= 4 ? "#f59e0b" : "#1e293b", margin: 0 }}>
                      {weeksOfBudgetLeft <= 0 ? "Over budget" : `${weeksOfBudgetLeft} wk${weeksOfBudgetLeft !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                )}
                {!budgetCost && !budgetHours && (
                  <p style={{ fontSize: "12px", color: "#94a3b8", fontStyle: "italic", margin: 0 }}>
                    Set a budget to see burn rate and runway forecasts
                  </p>
                )}
              </div>
            </div>

            {/* Progress Card */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Progress
              </h2>
              <div style={{ textAlign: "center", padding: "8px 0" }}>
                <div style={{ fontSize: "42px", fontWeight: "700",
                  color: progress >= 70 ? "#10b981" : progress >= 40 ? "#f59e0b" : "#64748b" }}>
                  {progress}%
                </div>
                <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "13px" }}>
                  {completedMilestones} of {milestones.length} milestones
                </p>
                <div style={{ marginTop: "12px", backgroundColor: "#e2e8f0",
                  borderRadius: "8px", height: "10px", overflow: "hidden" }}>
                  <div style={{ width: `${progress}%`, height: "100%",
                    backgroundColor: progress >= 70 ? "#10b981" : progress >= 40 ? "#f59e0b" : "#94a3b8",
                    transition: "width 0.3s" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px",
                borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: "#ef4444", margin: 0 }}>
                    {openBlockers.length}
                  </p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Blockers</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: "#f59e0b", margin: 0 }}>
                    {overdueMilestones}
                  </p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Overdue</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: "#10b981", margin: 0 }}>
                    {completedMilestones}
                  </p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "2px 0 0 0" }}>Done</p>
                </div>
              </div>
            </div>

            {/* Project Details Card */}
            <div style={{ ...cardStyle, gridColumn: "1 / 3" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Project Details
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                {[
                  { label: "Start Date", value: project?.start_date ? new Date(project.start_date).toLocaleDateString() : "Not set" },
                  { label: "Planned End", value: project?.planned_end_date ? new Date(project.planned_end_date).toLocaleDateString() : "Not set" },
                  { label: "Go-Live Target", value: project?.golive_target ? new Date(project.golive_target).toLocaleDateString() : "Not set" },
                  { label: "Health", value: project?.health || "grey" },
                  { label: "Budget Hours", value: budgetHours ? `${budgetHours}h` : "Not set" },
                  { label: "Budget Cost", value: budgetCost ? fmt(budgetCost) : "Not set" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: "13px", color: "#64748b" }}>{item.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b",
                      textTransform: "capitalize" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Edit Card */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Edit Budget
              </h2>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>Budget Hours</label>
                <input type="number" min="0" step="1"
                  defaultValue={project?.budget_hours || ""}
                  onBlur={e => updateProject("budget_hours", e.target.value ? Number(e.target.value) : null)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  placeholder="e.g. 200" />
              </div>
              <div>
                <label style={{ fontSize: "12px", color: "#64748b", display: "block", marginBottom: "4px" }}>Budget Cost ($)</label>
                <input type="number" min="0" step="100"
                  defaultValue={project?.budget_cost || ""}
                  onBlur={e => updateProject("budget_cost", e.target.value ? Number(e.target.value) : null)}
                  style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                  placeholder="e.g. 30000" />
              </div>
            </div>

            {/* Notes */}
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

        {activeTab === "usecases" && (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>&#9745;</p>
            <p style={{ color: "#1e293b", fontSize: "18px", fontWeight: "600", margin: "0 0 8px 0" }}>
              Use Cases & Testing
            </p>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 24px 0" }}>
              Validate workflows, track test cycles, manage defects, and collect signoffs
            </p>
            <button onClick={() => navigate(`/projects/${id}/usecases`)}
              style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                padding: "12px 28px", borderRadius: "8px", cursor: "pointer", fontWeight: "600",
                fontSize: "15px" }}>
              Open Use Cases & Testing
            </button>
          </div>
        )}

        {activeTab === "testing" && (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>&#129514;</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>
              Legacy Testing Center
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
