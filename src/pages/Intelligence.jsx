import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

export default function Intelligence() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({})

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [
      { data: projects },
      { data: opps },
      { data: discoveries },
      { data: scopes },
      { data: handoffs },
      { data: timeEntries },
      { data: blockers },
      { data: milestones },
      { data: defects }
    ] = await Promise.all([
      supabase.from("projects").select("id, name, status, health, budget_cost, budget_hours, golive_target, accounts(name), created_at"),
      supabase.from("opportunities").select("id, stage, name, estimated_value, accounts(name), created_at"),
      supabase.from("discovery_records").select("id, status, complexity_score, created_at"),
      supabase.from("scope_baselines").select("id, approval_status, confidence_score, estimated_hours_min, estimated_hours_max, workstream_hours, created_at"),
      supabase.from("handoff_packages").select("id, approval_status, created_at"),
      supabase.from("time_entries").select("project_id, hours, cost, category"),
      supabase.from("blockers").select("project_id, severity, status"),
      supabase.from("milestones").select("project_id, name, status, due_date"),
      supabase.from("defects").select("id, severity, status, project_id")
    ]).catch(() => Array(9).fill({ data: null }))

    const p = projects || [], o = opps || [], d = discoveries || [], s = scopes || [],
      h = handoffs || [], t = timeEntries || [], b = blockers || [], m = milestones || [],
      df = defects || []

    // Pipeline funnel
    const pipeline = {
      opportunities: o.length,
      discoveries: d.length,
      scopes: s.length,
      projects: p.length,
      handoffs: h.length
    }
    const convRates = {
      oppToDisc: o.length > 0 ? Math.round((d.length / o.length) * 100) : 0,
      discToScope: d.length > 0 ? Math.round((s.length / d.length) * 100) : 0,
      scopeToProj: s.length > 0 ? Math.round((p.length / s.length) * 100) : 0,
      projToHandoff: p.length > 0 ? Math.round((h.length / p.length) * 100) : 0,
    }

    // Health distribution
    const active = p.filter(x => !["closed", "on_hold"].includes(x.status))
    const health = { green: 0, yellow: 0, red: 0, grey: 0 }
    active.forEach(x => { health[x.health || "grey"]++ })

    // Budget performance
    const costByProject = {}
    t.forEach(e => {
      if (!costByProject[e.project_id]) costByProject[e.project_id] = { hours: 0, cost: 0 }
      costByProject[e.project_id].hours += Number(e.hours) || 0
      costByProject[e.project_id].cost += Number(e.cost) || 0
    })
    const totalBudget = p.reduce((a, x) => a + (Number(x.budget_cost) || 0), 0)
    const totalSpend = Object.values(costByProject).reduce((a, x) => a + x.cost, 0)
    const totalBudgetHours = p.reduce((a, x) => a + (Number(x.budget_hours) || 0), 0)
    const totalActualHours = Object.values(costByProject).reduce((a, x) => a + x.hours, 0)

    const budgetByProject = p.filter(x => Number(x.budget_cost) > 0).map(x => {
      const actual = costByProject[x.id] || { hours: 0, cost: 0 }
      return { name: x.name, account: x.accounts?.name, budget: Number(x.budget_cost), actual: actual.cost, pct: Math.round((actual.cost / Number(x.budget_cost)) * 100) }
    }).sort((a, b) => b.pct - a.pct).slice(0, 8)

    // Scope accuracy
    const avgConfidence = s.length > 0 ? Math.round(s.reduce((a, x) => a + (x.confidence_score || 0), 0) / s.length) : 0
    const approvedScopes = s.filter(x => x.approval_status === "approved").length

    // Discovery insights
    const avgComplexity = d.length > 0 ? Math.round(d.reduce((a, x) => a + (x.complexity_score || 0), 0) / d.length) : 0
    const completedDisc = d.filter(x => x.status === "completed").length

    // Time distribution by category
    const hoursByCategory = {}
    t.forEach(e => {
      const cat = e.category || "Uncategorized"
      hoursByCategory[cat] = (hoursByCategory[cat] || 0) + (Number(e.hours) || 0)
    })
    const totalHoursLogged = Object.values(hoursByCategory).reduce((a, b) => a + b, 0)

    // Upcoming go-lives (next 90 days)
    const now = new Date()
    const goLives = p
      .filter(x => x.golive_target && new Date(x.golive_target) >= now && new Date(x.golive_target) <= new Date(now.getTime() + 90 * 86400000))
      .sort((a, b) => new Date(a.golive_target) - new Date(b.golive_target))

    // Defect summary
    const defectsBySeverity = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    df.forEach(x => {
      const sev = x.severity ? x.severity.charAt(0).toUpperCase() + x.severity.slice(1).toLowerCase() : null
      if (sev && defectsBySeverity[sev] !== undefined) defectsBySeverity[sev]++
    })
    const openDefects = df.filter(x => x.status && x.status.toLowerCase() === "open").length

    // Milestone stats
    const totalMilestones = m.length
    const completedMilestones = m.filter(x => x.status === "completed").length
    const overdueMilestones = m.filter(x => x.status === "pending" && x.due_date && new Date(x.due_date) < now).length

    // Blocker stats
    const openBlockers = b.filter(x => x.status === "open").length
    const criticalBlockers = b.filter(x => x.status === "open" && x.severity === "critical").length

    setData({
      pipeline, convRates, health, active: active.length,
      totalBudget, totalSpend, totalBudgetHours, totalActualHours, budgetByProject,
      avgConfidence, approvedScopes, totalScopes: s.length,
      avgComplexity, completedDisc, totalDisc: d.length,
      hoursByCategory, totalHoursLogged,
      goLives,
      defectsBySeverity, openDefects, totalDefects: df.length,
      totalMilestones, completedMilestones, overdueMilestones,
      openBlockers, criticalBlockers,
      totalProjects: p.length, activeProjects: active.length,
      completedProjects: p.filter(x => x.status === "closed").length,
      totalOpps: o.length, activeOpps: o.filter(x => !["closed_lost", "converted"].includes(x.stage)).length,
      totalHandoffs: h.length, completedHandoffs: h.filter(x => x.approval_status === "completed").length,
    })
    setLoading(false)
  }

  const fmt = (n) => `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  const card = { backgroundColor: "white", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }

  const Bar = ({ value, max, color, height = 8 }) => (
    <div style={{ height, backgroundColor: "#f1f5f9", borderRadius: height / 2, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${max > 0 ? Math.min(100, (value / max) * 100) : 0}%`, height: "100%", backgroundColor: color, borderRadius: height / 2 }} />
    </div>
  )

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Analytics" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading analytics...</div>
      </main>
    </div>
  )

  const d = data
  const funnelSteps = [
    { label: "Opportunities", count: d.pipeline.opportunities, color: "#f59e0b" },
    { label: "Discoveries", count: d.pipeline.discoveries, color: "#8b5cf6", rate: d.convRates.oppToDisc },
    { label: "Scopes", count: d.pipeline.scopes, color: "#06b6d4", rate: d.convRates.discToScope },
    { label: "Projects", count: d.pipeline.projects, color: "#3b82f6", rate: d.convRates.scopeToProj },
    { label: "Handoffs", count: d.pipeline.handoffs, color: "#10b981", rate: d.convRates.projToHandoff },
  ]
  const maxFunnel = Math.max(...funnelSteps.map(s => s.count), 1)

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Analytics" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
            Intelligence Dashboard
          </h1>
          <p style={{ color: "#64748b", margin: 0 }}>Portfolio analytics and delivery insights</p>
        </div>

        {/* Top KPI Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[
            { label: "Active Projects", value: d.activeProjects, color: "#3b82f6" },
            { label: "Open Opps", value: d.activeOpps, color: "#f59e0b" },
            { label: "Open Blockers", value: d.openBlockers, color: "#ef4444" },
            { label: "Overdue", value: d.overdueMilestones, color: "#f97316" },
            { label: "Open Defects", value: d.openDefects, color: "#dc2626" },
            { label: "Avg Confidence", value: `${d.avgConfidence}%`, color: "#10b981" },
          ].map(k => (
            <div key={k.label} style={{ ...card, borderTop: `3px solid ${k.color}`, padding: "16px" }}>
              <p style={{ fontSize: "11px", color: "#64748b", fontWeight: "500", textTransform: "uppercase", margin: "0 0 4px 0" }}>{k.label}</p>
              <p style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Funnel + Health Distribution */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {/* Pipeline Conversion Funnel */}
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Pipeline Conversion Funnel
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {funnelSteps.map((step, i) => (
                <div key={step.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", width: "100px" }}>{step.label}</span>
                      {step.rate !== undefined && (
                        <span style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "4px",
                          backgroundColor: step.rate >= 70 ? "#dcfce7" : step.rate >= 40 ? "#fef3c7" : "#fee2e2",
                          color: step.rate >= 70 ? "#166534" : step.rate >= 40 ? "#92400e" : "#991b1b",
                          fontWeight: "600" }}>
                          {step.rate}% conv
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: step.color }}>{step.count}</span>
                  </div>
                  <div style={{ height: "24px", backgroundColor: "#f1f5f9", borderRadius: "6px", overflow: "hidden" }}>
                    <div style={{ width: `${(step.count / maxFunnel) * 100}%`, height: "100%",
                      backgroundColor: step.color + "30", borderRadius: "6px",
                      display: "flex", alignItems: "center", paddingLeft: "8px", minWidth: step.count > 0 ? "20px" : "0" }}>
                      <div style={{ height: "100%", width: "100%", backgroundColor: step.color, borderRadius: "6px", opacity: 0.6 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Health Distribution */}
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 20px 0" }}>
              Project Health
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "Healthy", count: d.health.green, color: "#10b981", icon: "●" },
                { label: "Needs Attention", count: d.health.yellow, color: "#f59e0b", icon: "●" },
                { label: "At Risk", count: d.health.red, color: "#ef4444", icon: "●" },
                { label: "Not Set", count: d.health.grey, color: "#94a3b8", icon: "●" },
              ].map(h => (
                <div key={h.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: h.color }}>{h.icon}</span> {h.label}
                    </span>
                    <span style={{ fontSize: "20px", fontWeight: "700", color: h.color }}>{h.count}</span>
                  </div>
                  <Bar value={h.count} max={d.active || 1} color={h.color} height={10} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", textAlign: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Total Active: </span>
              <span style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>{d.active}</span>
            </div>
          </div>
        </div>

        {/* Budget Performance + Testing Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {/* Budget Performance */}
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
              Budget Performance
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Budget</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{d.totalBudget > 0 ? fmt(d.totalBudget) : "N/A"}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Spend</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: d.totalBudget > 0 && d.totalSpend > d.totalBudget * 0.9 ? "#ef4444" : "#1e293b", margin: 0 }}>{fmt(d.totalSpend)}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Budget Hours</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{d.totalBudgetHours > 0 ? `${d.totalBudgetHours}h` : "N/A"}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Actual Hours</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{Math.round(d.totalActualHours)}h</p>
              </div>
            </div>
            {d.budgetByProject.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>By Project</p>
                {d.budgetByProject.map(p => (
                  <div key={p.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "12px", color: "#1e293b", fontWeight: "500", width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <Bar value={p.actual} max={p.budget} color={p.pct > 90 ? "#ef4444" : p.pct > 75 ? "#f59e0b" : "#3b82f6"} />
                    <span style={{ fontSize: "12px", fontWeight: "600", color: p.pct > 90 ? "#ef4444" : "#64748b", width: "40px", textAlign: "right" }}>{p.pct}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testing & Quality */}
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
              Testing & Quality
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Defects</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{d.totalDefects}</p>
              </div>
              <div style={{ padding: "12px", backgroundColor: d.openDefects > 0 ? "#fef2f2" : "#f8fafc", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Open Defects</p>
                <p style={{ fontSize: "20px", fontWeight: "700", color: d.openDefects > 0 ? "#ef4444" : "#10b981", margin: 0 }}>{d.openDefects}</p>
              </div>
            </div>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Defects by Severity</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
              {[
                { label: "Critical", count: d.defectsBySeverity.Critical, color: "#ef4444" },
                { label: "High", count: d.defectsBySeverity.High, color: "#f59e0b" },
                { label: "Medium", count: d.defectsBySeverity.Medium, color: "#3b82f6" },
                { label: "Low", count: d.defectsBySeverity.Low, color: "#94a3b8" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", width: "60px" }}>{s.label}</span>
                  <Bar value={s.count} max={Math.max(d.totalDefects, 1)} color={s.color} />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: s.color, width: "30px", textAlign: "right" }}>{s.count}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "16px" }}>
              <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 8px 0", textTransform: "uppercase" }}>Milestones</p>
              <div style={{ display: "flex", gap: "16px" }}>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: "700", color: "#10b981", margin: 0 }}>{d.completedMilestones}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Completed</p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: "700", color: d.overdueMilestones > 0 ? "#ef4444" : "#94a3b8", margin: 0 }}>{d.overdueMilestones}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Overdue</p>
                </div>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: "20px", fontWeight: "700", color: "#3b82f6", margin: 0 }}>{d.totalMilestones - d.completedMilestones - d.overdueMilestones}</p>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>Upcoming</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Distribution + Upcoming Go-Lives */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {/* Time Distribution */}
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
              Time Distribution
            </h2>
            {d.totalHoursLogged > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", textAlign: "center", marginBottom: "8px" }}>
                  <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 4px 0", textTransform: "uppercase" }}>Total Hours Logged</p>
                  <p style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{Math.round(d.totalHoursLogged)}h</p>
                </div>
                {Object.entries(d.hoursByCategory).sort((a, b) => b[1] - a[1]).map(([cat, hrs], i) => {
                  const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#6366f1"]
                  const pct = Math.round((hrs / d.totalHoursLogged) * 100)
                  return (
                    <div key={cat} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", width: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "capitalize" }}>{cat.replace(/_/g, " ")}</span>
                      <Bar value={hrs} max={d.totalHoursLogged} color={colors[i % colors.length]} />
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#1e293b", width: "55px", textAlign: "right" }}>{Math.round(hrs)}h ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "30px" }}>No time entries yet</p>
            )}
          </div>

          {/* Upcoming Go-Lives */}
          <div style={card}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
              Upcoming Go-Lives (90 days)
            </h2>
            {d.goLives.length === 0 ? (
              <p style={{ color: "#94a3b8", fontSize: "14px", textAlign: "center", padding: "30px" }}>No upcoming go-lives</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {d.goLives.map(p => {
                  const daysLeft = Math.ceil((new Date(p.golive_target) - new Date()) / 86400000)
                  const hc = { green: "#10b981", yellow: "#f59e0b", red: "#ef4444", grey: "#94a3b8" }
                  return (
                    <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", cursor: "pointer",
                        borderLeft: `3px solid ${hc[p.health] || "#94a3b8"}` }}>
                      <div>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "500", color: "#1e293b" }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{p.accounts?.name}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "700",
                          color: daysLeft <= 7 ? "#ef4444" : daysLeft <= 30 ? "#f59e0b" : "#10b981" }}>
                          {daysLeft}d
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>
                          {new Date(p.golive_target).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pipeline Summary */}
        <div style={card}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
            Delivery Pipeline Summary
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            {[
              { label: "Opportunities", value: d.totalOpps, sub: `${d.activeOpps} active`, color: "#f59e0b" },
              { label: "Discoveries", value: d.totalDisc, sub: `${d.completedDisc} done`, color: "#8b5cf6" },
              { label: "Scopes", value: d.totalScopes, sub: `${d.approvedScopes} approved`, color: "#06b6d4" },
              { label: "Projects", value: d.totalProjects, sub: `${d.activeProjects} active`, color: "#3b82f6" },
              { label: "Defects", value: d.totalDefects, sub: `${d.openDefects} open`, color: "#ef4444" },
              { label: "Handoffs", value: d.totalHandoffs, sub: `${d.completedHandoffs} done`, color: "#10b981" },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ textAlign: "center", position: "relative" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%",
                  backgroundColor: item.color + "18", border: `3px solid ${item.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 6px", fontSize: "18px", fontWeight: "700", color: item.color }}>
                  {item.value}
                </div>
                <p style={{ fontSize: "12px", color: "#1e293b", margin: "0 0 2px 0", fontWeight: "600" }}>{item.label}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{item.sub}</p>
                {i < arr.length - 1 && (
                  <div style={{ position: "absolute", top: "26px", right: "-8px", color: "#d1d5db", fontSize: "16px" }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
