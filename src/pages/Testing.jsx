import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  not_started: "#94a3b8", in_progress: "#3b82f6",
  passed: "#10b981", failed: "#ef4444", blocked: "#f97316"
}

const thStyle = {
  padding: '6px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600',
  color: '#64748b', borderBottom: '2px solid #d1d5db', backgroundColor: '#f1f5f9',
  position: 'sticky', top: 0, whiteSpace: 'nowrap', textTransform: 'uppercase',
  letterSpacing: '0.5px', userSelect: 'none'
}

const tdStyle = {
  padding: '5px 12px', fontSize: '13px', color: '#1e293b',
  borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden',
  textOverflow: 'ellipsis', maxWidth: '300px'
}

export default function Testing() {
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)

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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Testing" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "20px 24px", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 2px 0" }}>
              Testing Center
            </h1>
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{cycles.length} test cycles</p>
          </div>
          <button onClick={() => navigate("/testing/new")}
            style={{ backgroundColor: "#06b6d4", color: "white", border: "none",
              padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
              fontWeight: "600", fontSize: "13px" }}>
            + New Test Cycle
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : cycles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No test cycles yet</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '28%' }}>Cycle Name</th>
                  <th style={{ ...thStyle, width: '22%' }}>Project</th>
                  <th style={{ ...thStyle, width: '14%' }}>Status</th>
                  <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>Passed</th>
                  <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>Failed</th>
                  <th style={{ ...thStyle, width: '10%', textAlign: 'right' }}>Pass Rate</th>
                  <th style={{ ...thStyle, width: '6%' }}></th>
                </tr>
              </thead>
              <tbody>
                {cycles.map(cycle => {
                  const total = (cycle.pass_count || 0) + (cycle.fail_count || 0)
                  const passRate = total > 0 ? Math.round((cycle.pass_count / total) * 100) : 0
                  return (
                    <tr key={cycle.id}
                      onClick={() => navigate(`/testing/${cycle.id}`)}
                      onMouseEnter={() => setHoveredRow(cycle.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: hoveredRow === cycle.id ? '#eff6ff' : 'white'
                      }}>
                      <td style={{ ...tdStyle, fontWeight: '500' }}>{cycle.name}</td>
                      <td style={tdStyle}>{cycle.projects?.name || '—'}</td>
                      <td style={tdStyle}>
                        <span style={{
                          backgroundColor: (statusColors[cycle.status] || '#94a3b8') + '18',
                          color: statusColors[cycle.status] || '#94a3b8',
                          padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
                          fontWeight: '600', textTransform: 'capitalize' }}>
                          {cycle.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#10b981', fontWeight: '600' }}>
                        {cycle.pass_count || 0}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#ef4444', fontWeight: '600' }}>
                        {cycle.fail_count || 0}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {total > 0 ? `${passRate}%` : '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8' }}>→</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {cycles.length} record{cycles.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
