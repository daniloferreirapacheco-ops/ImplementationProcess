import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { supabase } from "../../supabase"

const sections = [
  { title: null, items: [{ label: "Dashboard", path: "/dashboard", icon: "⚡" }] },
  { title: "CRM", items: [
    { label: "Customers", path: "/customers", icon: "🏢" },
    { label: "Contacts", path: "/contacts", icon: "👤" },
    { label: "Opportunities", path: "/opportunities", icon: "💼" },
  ]},
  { title: "Delivery", items: [
    { label: "Discovery", path: "/discovery", icon: "🔍" },
    { label: "Scope", path: "/scope", icon: "📋" },
    { label: "Projects", path: "/projects", icon: "📁" },
    { label: "Handoff", path: "/handoff", icon: "🤝" },
  ]},
  { title: "Operations", items: [
    { label: "Machines", path: "/machines", icon: "🖨️" },
    { label: "Products", path: "/products", icon: "📦" },
    { label: "Templates", path: "/templates", icon: "✅" },
    { label: "Time", path: "/time", icon: "⏱️" },
  ]},
  { title: "Insights", items: [{ label: "Analytics", path: "/intelligence", icon: "📊" }] },
  { title: "Admin", items: [{ label: "Users", path: "/users", icon: "👥" }] },
]

export default function NavBar({ current }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()

  // Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef(null)

  // Notifications state
  const [notifications, setNotifications] = useState([])
  const [showNotifs, setShowNotifs] = useState(false)
  const notifRef = useRef(null)

  // Load notifications on mount
  useEffect(() => { fetchNotifications() }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.querySelector("input")?.focus(), 50)
      }
      if (e.key === "Escape") { setSearchOpen(false); setShowNotifs(false) }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const fetchNotifications = async () => {
    try {
      const items = []
      // Overdue milestones
      const { data: miles } = await supabase.from("milestones").select("id, name, due_date, project_id, projects(name)")
        .eq("status", "pending").lt("due_date", new Date().toISOString().split("T")[0]).limit(5)
      ;(miles || []).forEach(m => items.push({
        type: "overdue", icon: "⏰", color: "#ef4444",
        text: `${m.name} is overdue`, sub: m.projects?.name,
        link: `/projects/${m.project_id}`
      }))
      // Critical blockers
      const { data: blockers } = await supabase.from("blockers").select("id, title, project_id, projects(name)")
        .eq("status", "open").eq("severity", "critical").limit(5)
      ;(blockers || []).forEach(b => items.push({
        type: "blocker", icon: "🚨", color: "#dc2626",
        text: b.title, sub: b.projects?.name,
        link: `/projects/${b.project_id}`
      }))
      // Pending scope approvals
      const { data: scopes } = await supabase.from("scopes").select("id, name")
        .in("approval_status", ["submitted", "in_review"]).limit(5)
      ;(scopes || []).forEach(s => items.push({
        type: "approval", icon: "📋", color: "#f59e0b",
        text: `${s.name || "Scope"} needs approval`, sub: "Scope",
        link: `/scope/${s.id}`
      }))
      // Pending handoff approvals
      const { data: handoffs } = await supabase.from("handoff_packages").select("id, projects(name)")
        .in("approval_status", ["awaiting_review"]).limit(3)
      ;(handoffs || []).forEach(h => items.push({
        type: "approval", icon: "🤝", color: "#3b82f6",
        text: `Handoff needs review`, sub: h.projects?.name,
        link: `/handoff/${h.id}`
      }))
      setNotifications(items)
    } catch { /* tables may not exist */ }
  }

  const runSearch = async (q) => {
    if (!q || q.length < 2) { setSearchResults([]); return }
    setSearching(true)
    const results = []
    try {
      const [{ data: projects }, { data: customers }, { data: opps }, { data: contacts }] = await Promise.all([
        supabase.from("projects").select("id, name, status").ilike("name", `%${q}%`).limit(5),
        supabase.from("accounts").select("id, name").ilike("name", `%${q}%`).limit(5),
        supabase.from("opportunities").select("id, name").ilike("name", `%${q}%`).limit(5),
        supabase.from("contacts").select("id, name").ilike("name", `%${q}%`).limit(5),
      ])
      ;(projects || []).forEach(p => results.push({ label: p.name, sub: "Project", icon: "📁", link: `/projects/${p.id}` }))
      ;(customers || []).forEach(c => results.push({ label: c.name, sub: "Customer", icon: "🏢", link: `/customers/${c.id}` }))
      ;(opps || []).forEach(o => results.push({ label: o.name, sub: "Opportunity", icon: "💼", link: `/opportunities/${o.id}` }))
      ;(contacts || []).forEach(c => results.push({ label: c.name, sub: "Contact", icon: "👤", link: `/contacts/${c.id}` }))
    } catch { /* ignore */ }
    setSearchResults(results)
    setSearching(false)
  }

  useEffect(() => {
    const t = setTimeout(() => runSearch(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleSignOut = async () => { await signOut(); navigate("/login") }
  const isActive = (item) => current === item.label || location.pathname.startsWith(item.path)

  const notifCount = notifications.length

  return (
    <nav style={{ width: "220px", minWidth: "220px", backgroundColor: "#1a1a2e", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: "auto" }}>
      {/* Logo */}
      <div onClick={() => navigate("/dashboard")} style={{ padding: "20px 20px 12px", cursor: "pointer", borderBottom: "1px solid #ffffff10" }}>
        <span style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>⚡ Ecalc OS</span>
      </div>

      {/* Search + Notifications bar */}
      <div style={{ padding: "10px 12px", display: "flex", gap: "6px", borderBottom: "1px solid #ffffff08" }}>
        <div ref={searchRef} style={{ flex: 1, position: "relative" }}>
          <button onClick={() => { setSearchOpen(!searchOpen); setTimeout(() => searchRef.current?.querySelector("input")?.focus(), 50) }}
            style={{ width: "100%", padding: "7px 10px", backgroundColor: "#ffffff10", border: "1px solid #ffffff15", borderRadius: "6px", color: "#94a3b8", fontSize: "11px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Search...</span>
            <span style={{ fontSize: "9px", backgroundColor: "#ffffff15", padding: "1px 5px", borderRadius: "3px" }}>Ctrl+K</span>
          </button>
          {searchOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "-8px", width: "320px", backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 200, overflow: "hidden" }}>
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search projects, customers, contacts..."
                style={{ width: "100%", padding: "12px 14px", backgroundColor: "transparent", border: "none", borderBottom: "1px solid #334155", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                {searching && <p style={{ padding: "12px", color: "#64748b", fontSize: "12px", margin: 0 }}>Searching...</p>}
                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p style={{ padding: "12px", color: "#64748b", fontSize: "12px", margin: 0 }}>No results found</p>
                )}
                {searchResults.map((r, i) => (
                  <div key={i} onClick={() => { navigate(r.link); setSearchOpen(false); setSearchQuery("") }}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #ffffff08" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ffffff08"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <span style={{ fontSize: "16px" }}>{r.icon}</span>
                    <div>
                      <p style={{ margin: 0, color: "white", fontSize: "13px", fontWeight: "500" }}>{r.label}</p>
                      <p style={{ margin: 0, color: "#64748b", fontSize: "10px" }}>{r.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Notification bell */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowNotifs(!showNotifs); fetchNotifications() }}
            style={{ width: "34px", height: "34px", backgroundColor: "#ffffff10", border: "1px solid #ffffff15", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", fontSize: "14px" }}>
            🔔
            {notifCount > 0 && (
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "16px", height: "16px", backgroundColor: "#ef4444", borderRadius: "50%", fontSize: "9px", fontWeight: "700", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, width: "300px", backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "10px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 200, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #334155" }}>
                <p style={{ margin: 0, color: "white", fontSize: "13px", fontWeight: "600" }}>Notifications ({notifCount})</p>
              </div>
              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {notifCount === 0 && <p style={{ padding: "20px", color: "#64748b", fontSize: "12px", margin: 0, textAlign: "center" }}>All clear!</p>}
                {notifications.map((n, i) => (
                  <div key={i} onClick={() => { navigate(n.link); setShowNotifs(false) }}
                    style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: "10px", borderBottom: "1px solid #ffffff08" }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#ffffff08"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <span style={{ fontSize: "14px", marginTop: "2px" }}>{n.icon}</span>
                    <div>
                      <p style={{ margin: 0, color: "white", fontSize: "12px", fontWeight: "500" }}>{n.text}</p>
                      {n.sub && <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "10px" }}>{n.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav Sections */}
      <div style={{ flex: 1, padding: "8px 0" }}>
        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: "4px" }}>
            {section.title && (
              <p style={{ color: "#64748b", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", padding: "12px 20px 4px", margin: 0 }}>
                {section.title}
              </p>
            )}
            {section.items.map(item => {
              const active = isActive(item)
              return (
                <button key={item.path} onClick={() => navigate(item.path)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "9px 20px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: active ? "600" : "400", color: active ? "white" : "#94a3b8", backgroundColor: active ? "#ffffff15" : "transparent", borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent", textAlign: "left", transition: "all 0.15s ease" }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = "#ffffff08"; e.currentTarget.style.color = "#cbd5e1" }}}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8" }}}>
                  <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* User Section */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #ffffff10" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "13px", fontWeight: "600" }}>
            {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <p style={{ margin: 0, color: "white", fontSize: "13px", fontWeight: "500" }}>
              {profile?.full_name?.split(" ")[0] || "User"}
            </p>
            <p style={{ margin: 0, color: "#64748b", fontSize: "11px", textTransform: "capitalize" }}>
              {profile?.role?.replace("_", " ") || ""}
            </p>
          </div>
        </div>
        <button onClick={handleSignOut}
          style={{ width: "100%", padding: "8px", backgroundColor: "transparent", border: "1px solid #475569", color: "#94a3b8", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#ffffff10"; e.currentTarget.style.color = "#cbd5e1" }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8" }}>
          Sign Out
        </button>
      </div>
    </nav>
  )
}
