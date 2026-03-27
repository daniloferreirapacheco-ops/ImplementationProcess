import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar
import usePageTitle from "../hooks/usePageTitle" from '../components/layout/NavBar'
import { useToast } from '../components/Toast'

export default function ContactDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [accounts, setAccounts] = useState([])

  usePageTitle(contact?.name || 'Contact')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    const [contactRes, accountsRes] = await Promise.all([
      supabase.from('contacts').select('*, accounts(name)').eq('id', id).single(),
      supabase.from('accounts').select('id, name').order('name')
    ])
    if (contactRes.data) {
      setContact(contactRes.data)
      setForm(contactRes.data)
    }
    setAccounts(accountsRes.data || [])
    setLoading(false)
  }

  const handleSave = async () => {
    const { error } = await supabase.from('contacts').update({
      name: form.name,
      title: form.title,
      email: form.email,
      phone: form.phone,
      account_id: form.account_id,
      role: form.role,
      notes: form.notes
    }).eq('id', id)
    if (!error) {
      loadData()
      setEditing(false)
      toast("Contact saved successfully")
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this contact?')) return
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) { alert(error.message); return }
    toast("Contact deleted")
    navigate('/contacts')
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Contacts" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        <p style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Loading...</p>
      </main>
    </div>
  )

  if (!contact) return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Contacts" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px' }}>
        <p style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>Contact not found</p>
      </main>
    </div>
  )

  const fieldStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500',
    fontSize: '14px', color: '#374151' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Contacts" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/contacts")} style={{ color: "#94a3b8", cursor: "pointer" }}>Contacts</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>{contact.name}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', fontWeight: '700' }}>
              {contact.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
                {contact.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {contact.title && <span style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: '500' }}>{contact.title}</span>}
                {contact.title && contact.accounts?.name && <span style={{ color: '#cbd5e1' }}>at</span>}
                {contact.accounts?.name && (
                  <span onClick={() => navigate(`/customers/${contact.account_id}`)}
                    style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '14px', fontWeight: '500' }}>
                    {contact.accounts.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)}
                  style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Edit
                </button>
                <button onClick={() => window.print()}
                  style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                    border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  Print
                </button>
                <button onClick={handleDelete}
                  style={{ padding: '10px 20px', backgroundColor: '#fef2f2', color: '#dc2626',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(false); setForm(contact) }}
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

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
          border: '1px solid #e2e8f0' }}>
          {editing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={form.name || ''} onChange={e => updateForm('name', e.target.value)}
                  style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Title / Position</label>
                <input value={form.title || ''} onChange={e => updateForm('title', e.target.value)}
                  style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.email || ''} onChange={e => updateForm('email', e.target.value)}
                  style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={form.phone || ''} onChange={e => updateForm('phone', e.target.value)}
                  style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <select value={form.account_id || ''} onChange={e => updateForm('account_id', e.target.value)}
                  style={fieldStyle}>
                  <option value="">— No company —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select value={form.role || ''} onChange={e => updateForm('role', e.target.value)}
                  style={fieldStyle}>
                  <option value="">— Select —</option>
                  <option value="decision_maker">Decision Maker</option>
                  <option value="champion">Champion</option>
                  <option value="technical">Technical</option>
                  <option value="end_user">End User</option>
                  <option value="influencer">Influencer</option>
                  <option value="other">Other</option>
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
                { label: 'Email', value: contact.email },
                { label: 'Phone', value: contact.phone },
                { label: 'Company', value: contact.accounts?.name },
                { label: 'Role', value: contact.role?.replace('_', ' ') },
                { label: 'Notes', value: contact.notes }
              ].map(field => (
                <div key={field.label}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    {field.label.toUpperCase()}
                  </p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e293b', textTransform: field.label === 'Role' ? 'capitalize' : 'none' }}>
                    {field.value || '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Record Footer */}
        <div style={{ marginTop: "24px", padding: "12px 0", borderTop: "1px solid #e2e8f0", display: "flex", gap: "24px", fontSize: "11px", color: "#94a3b8" }}>
          <span>Created: {contact?.created_at ? new Date(contact.created_at).toLocaleString() : "—"}</span>
          <span>Updated: {contact?.updated_at ? new Date(contact.updated_at).toLocaleString() : "—"}</span>
          <span style={{ fontFamily: "monospace", fontSize: "10px" }}>ID: {contact?.id?.substring(0, 8)}</span>
        </div>
      </main>
    </div>
  )
}
