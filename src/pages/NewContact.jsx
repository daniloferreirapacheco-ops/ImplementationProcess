import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'
import { useToast } from "../components/Toast"

export default function NewContact() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const preselectedAccount = searchParams.get('account_id') || ''
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState({
    name: '', title: '', email: '', phone: '',
    account_id: preselectedAccount, role: '', notes: ''
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    const { data } = await supabase.from('accounts').select('id, name').order('name')
    setAccounts(data || [])
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Contact name is required')
      return
    }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('contacts').insert({
      name: form.name.trim(),
      title: form.title || null,
      email: form.email || null,
      phone: form.phone || null,
      account_id: form.account_id || null,
      role: form.role || null,
      notes: form.notes || null,
      created_by: profile?.id
    }).select().single()
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    toast("Contact created successfully")
      navigate(`/contacts/${data.id}`)
  }

  const fieldStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500',
    fontSize: '14px', color: '#374151' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Contacts" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/contacts")} style={{ color: "#94a3b8", cursor: "pointer" }}>Contacts</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>New Contact</span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px 0' }}>
          New Contact
        </h1>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#dc2626',
            padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
          border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input value={form.name} onChange={e => updateForm('name', e.target.value)}
                placeholder="John Smith" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Title / Position</label>
              <input value={form.title} onChange={e => updateForm('title', e.target.value)}
                placeholder="e.g. VP of Operations" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)}
                placeholder="john@company.com" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e => updateForm('phone', e.target.value)}
                placeholder="(555) 123-4567" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Company</label>
              <select value={form.account_id} onChange={e => updateForm('account_id', e.target.value)}
                style={fieldStyle}>
                <option value="">— Select company —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={form.role} onChange={e => updateForm('role', e.target.value)}
                style={fieldStyle}>
                <option value="">— Select role —</option>
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
              <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)}
                placeholder="Any additional notes..." rows={3}
                style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => navigate('/contacts')}
              style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                fontWeight: '600', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating...' : 'Create Contact'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
