import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'
import SearchInput from "../components/SearchInput"
import LoadingSkeleton from "../components/LoadingSkeleton"

const stageColors = {
  new: '#94a3b8', qualified: '#3b82f6', discovery_required: '#f59e0b',
  discovery_in_progress: '#8b5cf6', ready_for_scope: '#06b6d4',
  scope_under_review: '#f97316', awaiting_approval: '#ec4899',
  approved: '#10b981', rejected: '#ef4444', converted: '#1d4ed8',
  closed_lost: '#6b7280', on_hold: '#78716c'
}

const stageLabels = {
  new: 'New', qualified: 'Qualified', discovery_required: 'Discovery Required',
  discovery_in_progress: 'Discovery In Progress', ready_for_scope: 'Ready for Scope',
  scope_under_review: 'Scope Under Review', awaiting_approval: 'Awaiting Approval',
  approved: 'Approved', rejected: 'Rejected', converted: 'Converted',
  closed_lost: 'Closed Lost', on_hold: 'On Hold'
}

const urgencyColors = {
  low: '#10b981', medium: '#3b82f6', high: '#f59e0b', critical: '#ef4444'
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

export default function Opportunities() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)
  const [page, setPage] = useState(1)

  useEffect(() => { fetchOpportunities() }, [])

  const fetchOpportunities = async () => {
    let { data, error } = await supabase
      .from('opportunities')
      .select('*, accounts(name)')
      .order('created_at', { ascending: false })
    if (error || !data) {
      const res = await supabase.from('opportunities').select('*').order('created_at', { ascending: false })
      data = res.data
    }
    setOpportunities(data || [])
    setLoading(false)
  }

  const filtered = opportunities.filter(o => {
    if (search) {
      const term = search.toLowerCase()
      const name = (o.name || '').toLowerCase()
      const accName = (o.accounts?.name || '').toLowerCase()
      if (!name.includes(term) && !accName.includes(term)) return false
    }
    if (filter === 'all') return true
    if (filter === 'active') return !['closed_lost', 'converted', 'rejected'].includes(o.stage)
    if (filter === 'at_risk') return o.early_risk_indicators?.length > 0
    return o.stage === filter
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Opportunities" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Opportunities
            </h1>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              {filtered.length} of {opportunities.length} opportunities
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => {
              const headers = ['Name', 'Account', 'Stage', 'Urgency', 'Value', 'Go-Live Date', 'Risk']
              const rows = filtered.map(o => [o.name, o.accounts?.name, stageLabels[o.stage] || o.stage, o.urgency, o.estimated_value ? `$${Number(o.estimated_value).toLocaleString()}` : '', o.target_golive_date || '', o.early_risk_indicators?.length > 0 ? 'Yes' : 'No'].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
              const csv = [headers.join(','), ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a'); link.href = url; link.download = 'opportunities.csv'; link.click()
              URL.revokeObjectURL(url)
            }}
              style={{ padding: '7px 16px', backgroundColor: '#f1f5f9', color: '#475569',
                border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500' }}>
              Export CSV
            </button>
            <button onClick={() => navigate('/opportunities/new')}
              style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none',
                padding: '7px 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600', fontSize: '13px' }}>
              + New Opportunity
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {opportunities.length > 0 && (() => {
          const totalValue = opportunities.reduce((s, o) => s + (Number(o.estimated_value) || 0), 0)
          const openOpps = opportunities.filter(o => !['closed_lost', 'converted'].includes(o.stage))
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Total Pipeline', value: opportunities.length, color: '#1e293b' },
                { label: 'Open', value: openOpps.length, color: '#3b82f6' },
                { label: 'Pipeline Value', value: `$${Math.round(totalValue / 1000)}K`, color: '#10b981' },
                { label: 'Converted', value: opportunities.filter(o => o.stage === 'converted').length, color: '#6366f1' },
                { label: 'Lost', value: opportunities.filter(o => o.stage === 'closed_lost').length, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                  <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          )
        })()}

        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search opportunities..."
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '13px', width: '240px' }} />
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'at_risk', label: 'At Risk' },
            { key: 'discovery_required', label: 'Needs Discovery' },
            { key: 'awaiting_approval', label: 'Awaiting Approval' },
            { key: 'approved', label: 'Approved' },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1) }}
              style={{ padding: '4px 12px', borderRadius: '8px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: filter === f.key ? '#1a1a2e' : 'white',
                color: filter === f.key ? 'white' : '#475569' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 40px", backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "linear-gradient(135deg, #f59e0b, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px" }}>💼</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px' }}>No opportunities found</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>Start building your pipeline by creating an opportunity.</p>
            <button onClick={() => navigate('/opportunities/new')}
              style={{ padding: '10px 24px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              + New Opportunity
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '30%' }}>Opportunity</th>
                  <th style={{ ...thStyle, width: '16%' }}>Stage</th>
                  <th style={{ ...thStyle, width: '10%' }}>Urgency</th>
                  <th style={{ ...thStyle, width: '12%' }}>Value</th>
                  <th style={{ ...thStyle, width: '12%' }}>Go-Live</th>
                  <th style={{ ...thStyle, width: '8%' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(opp => (
                  <tr key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    onMouseEnter={() => setHoveredRow(opp.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === opp.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#1e293b' }}>
                      {opp.name}
                      {opp.accounts?.name && <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', color: '#94a3b8' }}>{opp.accounts.name}</span>}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (stageColors[opp.stage] || '#94a3b8') + '15',
                        color: stageColors[opp.stage] || '#94a3b8',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        border: `1px solid ${(stageColors[opp.stage] || '#94a3b8')}30` }}>
                        {stageLabels[opp.stage] || opp.stage}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (urgencyColors[opp.urgency] || '#94a3b8') + '15',
                        color: urgencyColors[opp.urgency] || '#94a3b8',
                        padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                        fontWeight: '600', textTransform: 'capitalize',
                        border: `1px solid ${(urgencyColors[opp.urgency] || '#94a3b8')}30` }}>
                        {opp.urgency || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: opp.estimated_value ? '600' : '400', color: opp.estimated_value ? '#10b981' : '#cbd5e1' }}>
                      {opp.estimated_value ? `$${Number(opp.estimated_value).toLocaleString()}` : '—'}
                    </td>
                    <td style={tdStyle}>
                      {opp.target_golive_date ? new Date(opp.target_golive_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {(() => {
                        const flags = []
                        if (opp.early_risk_indicators?.length > 0) flags.push({ icon: '⚠️', color: '#ef4444', title: `${opp.early_risk_indicators.length} risk flag${opp.early_risk_indicators.length > 1 ? 's' : ''}` })
                        if (opp.target_close_date) {
                          const days = Math.ceil((new Date(opp.target_close_date) - new Date()) / 86400000)
                          if (days < 0) flags.push({ icon: '🔴', color: '#ef4444', title: 'Past close date' })
                          else if (days <= 14) flags.push({ icon: '🟡', color: '#f59e0b', title: `${days}d to close` })
                        }
                        return flags.length > 0 ? flags.map((f, i) => <span key={i} title={f.title} style={{ cursor: 'help' }}>{f.icon}</span>) : '—'
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''} ({opportunities.length} total)</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px', cursor: page <= 1 ? 'default' : 'pointer', backgroundColor: 'white', color: page <= 1 ? '#cbd5e1' : '#475569' }}>
              Prev
            </button>
            <span>Page {page} of {Math.max(1, Math.ceil(filtered.length / PER_PAGE))}</span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PER_PAGE), p + 1))} disabled={page >= Math.ceil(filtered.length / PER_PAGE)}
              style={{ padding: '2px 8px', fontSize: '11px', border: '1px solid #d1d5db', borderRadius: '3px', cursor: page >= Math.ceil(filtered.length / PER_PAGE) ? 'default' : 'pointer', backgroundColor: 'white', color: page >= Math.ceil(filtered.length / PER_PAGE) ? '#cbd5e1' : '#475569' }}>
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
