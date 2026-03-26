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

const PER_PAGE = 25

export default function Scope() {
  const navigate = useNavigate()
  const [scopes, setScopes] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchScopes() }, [])

  const fetchScopes = async () => {
    const { data } = await supabase
      .from("scopes")
      .select("*")
      .order("created_at", { ascending: false })
    setScopes(data || [])
    setLoading(false)
  }

  const filtered = scopes.filter(scope => {
    const term = search.toLowerCase()
    if (search) {
      const name = (scope.name || scope.opportunities?.name || '').toLowerCase()
      const oppName = (scope.opportunities?.name || '').toLowerCase()
      const accName = (scope.opportunities?.accounts?.name || '').toLowerCase()
      if (!name.includes(term) && !oppName.includes(term) && !accName.includes(term)) return false
    }
    if (filter === 'all') return true
    return scope.approval_status === filter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const exportCSV = () => {
    const headers = ['Name', 'Account', 'Status', 'Hours Min', 'Hours Max', 'Confidence', 'Created']
    const rows = filtered.map(s => [
      s.name || s.opportunities?.name || 'Untitled Scope',
      s.opportunities?.accounts?.name || '',
      s.approval_status || '',
      s.estimated_hours_min || 0,
      s.estimated_hours_max || 0,
      s.confidence_score || 0,
      s.created_at ? new Date(s.created_at).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scopes.csv'
    a.click()
    URL.revokeObjectURL(url)
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
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{filtered.length} of {scopes.length} scope records</p>
          </div>
          <button onClick={() => navigate("/scope/new")}
            style={{ backgroundColor: "#3b82f6", color: "white", border: "none",
              padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
              fontWeight: "600", fontSize: "13px" }}>
            + New Scope
          </button>
        </div>

        {/* Summary Stats */}
        {scopes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total', value: scopes.length, color: '#1e293b' },
              { label: 'Draft', value: scopes.filter(s => s.approval_status === 'draft').length, color: '#94a3b8' },
              { label: 'Submitted', value: scopes.filter(s => ['submitted', 'in_review'].includes(s.approval_status)).length, color: '#3b82f6' },
              { label: 'Approved', value: scopes.filter(s => s.approval_status === 'approved').length, color: '#10b981' },
              { label: 'Avg Confidence', value: `${scopes.length > 0 ? Math.round(scopes.reduce((a, s) => a + (s.confidence_score || 0), 0) / scopes.length) : 0}%`, color: '#6366f1' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search scopes..."
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
              fontSize: '13px', width: '240px' }} />
          {['all', 'draft', 'submitted', 'in_review', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1) }}
              style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: filter === f ? '#1a1a2e' : 'white',
                color: filter === f ? 'white' : '#475569', textTransform: 'capitalize' }}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
          <button onClick={exportCSV}
            style={{ padding: '7px 16px', backgroundColor: '#f1f5f9', color: '#475569',
              border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '500', marginLeft: 'auto' }}>
            Export CSV
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
                {paginated.map(scope => (
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
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''} ({scopes.length} total)</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              style={{ padding: '2px 10px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px',
                cursor: safePage <= 1 ? 'default' : 'pointer', backgroundColor: 'white', color: safePage <= 1 ? '#cbd5e1' : '#475569' }}>
              Prev
            </button>
            <span>Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              style={{ padding: '2px 10px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px',
                cursor: safePage >= totalPages ? 'default' : 'pointer', backgroundColor: 'white', color: safePage >= totalPages ? '#cbd5e1' : '#475569' }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
