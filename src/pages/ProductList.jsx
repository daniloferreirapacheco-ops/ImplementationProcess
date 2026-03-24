import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

const productCategories = [
  'Commercial Print',
  'Packaging / Labels',
  'Wide Format / Signage',
  'Books / Publishing',
  'Direct Mail',
  'Forms / NCR',
  'Promotional / Specialty',
  'Digital / Variable Data',
  'Transactional',
  'Apparel / Textile',
  'Other'
]

const complexityByCategory = {
  'Commercial Print': 'low',
  'Packaging / Labels': 'high',
  'Wide Format / Signage': 'medium',
  'Books / Publishing': 'medium',
  'Direct Mail': 'high',
  'Forms / NCR': 'low',
  'Promotional / Specialty': 'medium',
  'Digital / Variable Data': 'high',
  'Transactional': 'high',
  'Apparel / Textile': 'medium',
  'Other': 'low'
}

const emptyProduct = {
  name: '',
  category: 'Commercial Print',
  description: '',
  complexity: 'low',
  volume: '',
  notes: ''
}

export default function ProductList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ ...emptyProduct })
  const [error, setError] = useState('')

  useEffect(() => { loadAccounts() }, [])
  useEffect(() => { if (selectedAccount) loadProducts() }, [selectedAccount])

  const loadAccounts = async () => {
    const { data } = await supabase.from('accounts').select('id, name').order('name')
    setAccounts(data || [])
    if (data?.length > 0) setSelectedAccount(data[0].id)
    setLoading(false)
  }

  const loadProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('account_id', selectedAccount)
      .order('category, name')
    setProducts(data || [])
  }

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!form.name) {
      setError('Product name is required')
      return
    }
    setError('')
    const payload = {
      account_id: selectedAccount,
      name: form.name,
      category: form.category,
      description: form.description,
      complexity: form.complexity,
      volume: form.volume,
      notes: form.notes,
      updated_by: profile.id
    }
    if (editingId) {
      const { error: err } = await supabase.from('products').update(payload).eq('id', editingId)
      if (err) { setError(err.message); return }
    } else {
      payload.created_by = profile.id
      const { error: err } = await supabase.from('products').insert(payload)
      if (err) { setError(err.message); return }
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ ...emptyProduct })
    loadProducts()
  }

  const startEdit = (product) => {
    setForm({
      name: product.name,
      category: product.category || 'Commercial Print',
      description: product.description || '',
      complexity: product.complexity || 'low',
      volume: product.volume || '',
      notes: product.notes || ''
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    await supabase.from('products').delete().eq('id', id)
    loadProducts()
  }

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const complexityColor = (level) =>
    level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981'

  const highComplexityCount = products.filter(p => p.complexity === 'high').length
  const scopeWarning = highComplexityCount >= 3

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Products" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Product List
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              What the customer produces — categorized with complexity scoring
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)}
              style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
                fontSize: '14px', minWidth: '220px' }}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyProduct }) }}
              style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              + Add Product
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Products', value: products.length, color: '#8b5cf6' },
            { label: 'Categories', value: Object.keys(grouped).length, color: '#3b82f6' },
            { label: 'High Complexity', value: highComplexityCount, color: '#ef4444' },
            { label: 'Low Complexity', value: products.filter(p => p.complexity === 'low').length, color: '#10b981' }
          ].map(card => (
            <div key={card.label} style={{ backgroundColor: 'white', borderRadius: '12px',
              padding: '20px', border: '1px solid #e2e8f0' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                {card.label.toUpperCase()}
              </p>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>

        {/* Scope Warning */}
        {scopeWarning && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
            padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>&#9888;&#65039;</span>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: '600', color: '#dc2626', fontSize: '14px' }}>
                Scope Warning: {highComplexityCount} high-complexity products detected
              </p>
              <p style={{ margin: 0, color: '#dc2626', fontSize: '13px' }}>
                This account may require extended Discovery and a deeper Scope baseline. Consider upgrading discovery depth.
              </p>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            border: '2px solid #8b5cf6', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setError('') }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>
                x
              </button>
            </div>
            {error && (
              <div style={{ backgroundColor: '#fee2e2', color: '#dc2626',
                padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Product Name *
                </label>
                <input value={form.name} onChange={e => updateForm('name', e.target.value)}
                  placeholder="e.g. Business Cards"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Category
                </label>
                <select value={form.category} onChange={e => updateForm('category', e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                  {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Complexity
                </label>
                <select value={form.complexity} onChange={e => updateForm('complexity', e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Volume (monthly)
                </label>
                <input value={form.volume} onChange={e => updateForm('volume', e.target.value)}
                  placeholder="e.g. 10,000 units"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '2 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Description
                </label>
                <input value={form.description} onChange={e => updateForm('description', e.target.value)}
                  placeholder="Brief description of this product type"
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#374151' }}>
                  Notes
                </label>
                <textarea value={form.notes} onChange={e => updateForm('notes', e.target.value)}
                  placeholder="Any additional details..."
                  rows={2}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db',
                    borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Category default complexity: <span style={{ fontWeight: '600', color: complexityColor(complexityByCategory[form.category]) }}>
                  {complexityByCategory[form.category]?.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setShowForm(false); setEditingId(null); setError('') }}
                  style={{ padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#475569',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  Cancel
                </button>
                <button onClick={handleSave}
                  style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  {editingId ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Product List Grouped by Category */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>&#128230;</p>
            <p style={{ fontSize: '16px', margin: '0 0 4px 0' }}>No products registered yet</p>
            <p style={{ fontSize: '14px' }}>Click "Add Product" to define what this account produces</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                  {category}
                </h2>
                <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px',
                  backgroundColor: complexityColor(complexityByCategory[category]) + '20',
                  color: complexityColor(complexityByCategory[category]), fontWeight: '600' }}>
                  {complexityByCategory[category]?.toUpperCase()} default
                </span>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {items.length} product{items.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                {items.map(product => (
                  <div key={product.id} style={{ backgroundColor: 'white', borderRadius: '12px',
                    padding: '20px', border: '1px solid #e2e8f0', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
                        {product.name}
                      </h3>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                        backgroundColor: complexityColor(product.complexity) + '20',
                        color: complexityColor(product.complexity), fontWeight: '600' }}>
                        {product.complexity?.toUpperCase()}
                      </span>
                    </div>
                    {product.description && (
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 6px 0' }}>{product.description}</p>
                    )}
                    {product.volume && (
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 6px 0' }}>
                        Volume: <strong style={{ color: '#1e293b' }}>{product.volume}</strong>
                      </p>
                    )}
                    {product.notes && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                        {product.notes}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={() => startEdit(product)}
                        style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#475569',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(product.id)}
                        style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626',
                          border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                        Remove
                      </button>
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
