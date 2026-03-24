import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

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
  low: '#10b981', normal: '#3b82f6', high: '#f59e0b', critical: '#ef4444'
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

export default function Opportunities() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [hoveredRow, setHoveredRow] = useState(null)

  useEffect(() => { fetchOpportunities() }, [])

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*, accounts(name)')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    else setOpportunities(data || [])
    setLoading(false)
  }

  const filtered = opportunities.filter(o => {
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
          <button onClick={() => navigate('/opportunities/new')}
            style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none',
              padding: '7px 16px', borderRadius: '4px', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px' }}>
            + New Opportunity
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'at_risk', label: 'At Risk' },
            { key: 'discovery_required', label: 'Needs Discovery' },
            { key: 'awaiting_approval', label: 'Awaiting Approval' },
            { key: 'approved', label: 'Approved' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: filter === f.key ? '#1a1a2e' : 'white',
                color: filter === f.key ? 'white' : '#475569' }}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No opportunities found</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '24%' }}>Name</th>
                  <th style={{ ...thStyle, width: '18%' }}>Account</th>
                  <th style={{ ...thStyle, width: '16%' }}>Stage</th>
                  <th style={{ ...thStyle, width: '10%' }}>Urgency</th>
                  <th style={{ ...thStyle, width: '12%' }}>Value</th>
                  <th style={{ ...thStyle, width: '12%' }}>Go-Live</th>
                  <th style={{ ...thStyle, width: '8%' }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(opp => (
                  <tr key={opp.id}
                    onClick={() => navigate(`/opportunities/${opp.id}`)}
                    onMouseEnter={() => setHoveredRow(opp.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === opp.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{opp.name}</td>
                    <td style={tdStyle}>{opp.accounts?.name || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (stageColors[opp.stage] || '#94a3b8') + '18',
                        color: stageColors[opp.stage] || '#94a3b8',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>
                        {stageLabels[opp.stage] || opp.stage}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (urgencyColors[opp.urgency] || '#94a3b8') + '18',
                        color: urgencyColors[opp.urgency] || '#94a3b8',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px',
                        fontWeight: '600', textTransform: 'capitalize' }}>
                        {opp.urgency || '—'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {opp.estimated_value ? `$${Number(opp.estimated_value).toLocaleString()}` : '—'}
                    </td>
                    <td style={tdStyle}>
                      {opp.target_golive_date ? new Date(opp.target_golive_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      {opp.early_risk_indicators?.length > 0 ? '⚠' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} ({opportunities.length} total)
        </div>
      </main>
    </div>
  )
}
