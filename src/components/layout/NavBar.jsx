import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

const sections = [
  {
    title: null,
    items: [
      { label: "Dashboard", path: "/dashboard", icon: "⚡" },
    ]
  },
  {
    title: "CRM",
    items: [
      { label: "Customers", path: "/customers", icon: "🏢" },
      { label: "Contacts", path: "/contacts", icon: "👤" },
      { label: "Opportunities", path: "/opportunities", icon: "💼" },
    ]
  },
  {
    title: "Delivery",
    items: [
      { label: "Discovery", path: "/discovery", icon: "🔍" },
      { label: "Scope", path: "/scope", icon: "📋" },
      { label: "Projects", path: "/projects", icon: "📁" },
      { label: "Handoff", path: "/handoff", icon: "🤝" },
    ]
  },
  {
    title: "Operations",
    items: [
      { label: "Machines", path: "/machines", icon: "🖨️" },
      { label: "Products", path: "/products", icon: "📦" },
      { label: "Templates", path: "/templates", icon: "✅" },
      { label: "Time", path: "/time", icon: "⏱️" },
    ]
  },
  {
    title: "Insights",
    items: [
      { label: "Analytics", path: "/intelligence", icon: "📊" },
    ]
  }
]

export default function NavBar({ current }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  const isActive = (item) => {
    if (current === item.label) return true
    return location.pathname.startsWith(item.path)
  }

  return (
      <nav style={{
        width: "220px",
        minWidth: "220px",
        backgroundColor: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflowY: "auto"
      }}>
        {/* Logo */}
        <div onClick={() => navigate("/dashboard")}
          style={{
            padding: "20px 20px 16px",
            cursor: "pointer",
            borderBottom: "1px solid #ffffff10"
          }}>
          <span style={{ color: "white", fontWeight: "700", fontSize: "18px" }}>
            ⚡ Ecalc OS
          </span>
        </div>

        {/* Nav Sections */}
        <div style={{ flex: 1, padding: "8px 0" }}>
          {sections.map((section, si) => (
            <div key={si} style={{ marginBottom: "4px" }}>
              {section.title && (
                <p style={{
                  color: "#64748b",
                  fontSize: "10px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  padding: "12px 20px 4px",
                  margin: 0
                }}>
                  {section.title}
                </p>
              )}
              {section.items.map(item => {
                const active = isActive(item)
                return (
                  <button key={item.path} onClick={() => navigate(item.path)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "9px 20px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: active ? "600" : "400",
                      color: active ? "white" : "#94a3b8",
                      backgroundColor: active ? "#ffffff15" : "transparent",
                      borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
                      textAlign: "left",
                      transition: "all 0.15s ease"
                    }}
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = "#ffffff08"
                        e.currentTarget.style.color = "#cbd5e1"
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = "transparent"
                        e.currentTarget.style.color = "#94a3b8"
                      }
                    }}>
                    <span style={{ fontSize: "15px", width: "20px", textAlign: "center" }}>{item.icon}</span>
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* User Section */}
        <div style={{
          padding: "16px 20px",
          borderTop: "1px solid #ffffff10"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px"
          }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "13px",
              fontWeight: "600"
            }}>
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
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: "transparent",
              border: "1px solid #475569",
              color: "#94a3b8",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = "#ffffff10"
              e.currentTarget.style.color = "#cbd5e1"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = "transparent"
              e.currentTarget.style.color = "#94a3b8"
            }}>
            Sign Out
          </button>
        </div>
      </nav>
  )
}
