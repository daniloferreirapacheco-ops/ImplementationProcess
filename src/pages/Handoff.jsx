import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  not_started: "#94a3b8", in_preparation: "#f59e0b",
  awaiting_review: "#3b82f6", approved: "#10b981", completed: "#6366f1"
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

export default function Handoff() {
  const navigate = useNavigate()
  const [handoffs, setHandoffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)

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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Handoff" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "20px 24px", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 2px 0" }}>
              Support Handoff
            </h1>
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{handoffs.length} handoff packages</p>
          </div>
          <button onClick={() => navigate("/handoff/new")}
            style={{ backgroundColor: "#14b8a6", color: "white", border: "none",
              padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
              fontWeight: "600", fontSize: "13px" }}>
            + New Handoff Package
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : handoffs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No handoff packages yet</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '28%' }}>Project</th>
                  <th style={{ ...thStyle, width: '22%' }}>Account</th>
                  <th style={{ ...thStyle, width: '18%' }}>Status</th>
                  <th style={{ ...thStyle, width: '16%' }}>Created</th>
                  <th style={{ ...thStyle, width: '16%' }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {handoffs.map(h => (
                  <tr key={h.id}
                    onClick={() => navigate(`/handoff/${h.id}`)}
                    onMouseEnter={() => setHoveredRow(h.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === h.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>
                      {h.projects?.name || 'Untitled Handoff'}
                    </td>
                    <td style={tdStyle}>{h.projects?.accounts?.name || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (statusColors[h.approval_status] || '#94a3b8') + '18',
                        color: statusColors[h.approval_status] || '#94a3b8',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
                        fontWeight: '600', textTransform: 'capitalize' }}>
                        {h.approval_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      {h.updated_at ? new Date(h.updated_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {handoffs.length} record{handoffs.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
