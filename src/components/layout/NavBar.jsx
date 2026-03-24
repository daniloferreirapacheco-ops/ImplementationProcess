import { useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function NavBar({ current }) {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "⚡" },
    { label: "Opportunities", path: "/opportunities", icon: "💼" },
    { label: "Discovery", path: "/discovery", icon: "🔍" },
    { label: "Scope", path: "/scope", icon: "📋" },
    { label: "Projects", path: "/projects", icon: "📁" },
    { label: "Testing", path: "/testing", icon: "🧪" },
    { label: "Handoff", path: "/handoff", icon: "🤝" },
    { label: "Analytics", path: "/intelligence", icon: "📊" },
    { label: "Machines", path: "/machines", icon: "🖨️" },
    { label: "Products", path: "/products", icon: "📦" },
    { label: "Templates", path: "/templates", icon: "✅" },
    { label: "Time", path: "/time", icon: "⏱️" },
  ]

  return (
    <div style={{ backgroundColor: "#1a1a2e", padding: "0 24px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: "64px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span onClick={() => navigate("/dashboard")}
          style={{ color: "white", fontWeight: "700", fontSize: "16px",
            cursor: "pointer", marginRight: "12px", whiteSpace: "nowrap" }}>
          ⚡ Ecalc OS
        </span>
        {navItems.map(item => (
          <button key={item.path} onClick={() => navigate(item.path)}
            style={{ backgroundColor: current === item.label ? "#ffffff20" : "transparent",
              border: "none", color: current === item.label ? "white" : "#94a3b8",
              padding: "6px 10px", borderRadius: "6px", cursor: "pointer",
              fontSize: "12px", fontWeight: current === item.label ? "600" : "400",
              display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ color: "#94a3b8", fontSize: "13px" }}>
          {profile?.full_name?.split(" ")[0]}
        </span>
        <button onClick={handleSignOut}
          style={{ backgroundColor: "transparent", border: "1px solid #475569",
            color: "#94a3b8", padding: "5px 12px", borderRadius: "4px",
            cursor: "pointer", fontSize: "13px" }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}
