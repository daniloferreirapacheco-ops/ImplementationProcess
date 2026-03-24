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
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [accountRes, contactsRes, oppsRes, projRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('id', id).single(),
      supabase.from('contacts').select('*').eq('account_id', id).order('name'),
      supabase.from('opportunities').select('*').eq('account_id', id).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('account_id', id).order('created_at', { ascending: false })
    ])
    if (accountRes.data) {
      setAccount(accountRes.data)
      setForm(accountRes.data)
    }
    setContacts(contactsRes.data || [])
    setOpportunities(oppsRes.data || [])
    setProjects(projRes.data || [])
    setLoading(false)
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
              <button onClick={() => setEditing(true)}
                style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Edit
              </button>
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
          {['overview', 'contacts', 'opportunities', 'projects'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: '14px',
                fontWeight: tab === t ? '600' : '400',
                color: tab === t ? '#3b82f6' : '#64748b',
                backgroundColor: 'transparent',
                borderBottom: tab === t ? '2px solid #3b82f6' : '2px solid transparent',
                textTransform: 'capitalize' }}>
              {t} {t === 'contacts' ? `(${contacts.length})` :
                    t === 'opportunities' ? `(${opportunities.length})` :
                    t === 'projects' ? `(${projects.length})` : ''}
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
      </main>
    </div>
  )
}
