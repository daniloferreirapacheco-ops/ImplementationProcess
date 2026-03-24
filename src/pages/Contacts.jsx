import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'

export default function Contacts() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*, accounts(name)')
      .order('name')
    if (error) console.error(error)
    else setContacts(data || [])
    setLoading(false)
  }

  const filtered = contacts.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.accounts?.name?.toLowerCase().includes(q)
  })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <NavBar current="Contacts" />

      <main style={{ marginLeft: '220px', flex: 1, padding: '32px', maxWidth: '1420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
              Contacts
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              {contacts.length} total contacts across all accounts
            </p>
          </div>
          <button onClick={() => navigate('/contacts/new')}
            style={{ padding: '12px 24px', backgroundColor: '#8b5cf6', color: 'white',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontSize: '14px', fontWeight: '600' }}>
            + New Contact
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '24px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, title, or company..."
            style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '14px', width: '100%', maxWidth: '400px' }} />
        </div>

        {/* Contact List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#94a3b8' }}>
            <p style={{ fontSize: '48px', margin: '0 0 12px 0' }}>👤</p>
            <p style={{ fontSize: '16px', margin: '0 0 4px 0' }}>No contacts found</p>
            <p style={{ fontSize: '14px' }}>Click "+ New Contact" to add your first contact</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '12px' }}>
            {filtered.map(contact => (
              <div key={contact.id} onClick={() => navigate(`/contacts/${contact.id}`)}
                style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                  border: '1px solid #e2e8f0', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                      {contact.name}
                    </h3>
                    {contact.title && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#8b5cf6', fontWeight: '500' }}>
                        {contact.title}
                      </p>
                    )}
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '18px' }}>→</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: '#64748b' }}>
                  {contact.accounts?.name && (
                    <span>🏢 {contact.accounts.name}</span>
                  )}
                  {contact.email && <span>✉️ {contact.email}</span>}
                  {contact.phone && <span>📞 {contact.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
