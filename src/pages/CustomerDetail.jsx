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

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [accountRes, contactsRes, oppsRes, projRes, amRes, apRes, machinesRes, productsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('account_id', id).order('name'),
      supabase.from('opportunities').select('*').eq('account_id', id).order('created_at', { ascending: false }),
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <button onClick={() => navigate('/customers')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer',
                fontSize: '14px', padding: 0, marginBottom: '8px' }}>
              ← Back to Customers
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
              🏢 {account.name}
            </h1>
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
            { key: 'contacts', label: 'Contacts', count: contacts.length },
            { key: 'machines', label: 'Machines', count: customerMachines.length },
            { key: 'products', label: 'Products', count: customerProducts.length },
            { key: 'opportunities', label: 'Opportunities', count: opportunities.length },
            { key: 'projects', label: 'Projects', count: projects.length }
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
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            border: '1px solid #e2e8f0' }}>
            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Company Name *</label>
                  <input value={form.name || ''} onChange={e => updateForm('name', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Industry</label>
                  <input value={form.industry || ''} onChange={e => updateForm('industry', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input value={form.website || ''} onChange={e => updateForm('website', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input value={form.phone || ''} onChange={e => updateForm('phone', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Address</label>
                  <input value={form.address || ''} onChange={e => updateForm('address', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>City</label>
                  <input value={form.city || ''} onChange={e => updateForm('city', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>State</label>
                  <input value={form.state || ''} onChange={e => updateForm('state', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>ZIP</label>
                  <input value={form.zip || ''} onChange={e => updateForm('zip', e.target.value)}
                    style={fieldStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status || 'active'} onChange={e => updateForm('status', e.target.value)}
                    style={fieldStyle}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={form.notes || ''} onChange={e => updateForm('notes', e.target.value)}
                    rows={3} style={{ ...fieldStyle, resize: 'vertical' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[
                  { label: 'Industry', value: account.industry },
                  { label: 'Website', value: account.website },
                  { label: 'Phone', value: account.phone },
                  { label: 'Address', value: [account.address, account.city, account.state, account.zip].filter(Boolean).join(', ') },
                  { label: 'Status', value: account.status || 'active' },
                  { label: 'Notes', value: account.notes }
                ].map(field => (
                  <div key={field.label}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                      {field.label.toUpperCase()}
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>
                      {field.value || '—'}
                    </p>
                  </div>
                ))}
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
        {tab === 'opportunities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {opportunities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '36px', margin: '0 0 8px 0' }}>💼</p>
                <p>No opportunities for this customer</p>
              </div>
            ) : opportunities.map(o => (
              <div key={o.id} onClick={() => navigate(`/opportunities/${o.id}`)}
                style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px',
                  border: '1px solid #e2e8f0', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                  {o.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Stage: {o.stage} | Created: {new Date(o.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Projects Tab */}
        {tab === 'projects' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8',
                backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '36px', margin: '0 0 8px 0' }}>📁</p>
                <p>No projects for this customer</p>
              </div>
            ) : projects.map(p => (
              <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px 20px',
                  border: '1px solid #e2e8f0', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                  {p.name}
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Status: {p.status} | Created: {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}

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
