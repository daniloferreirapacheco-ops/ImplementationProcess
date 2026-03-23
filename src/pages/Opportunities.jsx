import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'

const stageColors = {
  new: '#94a3b8',
  qualified: '#3b82f6',
  discovery_required: '#f59e0b',
  discovery_in_progress: '#8b5cf6',
  ready_for_scope: '#06b6d4',
  scope_under_review: '#f97316',
  awaiting_approval: '#ec4899',
  approved: '#10b981',
  rejected: '#ef4444',
  converted: '#1d4ed8',
  closed_lost: '#6b7280',
  on_hold: '#78716c'
}

const stageLabels = {
  new: 'New',
  qualified: 'Qualified',
  discovery_required: 'Discovery Required',
  discovery_in_progress: 'Discovery In Progress',
  ready_for_scope: 'Ready for Scope',
  scope_under_review: 'Scope Under Review',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  converted: 'Converted to Project',
  closed_lost: 'Closed Lost',
  on_hold: 'On Hold'
}

const urgencyColors = {
  low: '#10b981',
  normal: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444'
}

export default function Opportunities() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        *,
        accounts(name)
      `)
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* Nav Bar */}
      <div style={{
        backgroundColor: '#1a1a2e',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span
            onClick={() => navigate('/dashboard')}
            style={{ color: 'white', fontWeight: '700', fontSize: '18px', cursor: 'pointer' }}
          >
            ⚡ Ecalc Delivery OS
          </span>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>/ Opportunities</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            color: '#94a3b8',
            padding: '6px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Dashboard
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '32px' }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Opportunities
            </h1>
            <p style={{ color: '#64748b', margin: 0 }}>
              {opportunities.length} total opportunities
            </p>
          </div>
          <button
            onClick={() => navigate('/opportunities/new')}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            + New Opportunity
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'at_risk', label: '⚠️ At Risk' },
            { key: 'discovery_required', label: 'Needs Discovery' },
            { key: 'awaiting_approval', label: 'Awaiting Approval' },
            { key: 'approved', label: 'Approved' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                backgroundColor: filter === f.key ? '#1a1a2e' : '#e2e8f0',
                color: filter === f.key ? 'white' : '#475569'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Opportunities List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            Loading opportunities...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>💼</p>
            <p style={{ color: '#64748b', fontSize: '18px', margin: '0 0 24px 0' }}>
              No opportunities found
            </p>
            <button
              onClick={() => navigate('/opportunities/new')}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Create First Opportunity
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(opp => (
              <div
                key={opp.id}
                onClick={() => navigate(`/opportunities/${opp.id}`)}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {opp.name}
                    </h3>
                    {opp.early_risk_indicators?.length > 0 && (
                      <span style={{ fontSize: '16px' }}>⚠️</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '14px' }}>
                      🏢 {opp.accounts?.name || 'No account'}
                    </span>
                    {opp.target_golive_date && (
                      <span style={{ color: '#64748b', fontSize: '14px' }}>
                        📅 Go-live: {new Date(opp.target_golive_date).toLocaleDateString()}
                      </span>
                    )}
                    {opp.estimated_value && (
                      <span style={{ color: '#64748b', fontSize: '14px' }}>
                        💰 ${Number(opp.estimated_value).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    backgroundColor: urgencyColors[opp.urgency] + '20',
                    color: urgencyColors[opp.urgency],
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    {opp.urgency}
                  </span>
                  <span style={{
                    backgroundColor: (stageColors[opp.stage] || '#94a3b8') + '20',
                    color: stageColors[opp.stage] || '#94a3b8',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {stageLabels[opp.stage] || opp.stage}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '18px' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
