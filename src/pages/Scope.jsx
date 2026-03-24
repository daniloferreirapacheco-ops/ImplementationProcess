import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  draft: "#94a3b8", submitted: "#3b82f6", in_review: "#f59e0b",
  changes_required: "#f97316", approved: "#10b981", rejected: "#ef4444"
}

export default function Scope() {
  const navigate = useNavigate()
  const [scopes, setScopes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchScopes() }, [])

  const fetchScopes = async () => {
    const { data } = await supabase
      .from("scope_baselines")
      .select("*, opportunities(name, accounts(name))")
      .order("created_at", { ascending: false })
    setScopes(data || [])
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Scope" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              Scope Builder
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>{scopes.length} scope records</p>
          </div>
          <button onClick={() => navigate("/scope/new")}
            style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px" }}>
            + New Scope
          </button>
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : scopes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>📋</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>No scopes yet</p>
            <button onClick={() => navigate("/scope/new")}
              style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Create First Scope
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {scopes.map(scope => (
              <div key={scope.id} onClick={() => navigate(`/scope/${scope.id}`)}
                style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px 24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                    {scope.name || scope.opportunities?.name || "Untitled Scope"}
                  </h3>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      🏢 {scope.opportunities?.accounts?.name || "No account"}
                    </span>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      ⏱ {scope.estimated_hours_min || 0}–{scope.estimated_hours_max || 0} hrs
                    </span>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      🎯 Confidence: {scope.confidence_score || 0}%
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ backgroundColor: (statusColors[scope.approval_status] || "#94a3b8") + "20",
                    color: statusColors[scope.approval_status] || "#94a3b8",
                    padding: "4px 12px", borderRadius: "20px", fontSize: "12px",
                    fontWeight: "600", textTransform: "capitalize" }}>
                    {scope.approval_status?.replace(/_/g, " ")}
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
