import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

export default function Discovery() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("discovery_records")
      .select("*, opportunities(name, accounts(name))")
      .order("created_at", { ascending: false })
    if (!error) setRecords(data || [])
    setLoading(false)
  }

  const statusColors = {
    in_progress: "#f59e0b", completed: "#10b981",
    blocked: "#ef4444", not_started: "#94a3b8"
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Discovery" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              Discovery Workspace
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>{records.length} discovery records</p>
          </div>
          <button onClick={() => navigate("/discovery/new")}
            style={{ backgroundColor: "#8b5cf6", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px" }}>
            + New Discovery
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🔍</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>No discovery records yet</p>
            <button onClick={() => navigate("/discovery/new")}
              style={{ backgroundColor: "#8b5cf6", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Start First Discovery
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {records.map(rec => (
              <div key={rec.id} onClick={() => navigate(`/discovery/${rec.id}`)}
                style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                    {rec.opportunities?.name || "Untitled Discovery"}
                  </h3>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>
                    🏢 {rec.opportunities?.accounts?.name || "No account"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ backgroundColor: (statusColors[rec.status] || "#94a3b8") + "20",
                    color: statusColors[rec.status] || "#94a3b8", padding: "4px 12px",
                    borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" }}>
                    {rec.status?.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
