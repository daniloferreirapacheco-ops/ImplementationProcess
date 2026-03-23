import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  not_started: "#94a3b8", in_progress: "#3b82f6",
  passed: "#10b981", failed: "#ef4444", blocked: "#f97316"
}

export default function Testing() {
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchCycles() }, [])

  const fetchCycles = async () => {
    const { data } = await supabase
      .from("test_cycles")
      .select("*, projects(name, accounts(name))")
      .order("created_at", { ascending: false })
    setCycles(data || [])
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Testing" />
      <div style={{ padding: "32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0" }}>
              Testing Center
            </h1>
            <p style={{ color: "#64748b", margin: 0 }}>{cycles.length} test cycles</p>
          </div>
          <button onClick={() => navigate("/testing/new")}
            style={{ backgroundColor: "#06b6d4", color: "white", border: "none",
              padding: "12px 24px", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px" }}>
            + New Test Cycle
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : cycles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", backgroundColor: "white",
            borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <p style={{ fontSize: "48px", margin: "0 0 16px 0" }}>🧪</p>
            <p style={{ color: "#64748b", fontSize: "18px", margin: "0 0 24px 0" }}>No test cycles yet</p>
            <button onClick={() => navigate("/testing/new")}
              style={{ backgroundColor: "#06b6d4", color: "white", border: "none",
                padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
              Create First Test Cycle
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {cycles.map(cycle => {
              const total = (cycle.pass_count || 0) + (cycle.fail_count || 0)
              const passRate = total > 0 ? Math.round((cycle.pass_count / total) * 100) : 0
              return (
                <div key={cycle.id} onClick={() => navigate(`/testing/${cycle.id}`)}
                  style={{ backgroundColor: "white", borderRadius: "12px", padding: "20px 24px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0",
                    cursor: "pointer", display: "flex", justifyContent: "space-between",
                    alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#1e293b" }}>
                      {cycle.name}
                    </h3>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <span style={{ color: "#64748b", fontSize: "14px" }}>
                        📁 {cycle.projects?.name || "No project"}
                      </span>
                      <span style={{ color: "#10b981", fontSize: "14px", fontWeight: "600" }}>
                        ✓ {cycle.pass_count || 0} passed
                      </span>
                      <span style={{ color: "#ef4444", fontSize: "14px", fontWeight: "600" }}>
                        ✗ {cycle.fail_count || 0} failed
                      </span>
                      {total > 0 && (
                        <span style={{ color: "#64748b", fontSize: "14px" }}>
                          {passRate}% pass rate
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ backgroundColor: (statusColors[cycle.status] || "#94a3b8") + "20",
                      color: statusColors[cycle.status] || "#94a3b8", padding: "4px 12px",
                      borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                      textTransform: "capitalize" }}>
                      {cycle.status?.replace(/_/g, " ")}
                    </span>
                    <span style={{ color: "#94a3b8" }}>→</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
