import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'
import usePageTitle from '../hooks/usePageTitle'
import { useToast } from '../components/Toast'

export default function NewCustomer() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: '', industry: '', website: '', phone: '',
    address: '', city: '', state: '', zip: '', notes: '', status: 'active'
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Company name is required')
      return
    }
    setSaving(true)
    setError('')
    const { data, error: err } = await supabase.from('accounts').insert({
      name: form.name.trim(),
      industry: form.industry || null,
      website: form.website || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      notes: form.notes || null,
      status: form.status,
      created_by: profile?.id
    }).select().single()
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    toast("Customer created successfully")
    navigate(`/customers/${data.id}`)
  }

  const fieldStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500',
    fontSize: '14px', color: '#374151' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Customers" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", fontSize: "13px" }}>
          <span onClick={() => navigate("/dashboard")} style={{ color: "#94a3b8", cursor: "pointer" }}>Dashboard</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span onClick={() => navigate("/customers")} style={{ color: "#94a3b8", cursor: "pointer" }}>Customers</span>
          <span style={{ color: "#cbd5e1" }}>/</span>
          <span style={{ color: "#1e293b", fontWeight: "500" }}>New Customer</span>
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 24px 0' }}>
          New Customer
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
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Company Name *</label>
              <input value={form.name} onChange={e => updateForm('name', e.target.value)}
                autoFocus placeholder="Enter company name" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Industry</label>
              <input value={form.industry} onChange={e => updateForm('industry', e.target.value)}
                placeholder="e.g. Commercial Printing" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input value={form.website} onChange={e => updateForm('website', e.target.value)}
                placeholder="e.g. www.company.com" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e => updateForm('phone', e.target.value)}
                placeholder="e.g. (555) 123-4567" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => updateForm('status', e.target.value)}
                style={fieldStyle}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address</label>
              <input value={form.address} onChange={e => updateForm('address', e.target.value)}
                placeholder="Street address" style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input value={form.city} onChange={e => updateForm('city', e.target.value)}
                style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input value={form.state} onChange={e => updateForm('state', e.target.value)}
                style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle}>ZIP</label>
              <input value={form.zip} onChange={e => updateForm('zip', e.target.value)}
                style={fieldStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)}
                placeholder="Any additional notes..." rows={3}
                style={{ ...fieldStyle, resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button onClick={() => navigate('/customers')}
              style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '10px 20px', backgroundColor: '#6366f1', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                fontWeight: '600', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
