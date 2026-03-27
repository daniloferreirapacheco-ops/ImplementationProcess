import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabase"
import NavBar from "../components/layout/NavBar"
import SearchInput from "../components/SearchInput"
import LoadingSkeleton from "../components/LoadingSkeleton"

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

const PER_PAGE = 25
const statusFilters = ['all', 'not_started', 'in_preparation', 'awaiting_review', 'approved', 'completed']

export default function Handoff() {
  const navigate = useNavigate()
  const [handoffs, setHandoffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchHandoffs() }, [])

  const fetchHandoffs = async () => {
    let { data, error } = await supabase
      .from("handoff_packages")
      .select("*, projects(name, accounts(name))")
      .order("created_at", { ascending: false })
    if (error || !data) {
      const res = await supabase.from("handoff_packages").select("*, projects(name)").order("created_at", { ascending: false })
      data = res.data; error = res.error
    }
    if (error || !data) {
      const res = await supabase.from("handoff_packages").select("*").order("created_at", { ascending: false })
      data = res.data
    }
    setHandoffs(data || [])
    setLoading(false)
  }

  const filtered = handoffs.filter(h => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (h.projects?.name || '').toLowerCase().includes(q) ||
      (h.projects?.accounts?.name || '').toLowerCase().includes(q)
    const matchesFilter = filter === 'all' || h.approval_status === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const exportCSV = () => {
    const headers = ['Project', 'Account', 'Status', 'Created', 'Updated']
    const rows = filtered.map(h => [
      h.projects?.name || '',
      h.projects?.accounts?.name || '',
      h.approval_status?.replace(/_/g, ' ') || '',
      h.created_at ? new Date(h.created_at).toLocaleDateString() : '',
      h.updated_at ? new Date(h.updated_at).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'handoff_packages.csv'
    a.click()
    URL.revokeObjectURL(url)
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
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{filtered.length} of {handoffs.length} handoff packages</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => {
              const headers = ['Project', 'Status', 'Created']
              const rows = filtered.map(h => [h.projects?.name, h.approval_status, h.created_at ? new Date(h.created_at).toLocaleDateString() : ''].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
              const csv = [headers.join(','), ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'handoffs.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
              style={{ padding: '7px 16px', backgroundColor: '#f1f5f9', color: '#475569',
                border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500' }}>
              Export CSV
            </button>
            <button onClick={() => navigate("/handoff/new")}
              style={{ backgroundColor: "#14b8a6", color: "white", border: "none",
                padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
                fontWeight: "600", fontSize: "13px" }}>
              + New Handoff Package
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {handoffs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total', value: handoffs.length, color: '#1e293b' },
              { label: 'In Preparation', value: handoffs.filter(h => ['not_started', 'in_preparation'].includes(h.approval_status)).length, color: '#f59e0b' },
              { label: 'Awaiting Review', value: handoffs.filter(h => h.approval_status === 'awaiting_review').length, color: '#3b82f6' },
              { label: 'Completed', value: handoffs.filter(h => ['approved', 'completed'].includes(h.approval_status)).length, color: '#10b981' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search project or account..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', width: '240px' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            {statusFilters.map(s => (
              <button key={s} onClick={() => { setFilter(s); setPage(1) }}
                style={{
                  padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
                  cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                  backgroundColor: filter === s ? '#1a1a2e' : 'white',
                  color: filter === s ? 'white' : '#475569',
                  textTransform: 'capitalize'
                }}>
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : handoffs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 40px", backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>🤝</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px' }}>No handoff packages yet</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>Create a handoff package when a project is ready for support transition.</p>
            <button onClick={() => navigate('/handoff/new')}
              style={{ padding: '10px 24px', backgroundColor: '#14b8a6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              + New Handoff
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>No matching handoff packages. Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
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
                {paged.map(h => (
                  <tr key={h.id}
                    onClick={() => navigate(`/handoff/${h.id}`)}
                    onMouseEnter={() => setHoveredRow(h.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === h.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>
                      {h.project_id ? (
                        <span onClick={(e) => { e.stopPropagation(); navigate(`/projects/${h.project_id}`) }}
                          style={{ color: '#3b82f6', cursor: 'pointer' }}>
                          {h.projects?.name || 'View Project'}
                        </span>
                      ) : 'Untitled Handoff'}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
          <button onClick={exportCSV}
            style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
              cursor: 'pointer', fontSize: '12px', fontWeight: '500',
              backgroundColor: 'white', color: '#475569' }}>
            Export CSV
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
                cursor: safePage <= 1 ? 'default' : 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: 'white', color: safePage <= 1 ? '#cbd5e1' : '#475569' }}>
              Prev
            </button>
            <span style={{ fontSize: '12px' }}>Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
                cursor: safePage >= totalPages ? 'default' : 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: 'white', color: safePage >= totalPages ? '#cbd5e1' : '#475569' }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
