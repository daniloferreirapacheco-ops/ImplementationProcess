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

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("active")
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("*, accounts(name)")
      .order("created_at", { ascending: false })
    setProjects(data || [])
    setLoading(false)
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
          <button onClick={() => navigate("/projects/new")}
            style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
              padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
              fontWeight: "600", fontSize: "13px" }}>
            + New Project
          </button>
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "at_risk", label: "At Risk" },
            { key: "golive", label: "Go-Live" },
            { key: "closed", label: "Closed" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
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
                  <th style={{ ...thStyle, width: '4%' }}>Health</th>
                  <th style={{ ...thStyle, width: '26%' }}>Project Name</th>
                  <th style={{ ...thStyle, width: '20%' }}>Account</th>
                  <th style={{ ...thStyle, width: '16%' }}>Status</th>
                  <th style={{ ...thStyle, width: '14%' }}>Go-Live Date</th>
                  <th style={{ ...thStyle, width: '20%' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(project => (
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
                      {project.golive_target ? new Date(project.golive_target).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} ({projects.length} total)
        </div>
      </main>
    </div>
  )
}
