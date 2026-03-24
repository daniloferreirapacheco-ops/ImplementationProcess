import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

const thStyle = {
  padding: '6px 12px', textAlign: 'left', fontSize: '12px', fontWeight: '600',
  color: '#64748b', borderBottom: '2px solid #d1d5db', backgroundColor: '#f1f5f9',
  position: 'sticky', top: 0, whiteSpace: 'nowrap', textTransform: 'uppercase',
  letterSpacing: '0.5px', userSelect: 'none'
}

const tdStyle = {
  padding: '5px 12px', fontSize: '13px', color: '#1e293b',
  borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden',
  textOverflow: 'ellipsis', maxWidth: '300px'
}

export default function Customers() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

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

      <main style={{ marginLeft: '220px', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Customers
            </h1>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              {filtered.length} of {accounts.length} accounts | {totalActive} active
            </p>
          </div>
          <button onClick={() => navigate('/customers/new')}
            style={{ padding: '7px 16px', backgroundColor: '#6366f1', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600' }}>
            + New Customer
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
              fontSize: '13px', width: '240px' }} />
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #d1d5db',
                cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                backgroundColor: filter === f ? '#1a1a2e' : 'white',
                color: filter === f ? 'white' : '#475569', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No customers found</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '30%' }}>Name</th>
                  <th style={{ ...thStyle, width: '15%' }}>Industry</th>
                  <th style={{ ...thStyle, width: '20%' }}>Location</th>
                  <th style={{ ...thStyle, width: '15%' }}>Phone</th>
                  <th style={{ ...thStyle, width: '10%' }}>Status</th>
                  <th style={{ ...thStyle, width: '10%' }}>Website</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(account => (
                  <tr key={account.id}
                    onClick={() => navigate(`/customers/${account.id}`)}
                    onMouseEnter={() => setHoveredRow(account.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === account.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '500' }}>{account.name}</span>
                    </td>
                    <td style={tdStyle}>{account.industry || '—'}</td>
                    <td style={tdStyle}>
                      {account.city ? `${account.city}${account.state ? `, ${account.state}` : ''}` : '—'}
                    </td>
                    <td style={tdStyle}>{account.phone || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        backgroundColor: (account.status === 'inactive' ? '#94a3b8' : '#10b981') + '18',
                        color: account.status === 'inactive' ? '#94a3b8' : '#10b981',
                        padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600',
                        textTransform: 'capitalize' }}>
                        {account.status || 'active'}
                      </span>
                    </td>
                    <td style={tdStyle}>{account.website || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} ({accounts.length} total)
        </div>
      </main>
    </div>
  )
}
