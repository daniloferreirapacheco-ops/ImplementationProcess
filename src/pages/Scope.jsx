import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const statusColors = {
  draft: "#94a3b8", submitted: "#3b82f6", in_review: "#f59e0b",
  changes_required: "#f97316", approved: "#10b981", rejected: "#ef4444"
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

export default function Scope() {
  const navigate = useNavigate()
  const [scopes, setScopes] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)

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
      <main style={{ marginLeft: "220px", flex: 1, padding: "20px 24px", display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: "12px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: "0 0 2px 0" }}>
              Scope Builder
            </h1>
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{scopes.length} scope records</p>
          </div>
          <button onClick={() => navigate("/scope/new")}
            style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
              padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
              fontWeight: "600", fontSize: "13px" }}>
            + New Scope
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : scopes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No scopes yet</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '25%' }}>Name</th>
                  <th style={{ ...thStyle, width: '20%' }}>Account</th>
                  <th style={{ ...thStyle, width: '15%' }}>Status</th>
                  <th style={{ ...thStyle, width: '15%', textAlign: 'right' }}>Hours (Min-Max)</th>
                  <th style={{ ...thStyle, width: '12%', textAlign: 'right' }}>Confidence</th>
                  <th style={{ ...thStyle, width: '13%' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {scopes.map(scope => (
                  <tr key={scope.id}
                    onClick={() => navigate(`/scope/${scope.id}`)}
                    onMouseEnter={() => setHoveredRow(scope.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === scope.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>
                      {scope.name || scope.opportunities?.name || 'Untitled Scope'}
                    </td>
                    <td style={tdStyle}>{scope.opportunities?.accounts?.name || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (statusColors[scope.approval_status] || '#94a3b8') + '18',
                        color: statusColors[scope.approval_status] || '#94a3b8',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
                        fontWeight: '600', textTransform: 'capitalize' }}>
                        {scope.approval_status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {scope.estimated_hours_min || 0}–{scope.estimated_hours_max || 0}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>
                      {scope.confidence_score || 0}%
                    </td>
                    <td style={tdStyle}>
                      {scope.created_at ? new Date(scope.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {scopes.length} record{scopes.length !== 1 ? 's' : ''}
        </div>
      </main>
    </div>
  )
}
