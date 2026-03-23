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

export default function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("active")

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
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <div style={{ padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              Projects
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>{projects.length} total projects</p>
          </div>
          <button onClick={() => navigate("/projects/new")}
            style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px" }}>
            + New Project
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "at_risk", label: "⚠️ At Risk" },
            { key: "golive", label: "🚀 Go-Live" },
            { key: "closed", label: "Closed" },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: "6px 16px", borderRadius: "20px", border: "none",
                cursor: "pointer", fontSize: "13px", fontWeight: "500",
                backgroundColor: filter === f.key ? "#1a1a2e" : "#e2e8f0",
                color: filter === f.key ? "white" : "#475569" }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>📁</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>No projects found</p>
            <button onClick={() => navigate("/projects/new")}
              style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Create First Project
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(project => (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}
                style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center", borderLeft: `4px solid ${healthColors[project.health] || "#94a3b8"}` }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                      {project.name}
                    </h3>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%",
                      backgroundColor: healthColors[project.health] || "#94a3b8",
                      display: "inline-block" }} />
                  </div>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      🏢 {project.accounts?.name || "No account"}
                    </span>
                    {project.golive_target && (
                      <span style={{ color: "#64748b", fontSize: "14px" }}>
                        🚀 Go-live: {new Date(project.golive_target).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ backgroundColor: (statusColors[project.status] || "#94a3b8") + "20",
                    color: statusColors[project.status] || "#94a3b8", padding: "4px 12px",
                    borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                    textTransform: "capitalize" }}>
                    {project.status?.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
