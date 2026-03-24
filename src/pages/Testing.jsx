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

const PER_PAGE = 25

export default function Testing() {
  const navigate = useNavigate()
  const [cycles, setCycles] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchCycles() }, [])

  const fetchCycles = async () => {
    const { data } = await supabase
      .from("test_cycles")
      .select("*, projects(name, accounts(name))")
      .order("created_at", { ascending: false })
    setCycles(data || [])
    setLoading(false)
  }

  const filtered = cycles.filter(c => {
    const matchesSearch = search === '' ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.projects?.name || '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || c.status === filter
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const exportCSV = () => {
    const headers = ['Cycle Name', 'Project', 'Status', 'Passed', 'Failed', 'Pass Rate']
    const rows = filtered.map(c => {
      const total = (c.pass_count || 0) + (c.fail_count || 0)
      const rate = total > 0 ? Math.round((c.pass_count / total) * 100) + '%' : '—'
      return [c.name, c.projects?.name || '', c.status || '', c.pass_count || 0, c.fail_count || 0, rate]
    })
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'test_cycles.csv'
    a.click()
    URL.revokeObjectURL(url)
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
            <p style={{ color: "#64748b", fontSize: '12px', margin: 0 }}>{filtered.length} of {cycles.length} test cycles</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={exportCSV}
              style={{ padding: '7px 16px', backgroundColor: '#f1f5f9', color: '#475569',
                border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500' }}>
              Export CSV
            </button>
            <button onClick={() => navigate("/testing/new")}
              style={{ backgroundColor: "#06b6d4", color: "white", border: "none",
                padding: "7px 16px", borderRadius: "4px", cursor: "pointer",
                fontWeight: "600", fontSize: "13px" }}>
              + New Test Cycle
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search cycles or projects..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px', width: '240px' }}
          />
          {['all', 'not_started', 'in_progress', 'passed', 'failed', 'blocked'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1) }}
              style={{
                padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: filter === s ? '#1a1a2e' : 'white',
                color: filter === s ? 'white' : '#475569'
              }}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
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
                {paginated.map(cycle => {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #e2e8f0' }}>
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
                backgroundColor: safePage <= 1 ? '#f1f5f9' : 'white', color: safePage <= 1 ? '#94a3b8' : '#475569',
                cursor: safePage <= 1 ? 'default' : 'pointer', fontSize: '12px' }}>
              Prev
            </button>
            <span style={{ fontSize: '12px' }}>Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
                backgroundColor: safePage >= totalPages ? '#f1f5f9' : 'white', color: safePage >= totalPages ? '#94a3b8' : '#475569',
                cursor: safePage >= totalPages ? 'default' : 'pointer', fontSize: '12px' }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
