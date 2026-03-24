import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const healthColors = {
  green: "#10b981", yellow: "#f59e0b",
  red: "#ef4444", grey: "#94a3b8"
}

const statusColors = {
  not_started: "#94a3b8", kickoff_planned: "#3b82f6",
  discovery_design: "#8b5cf6", configuration: "#f59e0b",
  integration: "#f97316", testing: "#06b6d4",
  readiness_review: "#ec4899", golive_planned: "#10b981",
  hypercare: "#6366f1", handoff_to_support: "#14b8a6",
  closed: "#64748b", at_risk: "#ef4444",
  blocked: "#dc2626", on_hold: "#78716c"
}

const thStyle = {
  padding: '6px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600',
  color: '#64748b', borderBottom: '2px solid #d1d5db', backgroundColor: '#f1f5f9',
  position: 'sticky', top: 0, whiteSpace: 'nowrap', textTransform: 'uppercase',
  letterSpacing: '0.5px', userSelect: 'none'
}

const tdStyle = {
  padding: '5px 12px', fontSize: '13px', color: '#1e293b',
  borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden',
  textOverflow: 'ellipsis', maxWidth: '300px'
}

const PER_PAGE = 25

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [costMap, setCostMap] = useState({})
  const [blockerMap, setBlockerMap] = useState({})
  const [milestoneMap, setMilestoneMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("active")
  const [hoveredRow, setHoveredRow] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const [{ data: projs }, { data: times }, { data: blocks }, { data: miles }] = await Promise.all([
      supabase.from("projects").select("*, accounts(name)").order("created_at", { ascending: false }),
      supabase.from("time_entries").select("project_id, hours, cost"),
      supabase.from("blockers").select("project_id, severity, status").eq("status", "open"),
      supabase.from("milestones").select("project_id, status, due_date")
    ])
    setProjects(projs || [])
    // Aggregate costs per project
    const cm = {}
    ;(times || []).forEach(t => {
      if (!cm[t.project_id]) cm[t.project_id] = { hours: 0, cost: 0 }
      cm[t.project_id].hours += Number(t.hours) || 0
      cm[t.project_id].cost += Number(t.cost) || 0
    })
    setCostMap(cm)
    // Aggregate blockers per project
    const bm = {}
    ;(blocks || []).forEach(b => {
      if (!bm[b.project_id]) bm[b.project_id] = { total: 0, critical: 0 }
      bm[b.project_id].total++
      if (b.severity === "critical" || b.severity === "high") bm[b.project_id].critical++
    })
    setBlockerMap(bm)
    // Aggregate overdue milestones per project
    const mm = {}
    const now = new Date()
    ;(miles || []).forEach(m => {
      if (!mm[m.project_id]) mm[m.project_id] = { overdue: 0 }
      if (m.status === "pending" && m.due_date && new Date(m.due_date) < now) mm[m.project_id].overdue++
    })
    setMilestoneMap(mm)
    setLoading(false)
  }

  const getRiskLevel = (p) => {
    const c = costMap[p.id] || { hours: 0, cost: 0 }
    const b = blockerMap[p.id] || { total: 0, critical: 0 }
    const m = milestoneMap[p.id] || { overdue: 0 }
    const costPct = Number(p.budget_cost) > 0 ? (c.cost / Number(p.budget_cost)) * 100 : 0
    const score = (b.critical * 20) + (b.total * 5) + (m.overdue * 10) +
      (costPct > 90 ? 20 : costPct > 75 ? 10 : 0) +
      (p.health === "red" ? 15 : p.health === "yellow" ? 5 : 0)
    if (score >= 60) return { label: "Critical", color: "#dc2626" }
    if (score >= 35) return { label: "Elevated", color: "#f59e0b" }
    if (score >= 15) return { label: "Moderate", color: "#f97316" }
    return { label: "Low", color: "#10b981" }
  }

  const filtered = projects.filter(p => {
    if (filter === "all") return true
    if (filter === "active") return !["closed", "on_hold"].includes(p.status)
    if (filter === "at_risk") return ["at_risk", "blocked"].includes(p.status)
    if (filter === "golive") return ["golive_planned", "hypercare"].includes(p.status)
    return p.status === filter
  })

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "20px 24px", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 2px 0" }}>
              Projects
            </h1>
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{filtered.length} of {projects.length} projects</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => {
              const headers = ['Name', 'Account', 'Status', 'Health', 'Risk', 'Cost', 'Budget', 'Budget %', 'Go-Live Date', 'Created']
              const rows = filtered.map(p => {
                const c = costMap[p.id] || { hours: 0, cost: 0 }
                const bPct = Number(p.budget_cost) > 0 ? Math.round((c.cost / Number(p.budget_cost)) * 100) : ''
                return [p.name, p.accounts?.name, p.status?.replace(/_/g, ' '), p.health, getRiskLevel(p).label, c.cost || '', p.budget_cost || '', bPct, p.golive_target || '', p.created_at ? new Date(p.created_at).toLocaleDateString() : ''].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')
              })
              const csv = [headers.join(','), ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a'); link.href = url; link.download = 'projects.csv'; link.click()
              URL.revokeObjectURL(url)
            }}
              style={{ padding: '7px 16px', backgroundColor: '#f1f5f9', color: '#475569',
                border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500' }}>
              Export CSV
            </button>
            <button onClick={() => navigate("/projects/new")}
              style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
                fontWeight: "600", fontSize: "13px" }}>
              + New Project
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "at_risk", label: "At Risk" },
            { key: "golive", label: "Go-Live" },
            { key: "closed", label: "Closed" },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1) }}
              style={{ padding: "4px 12px", borderRadius: "4px", border: '1px solid #d1d5db',
                cursor: "pointer", fontSize: "12px", fontWeight: "500",
                backgroundColor: filter === f.key ? "#1a1a2e" : "white",
                color: filter === f.key ? "white" : "#475569" }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No projects found</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '3%' }}></th>
                  <th style={{ ...thStyle, width: '20%' }}>Project</th>
                  <th style={{ ...thStyle, width: '14%' }}>Account</th>
                  <th style={{ ...thStyle, width: '12%' }}>Status</th>
                  <th style={{ ...thStyle, width: '8%' }}>Risk</th>
                  <th style={{ ...thStyle, width: '10%' }}>Cost</th>
                  <th style={{ ...thStyle, width: '9%' }}>Budget %</th>
                  <th style={{ ...thStyle, width: '10%' }}>Go-Live</th>
                  <th style={{ ...thStyle, width: '14%' }}>Signals</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(project => {
                  const cost = costMap[project.id] || { hours: 0, cost: 0 }
                  const blk = blockerMap[project.id] || { total: 0, critical: 0 }
                  const mls = milestoneMap[project.id] || { overdue: 0 }
                  const risk = getRiskLevel(project)
                  const budgetPct = Number(project.budget_cost) > 0
                    ? Math.round((cost.cost / Number(project.budget_cost)) * 100) : null
                  return (
                  <tr key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    onMouseEnter={() => setHoveredRow(project.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === project.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%',
                        backgroundColor: healthColors[project.health] || '#94a3b8',
                        display: 'inline-block' }} />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{project.name}</td>
                    <td style={tdStyle}>{project.accounts?.name || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (statusColors[project.status] || '#94a3b8') + '18',
                        color: statusColors[project.status] || '#94a3b8',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
                        fontWeight: '600', textTransform: 'capitalize' }}>
                        {project.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px',
                        borderRadius: '3px', backgroundColor: risk.color + '18', color: risk.color }}>
                        {risk.label}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                      {cost.cost > 0 ? `$${cost.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                    <td style={tdStyle}>
                      {budgetPct !== null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ flex: 1, height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, budgetPct)}%`, height: "100%", borderRadius: "3px",
                              backgroundColor: budgetPct > 90 ? "#dc2626" : budgetPct > 75 ? "#f59e0b" : "#3b82f6" }} />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: "600", minWidth: "28px",
                            color: budgetPct > 90 ? "#dc2626" : budgetPct > 75 ? "#f59e0b" : "#64748b" }}>
                            {budgetPct}%
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={tdStyle}>
                      {project.golive_target ? new Date(project.golive_target).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {blk.critical > 0 && <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "#fee2e2", color: "#dc2626", fontWeight: "600" }}>{blk.critical} crit</span>}
                        {blk.total > 0 && <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "#fef3c7", color: "#92400e", fontWeight: "600" }}>{blk.total} blk</span>}
                        {mls.overdue > 0 && <span style={{ fontSize: "10px", padding: "1px 5px", borderRadius: "3px", backgroundColor: "#fef9c3", color: "#854d0e", fontWeight: "600" }}>{mls.overdue} late</span>}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''} ({projects.length} total)</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px', cursor: page <= 1 ? 'default' : 'pointer', backgroundColor: 'white', color: page <= 1 ? '#cbd5e1' : '#475569' }}>
              Prev
            </button>
            <span>Page {page} of {Math.max(1, Math.ceil(filtered.length / PER_PAGE))}</span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PER_PAGE), p + 1))} disabled={page >= Math.ceil(filtered.length / PER_PAGE)}
              style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px', cursor: page >= Math.ceil(filtered.length / PER_PAGE) ? 'default' : 'pointer', backgroundColor: 'white', color: page >= Math.ceil(filtered.length / PER_PAGE) ? '#cbd5e1' : '#475569' }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
