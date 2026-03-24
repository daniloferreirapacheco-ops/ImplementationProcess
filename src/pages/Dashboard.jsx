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
    { title: "Pending Approvals", value: "0", icon: "✅", color: "#6366f1", link: "/approvals" },
    { title: "Active Projects", value: "0", icon: "📁", color: "#3b82f6", link: "/projects" },
    { title: "Open Opportunities", value: "0", icon: "💼", color: "#f59e0b", link: "/opportunities" },
    { title: "Pending Handoffs", value: "0", icon: "🤝", color: "#ef4444", link: "/handoff" },
    { title: "Projects At Risk", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Team Capacity", value: "0%", icon: "👥", color: "#10b981", link: "/capacity" },
  ],
  leadership: [
    { title: "Portfolio Health", value: "Good", icon: "📊", color: "#8b5cf6", link: "/projects" },
    { title: "Active Projects", value: "0", icon: "📁", color: "#3b82f6", link: "/projects" },
    { title: "Projects At Risk", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Pending Approvals", value: "0", icon: "✅", color: "#6366f1", link: "/approvals" },
    { title: "Estimate Accuracy", value: "0%", icon: "🎯", color: "#10b981", link: "/analytics" },
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
    { title: "Scopes Pending Approval", value: "0", icon: "✅", color: "#6366f1", link: "/approvals" },
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
    { title: "Technical Reviews Due", value: "0", icon: "🔬", color: "#06b6d4", link: "/approvals" },
    { title: "Advanced Requests", value: "0", icon: "⚙️", color: "#6366f1", link: "/opportunities" },
    { title: "Integration Reviews", value: "0", icon: "🔗", color: "#3b82f6", link: "/projects" },
    { title: "Custom Logic Pending", value: "0", icon: "💡", color: "#f59e0b", link: "/approvals" },
    { title: "Open Technical Risks", value: "0", icon: "⚠️", color: "#dc2626", link: "/projects" },
    { title: "Pending Sign-offs", value: "0", icon: "✅", color: "#10b981", link: "/testing" },
  ]
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const role = profile?.role || "consultant"
  const roleColor = roleColors[role] || "#6366f1"
  const roleLabel = roleLabels[role] || "User"
  const userWidgets = widgets[role] || widgets.consultant

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Dashboard" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0" }}>
            Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "16px" }}>
            Here is your {roleLabel} overview for today
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px", marginBottom: "40px" }}>
          {userWidgets.map((widget, index) => (
            <div key={index} onClick={() => navigate(widget.link)}
              style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)", cursor: "pointer",
                border: "1px solid #e2e8f0", borderLeft: `4px solid ${widget.color}` }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)"
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0", fontWeight: "500" }}>
                    {widget.title}
                  </p>
                  <p style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                    {widget.value}
                  </p>
                </div>
                <span style={{ fontSize: "32px" }}>{widget.icon}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "white", borderRadius: "12px", padding: "24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1e293b", margin: "0 0 16px 0" }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {(role === "sales" || role === "admin") && (
              <button onClick={() => navigate("/opportunities/new")}
                style={{ backgroundColor: "#f59e0b", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                  fontWeight: "600", fontSize: "14px" }}>
                + New Opportunity
              </button>
            )}
            {(role === "project_manager" || role === "admin") && (
              <button onClick={() => navigate("/projects/new")}
                style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                  fontWeight: "600", fontSize: "14px" }}>
                + New Project
              </button>
            )}
            {role === "admin" && (
              <button onClick={() => navigate("/admin/users")}
                style={{ backgroundColor: "#6366f1", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                  fontWeight: "600", fontSize: "14px" }}>
                👥 Manage Users
              </button>
            )}
            {(role === "consultant" || role === "admin") && (
              <button onClick={() => navigate("/discovery/new")}
                style={{ backgroundColor: "#10b981", color: "white", border: "none",
                  padding: "10px 20px", borderRadius: "6px", cursor: "pointer",
                  fontWeight: "600", fontSize: "14px" }}>
                + New Discovery
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
