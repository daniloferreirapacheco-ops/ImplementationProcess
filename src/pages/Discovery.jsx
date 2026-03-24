import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  in_progress: "#f59e0b", completed: "#10b981",
  blocked: "#ef4444", not_started: "#94a3b8"
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

export default function Discovery() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("discovery_records")
      .select("*, opportunities(name, accounts(name))")
      .order("created_at", { ascending: false })
    if (!error) setRecords(data || [])
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <NavBar current="Discovery" />
      <main style={{ marginLeft: "220px", flex: 1, padding: "20px 24px", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 2px 0" }}>
              Discovery Workspace
            </h1>
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{records.length} discovery records</p>
          </div>
          <button onClick={() => navigate("/discovery/new")}
            style={{ backgroundColor: "#8b5cf6", color: "white", border: "none",
              padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
              fontWeight: "600", fontSize: "13px" }}>
            + New Discovery
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No discovery records yet</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '30%' }}>Opportunity</th>
                  <th style={{ ...thStyle, width: '25%' }}>Account</th>
                  <th style={{ ...thStyle, width: '15%' }}>Status</th>
                  <th style={{ ...thStyle, width: '15%' }}>Created</th>
                  <th style={{ ...thStyle, width: '15%' }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id}
                    onClick={() => navigate(`/discovery/${rec.id}`)}
                    onMouseEnter={() => setHoveredRow(rec.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === rec.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>
                      {rec.opportunities?.name || 'Untitled Discovery'}
                    </td>
                    <td style={tdStyle}>{rec.opportunities?.accounts?.name || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (statusColors[rec.status] || '#94a3b8') + '18',
                        color: statusColors[rec.status] || '#94a3b8',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
                        fontWeight: '600', textTransform: 'capitalize' }}>
                        {rec.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={tdStyle}>
                      {rec.updated_at ? new Date(rec.updated_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {records.length} record{records.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
