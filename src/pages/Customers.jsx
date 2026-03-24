import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

export default function Customers() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name')
    if (error) console.error(error)
    else setAccounts(data || [])
    setLoading(false)
  }

  const filtered = accounts.filter(a => {
    if (search && !a.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'all') return true
    if (filter === 'active') return a.status === 'active' || !a.status
    if (filter === 'inactive') return a.status === 'inactive'
    return true
  })

  const totalActive = accounts.filter(a => a.status === 'active' || !a.status).length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Customers" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Customers
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              {accounts.length} total accounts
            </p>
          </div>
          <button onClick={() => navigate('/customers/new')}
            style={{ padding: '12px 24px', backgroundColor: '#6366f1', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600' }}>
            + New Customer
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Customers', value: accounts.length, color: '#3b82f6' },
            { label: 'Active', value: totalActive, color: '#10b981' },
            { label: 'Inactive', value: accounts.length - totalActive, color: '#94a3b8' }
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

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '14px', flex: 1, maxWidth: '320px' }} />
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 16px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                backgroundColor: filter === f ? '#1a1a2e' : '#e2e8f0',
                color: filter === f ? 'white' : '#475569', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Customer List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>🏢</p>
            <p style={{ fontSize: '16px', margin: '0 0 4px 0' }}>No customers found</p>
            <p style={{ fontSize: '14px' }}>Click "+ New Customer" to add your first account</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(account => (
              <div key={account.id} onClick={() => navigate(`/customers/${account.id}`)}
                style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                    🏢 {account.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b' }}>
                    {account.industry && <span>Industry: {account.industry}</span>}
                    {account.city && <span>📍 {account.city}{account.state ? `, ${account.state}` : ''}</span>}
                    {account.phone && <span>📞 {account.phone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{
                    backgroundColor: (account.status === 'inactive' ? '#94a3b8' : '#10b981') + '20',
                    color: account.status === 'inactive' ? '#94a3b8' : '#10b981',
                    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    textTransform: 'capitalize' }}>
                    {account.status || 'active'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '18px' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
