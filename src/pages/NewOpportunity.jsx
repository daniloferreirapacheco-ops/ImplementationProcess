import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

const riskFlags = [
  'Aggressive timeline',
  'Advanced XML or integration request',
  'No defined customer process owner',
  'Multi-site rollout',
  'Undefined custom reporting',
  'Pilot and full rollout in same phase',
  'Low customer maturity',
  'No sample data available',
  'Multiple currencies required',
  'Unknown legacy system'
]

const modules = [
  'iQuote / Estimating',
  'Job Entry',
  'Scheduling',
  'Shop Floor / Production',
  'Prepress',
  'Shipping',
  'Fulfillment',
  'Purchasing / Inventory',
  'Job Costing',
  'Accounts Receivable',
  'Accounts Payable',
  'General Ledger',
  'Mailing',
  'PrintFlow',
  'PrintStream',
  'eCRM',
  'Auto-Count',
  'Process Shipper',
  'DSF'
]

export default function NewOpportunity() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({
    account_id: '',
    name: '',
    opportunity_type: 'new_implementation',
    urgency: 'medium',
    estimated_value: '',
    target_close_date: '',
    target_golive_date: '',
    notes: '',
    selectedModules: [],
    selectedRisks: []
  })

  useEffect(() => {
    const loadAccounts = async () => {
      const { data } = await supabase.from('accounts').select('id, name').order('name')
      setAccounts(data || [])
    }
    loadAccounts()
  }, [])

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const toggleModule = (mod) => {
    setForm(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(mod)
        ? prev.selectedModules.filter(m => m !== mod)
        : [...prev.selectedModules, mod]
    }))
  }

  const toggleRisk = (risk) => {
    setForm(prev => ({
      ...prev,
      selectedRisks: prev.selectedRisks.includes(risk)
        ? prev.selectedRisks.filter(r => r !== risk)
        : [...prev.selectedRisks, risk]
    }))
  }

  const calculateScore = () => {
    let score = 0
    if (form.urgency === 'critical') score += 30
    else if (form.urgency === 'high') score += 20
    score += form.selectedRisks.length * 10
    score += form.selectedModules.length * 2
    return Math.min(score, 100)
  }

  const getComplexity = (score) => {
    if (score >= 70) return 'high'
    if (score >= 40) return 'medium'
    return 'standard'
  }

  const getDiscoveryDepth = (score) => {
    if (score >= 70) return 'deep'
    if (score >= 40) return 'standard'
    return 'light'
  }

  const handleSubmit = async () => {
    if (!form.account_id || !form.name) {
      setError('Customer and opportunity name are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const score = calculateScore()
      const { data, error: oppError } = await supabase
        .from('opportunities')
        .insert({
          account_id: form.account_id,
          name: form.name,
          opportunity_type: form.opportunity_type,
          urgency: form.urgency,
          estimated_value: form.estimated_value || null,
          target_close_date: form.target_close_date || null,
          target_golive_date: form.target_golive_date || null,
          requested_modules: form.selectedModules,
          early_risk_indicators: form.selectedRisks,
          notes: form.notes,
          qualification_score: score,
          complexity_level: getComplexity(score),
          discovery_depth: getDiscoveryDepth(score),
          sales_owner_id: profile?.id,
          created_by: profile?.id
        })
        .select()
        .single()
      if (oppError) throw oppError
      navigate(`/opportunities/${data.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const score = calculateScore()
  const complexity = getComplexity(score)
  const discoveryDepth = getDiscoveryDepth(score)
return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Opportunities" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>

          <div>
            <button onClick={() => navigate('/opportunities')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
                fontSize: '14px', padding: 0, marginBottom: '16px' }}>
              ← Back to Opportunities
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px 0' }}>
              New Opportunity
            </h1>
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626',
                padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Basic Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px',
                    fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                    Customer *
                  </label>
                  <select value={form.account_id}
                    onChange={e => updateForm('account_id', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="">— Select a customer —</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                {[
                  { label: 'Opportunity Name *', field: 'name', placeholder: 'e.g. Acme - Full Monarch Implementation', type: 'text' },
                  { label: 'Estimated Value ($)', field: 'estimated_value', placeholder: 'e.g. 50000', type: 'number' },
                  { label: 'Target Close Date', field: 'target_close_date', placeholder: '', type: 'date' },
                  { label: 'Target Go-Live Date', field: 'target_golive_date', placeholder: '', type: 'date' },
                ].map(item => (
                  <div key={item.field}>
                    <label style={{ display: 'block', marginBottom: '6px',
                      fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                      {item.label}
                    </label>
                    <input
                      type={item.type}
                      value={form[item.field]}
                      onChange={e => updateForm(item.field, e.target.value)}
                      placeholder={item.placeholder}
                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                        borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px',
                    fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                    Opportunity Type
                  </label>
                  <select value={form.opportunity_type}
                    onChange={e => updateForm('opportunity_type', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="new_implementation">New Implementation</option>
                    <option value="expansion">Expansion / Add-on</option>
                    <option value="upgrade">Version Upgrade</option>
                    <option value="migration">Data Migration</option>
                    <option value="integration">Integration Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px',
                    fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                    Urgency
                  </label>
                  <select value={form.urgency}
                    onChange={e => updateForm('urgency', e.target.value)}
                    style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                      borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                   	<option value="low">Low</option>
		   	<option value="medium">Medium</option>
			<option value="high">High</option>
			<option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modules */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Requested Modules
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {modules.map(mod => (
                  <div key={mod} onClick={() => toggleModule(mod)}
                    style={{ padding: '10px 12px', borderRadius: '6px',
                      border: `2px solid ${form.selectedModules.includes(mod) ? '#3b82f6' : '#e2e8f0'}`,
                      backgroundColor: form.selectedModules.includes(mod) ? '#eff6ff' : 'white',
                      cursor: 'pointer', fontSize: '13px',
                      fontWeight: form.selectedModules.includes(mod) ? '600' : '400',
                      color: form.selectedModules.includes(mod) ? '#1d4ed8' : '#475569' }}>
                    {form.selectedModules.includes(mod) ? '✓ ' : ''}{mod}
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Flags */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                Risk Flags
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 16px 0' }}>
                Select any known risk indicators
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {riskFlags.map(risk => (
                  <div key={risk} onClick={() => toggleRisk(risk)}
                    style={{ padding: '12px 16px', borderRadius: '6px',
                      border: `2px solid ${form.selectedRisks.includes(risk) ? '#ef4444' : '#e2e8f0'}`,
                      backgroundColor: form.selectedRisks.includes(risk) ? '#fef2f2' : 'white',
                      cursor: 'pointer', fontSize: '14px',
                      color: form.selectedRisks.includes(risk) ? '#dc2626' : '#475569',
                      display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{form.selectedRisks.includes(risk) ? '⚠️' : '○'}</span>
                    {risk}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Notes
              </h2>
              <textarea value={form.notes}
                onChange={e => updateForm('notes', e.target.value)}
                placeholder="Any additional context..."
                rows={4}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                  borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', padding: '14px', backgroundColor: '#f59e0b',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating...' : 'Create Opportunity'}
            </button>
          </div>

          {/* Score Panel */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '24px', border: '1px solid #e2e8f0', position: 'sticky', top: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Qualification Score
              </h2>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%',
                  backgroundColor: score >= 70 ? '#fee2e2' : score >= 40 ? '#fef3c7' : '#dcfce7',
                  border: `6px solid ${score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                  <span style={{ fontSize: '32px', fontWeight: '700',
                    color: score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#10b981' }}>
                    {score}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    COMPLEXITY
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700',
                    color: complexity === 'high' ? '#ef4444' : complexity === 'medium' ? '#f59e0b' : '#10b981',
                    textTransform: 'capitalize' }}>
                    {complexity}
                  </p>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    DISCOVERY DEPTH
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700',
                    color: discoveryDepth === 'deep' ? '#ef4444' : discoveryDepth === 'standard' ? '#f59e0b' : '#10b981',
                    textTransform: 'capitalize' }}>
                    {discoveryDepth}
                  </p>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    RISK FLAGS
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700',
                    color: form.selectedRisks.length > 3 ? '#ef4444' : form.selectedRisks.length > 0 ? '#f59e0b' : '#10b981' }}>
                    {form.selectedRisks.length} identified
                  </p>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    MODULES
                  </p>
                  <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                    {form.selectedModules.length} selected
                  </p>
                </div>
              </div>
              {form.selectedRisks.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px',
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '700', color: '#dc2626' }}>
                    ⚠️ ACTIVE RISK FLAGS
                  </p>
                  {form.selectedRisks.map(risk => (
                    <p key={risk} style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#dc2626' }}>
                      • {risk}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}