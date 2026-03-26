import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

const machineTypes = [
  'Offset Press', 'Digital Press', 'Wide Format', 'Cutting / Finishing',
  'Binding / Stitching', 'Folding', 'Mailing / Inserting', 'Packaging',
  'Labeling', 'Inkjet', 'Engraving / Laser', 'Other'
]

const complexityByType = {
  'Offset Press': 'high', 'Digital Press': 'medium', 'Wide Format': 'medium',
  'Cutting / Finishing': 'low', 'Binding / Stitching': 'medium', 'Folding': 'low',
  'Mailing / Inserting': 'high', 'Packaging': 'medium', 'Labeling': 'low',
  'Inkjet': 'medium', 'Engraving / Laser': 'medium', 'Other': 'low'
}

const emptyMachine = {
  name: '', machine_type: 'Digital Press', brand: '', model: '',
  year: '', max_format: '', colors: '', notes: '', active: true
}

export default function MachineList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyMachine })
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => { loadMachines() }, [])

  const loadMachines = async () => {
    const { data } = await supabase.from('machines').select('*').order('machine_type, name')
    setMachines(data || [])
    setLoading(false)
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!form.name || !form.brand) {
      setError('Machine name and brand are required')
      return
    }
    setError('')
    const payload = {
      name: form.name, machine_type: form.machine_type, brand: form.brand,
      model: form.model, year: form.year ? parseInt(form.year) : null,
      max_format: form.max_format, colors: form.colors, notes: form.notes,
      active: form.active,
      complexity_signal: complexityByType[form.machine_type] || 'low',
      updated_by: profile.id
    }
    if (editingId) {
      const { error: err } = await supabase.from('machines').update(payload).eq('id', editingId)
      if (err) { setError(err.message); return }
    } else {
      payload.created_by = profile.id
      const { error: err } = await supabase.from('machines').insert(payload)
      if (err) { setError(err.message); return }
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyMachine })
    loadMachines()
  }

  const startEdit = (machine) => {
    setForm({
      name: machine.name, machine_type: machine.machine_type, brand: machine.brand,
      model: machine.model || '', year: machine.year?.toString() || '',
      max_format: machine.max_format || '', colors: machine.colors || '',
      notes: machine.notes || '', active: machine.active
    })
    setEditingId(machine.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this machine from the catalog?')) return
    await supabase.from('machines').delete().eq('id', id)
    loadMachines()
  }

  const filtered = filter === 'all' ? machines : machines.filter(m => m.machine_type === filter)

  const grouped = filtered.reduce((acc, m) => {
    const type = m.machine_type || 'Other'
    if (!acc[type]) acc[type] = []
    acc[type].push(m)
    return acc
  }, {})

  const complexityColor = (level) =>
    level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981'

  const fieldStyle = { width: '100%', padding: '10px', border: '1px solid #d1d5db',
    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }
  const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500',
    fontSize: '14px', color: '#374151' }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Machines" />
      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Machine Catalog
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Industry machine catalog — assign machines to customers from their profile
            </p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyMachine }) }}
            style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
            + Add Machine
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Machines', value: machines.length, color: '#3b82f6' },
            { label: 'Active', value: machines.filter(m => m.active).length, color: '#10b981' },
            { label: 'Machine Types', value: new Set(machines.map(m => m.machine_type)).size, color: '#8b5cf6' },
            { label: 'High Complexity', value: machines.filter(m => m.complexity_signal === 'high').length, color: '#ef4444' }
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                {card.label.toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')}
            style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #d1d5db',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              backgroundColor: filter === 'all' ? '#1a1a2e' : 'white',
              color: filter === 'all' ? 'white' : '#475569' }}>
            All
          </button>
          {machineTypes.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                backgroundColor: filter === t ? '#1a1a2e' : 'white',
                color: filter === t ? 'white' : '#475569' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            border: '2px solid #3b82f6', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                {editingId ? 'Edit Machine' : 'Add Machine to Catalog'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setError('') }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>x</button>
            </div>
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626',
                padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div><label style={labelStyle}>Machine Name *</label>
                <input value={form.name} onChange={e => updateForm('name', e.target.value)}
                  placeholder="e.g. Heidelberg SM 52" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Machine Type</label>
                <select value={form.machine_type} onChange={e => updateForm('machine_type', e.target.value)} style={fieldStyle}>
                  {machineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label style={labelStyle}>Brand *</label>
                <input value={form.brand} onChange={e => updateForm('brand', e.target.value)}
                  placeholder="e.g. Heidelberg" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Model</label>
                <input value={form.model} onChange={e => updateForm('model', e.target.value)}
                  placeholder="e.g. SM 52-5+L" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Year</label>
                <input type="number" value={form.year} onChange={e => updateForm('year', e.target.value)}
                  placeholder="e.g. 2019" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Max Format</label>
                <input value={form.max_format} onChange={e => updateForm('max_format', e.target.value)}
                  placeholder="e.g. 52x74 cm" style={fieldStyle} /></div>
              <div><label style={labelStyle}>Colors</label>
                <input value={form.colors} onChange={e => updateForm('colors', e.target.value)}
                  placeholder="e.g. 5+1, CMYK+Spot" style={fieldStyle} /></div>
              <div style={{ display: 'flex', alignItems: 'end', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={form.active} onChange={e => updateForm('active', e.target.checked)} /> Active
                </label>
              </div>
              <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Notes</label>
                <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)}
                  placeholder="Any additional details..." rows={2}
                  style={{ ...fieldStyle, resize: 'vertical' }} /></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Complexity: <span style={{ fontWeight: '600', color: complexityColor(complexityByType[form.machine_type]) }}>
                  {complexityByType[form.machine_type]?.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setShowForm(false); setEditingId(null); setError('') }}
                  style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>
                <button onClick={handleSave}
                  style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  {editingId ? 'Save Changes' : 'Add Machine'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Machine List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>&#9881;</p>
            <p style={{ fontSize: '16px' }}>No machines in the catalog yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([type, items]) => (
            <div key={type} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{type}</h2>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
                  backgroundColor: complexityColor(complexityByType[type]) + '20',
                  color: complexityColor(complexityByType[type]), fontWeight: '600' }}>
                  {complexityByType[type]?.toUpperCase()}</span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>{items.length} machine{items.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                {items.map(machine => (
                  <div key={machine.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                    padding: '20px', border: '1px solid #e2e8f0', opacity: machine.active ? 1 : 0.5, position: 'relative' }}>
                    {!machine.active && (
                      <span style={{ position: 'absolute', top: '12px', right: '12px',
                        fontSize: '11px', padding: '2px 8px', borderRadius: '8px',
                        backgroundColor: '#f1f5f9', color: '#94a3b8', fontWeight: '600' }}>INACTIVE</span>
                    )}
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>{machine.name}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                      <span>Brand: <strong style={{ color: '#1e293b' }}>{machine.brand}</strong></span>
                      {machine.model && <span>Model: <strong style={{ color: '#1e293b' }}>{machine.model}</strong></span>}
                      {machine.year && <span>Year: <strong style={{ color: '#1e293b' }}>{machine.year}</strong></span>}
                      {machine.max_format && <span>Format: <strong style={{ color: '#1e293b' }}>{machine.max_format}</strong></span>}
                      {machine.colors && <span>Colors: <strong style={{ color: '#1e293b' }}>{machine.colors}</strong></span>}
                    </div>
                    {machine.notes && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '8px 0 0 0', fontStyle: 'italic' }}>{machine.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => startEdit(machine)}
                        style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                      <button onClick={() => handleDelete(machine.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
