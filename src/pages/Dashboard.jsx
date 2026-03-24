import { useState, useEffect } from "react"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import NavBar from "../components/layout/NavBar"

const roleColors = {
  admin: "#6366f1", leadership: "#8b5cf6",
  project_manager: "#3b82f6", consultant: "#10b981",
  sales: "#f59e0b", support: "#ef4444", product_specialist: "#06b6d4"
}

const roleLabels = {
  admin: "Administrator", leadership: "Leadership",
  project_manager: "Project Manager", consultant: "Implementation Consultant",
  sales: "Sales", support: "Support", product_specialist: "Product Specialist"
}

const widgets = {
  admin: [
    { title: "Pending Approvals", value: "0", icon: "✅", color: "#6366f1", link: "/scope" },
    { title: "Active Projects", value: "0", icon: "📁", color: "#3b82f6", link: "/projects" },
    { title: "Open Opportunities", value: "0", icon: "💼", color: "#f59e0b", link: "/opportunities" },
    { title: "Pending Handoffs", value: "0", icon: "🤝", color: "#ef4444", link: "/handoff" },
    { title: "Projects At Risk", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Team Capacity", value: "0%", icon: "👥", color: "#10b981", link: "/time" },
  ],
  leadership: [
    { title: "Portfolio Health", value: "Good", icon: "📊", color: "#8b5cf6", link: "/projects" },
    { title: "Active Projects", value: "0", icon: "📁", color: "#3b82f6", link: "/projects" },
    { title: "Projects At Risk", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Pending Approvals", value: "0", icon: "✅", color: "#6366f1", link: "/scope" },
    { title: "Estimate Accuracy", value: "0%", icon: "🎯", color: "#10b981", link: "/intelligence" },
    { title: "Upcoming Go-Lives", value: "0", icon: "🚀", color: "#f59e0b", link: "/projects" },
  ],
  project_manager: [
    { title: "My Active Projects", value: "0", icon: "📁", color: "#3b82f6", link: "/projects" },
    { title: "Projects At Risk", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Overdue Milestones", value: "0", icon: "📅", color: "#ef4444", link: "/projects" },
    { title: "Open Blockers", value: "0", icon: "🚧", color: "#f59e0b", link: "/projects" },
    { title: "Upcoming Go-Lives", value: "0", icon: "🚀", color: "#10b981", link: "/projects" },
    { title: "Pending Handoffs", value: "0", icon: "🤝", color: "#6366f1", link: "/handoff" },
  ],
  consultant: [
    { title: "My Assignments", value: "0", icon: "📋", color: "#10b981", link: "/projects" },
    { title: "Discovery Tasks Due", value: "0", icon: "🔍", color: "#3b82f6", link: "/discovery" },
    { title: "Data Gaps", value: "0", icon: "⚠️", color: "#f59e0b", link: "/discovery" },
    { title: "Testing Items Due", value: "0", icon: "🧪", color: "#6366f1", link: "/testing" },
    { title: "Open Questions", value: "0", icon: "❓", color: "#ef4444", link: "/discovery" },
    { title: "Configurations Pending", value: "0", icon: "⚙️", color: "#06b6d4", link: "/projects" },
  ],
  sales: [
    { title: "Open Opportunities", value: "0", icon: "💼", color: "#f59e0b", link: "/opportunities" },
    { title: "Needs Discovery", value: "0", icon: "🔍", color: "#3b82f6", link: "/opportunities" },
    { title: "Scopes Pending Approval", value: "0", icon: "✅", color: "#6366f1", link: "/scope" },
    { title: "High Risk Deals", value: "0", icon: "⚠️", color: "#dc2626", link: "/opportunities" },
    { title: "Ready to Convert", value: "0", icon: "🚀", color: "#10b981", link: "/opportunities" },
    { title: "Closed This Month", value: "0", icon: "🏆", color: "#8b5cf6", link: "/opportunities" },
  ],
  support: [
    { title: "Pending Handoffs", value: "0", icon: "🤝", color: "#ef4444", link: "/handoff" },
    { title: "Customers in Hypercare", value: "0", icon: "💊", color: "#f59e0b", link: "/projects" },
    { title: "Recently Live", value: "0", icon: "🚀", color: "#10b981", link: "/projects" },
    { title: "Watchlist Accounts", value: "0", icon: "👁️", color: "#6366f1", link: "/projects" },
    { title: "Known Issues", value: "0", icon: "🐛", color: "#dc2626", link: "/projects" },
    { title: "Support Sensitive", value: "0", icon: "⚡", color: "#8b5cf6", link: "/projects" },
  ],
  product_specialist: [
    { title: "Technical Reviews Due", value: "0", icon: "🔬", color: "#06b6d4", link: "/scope" },
    { title: "Advanced Requests", value: "0", icon: "⚙️", color: "#6366f1", link: "/opportunities" },
    { title: "Integration Reviews", value: "0", icon: "🔗", color: "#3b82f6", link: "/projects" },
    { title: "Custom Logic Pending", value: "0", icon: "💡", color: "#f59e0b", link: "/scope" },
    { title: "Open Technical Risks", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Pending Sign-offs", value: "0", icon: "✅", color: "#10b981", link: "/testing" },
  ]
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || "admin"
  const roleLabel = roleLabels[role] || "User"
  const [stats, setStats] = useState(null)
  const [topProjects, setTopProjects] = useState([])

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    const [
      { data: projects },
      { data: opps },
      { data: blockers },
      { data: milestones },
      { data: scopes },
      { data: handoffs },
      { data: timeEntries }
    ] = await Promise.all([
      supabase.from("projects").select("id, name, status, health, budget_cost, budget_hours, golive_target, accounts(name)"),
      supabase.from("opportunities").select("id, stage"),
      supabase.from("blockers").select("project_id, severity, status").eq("status", "open"),
      supabase.from("milestones").select("project_id, status, due_date"),
      supabase.from("scope_baselines").select("id, approval_status"),
      supabase.from("handoff_packages").select("id, approval_status"),
      supabase.from("time_entries").select("project_id, hours, cost")
    ])

    const allProjects = projects || []
    const active = allProjects.filter(p => !["closed", "on_hold"].includes(p.status))
    const atRisk = allProjects.filter(p => ["at_risk", "blocked"].includes(p.status) || p.health === "red")
    const now = new Date()
    const upcomingGolive = allProjects.filter(p => {
      if (!p.golive_target) return false
      const d = new Date(p.golive_target)
      return d >= now && d <= new Date(now.getTime() + 30 * 86400000)
    })

    const allBlockers = blockers || []
    const allMilestones = milestones || []
    const overdue = allMilestones.filter(m => m.status === "pending" && m.due_date && new Date(m.due_date) < now)
    const pendingApprovals = (scopes || []).filter(s => ["submitted", "in_review"].includes(s.approval_status))
    const pendingHandoffs = (handoffs || []).filter(h => ["in_preparation", "awaiting_review"].includes(h.approval_status))
    const openOpps = (opps || []).filter(o => !["closed_lost", "converted"].includes(o.stage))

    // Cost aggregation per project
    const costByProject = {}
    ;(timeEntries || []).forEach(t => {
      if (!costByProject[t.project_id]) costByProject[t.project_id] = { hours: 0, cost: 0 }
      costByProject[t.project_id].hours += Number(t.hours) || 0
      costByProject[t.project_id].cost += Number(t.cost) || 0
    })

    const totalSpend = Object.values(costByProject).reduce((s, c) => s + c.cost, 0)
    const totalBudget = allProjects.reduce((s, p) => s + (Number(p.budget_cost) || 0), 0)

    // Top risk projects
    const scored = active.map(p => {
      const c = costByProject[p.id] || { hours: 0, cost: 0 }
      const pBlk = allBlockers.filter(b => b.project_id === p.id)
      const pMls = allMilestones.filter(m => m.project_id === p.id)
      const pOverdue = pMls.filter(m => m.status === "pending" && m.due_date && new Date(m.due_date) < now).length
      const critBlk = pBlk.filter(b => b.severity === "critical").length
      const highBlk = pBlk.filter(b => b.severity === "high").length
      const costPct = Number(p.budget_cost) > 0 ? (c.cost / Number(p.budget_cost)) * 100 : 0
      const score = (critBlk * 25) + (highBlk * 15) + (pBlk.length * 5) + (pOverdue * 10) +
        (costPct > 90 ? 20 : costPct > 75 ? 10 : 0) +
        (p.health === "red" ? 15 : p.health === "yellow" ? 5 : 0)
      return { ...p, riskScore: Math.min(100, score), costSpent: c.cost, costPct, blockerCount: pBlk.length, overdueCount: pOverdue }
    }).sort((a, b) => b.riskScore - a.riskScore)

    setTopProjects(scored.slice(0, 5))
    setStats({
      active: active.length, atRisk: atRisk.length,
      openBlockers: allBlockers.length, overdueMilestones: overdue.length,
      pendingApprovals: pendingApprovals.length, pendingHandoffs: pendingHandoffs.length,
      openOpps: openOpps.length, upcomingGolive: upcomingGolive.length,
      totalSpend, totalBudget
    })
  }

  const fmt = (n) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const healthColors2 = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444", grey: "#94a3b8" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Dashboard" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px" }}>
            {roleLabel} dashboard — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        {!stats ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { title: "Active Projects", value: stats.active, color: "#3b82f6", link: "/projects" },
                { title: "At Risk", value: stats.atRisk, color: stats.atRisk > 0 ? "#dc2626" : "#10b981", link: "/projects" },
                { title: "Open Blockers", value: stats.openBlockers, color: stats.openBlockers > 0 ? "#ef4444" : "#10b981", link: "/projects" },
                { title: "Overdue Milestones", value: stats.overdueMilestones, color: stats.overdueMilestones > 0 ? "#f59e0b" : "#10b981", link: "/projects" },
              ].map((kpi, i) => (
                <div key={i} onClick={() => navigate(kpi.link)}
                  style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px",
                    border: "1px solid #e2e8f0", borderLeft: `4px solid ${kpi.color}`,
                    cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 6px 0", fontWeight: "500" }}>{kpi.title}</p>
                  <p style={{ fontSize: "32px", fontWeight: "700", color: kpi.color, margin: 0 }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Cost Overview + Pipeline Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              {/* Cost Overview */}
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
                border: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Cost Overview
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "14px" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Spend</p>
                    <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{fmt(stats.totalSpend)}</p>
                  </div>
                  <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "14px" }}>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Budget</p>
                    <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{stats.totalBudget > 0 ? fmt(stats.totalBudget) : "Not set"}</p>
                  </div>
                </div>
                {stats.totalBudget > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#64748b" }}>Portfolio Budget Usage</span>
                      <span style={{ fontWeight: "600", color: "#1e293b" }}>{Math.round((stats.totalSpend / stats.totalBudget) * 100)}%</span>
                    </div>
                    <div style={{ height: "10px", backgroundColor: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, Math.round((stats.totalSpend / stats.totalBudget) * 100))}%`, height: "100%",
                        backgroundColor: (stats.totalSpend / stats.totalBudget) > 0.9 ? "#dc2626" : (stats.totalSpend / stats.totalBudget) > 0.75 ? "#f59e0b" : "#3b82f6",
                        borderRadius: "5px" }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Pipeline Summary */}
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
                border: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Pipeline
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {[
                    { label: "Open Opportunities", value: stats.openOpps, color: "#f59e0b", link: "/opportunities" },
                    { label: "Pending Approvals", value: stats.pendingApprovals, color: "#6366f1", link: "/scope" },
                    { label: "Upcoming Go-Lives", value: stats.upcomingGolive, color: "#10b981", link: "/projects" },
                    { label: "Pending Handoffs", value: stats.pendingHandoffs, color: "#ef4444", link: "/handoff" },
                  ].map((item, i) => (
                    <div key={i} onClick={() => navigate(item.link)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px",
                        borderRadius: "8px", cursor: "pointer", backgroundColor: "#f8fafc" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "8px",
                        backgroundColor: item.color + "18", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "16px", fontWeight: "700", color: item.color }}>
                        {item.value}
                      </div>
                      <span style={{ fontSize: "13px", color: "#475569", fontWeight: "500" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Risk Projects */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
              border: "1px solid #e2e8f0", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: 0 }}>
                  Projects Requiring Attention
                </h2>
                <button onClick={() => navigate("/projects")}
                  style={{ fontSize: "13px", color: "#3b82f6", background: "none", border: "none",
                    cursor: "pointer", fontWeight: "500" }}>
                  View All →
                </button>
              </div>
              {topProjects.length === 0 ? (
                <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "20px" }}>
                  No active projects yet
                </p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["", "Project", "Risk", "Cost", "Blockers", "Overdue"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontSize: "11px",
                          fontWeight: "600", color: "#64748b", borderBottom: "2px solid #e2e8f0",
                          textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topProjects.map(p => {
                      const rColor = p.riskScore >= 60 ? "#dc2626" : p.riskScore >= 35 ? "#f59e0b" : p.riskScore >= 15 ? "#f97316" : "#10b981"
                      const rLabel = p.riskScore >= 60 ? "Critical" : p.riskScore >= 35 ? "Elevated" : p.riskScore >= 15 ? "Moderate" : "Low"
                      return (
                        <tr key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                          style={{ cursor: "pointer" }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#f8fafc"}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%",
                              backgroundColor: healthColors2[p.health] || "#94a3b8", display: "inline-block" }} />
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", fontWeight: "500", color: "#1e293b" }}>
                            {p.name}
                            <span style={{ display: "block", fontSize: "11px", color: "#94a3b8", fontWeight: "400" }}>{p.accounts?.name}</span>
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: "11px", fontWeight: "600", padding: "2px 8px",
                              borderRadius: "12px", backgroundColor: rColor + "18", color: rColor }}>
                              {p.riskScore} — {rLabel}
                            </span>
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                            {p.costSpent > 0 ? fmt(p.costSpent) : "—"}
                            {p.costPct > 0 && <span style={{ fontSize: "11px", color: p.costPct > 90 ? "#dc2626" : "#64748b", marginLeft: "4px" }}>({Math.round(p.costPct)}%)</span>}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: "13px",
                            fontWeight: "600", color: p.blockerCount > 0 ? "#ef4444" : "#94a3b8" }}>
                            {p.blockerCount}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #f1f5f9", fontSize: "13px",
                            fontWeight: "600", color: p.overdueCount > 0 ? "#f59e0b" : "#94a3b8" }}>
                            {p.overdueCount}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Quick Actions
              </h2>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button onClick={() => navigate("/opportunities/new")}
                  style={{ backgroundColor: "#f59e0b", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px" }}>
                  + New Opportunity
                </button>
                <button onClick={() => navigate("/projects/new")}
                  style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px" }}>
                  + New Project
                </button>
                <button onClick={() => navigate("/discovery/new")}
                  style={{ backgroundColor: "#10b981", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px" }}>
                  + New Discovery
                </button>
                <button onClick={() => navigate("/time")}
                  style={{ backgroundColor: "#6366f1", color: "white", border: "none",
                    padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                    fontWeight: "600", fontSize: "14px" }}>
                  Log Time
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
