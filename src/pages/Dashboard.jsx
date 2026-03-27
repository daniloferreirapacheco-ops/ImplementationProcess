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

// Dynamic widget builder - values populated from stats
const buildWidgets = (s) => {
  if (!s) return {}
  return {
    admin: [
      { title: "Pending Approvals", value: s.pendingApprovals, icon: "✅", color: "#6366f1", link: "/scope" },
      { title: "Active Projects", value: s.active, icon: "📁", color: "#3b82f6", link: "/projects" },
      { title: "Open Opportunities", value: s.openOpps, icon: "💼", color: "#f59e0b", link: "/opportunities" },
      { title: "Pending Handoffs", value: s.pendingHandoffs, icon: "🤝", color: "#ef4444", link: "/handoff" },
      { title: "Projects At Risk", value: s.atRisk, icon: "⚠️", color: "#dc2626", link: "/projects" },
      { title: "Open Blockers", value: s.openBlockers, icon: "🚧", color: "#f97316", link: "/projects" },
    ],
    leadership: [
      { title: "Active Projects", value: s.active, icon: "📁", color: "#3b82f6", link: "/projects" },
      { title: "Projects At Risk", value: s.atRisk, icon: "⚠️", color: "#dc2626", link: "/projects" },
      { title: "Pending Approvals", value: s.pendingApprovals, icon: "✅", color: "#6366f1", link: "/scope" },
      { title: "Open Opportunities", value: s.openOpps, icon: "💼", color: "#f59e0b", link: "/opportunities" },
      { title: "Upcoming Go-Lives", value: s.upcomingGolive, icon: "🚀", color: "#10b981", link: "/projects" },
      { title: "Overdue Milestones", value: s.overdueMilestones, icon: "📅", color: "#ef4444", link: "/projects" },
    ],
    project_manager: [
      { title: "Active Projects", value: s.active, icon: "📁", color: "#3b82f6", link: "/projects" },
      { title: "Projects At Risk", value: s.atRisk, icon: "⚠️", color: "#dc2626", link: "/projects" },
      { title: "Overdue Milestones", value: s.overdueMilestones, icon: "📅", color: "#ef4444", link: "/projects" },
      { title: "Open Blockers", value: s.openBlockers, icon: "🚧", color: "#f59e0b", link: "/projects" },
      { title: "Upcoming Go-Lives", value: s.upcomingGolive, icon: "🚀", color: "#10b981", link: "/projects" },
      { title: "Pending Handoffs", value: s.pendingHandoffs, icon: "🤝", color: "#6366f1", link: "/handoff" },
    ],
    consultant: [
      { title: "Active Projects", value: s.active, icon: "📋", color: "#10b981", link: "/projects" },
      { title: "Discoveries", value: s.discoveryCount, icon: "🔍", color: "#3b82f6", link: "/discovery" },
      { title: "Open Blockers", value: s.openBlockers, icon: "🚧", color: "#f59e0b", link: "/projects" },
      { title: "Overdue Milestones", value: s.overdueMilestones, icon: "📅", color: "#ef4444", link: "/projects" },
      { title: "Pending Approvals", value: s.pendingApprovals, icon: "✅", color: "#6366f1", link: "/scope" },
      { title: "Upcoming Go-Lives", value: s.upcomingGolive, icon: "🚀", color: "#06b6d4", link: "/projects" },
    ],
    sales: [
      { title: "Open Opportunities", value: s.openOpps, icon: "💼", color: "#f59e0b", link: "/opportunities" },
      { title: "Needs Discovery", value: s.needsDiscovery, icon: "🔍", color: "#3b82f6", link: "/opportunities" },
      { title: "Pending Approvals", value: s.pendingApprovals, icon: "✅", color: "#6366f1", link: "/scope" },
      { title: "Projects At Risk", value: s.atRisk, icon: "⚠️", color: "#dc2626", link: "/projects" },
      { title: "Ready to Convert", value: s.readyToConvert, icon: "🚀", color: "#10b981", link: "/opportunities" },
      { title: "Active Projects", value: s.active, icon: "📁", color: "#8b5cf6", link: "/projects" },
    ],
    support: [
      { title: "Pending Handoffs", value: s.pendingHandoffs, icon: "🤝", color: "#ef4444", link: "/handoff" },
      { title: "In Hypercare", value: s.hypercare, icon: "💊", color: "#f59e0b", link: "/projects" },
      { title: "Upcoming Go-Lives", value: s.upcomingGolive, icon: "🚀", color: "#10b981", link: "/projects" },
      { title: "Active Projects", value: s.active, icon: "📁", color: "#3b82f6", link: "/projects" },
      { title: "Open Blockers", value: s.openBlockers, icon: "🐛", color: "#dc2626", link: "/projects" },
      { title: "Projects At Risk", value: s.atRisk, icon: "⚠️", color: "#8b5cf6", link: "/projects" },
    ],
    product_specialist: [
      { title: "Pending Approvals", value: s.pendingApprovals, icon: "🔬", color: "#06b6d4", link: "/scope" },
      { title: "Active Projects", value: s.active, icon: "📁", color: "#3b82f6", link: "/projects" },
      { title: "Discoveries", value: s.discoveryCount, icon: "🔍", color: "#8b5cf6", link: "/discovery" },
      { title: "Open Blockers", value: s.openBlockers, icon: "🚧", color: "#f59e0b", link: "/projects" },
      { title: "Projects At Risk", value: s.atRisk, icon: "⚠️", color: "#dc2626", link: "/projects" },
      { title: "Upcoming Go-Lives", value: s.upcomingGolive, icon: "🚀", color: "#10b981", link: "/projects" },
    ]
  }
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || "admin"
  const roleLabel = roleLabels[role] || "User"
  const [stats, setStats] = useState(null)
  const [topProjects, setTopProjects] = useState([])
  const [upcomingMilestones, setUpcomingMilestones] = useState([])
  const [healthDist, setHealthDist] = useState({ green: 0, yellow: 0, red: 0, grey: 0 })
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    const [
      { data: projects },
      { data: opps },
      { data: blockers },
      { data: milestones },
      { data: scopes },
      { data: handoffs },
      { data: timeEntries },
      { data: discoveries }
    ] = await Promise.all([
      supabase.from("projects").select("id, name, status, health, budget_cost, budget_hours, golive_target, accounts(name), updated_at"),
      supabase.from("opportunities").select("id, stage, name, accounts(name), updated_at"),
      supabase.from("blockers").select("project_id, severity, status").eq("status", "open"),
      supabase.from("milestones").select("project_id, name, status, due_date, projects(name)"),
      supabase.from("scopes").select("id, approval_status"),
      supabase.from("handoff_packages").select("id, approval_status"),
      supabase.from("time_entries").select("project_id, hours, cost"),
      supabase.from("discovery_records").select("id, status")
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

    // Health distribution
    const hd = { green: 0, yellow: 0, red: 0, grey: 0 }
    active.forEach(p => { hd[p.health || "grey"] = (hd[p.health || "grey"] || 0) + 1 })
    setHealthDist(hd)

    // Upcoming milestones (next 30 days, pending only)
    const upcoming = allMilestones
      .filter(m => m.status === "pending" && m.due_date && new Date(m.due_date) >= now && new Date(m.due_date) <= new Date(now.getTime() + 30 * 86400000))
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 5)
    setUpcomingMilestones(upcoming)

    // Recent activity (mix of recent projects and opps by updated_at)
    const activity = [
      ...(projects || []).map(p => ({ type: "Project", name: p.name, account: p.accounts?.name, date: p.updated_at, link: `/projects/${p.id}` })),
      ...(opps || []).map(o => ({ type: "Opportunity", name: o.name, account: o.accounts?.name, date: o.updated_at, link: `/opportunities/${o.id}` }))
    ].filter(a => a.date).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8)
    setRecentActivity(activity)

    const discoveryCount = (discoveries || []).length

    setStats({
      active: active.length, atRisk: atRisk.length,
      openBlockers: allBlockers.length, overdueMilestones: overdue.length,
      pendingApprovals: pendingApprovals.length, pendingHandoffs: pendingHandoffs.length,
      openOpps: openOpps.length, upcomingGolive: upcomingGolive.length,
      totalSpend, totalBudget, discoveryCount,
      completedProjects: allProjects.filter(p => p.status === "closed").length,
      hypercare: allProjects.filter(p => p.status === "hypercare").length,
      needsDiscovery: (opps || []).filter(o => o.stage === "discovery_required").length,
      readyToConvert: (opps || []).filter(o => o.stage === "approved").length,
    })
  }

  const fmt = (n) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`

  const healthColors2 = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444", grey: "#94a3b8" }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Dashboard" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        {/* Welcome Banner */}
        <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)", borderRadius: "16px", padding: "28px 32px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "white", margin: "0 0 6px 0" }}>
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
            </h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>
              {roleLabel} dashboard — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          {stats && (stats.overdueMilestones > 0 || stats.openBlockers > 0 || stats.pendingApprovals > 0) && (
            <div style={{ display: "flex", gap: "10px" }}>
              {stats.overdueMilestones > 0 && (
                <div onClick={() => navigate("/projects")} style={{ padding: "8px 14px", backgroundColor: "#ef444420", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: "600" }}>{stats.overdueMilestones} overdue</span>
                </div>
              )}
              {stats.openBlockers > 0 && (
                <div onClick={() => navigate("/projects")} style={{ padding: "8px 14px", backgroundColor: "#f59e0b20", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#f59e0b", fontSize: "13px", fontWeight: "600" }}>{stats.openBlockers} blockers</span>
                </div>
              )}
              {stats.pendingApprovals > 0 && (
                <div onClick={() => navigate("/scope")} style={{ padding: "8px 14px", backgroundColor: "#3b82f620", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: "600" }}>{stats.pendingApprovals} approvals</span>
                </div>
              )}
            </div>
          )}
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

            {/* Health Distribution Bar */}
            {stats.active > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px 20px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>Portfolio Health</span>
                  <div style={{ display: "flex", gap: "14px", fontSize: "12px" }}>
                    {[
                      { label: "Healthy", count: healthDist.green, color: "#10b981" },
                      { label: "Warning", count: healthDist.yellow, color: "#f59e0b" },
                      { label: "Critical", count: healthDist.red, color: "#ef4444" },
                    ].map(h => h.count > 0 && (
                      <span key={h.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: h.color }} />
                        <span style={{ color: "#64748b" }}>{h.count} {h.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f1f5f9" }}>
                  {healthDist.green > 0 && <div style={{ flex: healthDist.green, backgroundColor: "#10b981", transition: "flex 0.3s" }} />}
                  {healthDist.yellow > 0 && <div style={{ flex: healthDist.yellow, backgroundColor: "#f59e0b", transition: "flex 0.3s" }} />}
                  {healthDist.red > 0 && <div style={{ flex: healthDist.red, backgroundColor: "#ef4444", transition: "flex 0.3s" }} />}
                  {healthDist.grey > 0 && <div style={{ flex: healthDist.grey, backgroundColor: "#cbd5e1", transition: "flex 0.3s" }} />}
                </div>
              </div>
            )}

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

            {/* Health Distribution + Upcoming Milestones Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              {/* Delivery Health */}
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
                border: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Delivery Health
                </h2>
                {stats.active > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Healthy", count: healthDist.green, color: "#10b981" },
                      { label: "Needs Attention", count: healthDist.yellow, color: "#f59e0b" },
                      { label: "At Risk", count: healthDist.red, color: "#ef4444" },
                      { label: "Not Set", count: healthDist.grey, color: "#94a3b8" },
                    ].map(h => (
                      <div key={h.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                          <span style={{ color: "#64748b" }}>{h.label}</span>
                          <span style={{ fontWeight: "600", color: h.color }}>{h.count}</span>
                        </div>
                        <div style={{ height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${stats.active > 0 ? (h.count / stats.active) * 100 : 0}%`, height: "100%", backgroundColor: h.color, borderRadius: "4px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "20px" }}>No active projects</p>
                )}
              </div>

              {/* Upcoming Milestones */}
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
                border: "1px solid #e2e8f0" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Upcoming Milestones
                </h2>
                {upcomingMilestones.length === 0 ? (
                  <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "20px" }}>No upcoming milestones</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {upcomingMilestones.map((m, i) => {
                      const daysLeft = Math.ceil((new Date(m.due_date) - new Date()) / 86400000)
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 12px", backgroundColor: "#f8fafc", borderRadius: "8px",
                          borderLeft: `3px solid ${daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#f59e0b" : "#3b82f6"}` }}>
                          <div>
                            <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "#1e293b" }}>{m.name}</p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{m.projects?.name}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: "600",
                              color: daysLeft <= 3 ? "#ef4444" : daysLeft <= 7 ? "#f59e0b" : "#3b82f6" }}>
                              {daysLeft <= 0 ? "Today" : `${daysLeft}d`}
                            </p>
                            <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                              {new Date(m.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
                border: "1px solid #e2e8f0", marginBottom: "24px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                  Recent Activity
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {recentActivity.map((a, i) => {
                    const mins = Math.round((Date.now() - new Date(a.date).getTime()) / 60000)
                    const timeAgo = mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.round(mins / 60)}h ago` : `${Math.round(mins / 1440)}d ago`
                    const icons = { Project: "📁", Opportunity: "💼", Discovery: "🔍", Scope: "📋", Handoff: "🤝" }
                    return (
                      <div key={i} onClick={() => navigate(a.link)}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "10px 14px", borderRadius: "8px", cursor: "pointer", borderLeft: "3px solid transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#f8fafc"; e.currentTarget.style.borderLeftColor = a.type === "Project" ? "#3b82f6" : "#f59e0b" }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.borderLeftColor = "transparent" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ fontSize: "16px" }}>{icons[a.type] || "📄"}</span>
                          <div>
                            <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{a.name}</span>
                            {a.account && <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "8px" }}>{a.account}</span>}
                          </div>
                        </div>
                        <span style={{ fontSize: "11px", color: "#94a3b8", whiteSpace: "nowrap" }}>{timeAgo}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
              border: "1px solid #e2e8f0" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
                Quick Actions
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {[
                  { label: "New Opportunity", icon: "💼", color: "#f59e0b", link: "/opportunities/new" },
                  { label: "New Project", icon: "📁", color: "#3b82f6", link: "/projects/new" },
                  { label: "New Discovery", icon: "🔍", color: "#8b5cf6", link: "/discovery/new" },
                  { label: "New Customer", icon: "🏢", color: "#6366f1", link: "/customers/new" },
                  { label: "Log Time", icon: "⏱️", color: "#10b981", link: "/time" },
                  { label: "Analytics", icon: "📊", color: "#06b6d4", link: "/intelligence" },
                ].map(a => (
                  <button key={a.label} onClick={() => navigate(a.link)}
                    style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: `${a.color}08`, color: a.color, border: `1px solid ${a.color}25`,
                      padding: "12px 16px", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "13px", textAlign: "left" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = `${a.color}15`}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = `${a.color}08`}>
                    <span style={{ fontSize: "18px" }}>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
