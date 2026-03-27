import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../supabase"
import { useAuth } from "../contexts/AuthContext"
import NavBar from "../components/layout/NavBar"
import usePageTitle from "../hooks/usePageTitle"
import { useToast } from "../components/Toast"

const CATEGORIES = [
  { key: "configuration", label: "Configuration", icon: "⚙️", color: "#3b82f6" },
  { key: "data_migration", label: "Data Migration", icon: "📦", color: "#8b5cf6" },
  { key: "integrations", label: "Integrations", icon: "🔗", color: "#f59e0b" },
  { key: "workflows", label: "Workflows & Processes", icon: "🔄", color: "#06b6d4" },
  { key: "reports", label: "Reports & Outputs", icon: "📊", color: "#ec4899" },
  { key: "user_acceptance", label: "User Acceptance", icon: "👥", color: "#10b981" },
  { key: "training", label: "Training", icon: "🎓", color: "#f97316" },
  { key: "security", label: "Security & Permissions", icon: "🔒", color: "#ef4444" },
  { key: "performance", label: "Performance", icon: "⚡", color: "#6366f1" },
  { key: "go_live_prep", label: "Go-Live Preparation", icon: "🚀", color: "#14b8a6" },
]

const STATUS_CONFIG = {
  not_tested: { label: "Not Tested", color: "#94a3b8", bg: "#f8fafc" },
  passed: { label: "Passed", color: "#10b981", bg: "#f0fdf4" },
  failed: { label: "Failed", color: "#ef4444", bg: "#fef2f2" },
  blocked: { label: "Blocked", color: "#f59e0b", bg: "#fffbeb" },
  skipped: { label: "Skipped", color: "#64748b", bg: "#f1f5f9" },
}

const DEFAULT_CHECKS = {
  configuration: [
    "Core module settings verified", "Custom fields configured", "Pricing/rate tables loaded",
    "Tax settings validated", "Numbering sequences confirmed", "Default values reviewed"
  ],
  data_migration: [
    "Customer data imported & verified", "Product/item data imported", "Historical data migrated",
    "Data reconciliation completed", "Duplicate records cleaned"
  ],
  integrations: [
    "API connections tested", "File import/export verified", "Email notifications working",
    "Third-party integrations validated"
  ],
  workflows: [
    "Order-to-cash flow tested end-to-end", "Purchase workflow validated",
    "Approval workflows functioning", "Job/project lifecycle verified",
    "Shipping & invoicing flow tested"
  ],
  reports: [
    "Standard reports generating correctly", "Custom reports validated",
    "Dashboard data accurate", "Export formats verified"
  ],
  user_acceptance: [
    "Key users completed UAT", "Edge cases tested", "Error handling verified",
    "User feedback addressed"
  ],
  training: [
    "Admin training completed", "End-user training completed", "Training materials distributed",
    "Quick reference guides available"
  ],
  security: [
    "User roles & permissions set", "Access restrictions verified",
    "Audit logging enabled", "Backup procedures tested"
  ],
  performance: [
    "Page load times acceptable", "Batch operations tested", "Concurrent users tested"
  ],
  go_live_prep: [
    "Go-live date confirmed with customer", "Rollback plan documented",
    "Support schedule for first week defined", "Communication plan sent to stakeholders",
    "Final data cutover planned"
  ],
}

const SIGNOFF_ROLES = [
  "Project Manager", "Customer Sponsor", "IT Lead", "Operations Lead", "Finance Lead"
]

export default function ProjectReadiness() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { toast } = useToast()

  const [project, setProject] = useState(null)
  const [checks, setChecks] = useState([])
  const [signoffs, setSignoffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [newCheck, setNewCheck] = useState({ name: "", category: "configuration", priority: "required" })

  usePageTitle("Go-Live Readiness")

  useEffect(() => { fetchAll() }, [id])

  const fetchAll = async () => {
    try {
      const { data: proj } = await supabase.from("projects").select("*, accounts(name)").eq("id", id).single()
      setProject(proj)

      let { data: chks } = await supabase.from("readiness_checks").select("*").eq("project_id", id).order("sort_order").order("created_at")
      if (!chks || chks.length === 0) {
        // Auto-populate with defaults
        const defaults = []
        Object.entries(DEFAULT_CHECKS).forEach(([cat, items]) => {
          items.forEach((name, i) => defaults.push({
            project_id: id, category: cat, name, status: "not_tested",
            priority: "required", sort_order: i
          }))
        })
        const { data: inserted } = await supabase.from("readiness_checks").insert(defaults).select()
        chks = inserted || []
      }
      setChecks(chks)

      let { data: sigs } = await supabase.from("golive_signoffs").select("*").eq("project_id", id)
      if (!sigs || sigs.length === 0) {
        const defaultSigs = SIGNOFF_ROLES.map(role => ({ project_id: id, role, signed: false }))
        const { data: inserted } = await supabase.from("golive_signoffs").insert(defaultSigs).select()
        sigs = inserted || []
      }
      setSignoffs(sigs)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const updateCheck = async (checkId, field, value) => {
    const updates = { [field]: value, updated_at: new Date().toISOString() }
    if (field === "status" && value === "passed") updates.tested_at = new Date().toISOString()
    if (field === "status" && value === "passed") updates.tester_name = profile?.full_name || "Unknown"
    await supabase.from("readiness_checks").update(updates).eq("id", checkId)
    setChecks(prev => prev.map(c => c.id === checkId ? { ...c, ...updates } : c))
  }

  const addCheck = async () => {
    if (!newCheck.name) return
    const { data } = await supabase.from("readiness_checks")
      .insert({ ...newCheck, project_id: id, sort_order: checks.length }).select().single()
    if (data) setChecks(prev => [...prev, data])
    setNewCheck({ name: "", category: "configuration", priority: "required" })
    setShowAdd(false)
    toast("Test item added")
  }

  const deleteCheck = async (checkId) => {
    await supabase.from("readiness_checks").delete().eq("id", checkId)
    setChecks(prev => prev.filter(c => c.id !== checkId))
  }

  const toggleSignoff = async (sigId, current) => {
    const updates = { signed: !current }
    if (!current) {
      updates.signed_at = new Date().toISOString()
      updates.signer_name = profile?.full_name || "Unknown"
    } else {
      updates.signed_at = null
      updates.signer_name = null
    }
    await supabase.from("golive_signoffs").update(updates).eq("id", sigId)
    setSignoffs(prev => prev.map(s => s.id === sigId ? { ...s, ...updates } : s))
    toast(!current ? "Signed off" : "Sign-off removed")
  }

  // Computed
  const filtered = activeCategory === "all" ? checks : checks.filter(c => c.category === activeCategory)
  const required = checks.filter(c => c.priority === "required")
  const requiredPassed = required.filter(c => c.status === "passed").length
  const totalPassed = checks.filter(c => c.status === "passed").length
  const totalFailed = checks.filter(c => c.status === "failed").length
  const totalBlocked = checks.filter(c => c.status === "blocked").length
  const readinessScore = required.length > 0 ? Math.round((requiredPassed / required.length) * 100) : 0
  const allSignedOff = signoffs.length > 0 && signoffs.every(s => s.signed)
  const isReadyForGoLive = readinessScore === 100 && totalFailed === 0 && totalBlocked === 0 && allSignedOff

  const inputSm = { padding: "7px 10px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", boxSizing: "border-box" }

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading readiness...</div>
      </main>
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Projects" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "28px 32px", maxWidth: "1400px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate(`/projects/${id}`)} style={{ color: "#94a3b8", cursor: "pointer" }}>{project?.name || "Project"}</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>Go-Live Readiness</span>
        </div>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Go-Live Readiness</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>{project?.name}</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowAdd(!showAdd)}
              style={{ padding: "8px 16px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              + Add Test
            </button>
            <button onClick={() => window.print()}
              style={{ padding: "8px 16px", backgroundColor: "#f1f5f9", color: "#475569", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
              Print Report
            </button>
          </div>
        </div>

        {/* Readiness Score + KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", marginBottom: "20px" }}>
          {/* Score Circle */}
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "28px", border: "1px solid #e2e8f0", textAlign: "center" }}>
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", margin: "0 auto 16px",
              background: `conic-gradient(${readinessScore >= 80 ? "#10b981" : readinessScore >= 50 ? "#f59e0b" : "#ef4444"} ${readinessScore * 3.6}deg, #e2e8f0 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "96px", height: "96px", borderRadius: "50%", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: "28px", fontWeight: "800", color: readinessScore >= 80 ? "#10b981" : readinessScore >= 50 ? "#f59e0b" : "#ef4444" }}>{readinessScore}%</span>
                <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase" }}>Ready</span>
              </div>
            </div>
            <p style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", margin: "0 0 4px" }}>
              {isReadyForGoLive ? "Ready for Go-Live!" : readinessScore >= 80 ? "Almost Ready" : readinessScore >= 50 ? "In Progress" : "Not Ready"}
            </p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
              {requiredPassed} of {required.length} required tests passed
            </p>
            {isReadyForGoLive && (
              <div style={{ marginTop: "12px", padding: "8px", backgroundColor: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#166534" }}>All checks passed & signed off</span>
              </div>
            )}
          </div>

          {/* KPI Grid + Sign-offs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {[
                { label: "Total Tests", value: checks.length, color: "#1e293b" },
                { label: "Passed", value: totalPassed, color: "#10b981" },
                { label: "Failed", value: totalFailed, color: totalFailed > 0 ? "#ef4444" : "#10b981" },
                { label: "Blocked", value: totalBlocked, color: totalBlocked > 0 ? "#f59e0b" : "#10b981" },
                { label: "Not Tested", value: checks.filter(c => c.status === "not_tested").length, color: "#94a3b8" },
              ].map(k => (
                <div key={k.label} style={{ backgroundColor: "white", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                  <p style={{ fontSize: "22px", fontWeight: "700", color: k.color, margin: "0 0 2px" }}>{k.value}</p>
                  <p style={{ fontSize: "10px", fontWeight: "600", color: "#94a3b8", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</p>
                </div>
              ))}
            </div>

            {/* Sign-offs */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "16px 20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>Go-Live Sign-offs</span>
                <span style={{ fontSize: "11px", color: "#64748b" }}>{signoffs.filter(s => s.signed).length}/{signoffs.length} signed</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {signoffs.map(s => (
                  <button key={s.id} onClick={() => toggleSignoff(s.id, s.signed)}
                    style={{ padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: "1px solid", transition: "all 0.2s",
                      backgroundColor: s.signed ? "#f0fdf4" : "white",
                      borderColor: s.signed ? "#bbf7d0" : "#e2e8f0",
                      color: s.signed ? "#166534" : "#64748b" }}>
                    {s.signed ? "✓ " : ""}{s.role}
                    {s.signer_name && <span style={{ fontSize: "10px", marginLeft: "4px", opacity: 0.7 }}>({s.signer_name})</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Add Test Form */}
        {showAdd && (
          <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px", border: "1px solid #bfdbfe", marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "end" }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Test Name *</label>
                <input value={newCheck.name} onChange={e => setNewCheck(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Verify invoice generation" autoFocus style={{ ...inputSm, width: "100%" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Category</label>
                <select value={newCheck.category} onChange={e => setNewCheck(f => ({ ...f, category: e.target.value }))} style={{ ...inputSm, width: "100%" }}>
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", display: "block", marginBottom: "4px" }}>Priority</label>
                <select value={newCheck.priority} onChange={e => setNewCheck(f => ({ ...f, priority: e.target.value }))} style={{ ...inputSm, width: "120px" }}>
                  <option value="required">Required</option>
                  <option value="recommended">Recommended</option>
                  <option value="optional">Optional</option>
                </select>
              </div>
              <button onClick={addCheck} disabled={!newCheck.name}
                style={{ padding: "7px 20px", backgroundColor: "#3b82f6", color: "white", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", whiteSpace: "nowrap" }}>
                Add
              </button>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
          <button onClick={() => setActiveCategory("all")}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer",
              backgroundColor: activeCategory === "all" ? "#1e293b" : "#f1f5f9", color: activeCategory === "all" ? "white" : "#475569" }}>
            All ({checks.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = checks.filter(c => c.category === cat.key).length
            if (count === 0) return null
            const passed = checks.filter(c => c.category === cat.key && c.status === "passed").length
            return (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                style={{ padding: "6px 14px", borderRadius: "8px", border: "none", fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  backgroundColor: activeCategory === cat.key ? cat.color : "#f1f5f9",
                  color: activeCategory === cat.key ? "white" : "#475569" }}>
                {cat.icon} {cat.label} ({passed}/{count})
              </button>
            )
          })}
        </div>

        {/* Test Items by Category */}
        {CATEGORIES.filter(cat => activeCategory === "all" || activeCategory === cat.key).map(cat => {
          const catChecks = filtered.filter(c => c.category === cat.key)
          if (catChecks.length === 0) return null
          const catPassed = catChecks.filter(c => c.status === "passed").length
          const catPct = catChecks.length > 0 ? Math.round((catPassed / catChecks.length) * 100) : 0

          return (
            <div key={cat.key} style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "12px", overflow: "hidden" }}>
              {/* Category Header */}
              <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", backgroundColor: "#fafbfc" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>{cat.icon}</span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{cat.label}</span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>({catPassed}/{catChecks.length})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "80px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${catPct}%`, height: "100%", backgroundColor: catPct === 100 ? "#10b981" : cat.color, borderRadius: "3px" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: catPct === 100 ? "#10b981" : "#64748b" }}>{catPct}%</span>
                </div>
              </div>

              {/* Check Items */}
              {catChecks.map((check, i) => {
                const sc = STATUS_CONFIG[check.status] || STATUS_CONFIG.not_tested
                return (
                  <div key={check.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px",
                    borderBottom: i < catChecks.length - 1 ? "1px solid #f8fafc" : "none",
                    backgroundColor: check.status === "failed" ? "#fef2f210" : "transparent" }}>

                    {/* Status Selector */}
                    <select value={check.status} onChange={e => updateCheck(check.id, "status", e.target.value)}
                      style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "600", borderRadius: "6px",
                        border: `1px solid ${sc.color}40`, backgroundColor: sc.bg, color: sc.color,
                        cursor: "pointer", minWidth: "95px" }}>
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>

                    {/* Test Name */}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: "13px", color: "#1e293b", fontWeight: "500",
                        textDecoration: check.status === "passed" ? "none" : "none" }}>
                        {check.name}
                      </span>
                      {check.tester_name && check.tested_at && (
                        <span style={{ fontSize: "10px", color: "#94a3b8", marginLeft: "8px" }}>
                          {check.tester_name} · {new Date(check.tested_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Priority Badge */}
                    <span style={{ fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px",
                      backgroundColor: check.priority === "required" ? "#dbeafe" : check.priority === "recommended" ? "#fef3c7" : "#f1f5f9",
                      color: check.priority === "required" ? "#1e40af" : check.priority === "recommended" ? "#92400e" : "#64748b" }}>
                      {check.priority}
                    </span>

                    {/* Notes input */}
                    <input value={check.notes || ""} onChange={e => updateCheck(check.id, "notes", e.target.value)}
                      placeholder="Notes..." style={{ width: "160px", padding: "4px 8px", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "11px", color: "#475569" }} />

                    {/* Delete */}
                    <button onClick={() => deleteCheck(check.id)}
                      style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "14px", padding: "2px" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                      onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}>
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })}

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", padding: "12px 0", justifyContent: "center" }}>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: v.color }} />
              <span style={{ fontSize: "11px", color: "#64748b" }}>{v.label}</span>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
