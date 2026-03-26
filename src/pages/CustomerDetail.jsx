import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

export default function CustomerDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [account, setAccount] = useState(null)
  const [contacts, setContacts] = useState([])
  const [opportunities, setOpportunities] = useState([])
  const [projects, setProjects] = useState([])
  const [customerMachines, setCustomerMachines] = useState([])
  const [customerProducts, setCustomerProducts] = useState([])
  const [allMachines, setAllMachines] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [tab, setTab] = useState('overview')
  const [discoveries, setDiscoveries] = useState([])
  const [scopes, setScopes] = useState([])
  const [handoffs, setHandoffs] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [accountRes, contactsRes, oppsRes, projRes, amRes, apRes, machinesRes, productsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('account_id', id).order('name'),
      supabase.from('opportunities').select('id, name, stage, created_at, account_id').eq('account_id', id).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('account_id', id).order('created_at', { ascending: false }),
      supabase.from('account_machines').select('*, machines(*)').eq('account_id', id),
      supabase.from('account_products').select('*, products(*)').eq('account_id', id),
      supabase.from('machines').select('*').eq('active', true).order('machine_type, name'),
      supabase.from('products').select('*').order('category, name')
    ])
    if (accountRes.data) {
      setAccount(accountRes.data)
      setForm(accountRes.data)
    }
    setContacts(contactsRes.data || [])
    setOpportunities(oppsRes.data || [])
    setProjects(projRes.data || [])
    setCustomerMachines((amRes.data || []).map(am => am.machines).filter(Boolean))
    setCustomerProducts((apRes.data || []).map(ap => ap.products).filter(Boolean))
    setAllMachines(machinesRes.data || [])
    setAllProducts(productsRes.data || [])

    // Load discoveries, scopes, and handoffs via opportunity IDs
    const oppIds = (oppsRes.data || []).map(o => o.id)
    if (oppIds.length > 0) {
      const [discRes, scopeRes, handoffRes] = await Promise.all([
        supabase.from('discovery_records').select('*, opportunities(name)').in('opportunity_id', oppIds).order('created_at', { ascending: false }),
        supabase.from('scopes').select('*, opportunities(name)').in('opportunity_id', oppIds).order('created_at', { ascending: false }),
        supabase.from('handoff_packages').select('*').in('project_id', (projRes.data || []).map(p => p.id)).order('created_at', { ascending: false })
      ])
      setDiscoveries(discRes.data || [])
      setScopes(scopeRes.data || [])
      setHandoffs(handoffRes.data || [])
    }

    setLoading(false)
  }

  const addMachine = async (machineId) => {
    const { error } = await supabase.from('account_machines').insert({ account_id: id, machine_id: machineId })
    if (!error) loadData()
  }

  const removeMachine = async (machineId) => {
    const { error } = await supabase.from('account_machines').delete()
      .eq('account_id', id).eq('machine_id', machineId)
    if (!error) loadData()
  }

  const addProduct = async (productId) => {
    const { error } = await supabase.from('account_products').insert({ account_id: id, product_id: productId })
    if (!error) loadData()
  }

  const removeProduct = async (productId) => {
    const { error } = await supabase.from('account_products').delete()
      .eq('account_id', id).eq('product_id', productId)
    if (!error) loadData()
  }

  const handleSave = async () => {
    const { error } = await supabase.from('accounts').update({
      name: form.name,
      industry: form.industry,
      website: form.website,
      phone: form.phone,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      notes: form.notes,
      status: form.status
    }).eq('id', id)
    if (!error) {
      setAccount({ ...account, ...form })
      setEditing(false)
    }
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return
    const { error } = await supabase.from('accounts').delete().eq('id', id)
    if (!error) navigate('/customers')
  }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Customers" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        <p style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</p>
      </main>
    </div>
  )

  if (!account) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Customers" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        <p style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Customer not found</p>
      </main>
    </div>
  )

  const fieldStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500',
    fontSize: '14px', color: '#374151' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Customers" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/customers")} style={{ color: "#94a3b8", cursor: "pointer" }}>Customers</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>{account.name}</span>
        </div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              🏢 {account.name}
            </h1>
            {account.industry && <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px' }}>{account.industry} {account.city ? `· ${account.city}, ${account.state || ''}` : ''}</p>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)}
                  style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Edit
                </button>
                <button onClick={handleDelete}
                  style={{ padding: '10px 20px', backgroundColor: '#fee2e2', color: '#dc2626',
                    border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(false); setForm(account) }}
                  style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  Cancel
                </button>
                <button onClick={handleSave}
                  style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
          {[
            { key: 'overview', label: 'Overview', count: null },
            { key: 'pipeline', label: 'Delivery Pipeline', count: null },
            { key: 'contacts', label: 'Contacts', count: contacts.length },
            { key: 'opportunities', label: 'Opportunities', count: opportunities.length },
            { key: 'discoveries', label: 'Discoveries', count: discoveries.length },
            { key: 'projects', label: 'Projects', count: projects.length },
            { key: 'machines', label: 'Machines', count: customerMachines.length },
            { key: 'products', label: 'Products', count: customerProducts.length }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px',
                fontWeight: tab === t.key ? '600' : '400',
                color: tab === t.key ? '#3b82f6' : '#64748b',
                backgroundColor: 'transparent',
                borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent' }}>
              {t.label} {t.count !== null ? `(${t.count})` : ''}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <>
            {editing ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px' }}>Edit Customer Details</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={labelStyle}>Company Name *</label><input value={form.name || ''} onChange={e => updateForm('name', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>Industry</label><input value={form.industry || ''} onChange={e => updateForm('industry', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>Website</label><input value={form.website || ''} onChange={e => updateForm('website', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>Phone</label><input value={form.phone || ''} onChange={e => updateForm('phone', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>Address</label><input value={form.address || ''} onChange={e => updateForm('address', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>City</label><input value={form.city || ''} onChange={e => updateForm('city', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>State</label><input value={form.state || ''} onChange={e => updateForm('state', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>ZIP</label><input value={form.zip || ''} onChange={e => updateForm('zip', e.target.value)} style={fieldStyle} /></div>
                  <div><label style={labelStyle}>Status</label><select value={form.status || 'active'} onChange={e => updateForm('status', e.target.value)} style={fieldStyle}><option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label><textarea value={form.notes || ''} onChange={e => updateForm('notes', e.target.value)} rows={3} style={{ ...fieldStyle, resize: 'vertical' }} /></div>
                </div>
              </div>
            ) : (
              <>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[
                    { label: 'Contacts', value: contacts.length, color: '#8b5cf6', icon: '👤' },
                    { label: 'Opportunities', value: opportunities.length, color: '#3b82f6', icon: '💼' },
                    { label: 'Projects', value: projects.length, color: '#f59e0b', icon: '📁' },
                    { label: 'Machines', value: customerMachines.length, color: '#06b6d4', icon: '🖨️' },
                    { label: 'Products', value: customerProducts.length, color: '#10b981', icon: '📦' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <span style={{ fontSize: '20px' }}>{s.icon}</span>
                      <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: '4px 0 2px' }}>{s.value}</p>
                      <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Company Info Card */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Company Information
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { label: 'Industry', value: account.industry, icon: '🏭' },
                        { label: 'Phone', value: account.phone, icon: '📞' },
                        { label: 'Website', value: account.website, icon: '🌐' },
                        { label: 'Address', value: [account.address, account.city, account.state, account.zip].filter(Boolean).join(', '), icon: '📍' },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ fontSize: '14px', marginTop: '1px' }}>{f.icon}</span>
                          <div>
                            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '14px', color: f.value ? '#1e293b' : '#cbd5e1', fontWeight: '500' }}>
                              {f.label === 'Website' && f.value ? <span style={{ color: '#3b82f6', cursor: 'pointer' }}>{f.value}</span> : (f.value || 'Not set')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status & Activity Card */}
                  <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px' }}>Status & Activity</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: (account.status === 'active' ? '#f0fdf4' : account.status === 'prospect' ? '#eff6ff' : '#f8fafc'), borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Status</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: account.status === 'active' ? '#10b981' : account.status === 'prospect' ? '#3b82f6' : '#94a3b8', textTransform: 'capitalize' }}>{account.status || 'prospect'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Customer Since</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{account.created_at ? new Date(account.created_at).toLocaleDateString() : '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Active Projects</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: projects.filter(p => p.status !== 'closed').length > 0 ? '#3b82f6' : '#94a3b8' }}>{projects.filter(p => p.status !== 'closed').length}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Open Opportunities</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: opportunities.filter(o => o.stage !== 'closed_lost' && o.stage !== 'converted').length > 0 ? '#f59e0b' : '#94a3b8' }}>{opportunities.filter(o => o.stage !== 'closed_lost' && o.stage !== 'converted').length}</span>
                      </div>
                    </div>

                    {account.notes && (
                      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fffbeb', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                        <p style={{ margin: 0, fontSize: '11px', color: '#92400e', fontWeight: '600', marginBottom: '4px' }}>NOTES</p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>{account.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => navigate(`/opportunities/new?account_id=${id}`)}
                    style={{ padding: '10px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    + New Opportunity
                  </button>
                  <button onClick={() => navigate(`/contacts/new?account_id=${id}`)}
                    style={{ padding: '10px 18px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                    + Add Contact
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Pipeline Tab */}
        {tab === 'pipeline' && (
          <div>
            {/* Pipeline Progress Steps */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
              border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 20px 0' }}>
                Delivery Overview
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[
                  { label: 'Opportunities', count: opportunities.length, color: '#3b82f6', icon: '1' },
                  { label: 'Discoveries', count: discoveries.length, color: '#8b5cf6', icon: '2' },
                  { label: 'Scopes', count: scopes.length, color: '#06b6d4', icon: '3' },
                  { label: 'Projects', count: projects.length, color: '#f59e0b', icon: '4' },
                  { label: 'Handoffs', count: handoffs.length, color: '#10b981', icon: '5' },
                ].map((step, i) => (
                  <div key={step.label} style={{ textAlign: 'center', padding: '16px 8px',
                    backgroundColor: step.count > 0 ? step.color + '10' : '#f8fafc',
                    borderRadius: '10px', border: `1px solid ${step.count > 0 ? step.color + '30' : '#e2e8f0'}` }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%',
                      backgroundColor: step.count > 0 ? step.color : '#e2e8f0',
                      color: step.count > 0 ? 'white' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 8px', fontSize: '14px', fontWeight: '700' }}>
                      {step.icon}
                    </div>
                    <p style={{ margin: '0 0 2px 0', fontSize: '22px', fontWeight: '700',
                      color: step.count > 0 ? step.color : '#94a3b8' }}>
                      {step.count}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Opportunities with their pipeline */}
            {opportunities.map(opp => {
              const oppDiscs = discoveries.filter(d => d.opportunity_id === opp.id)
              const oppScopes = scopes.filter(s => s.opportunity_id === opp.id)
              const oppProjects = projects.filter(p => p.opportunity_id === opp.id)
              const stageColor = {
                new: '#94a3b8', qualified: '#3b82f6', discovery_required: '#f59e0b',
                discovery_in_progress: '#8b5cf6', ready_for_scope: '#06b6d4',
                scope_under_review: '#f97316', awaiting_approval: '#ec4899',
                approved: '#10b981', converted: '#1d4ed8', closed_lost: '#6b7280'
              }
              return (
                <div key={opp.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                  padding: '20px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h3 onClick={() => navigate(`/opportunities/${opp.id}`)}
                        style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e293b',
                          cursor: 'pointer' }}>
                        {opp.name}
                      </h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
                        backgroundColor: (stageColor[opp.stage] || '#94a3b8') + '18',
                        color: stageColor[opp.stage] || '#94a3b8', textTransform: 'capitalize' }}>
                        {opp.stage?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(opp.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {oppDiscs.map(d => (
                      <div key={d.id} onClick={() => navigate(`/discovery/${d.id}`)}
                        style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#f5f3ff',
                          border: '1px solid #ddd6fe', cursor: 'pointer', fontSize: '12px' }}>
                        <span style={{ color: '#7c3aed', fontWeight: '600' }}>Discovery</span>
                        <span style={{ color: '#a78bfa', marginLeft: '6px', textTransform: 'capitalize' }}>
                          {d.status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                    {oppScopes.map(s => (
                      <div key={s.id} onClick={() => navigate(`/scope/${s.id}`)}
                        style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#ecfeff',
                          border: '1px solid #a5f3fc', cursor: 'pointer', fontSize: '12px' }}>
                        <span style={{ color: '#0891b2', fontWeight: '600' }}>Scope:</span>
                        <span style={{ color: '#06b6d4', marginLeft: '4px' }}>{s.name}</span>
                        <span style={{ color: '#67e8f9', marginLeft: '6px', textTransform: 'capitalize' }}>
                          {s.approval_status?.replace(/_/g, ' ')}
                        </span>
                      </div>
                    ))}
                    {oppProjects.map(p => {
                      const hc = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', grey: '#94a3b8' }
                      return (
                        <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                          style={{ padding: '6px 12px', borderRadius: '6px', backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: '12px',
                            display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: hc[p.health] || '#94a3b8' }} />
                          <span style={{ color: '#1d4ed8', fontWeight: '600' }}>Project:</span>
                          <span style={{ color: '#3b82f6' }}>{p.name}</span>
                        </div>
                      )
                    })}
                    {oppDiscs.length === 0 && oppScopes.length === 0 && oppProjects.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#94a3b8', padding: '6px 0' }}>
                        No delivery records yet
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {opportunities.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '14px', margin: 0 }}>No opportunities yet — create one to start the delivery pipeline</p>
              </div>
            )}
          </div>
        )}

        {/* Discoveries Tab */}
        {tab === 'discoveries' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => navigate(`/discovery/new?account_id=${id}`)}
                style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                + New Discovery
              </button>
            </div>
            {discoveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: '0 0 8px 0' }}>No discoveries for this customer</p>
                <p style={{ fontSize: '13px', margin: 0 }}>Start a discovery from an opportunity</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {discoveries.map(d => {
                  const sc = { in_progress: '#f59e0b', completed: '#10b981', blocked: '#ef4444', not_started: '#94a3b8' }
                  return (
                    <div key={d.id} onClick={() => navigate(`/discovery/${d.id}`)}
                      style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px',
                        border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                          {d.opportunities?.name || 'Discovery Record'}
                        </h3>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#64748b' }}>
                          {d.complexity_score > 0 && <span>Complexity: {d.complexity_score}</span>}
                          <span>Created: {new Date(d.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '10px', fontWeight: '600',
                        backgroundColor: (sc[d.status] || '#94a3b8') + '18',
                        color: sc[d.status] || '#94a3b8', textTransform: 'capitalize' }}>
                        {d.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Contacts Tab */}
        {tab === 'contacts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button onClick={() => navigate(`/contacts/new?account_id=${id}`)}
                style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                + Add Contact
              </button>
            </div>
            {contacts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '36px', margin: '0 0 8px 0' }}>👤</p>
                <p>No contacts yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.map(c => (
                  <div key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
                    style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px',
                      border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {c.name}
                      </h3>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                        {c.title && <span>{c.title}</span>}
                        {c.email && <span>{c.email}</span>}
                        {c.phone && <span>{c.phone}</span>}
                      </div>
                    </div>
                    <span style={{ color: '#94a3b8' }}>→</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {tab === 'opportunities' && (() => {
          const stageColor = {
            new: '#94a3b8', qualified: '#3b82f6', discovery_required: '#f59e0b',
            discovery_in_progress: '#8b5cf6', ready_for_scope: '#06b6d4',
            scope_under_review: '#f97316', awaiting_approval: '#ec4899',
            approved: '#10b981', converted: '#1d4ed8', closed_lost: '#6b7280'
          }
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                <button onClick={() => navigate(`/opportunities/new?account_id=${id}`)}
                  style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  + New Opportunity
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {opportunities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                    backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p>No opportunities for this customer</p>
                  </div>
                ) : opportunities.map(o => (
                  <div key={o.id} onClick={() => navigate(`/opportunities/${o.id}`)}
                    style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px',
                      border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex',
                      justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {o.name}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Created: {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '10px', fontWeight: '600',
                      backgroundColor: (stageColor[o.stage] || '#94a3b8') + '18',
                      color: stageColor[o.stage] || '#94a3b8', textTransform: 'capitalize' }}>
                      {o.stage?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Projects Tab */}
        {tab === 'projects' && (() => {
          const hc = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', grey: '#94a3b8' }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p>No projects for this customer</p>
                </div>
              ) : projects.map(p => (
                <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px',
                    border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%',
                      backgroundColor: hc[p.health] || '#94a3b8' }} />
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                        {p.name}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Created: {new Date(p.created_at).toLocaleDateString()}
                        {p.golive_date && ` | Go-Live: ${new Date(p.golive_date).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '10px', fontWeight: '600',
                    color: '#64748b', backgroundColor: '#f1f5f9', textTransform: 'capitalize' }}>
                    {p.status?.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}

        {/* Machines Tab */}
        {tab === 'machines' && (() => {
          const assignedIds = new Set(customerMachines.map(m => m.id))
          const available = allMachines.filter(m => !assignedIds.has(m.id))
          const complexityColor = (l) => l === 'high' ? '#dc2626' : l === 'medium' ? '#d97706' : '#16a34a'
          const complexityBg = (l) => l === 'high' ? '#fee2e2' : l === 'medium' ? '#fef3c7' : '#dcfce7'
          return (
            <div>
              {/* Assigned machines */}
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Assigned Machines ({customerMachines.length})
              </h2>
              {customerMachines.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8',
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <p>No machines assigned yet — select from the catalog below</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {customerMachines.map(m => (
                    <div key={m.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                      padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>{m.name}</h3>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                            {m.machine_type} — {m.brand} {m.model || ''}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                            backgroundColor: complexityBg(m.complexity_signal), color: complexityColor(m.complexity_signal),
                            fontWeight: '600' }}>
                            {(m.complexity_signal || 'low').toUpperCase()}
                          </span>
                          <button onClick={() => removeMachine(m.id)}
                            style={{ padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626',
                              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available catalog */}
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Available in Catalog ({available.length})
              </h2>
              {available.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8',
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p>All catalog machines are assigned to this customer</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                  {available.map(m => (
                    <div key={m.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                      padding: '16px 20px', border: '1px dashed #d1d5db' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', margin: '0 0 4px 0' }}>{m.name}</h3>
                          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                            {m.machine_type} — {m.brand} {m.model || ''}
                          </p>
                        </div>
                        <button onClick={() => addMachine(m.id)}
                          style={{ padding: '4px 14px', backgroundColor: '#eff6ff', color: '#3b82f6',
                            border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '600' }}>
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* Products Tab */}
        {tab === 'products' && (() => {
          const assignedIds = new Set(customerProducts.map(p => p.id))
          const available = allProducts.filter(p => !assignedIds.has(p.id))
          const complexityColor = (l) => l === 'high' ? '#dc2626' : l === 'medium' ? '#d97706' : '#16a34a'
          const complexityBg = (l) => l === 'high' ? '#fee2e2' : l === 'medium' ? '#fef3c7' : '#dcfce7'
          return (
            <div>
              {/* Assigned products */}
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Assigned Products ({customerProducts.length})
              </h2>
              {customerProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8',
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <p>No products assigned yet — select from the catalog below</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {customerProducts.map(p => (
                    <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                      padding: '16px 20px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', margin: '0 0 4px 0' }}>{p.name}</h3>
                          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{p.category}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                            backgroundColor: complexityBg(p.complexity), color: complexityColor(p.complexity),
                            fontWeight: '600' }}>
                            {(p.complexity || 'low').toUpperCase()}
                          </span>
                          <button onClick={() => removeProduct(p.id)}
                            style={{ padding: '4px 10px', backgroundColor: '#fee2e2', color: '#dc2626',
                              border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Available catalog */}
              <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
                Available in Catalog ({available.length})
              </h2>
              {available.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8',
                  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <p>All catalog products are assigned to this customer</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {available.map(p => (
                    <div key={p.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                      padding: '16px 20px', border: '1px dashed #d1d5db' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', margin: '0 0 4px 0' }}>{p.name}</h3>
                          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>{p.category}</p>
                        </div>
                        <button onClick={() => addProduct(p.id)}
                          style={{ padding: '4px 14px', backgroundColor: '#faf5ff', color: '#8b5cf6',
                            border: '1px solid #ddd6fe', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '12px', fontWeight: '600' }}>
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}
      </main>
    </div>
  )
}
