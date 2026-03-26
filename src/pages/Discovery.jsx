import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"

const PER_PAGE = 25

const statusColors = {
  in_progress: "#f59e0b", completed: "#10b981",
  blocked: "#ef4444", not_started: "#94a3b8"
}

const statusLabels = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'not_started', label: 'Not Started' }
]

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
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchRecords() }, [])

  const fetchRecords = async () => {
    const { data, error } = await supabase
      .from("discovery_records")
      .select("*, opportunities(name, accounts(name))")
      .order("created_at", { ascending: false })
    if (!error) setRecords(data || [])
    setLoading(false)
  }

  const filtered = records.filter(rec => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (rec.opportunities?.name || '').toLowerCase().includes(q) ||
      (rec.opportunities?.accounts?.name || '').toLowerCase().includes(q)
    const matchesFilter = filter === 'all' || rec.status === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const exportCSV = () => {
    const headers = ['Opportunity', 'Account', 'Status', 'Created', 'Updated']
    const rows = filtered.map(rec => [
      rec.opportunities?.name || '',
      rec.opportunities?.accounts?.name || '',
      rec.status?.replace(/_/g, ' ') || '',
      rec.created_at ? new Date(rec.created_at).toLocaleDateString() : '',
      rec.updated_at ? new Date(rec.updated_at).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'discovery_records.csv'
    link.click()
    URL.revokeObjectURL(url)
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
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{filtered.length} of {records.length} discovery records</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportCSV}
              style={{ backgroundColor: 'white', color: '#475569', border: '1px solid #d1d5db',
                padding: '7px 16px', borderRadius: '4px', cursor: 'pointer',
                fontWeight: '600', fontSize: '13px' }}>
              Export CSV
            </button>
            <button onClick={() => navigate("/discovery/new")}
              style={{ backgroundColor: "#8b5cf6", color: "white", border: "none",
                padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
                fontWeight: "600", fontSize: "13px" }}>
              + New Discovery
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search opportunity or account..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '240px' }}
          />
          {statusLabels.map(s => (
            <button key={s.key}
              onClick={() => { setFilter(s.key); setPage(1) }}
              style={{
                padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: filter === s.key ? '#1a1a2e' : 'white',
                color: filter === s.key ? 'white' : '#475569'
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>Loading...</div>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 40px", backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>🔍</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px' }}>{records.length === 0 ? 'No discovery records yet' : 'No matching records'}</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>{records.length === 0 ? 'Start a discovery from an opportunity to begin the implementation process.' : 'Try adjusting your search or filters.'}</p>
            {records.length === 0 && (
              <button onClick={() => navigate('/discovery/new')}
                style={{ padding: '10px 24px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                + New Discovery
              </button>
            )}
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
                {paginated.map(rec => (
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
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px', cursor: safePage <= 1 ? 'default' : 'pointer', backgroundColor: safePage <= 1 ? '#f1f5f9' : 'white', color: safePage <= 1 ? '#94a3b8' : '#475569' }}>
              Prev
            </button>
            <span>Page {safePage} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px', cursor: safePage >= totalPages ? 'default' : 'pointer', backgroundColor: safePage >= totalPages ? '#f1f5f9' : 'white', color: safePage >= totalPages ? '#94a3b8' : '#475569' }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
