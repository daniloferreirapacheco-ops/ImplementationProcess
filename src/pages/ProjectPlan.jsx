import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import usePageTitle from "../hooks/usePageTitle"
import { useToast } from "../components/Toast"

const PHASES = [
  { value: "discovery", label: "Discovery", color: "#8b5cf6" },
  { value: "design", label: "Design", color: "#6366f1" },
  { value: "data_preparation", label: "Data Preparation", color: "#3b82f6" },
  { value: "configuration", label: "Configuration", color: "#f59e0b" },
  { value: "advanced_setup", label: "Advanced Setup", color: "#f97316" },
  { value: "integrations", label: "Integrations", color: "#ec4899" },
  { value: "testing", label: "Testing", color: "#06b6d4" },
  { value: "training", label: "Training", color: "#14b8a6" },
  { value: "project_management", label: "Project Management", color: "#64748b" },
  { value: "golive", label: "Go-Live", color: "#10b981" },
  { value: "post_golive", label: "Post Go-Live", color: "#22d3ee" },
]
const phaseColor = (p) => PHASES.find(x => x.value === p)?.color || "#94a3b8"
const phaseLabel = (p) => PHASES.find(x => x.value === p)?.label || p || "—"

const STATUSES = [
  { value: "not_started", label: "Not Started", color: "#94a3b8" },
  { value: "in_progress", label: "In Progress", color: "#3b82f6" },
  { value: "completed", label: "Completed", color: "#10b981" },
  { value: "on_hold", label: "On Hold", color: "#f59e0b" },
  { value: "blocked", label: "Blocked", color: "#ef4444" },
  { value: "cancelled", label: "Cancelled", color: "#78716c" },
]
const statusColor = (s) => STATUSES.find(x => x.value === s)?.color || "#94a3b8"
const statusLabel = (s) => STATUSES.find(x => x.value === s)?.label || s || "—"

const PRIORITIES = [
  { value: "low", label: "Low", color: "#94a3b8" },
  { value: "medium", label: "Medium", color: "#3b82f6" },
  { value: "high", label: "High", color: "#f59e0b" },
  { value: "critical", label: "Critical", color: "#ef4444" },
]
const priorityColor = (p) => PRIORITIES.find(x => x.value === p)?.color || "#94a3b8"

const card = { backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", marginBottom: "16px" }
const inputSm = { padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }

const today = new Date()
today.setHours(0, 0, 0, 0)

function getTaskHealth(task) {
  if (task.status === "completed" || task.status === "cancelled") return "done"
  if (task.status === "blocked") return "blocked"
  if (!task.planned_end) return "neutral"
  const end = new Date(task.planned_end)
  end.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((end - today) / 86400000)
  if (daysLeft < 0) return "overdue"
  if (daysLeft <= 3 && (task.completion_pct || 0) < 80) return "at_risk"
  return "on_track"
}

const healthIndicator = {
  overdue: { bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", label: "Overdue" },
  at_risk: { bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b", label: "At Risk" },
  on_track: { bg: "#f0fdf4", border: "#bbf7d0", dot: "#10b981", label: "On Track" },
  blocked: { bg: "#f1f5f9", border: "#cbd5e1", dot: "#64748b", label: "Blocked" },
  done: { bg: "#f0fdf4", border: "#bbf7d0", dot: "#10b981", label: "Done" },
  neutral: { bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8", label: "—" },
}

export default function ProjectPlan() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [team, setTeam] = useState([])
  const [scope, setScope] = useState(null)
  const [loading, setLoading] = useState(true)

  const [view, setView] = useState("table")
  const [filterPhase, setFilterPhase] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterAssignee, setFilterAssignee] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const emptyForm = { name: "", phase: "configuration", workstream: "", assigned_to: "", assigned_name: "",
    planned_start: "", planned_end: "", estimated_hours: "", priority: "medium", description: "", is_milestone: false }
  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    try {
      const [{ data: proj }, { data: planTasks }, { data: profs }, { data: tm }] = await Promise.all([
        supabase.from("projects").select("*, accounts(name)").eq("id", id).single(),
        supabase.from("project_plan_tasks").select("*").eq("project_id", id).order("sort_order").order("planned_start"),
        supabase.from("profiles").select("id, full_name"),
        supabase.from("project_team_members").select("*").eq("project_id", id),
      ])
      setProject(proj)
      setTasks(planTasks || [])
      setProfiles(profs || [])
      setTeam(tm || [])

      if (proj?.scope_id) {
        const { data: sc } = await supabase.from("scopes").select("id, name, workstream_hours")
          .eq("id", proj.scope_id).single()
        setScope(sc)
      }
    } catch (err) {
      console.error("Error loading plan:", err)
    } finally {
      setLoading(false)
    }
  }

  /* ── CRUD ── */
  const saveTask = async () => {
    if (!form.name) return
    setSaving(true)
    const payload = {
      ...form,
      project_id: id,
      scope_id: scope?.id || null,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : 0,
      assigned_to: form.assigned_to || null,
      assigned_name: form.assigned_name || null,
      planned_start: form.planned_start || null,
      planned_end: form.planned_end || null,
      workstream: form.workstream || null,
      description: form.description || null,
      created_by: profile?.id,
      updated_at: new Date().toISOString(),
    }
    delete payload.id
    try {
      if (editId) {
        await supabase.from("project_plan_tasks").update(payload).eq("id", editId)
        setTasks(prev => prev.map(t => t.id === editId ? { ...t, ...payload } : t))
        setEditId(null)
      } else {
        payload.sort_order = tasks.length
        const { data } = await supabase.from("project_plan_tasks").insert(payload).select().single()
        if (data) setTasks(prev => [...prev, data])
      }
      setForm({ ...emptyForm })
      setShowAdd(false)
      toast(editId ? "Task updated" : "Task added")
    } catch (err) {
      console.error("Save error:", err)
    } finally {
      setSaving(false)
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return
    await supabase.from("project_plan_tasks").delete().eq("id", taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
  }

  const quickUpdate = async (taskId, field, value) => {
    const updates = { [field]: value, updated_at: new Date().toISOString() }
    if (field === "status" && value === "completed") updates.completion_pct = 100
    if (field === "status" && value === "in_progress" && tasks.find(t => t.id === taskId)?.completion_pct === 0) {
      updates.completion_pct = 10
      updates.actual_start = new Date().toISOString().split("T")[0]
    }
    await supabase.from("project_plan_tasks").update(updates).eq("id", taskId)
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
  }

  const startEdit = (task) => {
    setForm({
      name: task.name || "", phase: task.phase || "configuration", workstream: task.workstream || "",
      assigned_to: task.assigned_to || "", assigned_name: task.assigned_name || "",
      planned_start: task.planned_start || "", planned_end: task.planned_end || "",
      estimated_hours: task.estimated_hours || "", priority: task.priority || "medium",
      description: task.description || "", is_milestone: task.is_milestone || false,
    })
    setEditId(task.id)
    setShowAdd(true)
  }

  const importFromScope = async () => {
    if (!scope?.workstream_hours) return
    const ws = scope.workstream_hours
    const newTasks = Object.entries(ws).map(([key, hours], i) => ({
      project_id: id, scope_id: scope.id, name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      phase: PHASES.find(p => p.value === key)?.value || "configuration",
      workstream: key, estimated_hours: Number(hours) || 0, status: "not_started",
      priority: "medium", completion_pct: 0, sort_order: tasks.length + i,
      created_by: profile?.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }))
    const { data } = await supabase.from("project_plan_tasks").insert(newTasks).select()
    if (data) setTasks(prev => [...prev, ...data])
  }

  /* ── Computed ── */
  const assigneeOptions = useMemo(() => {
    const map = new Map()
    profiles.forEach(p => map.set(p.id, p.full_name))
    team.forEach(t => { if (t.member_name) map.set(t.member_name, t.member_name) })
    return [...map.entries()]
  }, [profiles, team])

  const filtered = useMemo(() => tasks.filter(t => {
    if (filterPhase !== "all" && t.phase !== filterPhase) return false
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    if (filterAssignee !== "all" && t.assigned_to !== filterAssignee && t.assigned_name !== filterAssignee) return false
    return true
  }), [tasks, filterPhase, filterStatus, filterAssignee])

  const grouped = useMemo(() => {
    const g = {}
    PHASES.forEach(p => { g[p.value] = [] })
    g._other = []
    filtered.forEach(t => {
      if (g[t.phase]) g[t.phase].push(t)
      else g._other.push(t)
    })
    return g
  }, [filtered])

  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === "completed").length
    const overdue = tasks.filter(t => getTaskHealth(t) === "overdue").length
    const atRisk = tasks.filter(t => getTaskHealth(t) === "at_risk").length
    const blocked = tasks.filter(t => t.status === "blocked").length
    const plannedHrs = tasks.reduce((s, t) => s + (Number(t.estimated_hours) || 0), 0)
    const actualHrs = tasks.reduce((s, t) => s + (Number(t.actual_hours) || 0), 0)
    const avgCompletion = total > 0 ? Math.round(tasks.reduce((s, t) => s + (t.completion_pct || 0), 0) / total) : 0
    return { total, completed, overdue, atRisk, blocked, plannedHrs, actualHrs, avgCompletion }
  }, [tasks])

  /* ── Timeline helpers ── */
  const timelineRange = useMemo(() => {
    const starts = tasks.filter(t => t.planned_start).map(t => new Date(t.planned_start))
    const ends = tasks.filter(t => t.planned_end).map(t => new Date(t.planned_end))
    if (starts.length === 0) return null
    let min = new Date(Math.min(...starts))
    let max = new Date(Math.max(...ends, ...starts))
    min.setDate(min.getDate() - 7)
    max.setDate(max.getDate() + 14)
    return { min, max, days: Math.ceil((max - min) / 86400000) }
  }, [tasks])

  const dayToX = (date, width) => {
    if (!timelineRange) return 0
    const d = new Date(date)
    return ((d - timelineRange.min) / (timelineRange.max - timelineRange.min)) * width
  }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "#64748b" }}>Loading plan...</div>
      </main>
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "28px 32px", maxWidth: "1500px" }}>

        {/* Header */}
        <button onClick={() => navigate(`/projects/${id}`)}
          style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "13px", padding: 0, marginBottom: "8px" }}>
          ← Back to Project
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
              Project Plan
            </h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
              {project?.name} {scope ? `· Scope: ${scope.name}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {scope?.workstream_hours && tasks.length === 0 && (
              <button onClick={importFromScope} style={{ padding: "8px 16px", backgroundColor: "#8b5cf6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
                Import from Scope
              </button>
            )}
            <button onClick={() => { setShowAdd(!showAdd); setEditId(null); setForm({ ...emptyForm }) }}
              style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}>
              {showAdd ? "Cancel" : "+ Add Task"}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total Tasks", value: stats.total, color: "#1e293b" },
            { label: "Completed", value: `${stats.completed}/${stats.total}`, color: "#10b981" },
            { label: "Avg Progress", value: `${stats.avgCompletion}%`, color: "#3b82f6" },
            { label: "Overdue", value: stats.overdue, color: stats.overdue > 0 ? "#ef4444" : "#10b981" },
            { label: "At Risk", value: stats.atRisk, color: stats.atRisk > 0 ? "#f59e0b" : "#10b981" },
            { label: "Planned Hours", value: stats.plannedHrs, color: "#6366f1" },
          ].map(kpi => (
            <div key={kpi.label} style={{ ...card, padding: "14px 16px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</p>
              <p style={{ fontSize: "22px", fontWeight: "700", color: kpi.color, margin: 0 }}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showAdd && (
          <div style={{ ...card, borderColor: editId ? "#fde68a" : "#bfdbfe" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: "0 0 14px" }}>
              {editId ? "Edit Task" : "New Task"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Task Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Task name" style={{ ...inputSm, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Phase</label>
                <select value={form.phase} onChange={e => setForm(f => ({ ...f, phase: e.target.value }))} style={{ ...inputSm, width: "100%" }}>
                  {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={{ ...inputSm, width: "100%" }}>
                  {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Assigned To</label>
                <select value={form.assigned_to} onChange={e => {
                  const name = assigneeOptions.find(a => a[0] === e.target.value)?.[1] || ""
                  setForm(f => ({ ...f, assigned_to: e.target.value, assigned_name: name }))
                }} style={{ ...inputSm, width: "100%" }}>
                  <option value="">Unassigned</option>
                  {assigneeOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Start Date</label>
                <input type="date" value={form.planned_start} onChange={e => setForm(f => ({ ...f, planned_start: e.target.value }))} style={{ ...inputSm, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>End Date</label>
                <input type="date" value={form.planned_end} onChange={e => setForm(f => ({ ...f, planned_end: e.target.value }))} style={{ ...inputSm, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Est. Hours</label>
                <input type="number" value={form.estimated_hours} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value }))} placeholder="0" style={{ ...inputSm, width: "100%" }} />
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Workstream</label>
                <input value={form.workstream} onChange={e => setForm(f => ({ ...f, workstream: e.target.value }))} placeholder="e.g. configuration" style={{ ...inputSm, width: "100%" }} />
              </div>
              <button onClick={saveTask} disabled={saving || !form.name}
                style={{ padding: "7px 20px", backgroundColor: saving ? "#93c5fd" : "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: saving ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {saving ? "Saving..." : editId ? "Update" : "Add"}
              </button>
            </div>
            <div style={{ marginTop: "10px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" style={{ ...inputSm, width: "100%" }} />
            </div>
          </div>
        )}

        {/* Filters + View Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <select value={filterPhase} onChange={e => setFilterPhase(e.target.value)} style={inputSm}>
              <option value="all">All Phases</option>
              {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputSm}>
              <option value="all">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={inputSm}>
              <option value="all">All Assignees</option>
              {assigneeOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", borderRadius: "8px", padding: "3px" }}>
            {["table", "board", "timeline"].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ padding: "6px 14px", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  backgroundColor: view === v ? "white" : "transparent", color: view === v ? "#1e293b" : "#64748b",
                  boxShadow: view === v ? "0 1px 2px rgba(0,0,0,0.08)" : "none" }}>
                {v === "table" ? "Table" : v === "board" ? "Board" : "Timeline"}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        {view === "table" && (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>
                No tasks yet. {scope?.workstream_hours ? 'Click "Import from Scope" to get started.' : 'Click "+ Add Task" to create your first task.'}
              </div>
            ) : (
              PHASES.filter(p => (grouped[p.value] || []).length > 0).map(phase => (
                <div key={phase.value}>
                  <div style={{ padding: "10px 16px", backgroundColor: `${phase.color}10`, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: phase.color }} />
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{phase.label}</span>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>({grouped[phase.value].length} tasks)</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc" }}>
                        {["", "Task", "Assignee", "Start", "End", "Hours", "Priority", "Status", "Progress", ""].map((h, i) => (
                          <th key={i} style={{ padding: "6px 10px", fontSize: "10px", fontWeight: "700", color: "#94a3b8", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grouped[phase.value].map(task => {
                        const health = getTaskHealth(task)
                        const hi = healthIndicator[health]
                        return (
                          <tr key={task.id} style={{ backgroundColor: hi.bg, borderBottom: "1px solid #e2e8f0" }}
                            onMouseEnter={e => e.currentTarget.style.filter = "brightness(0.98)"}
                            onMouseLeave={e => e.currentTarget.style.filter = "none"}>
                            <td style={{ padding: "6px 4px 6px 10px", width: "24px" }}>
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: hi.dot }} title={hi.label} />
                            </td>
                            <td style={{ padding: "6px 10px", fontSize: "13px", fontWeight: "500", color: "#1e293b", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {task.is_milestone && <span title="Milestone" style={{ marginRight: "4px" }}>&#9670;</span>}
                              {task.name}
                              {task.description && <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", fontWeight: "400" }}>{task.description}</span>}
                            </td>
                            <td style={{ padding: "6px 10px", fontSize: "12px", color: "#475569" }}>{task.assigned_name || "—"}</td>
                            <td style={{ padding: "6px 10px", fontSize: "12px", color: "#475569" }}>{task.planned_start || "—"}</td>
                            <td style={{ padding: "6px 10px", fontSize: "12px", color: health === "overdue" ? "#ef4444" : "#475569", fontWeight: health === "overdue" ? "600" : "400" }}>{task.planned_end || "—"}</td>
                            <td style={{ padding: "6px 10px", fontSize: "12px", color: "#475569" }}>{task.estimated_hours || "—"}</td>
                            <td style={{ padding: "6px 10px" }}>
                              <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px", backgroundColor: `${priorityColor(task.priority)}18`, color: priorityColor(task.priority) }}>
                                {task.priority}
                              </span>
                            </td>
                            <td style={{ padding: "6px 10px" }}>
                              <select value={task.status} onChange={e => quickUpdate(task.id, "status", e.target.value)}
                                style={{ fontSize: "11px", fontWeight: "600", padding: "3px 6px", borderRadius: "6px", border: `1px solid ${statusColor(task.status)}40`, backgroundColor: `${statusColor(task.status)}12`, color: statusColor(task.status), cursor: "pointer" }}>
                                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: "6px 10px", width: "100px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <div style={{ flex: 1, height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${task.completion_pct || 0}%`, height: "100%", backgroundColor: (task.completion_pct || 0) === 100 ? "#10b981" : "#3b82f6", borderRadius: "3px", transition: "width 0.3s" }} />
                                </div>
                                <input type="number" min="0" max="100" value={task.completion_pct || 0}
                                  onChange={e => quickUpdate(task.id, "completion_pct", Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                  style={{ width: "38px", fontSize: "11px", padding: "2px 4px", border: "1px solid #e2e8f0", borderRadius: "4px", textAlign: "center" }} />
                              </div>
                            </td>
                            <td style={{ padding: "6px 10px", whiteSpace: "nowrap" }}>
                              <button onClick={() => startEdit(task)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", fontSize: "12px", padding: "2px 4px" }}>Edit</button>
                              <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", padding: "2px 4px" }}>Del</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        )}

        {/* Timeline View */}
        {view === "timeline" && (
          <div style={{ ...card, padding: "16px", overflowX: "auto" }}>
            {!timelineRange ? (
              <div style={{ padding: "48px", textAlign: "center", color: "#64748b" }}>Add tasks with dates to see the timeline.</div>
            ) : (() => {
              const W = Math.max(900, timelineRange.days * 14)
              const todayX = dayToX(today, W)
              const months = []
              const d = new Date(timelineRange.min)
              d.setDate(1)
              while (d <= timelineRange.max) {
                months.push({ label: d.toLocaleDateString("en", { month: "short", year: "2-digit" }), x: dayToX(d, W) })
                d.setMonth(d.getMonth() + 1)
              }
              const tasksWithDates = filtered.filter(t => t.planned_start)
              return (
                <div style={{ position: "relative", minWidth: `${W}px` }}>
                  {/* Month headers */}
                  <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "4px", position: "relative", height: "24px" }}>
                    {months.map((m, i) => (
                      <div key={i} style={{ position: "absolute", left: `${m.x}px`, fontSize: "11px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap" }}>{m.label}</div>
                    ))}
                  </div>
                  {/* Today line */}
                  <div style={{ position: "absolute", left: `${todayX}px`, top: "24px", bottom: 0, width: "2px", backgroundColor: "#ef4444", zIndex: 2, opacity: 0.6 }}>
                    <div style={{ position: "absolute", top: "-2px", left: "-10px", fontSize: "9px", color: "#ef4444", fontWeight: "700", whiteSpace: "nowrap" }}>TODAY</div>
                  </div>
                  {/* Task bars */}
                  {tasksWithDates.map(task => {
                    const health = getTaskHealth(task)
                    const x1 = dayToX(task.planned_start, W)
                    const x2 = task.planned_end ? dayToX(task.planned_end, W) : x1 + 28
                    const barW = Math.max(x2 - x1, 8)
                    const barColor = task.status === "completed" ? "#10b981" : health === "overdue" ? "#ef4444" : health === "at_risk" ? "#f59e0b" : phaseColor(task.phase)
                    return (
                      <div key={task.id} style={{ display: "flex", alignItems: "center", height: "32px", position: "relative" }}>
                        <div style={{ position: "absolute", left: `${x1}px`, width: `${barW}px`, height: "20px", backgroundColor: `${barColor}25`, border: `1.5px solid ${barColor}`, borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}
                          title={`${task.name}\n${task.planned_start} → ${task.planned_end || "?"}\n${task.assigned_name || "Unassigned"}\n${task.completion_pct || 0}%`}>
                          <div style={{ width: `${task.completion_pct || 0}%`, height: "100%", backgroundColor: `${barColor}50` }} />
                          {barW > 60 && <span style={{ position: "absolute", left: "6px", top: "2px", fontSize: "10px", fontWeight: "600", color: barColor, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: `${barW - 12}px` }}>{task.name}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

        {/* Board/Kanban View */}
        {view === "board" && (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "12px" }}>
            {STATUSES.filter(s => s.value !== "cancelled").map(col => {
              const colTasks = filtered.filter(t => t.status === col.value)
              return (
                <div key={col.value} style={{ minWidth: "240px", flex: "1 1 240px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 320px)" }}>
                  {/* Column header */}
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: col.color }} />
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>{col.label}</span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "#94a3b8", backgroundColor: "#e2e8f0", padding: "1px 8px", borderRadius: "10px" }}>{colTasks.length}</span>
                  </div>
                  {/* Cards */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {colTasks.length === 0 && (
                      <p style={{ fontSize: "11px", color: "#cbd5e1", textAlign: "center", padding: "20px 0" }}>No tasks</p>
                    )}
                    {colTasks.map(task => {
                      const health = getTaskHealth(task)
                      const hi = healthIndicator[health]
                      return (
                        <div key={task.id} style={{ backgroundColor: "white", borderRadius: "8px", padding: "12px", border: `1px solid ${hi.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", cursor: "pointer" }}
                          onClick={() => startEdit(task)}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", lineHeight: "1.3" }}>{task.name}</span>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: hi.dot, flexShrink: 0, marginTop: "4px" }} title={hi.label} />
                          </div>
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "8px", backgroundColor: `${phaseColor(task.phase)}15`, color: phaseColor(task.phase) }}>{phaseLabel(task.phase)}</span>
                            <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 7px", borderRadius: "8px", backgroundColor: `${priorityColor(task.priority)}15`, color: priorityColor(task.priority) }}>{task.priority}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ flex: 1, height: "4px", backgroundColor: "#e2e8f0", borderRadius: "2px", overflow: "hidden", marginRight: "8px" }}>
                              <div style={{ width: `${task.completion_pct || 0}%`, height: "100%", backgroundColor: (task.completion_pct || 0) === 100 ? "#10b981" : "#3b82f6", borderRadius: "2px" }} />
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: "600", color: "#64748b" }}>{task.completion_pct || 0}%</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                            <span style={{ fontSize: "10px", color: "#94a3b8" }}>{task.assigned_name || "Unassigned"}</span>
                            {task.estimated_hours > 0 && <span style={{ fontSize: "10px", color: "#94a3b8" }}>{task.estimated_hours}h</span>}
                          </div>
                          {/* Quick status buttons */}
                          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                            {STATUSES.filter(s => s.value !== task.status && s.value !== "cancelled").slice(0, 3).map(s => (
                              <button key={s.value} onClick={(e) => { e.stopPropagation(); quickUpdate(task.id, "status", s.value) }}
                                style={{ flex: 1, padding: "3px", fontSize: "9px", fontWeight: "600", borderRadius: "4px", border: `1px solid ${s.color}30`, backgroundColor: `${s.color}08`, color: s.color, cursor: "pointer" }}>
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", padding: "8px 0", justifyContent: "center" }}>
          {[
            { dot: "#10b981", label: "On Track / Done" },
            { dot: "#f59e0b", label: "At Risk" },
            { dot: "#ef4444", label: "Overdue" },
            { dot: "#64748b", label: "Blocked" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: l.dot }} />
              <span style={{ fontSize: "11px", color: "#64748b" }}>{l.label}</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
