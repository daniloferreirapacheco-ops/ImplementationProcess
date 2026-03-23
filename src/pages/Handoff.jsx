import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  not_started: "#94a3b8", in_preparation: "#f59e0b",
  awaiting_review: "#3b82f6", approved: "#10b981", completed: "#6366f1"
}

export default function Handoff() {
  const navigate = useNavigate()
  const [handoffs, setHandoffs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchHandoffs() }, [])

  const fetchHandoffs = async () => {
    const { data } = await supabase
      .from("handoff_packages")
      .select("*, projects(name, accounts(name))")
      .order("created_at", { ascending: false })
    setHandoffs(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <div style={{ padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              Support Handoff
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>{handoffs.length} handoff packages</p>
          </div>
          <button onClick={() => navigate("/handoff/new")}
            style={{ backgroundColor: "#14b8a6", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px" }}>
            + New Handoff Package
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : handoffs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🤝</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>
              No handoff packages yet
            </p>
            <button onClick={() => navigate("/handoff/new")}
              style={{ backgroundColor: "#14b8a6", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Create First Handoff
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {handoffs.map(h => (
              <div key={h.id} onClick={() => navigate(`/handoff/${h.id}`)}
                style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                    {h.projects?.name || "Untitled Handoff"}
                  </h3>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>
                    🏢 {h.projects?.accounts?.name || "No account"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ backgroundColor: (statusColors[h.approval_status] || "#94a3b8") + "20",
                    color: statusColors[h.approval_status] || "#94a3b8",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
                    fontWeight: "600", textTransform: "capitalize" }}>
                    {h.approval_status?.replace(/_/g, " ")}
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
