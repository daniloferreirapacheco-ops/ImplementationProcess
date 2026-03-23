import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

export default function Intelligence() {
  const [stats, setStats] = useState({
    totalProjects: 0, activeProjects: 0, completedProjects: 0,
    atRiskProjects: 0, totalOpportunities: 0, totalDiscoveries: 0,
    totalScopes: 0, approvedScopes: 0, totalTestCycles: 0,
    totalHandoffs: 0, completedHandoffs: 0
  })
  const [recentProjects, setRecentProjects] = useState([])
  const [recentOpps, setRecentOpps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [
      { data: projects },
      { data: opps },
      { data: discoveries },
      { data: scopes },
      { data: cycles },
      { data: handoffs }
    ] = await Promise.all([
      supabase.from("projects").select("id, status, health, name, accounts(name), created_at"),
      supabase.from("opportunities").select("id, stage, urgency, name, accounts(name), created_at"),
      supabase.from("discovery_records").select("id, status"),
      supabase.from("scope_baselines").select("id, approval_status, confidence_score, estimated_hours_min, estimated_hours_max"),
      supabase.from("test_cycles").select("id, status, pass_count, fail_count"),
      supabase.from("handoff_packages").select("id, approval_status")
    ])

    setStats({
      totalProjects: projects?.length || 0,
      activeProjects: projects?.filter(p => !["closed", "on_hold"].includes(p.status)).length || 0,
      completedProjects: projects?.filter(p => p.status === "closed").length || 0,
      atRiskProjects: projects?.filter(p => ["at_risk", "blocked"].includes(p.status)).length || 0,
      totalOpportunities: opps?.length || 0,
      activeOpportunities: opps?.filter(o => !["closed_lost", "converted"].includes(o.stage)).length || 0,
      totalDiscoveries: discoveries?.length || 0,
      completedDiscoveries: discoveries?.filter(d => d.status === "completed").length || 0,
      totalScopes: scopes?.length || 0,
      approvedScopes: scopes?.filter(s => s.approval_status === "approved").length || 0,
      avgConfidence: scopes?.length > 0 ? Math.round(scopes.reduce((a, s) => a + (s.confidence_score || 0), 0) / scopes.length) : 0,
      totalTestCycles: cycles?.length || 0,
      totalHandoffs: handoffs?.length || 0,
      completedHandoffs: handoffs?.filter(h => h.approval_status === "completed").length || 0
    })

    setRecentProjects(projects?.slice(0, 5) || [])
    setRecentOpps(opps?.slice(0, 5) || [])
    setLoading(false)
  }

  const healthColors = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444", grey: "#94a3b8" }
  const stageColors = {
    new: "#94a3b8", qualified: "#3b82f6", discovery_required: "#f59e0b",
    approved: "#10b981", closed_lost: "#ef4444", converted: "#6366f1"
  }

  const cardStyle = { backgroundColor: "white", borderRadius: "12px",
    padding: "24px", border: "1px solid #e2e8f0" }

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div style={{ ...cardStyle, borderTop: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "13px", color: "#64748b", fontWeight: "500",
            margin: "0 0 8px 0", textTransform: "uppercase" }}>{title}</p>
          <p style={{ fontSize: "36px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
            {value}
          </p>
          {subtitle && <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{subtitle}</p>}
        </div>
        <span style={{ fontSize: "32px" }}>{icon}</span>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Dashboard" />
      <div style={{ padding: "32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
            Intelligence Dashboard
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Portfolio overview and delivery analytics
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            Loading analytics...
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px", marginBottom: "32px" }}>
              <StatCard title="Total Projects" value={stats.totalProjects}
                subtitle={`${stats.activeProjects} active`} color="#3b82f6" icon="📁" />
              <StatCard title="At Risk" value={stats.atRiskProjects}
                subtitle="Need attention" color="#ef4444" icon="⚠️" />
              <StatCard title="Opportunities" value={stats.totalOpportunities}
                subtitle={`${stats.activeOpportunities || 0} active`} color="#f59e0b" icon="💼" />
              <StatCard title="Avg Confidence" value={`${stats.avgConfidence}%`}
                subtitle="Scope accuracy" color="#10b981" icon="🎯" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px", marginBottom: "32px" }}>
              <StatCard title="Discoveries" value={stats.totalDiscoveries}
                subtitle={`${stats.completedDiscoveries} completed`} color="#8b5cf6" icon="🔍" />
              <StatCard title="Scopes" value={stats.totalScopes}
                subtitle={`${stats.approvedScopes} approved`} color="#06b6d4" icon="📋" />
              <StatCard title="Test Cycles" value={stats.totalTestCycles}
                subtitle="Across all projects" color="#f97316" icon="🧪" />
              <StatCard title="Handoffs" value={stats.totalHandoffs}
                subtitle={`${stats.completedHandoffs} completed`} color="#14b8a6" icon="🤝" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px",
              marginBottom: "32px" }}>
              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b",
                  margin: "0 0 16px 0" }}>
                  Recent Projects
                </h2>
                {recentProjects.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>No projects yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {recentProjects.map(p => (
                      <div key={p.id} style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "10px 12px", backgroundColor: "#f8fafc",
                        borderRadius: "8px", borderLeft: `3px solid ${healthColors[p.health] || "#94a3b8"}` }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>
                            {p.name}
                          </p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                            {p.accounts?.name}
                          </p>
                        </div>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
                          backgroundColor: (healthColors[p.health] || "#94a3b8") + "20",
                          color: healthColors[p.health] || "#94a3b8",
                          fontWeight: "600", textTransform: "capitalize" }}>
                          {p.health || "grey"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b",
                  margin: "0 0 16px 0" }}>
                  Recent Opportunities
                </h2>
                {recentOpps.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px" }}>No opportunities yet</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {recentOpps.map(o => (
                      <div key={o.id} style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center", padding: "10px 12px", backgroundColor: "#f8fafc",
                        borderRadius: "8px" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>
                            {o.name}
                          </p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                            {o.accounts?.name}
                          </p>
                        </div>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
                          backgroundColor: (stageColors[o.stage] || "#94a3b8") + "20",
                          color: stageColors[o.stage] || "#94a3b8",
                          fontWeight: "600", textTransform: "capitalize" }}>
                          {o.stage?.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b",
                margin: "0 0 16px 0" }}>
                Pipeline Summary
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
                {[
                  { label: "Opportunities", value: stats.totalOpportunities, color: "#f59e0b" },
                  { label: "Discoveries", value: stats.totalDiscoveries, color: "#8b5cf6" },
                  { label: "Scopes", value: stats.totalScopes, color: "#06b6d4" },
                  { label: "Projects", value: stats.activeProjects, color: "#3b82f6" },
                  { label: "Testing", value: stats.totalTestCycles, color: "#f97316" },
                  { label: "Handoffs", value: stats.totalHandoffs, color: "#14b8a6" }
                ].map((item, i, arr) => (
                  <div key={item.label} style={{ textAlign: "center", position: "relative" }}>
                    <div style={{ width: "60px", height: "60px", borderRadius: "50%",
                      backgroundColor: item.color + "20", border: `3px solid ${item.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 8px", fontSize: "20px", fontWeight: "700",
                      color: item.color }}>
                      {item.value}
                    </div>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0,
                      fontWeight: "500" }}>{item.label}</p>
                    {i < arr.length - 1 && (
                      <div style={{ position: "absolute", top: "28px", right: "-8px",
                        color: "#94a3b8", fontSize: "18px" }}>→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
