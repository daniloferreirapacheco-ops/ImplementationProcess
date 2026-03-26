import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import NavBar from '../components/layout/NavBar'

const stageOptions = [
  { value: 'new', label: 'New' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'discovery_required', label: 'Discovery Required' },
  { value: 'discovery_in_progress', label: 'Discovery In Progress' },
  { value: 'ready_for_scope', label: 'Ready for Scope' },
  { value: 'scope_under_review', label: 'Scope Under Review' },
  { value: 'awaiting_approval', label: 'Awaiting Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'converted', label: 'Converted to Project' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'on_hold', label: 'On Hold' }
]

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

const urgencyColors = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f59e0b',
  critical: '#ef4444'
}

const complexityColors = {
  low: '#10b981',
  standard: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444'
}

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [opp, setOpp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stage, setStage] = useState('')
  const [discoveries, setDiscoveries] = useState([])
  const [scopes, setScopes] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchOpportunity()
  }, [id])

  const fetchOpportunity = async () => {
    const [{ data, error }, { data: discs }, { data: scs }, { data: projs }] = await Promise.all([
      supabase.from('opportunities').select('*, accounts(name)').eq('id', id).single(),
      supabase.from('discovery_records').select('id, status, complexity_score, created_at').eq('opportunity_id', id),
      supabase.from('scopes').select('id, name, approval_status, estimated_hours_min, estimated_hours_max, workstream_hours').eq('opportunity_id', id),
      supabase.from('projects').select('id, name, status, health').eq('opportunity_id', id)
    ])
    if (error) console.error(error)
    else {
      setOpp(data)
      setStage(data.stage)
    }
    setDiscoveries(discs || [])
    setScopes(scs || [])
    setProjects(projs || [])
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This action cannot be undone.')) return
    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (!error) navigate('/opportunities')
  }

  const updateStage = async (newStage) => {
    setSaving(true)
    const { error } = await supabase
      .from('opportunities')
      .update({ stage: newStage, updated_at: new Date() })
      .eq('id', id)
    if (!error) {
      setStage(newStage)
      setOpp(prev => ({ ...prev, stage: newStage }))
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Opportunities" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center',
          alignItems: 'center', height: 'calc(100vh - 64px)', color: '#64748b' }}>
          Loading...
        </div>
      </main>
    </div>
  )

  if (!opp) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Opportunities" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center',
          alignItems: 'center', height: 'calc(100vh - 64px)', color: '#64748b' }}>
          Opportunity not found
        </div>
      </main>
    </div>
  )
return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Opportunities" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>

        <button onClick={() => navigate('/opportunities')}
          style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
            fontSize: '14px', padding: 0, marginBottom: '16px' }}>
          ← Back to Opportunities
        </button>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                {opp.name}
              </h1>
              {opp.early_risk_indicators?.length > 0 && (
                <span style={{ fontSize: '24px' }}>⚠️</span>
              )}
            </div>
            <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>
              🏢 {opp.accounts?.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={stage}
              onChange={e => updateStage(e.target.value)}
              disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '14px',
                fontWeight: '600', border: `2px solid ${stageColors[stage] || '#94a3b8'}`,
                color: stageColors[stage] || '#94a3b8', backgroundColor: 'white',
                cursor: 'pointer' }}>
              {stageOptions.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              onClick={() => navigate(`/discovery/new?opportunity=${id}`)}
              style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none',
                padding: '10px 20px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: '600', fontSize: '14px' }}>
              🔍 Start Discovery
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>

          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Risk Alert */}
            {opp.early_risk_indicators?.length > 0 && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '16px',
                  fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚠️ Risk Flags Identified
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {opp.early_risk_indicators.map((risk, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ef4444', fontSize: '12px' }}>●</span>
                      <span style={{ color: '#dc2626', fontSize: '14px' }}>{risk}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Opportunity Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { label: 'Type', value: opp.opportunity_type?.replace(/_/g, ' ') },
                  { label: 'Urgency', value: opp.urgency, color: urgencyColors[opp.urgency] },
                  { label: 'Estimated Value', value: opp.estimated_value ? `$${Number(opp.estimated_value).toLocaleString()}` : 'Not set' },
                  { label: 'Complexity', value: opp.complexity_level, color: complexityColors[opp.complexity_level] },
                  { label: 'Target Close', value: opp.target_close_date ? new Date(opp.target_close_date).toLocaleDateString() : 'Not set' },
                  { label: 'Target Go-Live', value: opp.target_golive_date ? new Date(opp.target_golive_date).toLocaleDateString() : 'Not set' },
                  { label: 'Discovery Depth', value: opp.discovery_depth, color: opp.discovery_depth === 'deep' ? '#ef4444' : opp.discovery_depth === 'standard' ? '#f59e0b' : '#10b981' },
                  { label: 'Qualification Score', value: opp.qualification_score || 0 },
                ].map(item => (
                  <div key={item.label} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500', textTransform: 'uppercase' }}>
                      {item.label}
                    </p>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: '600',
                      color: item.color || '#1e293b', textTransform: 'capitalize' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Requested Modules */}
            {opp.requested_modules?.length > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px',
                padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                  Requested Modules ({opp.requested_modules.length})
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {opp.requested_modules.map((mod, i) => (
                    <span key={i} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8',
                      padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '500' }}>
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {opp.notes && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px',
                padding: '24px', border: '1px solid #e2e8f0' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 12px 0' }}>
                  Notes
                </h2>
                <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
                  {opp.notes}
                </p>
              </div>
            )}
            {/* Linked Records */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Delivery Pipeline
              </h2>

              {/* Discoveries */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Discoveries ({discoveries.length})
                  </span>
                  <button onClick={() => navigate(`/discovery/new?opportunity=${id}`)}
                    style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>+ New</button>
                </div>
                {discoveries.length > 0 ? discoveries.map(d => (
                  <div key={d.id} onClick={() => navigate(`/discovery/${d.id}`)}
                    style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#f8fafc',
                      marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#1e293b' }}>Discovery Record</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
                      backgroundColor: d.status === 'completed' ? '#dcfce7' : '#dbeafe',
                      color: d.status === 'completed' ? '#166534' : '#1e40af', textTransform: 'capitalize' }}>
                      {d.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                )) : <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No discoveries yet</p>}
              </div>

              {/* Scopes */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Scopes ({scopes.length})
                  </span>
                  <button onClick={() => navigate(`/scope/new?opportunity=${id}`)}
                    style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>+ New</button>
                </div>
                {scopes.length > 0 ? scopes.map(s => {
                  const ws = s.workstream_hours || {}
                  const totalH = Object.values(ws).reduce((a, b) => a + (Number(b) || 0), 0)
                  const sc = { draft: '#94a3b8', submitted: '#3b82f6', in_review: '#f59e0b', approved: '#10b981', rejected: '#ef4444', changes_required: '#f97316' }
                  return (
                    <div key={s.id} onClick={() => navigate(`/scope/${s.id}`)}
                      style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#f8fafc',
                        marginBottom: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{s.name}</span>
                        {totalH > 0 && <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '8px' }}>{totalH}h</span>}
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
                        backgroundColor: (sc[s.approval_status] || '#94a3b8') + '18',
                        color: sc[s.approval_status] || '#94a3b8', textTransform: 'capitalize' }}>
                        {s.approval_status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                }) : <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>No scopes yet</p>}
              </div>

              {/* Projects */}
              <div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Projects ({projects.length})
                </span>
                {projects.length > 0 ? projects.map(p => {
                  const hc = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', grey: '#94a3b8' }
                  return (
                    <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                      style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#f8fafc',
                        marginTop: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hc[p.health] || '#94a3b8' }} />
                        <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '500' }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'capitalize' }}>{p.status?.replace(/_/g, ' ')}</span>
                    </div>
                  )
                }) : <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0' }}>No projects yet</p>}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Score Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Qualification Score
              </h2>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%',
                  backgroundColor: opp.qualification_score >= 70 ? '#fee2e2' : opp.qualification_score >= 40 ? '#fef3c7' : '#dcfce7',
                  border: `6px solid ${opp.qualification_score >= 70 ? '#ef4444' : opp.qualification_score >= 40 ? '#f59e0b' : '#10b981'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <span style={{ fontSize: '28px', fontWeight: '700',
                    color: opp.qualification_score >= 70 ? '#ef4444' : opp.qualification_score >= 40 ? '#f59e0b' : '#10b981' }}>
                    {opp.qualification_score || 0}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                  backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Complexity</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize',
                    color: complexityColors[opp.complexity_level] || '#1e293b' }}>
                    {opp.complexity_level}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                  backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Discovery Depth</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize',
                    color: opp.discovery_depth === 'deep' ? '#ef4444' : opp.discovery_depth === 'standard' ? '#f59e0b' : '#10b981' }}>
                    {opp.discovery_depth}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px',
                  backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Risk Flags</span>
                  <span style={{ fontSize: '13px', fontWeight: '600',
                    color: opp.early_risk_indicators?.length > 3 ? '#ef4444' : opp.early_risk_indicators?.length > 0 ? '#f59e0b' : '#10b981' }}>
                    {opp.early_risk_indicators?.length || 0} identified
                  </span>
                </div>
              </div>
            </div>

            {/* Next Actions */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Next Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/discovery/new?opportunity=${id}`)}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#8b5cf6',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'left' }}>
                  🔍 Start Discovery Workspace
                </button>
                <button
                  onClick={() => updateStage('qualified')}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#3b82f6',
                    color: 'white', border: 'none', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'left' }}>
                  ✅ Mark as Qualified
                </button>
                <button
                  onClick={() => updateStage('on_hold')}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#f8fafc',
                    color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'left' }}>
                  ⏸ Put On Hold
                </button>
                <button
                  onClick={() => updateStage('closed_lost')}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#f8fafc',
                    color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'left' }}>
                  ✗ Close as Lost
                </button>
                <button
                  onClick={handleDelete}
                  style={{ width: '100%', padding: '12px', backgroundColor: '#fee2e2',
                    color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px',
                    cursor: 'pointer', fontWeight: '600', fontSize: '14px', textAlign: 'left', marginTop: '8px' }}>
                  🗑 Delete Opportunity
                </button>
              </div>
            </div>

            {/* Meta */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Record Info
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Created</span>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>
                    {new Date(opp.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Last Updated</span>
                  <span style={{ fontSize: '13px', color: '#1e293b' }}>
                    {new Date(opp.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>ID</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {opp.id.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
