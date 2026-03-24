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

export default function Contacts() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)

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

      <main style={{ marginLeft: '220px', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Contacts
            </h1>
            <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
              {filtered.length} of {contacts.length} contacts
            </p>
          </div>
          <button onClick={() => navigate('/contacts/new')}
            style={{ padding: '7px 16px', backgroundColor: '#8b5cf6', color: 'white',
              border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600' }}>
            + New Contact
          </button>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, title, or company..."
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '4px',
              fontSize: '13px', width: '320px' }} />
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>No contacts found</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '22%' }}>Name</th>
                  <th style={{ ...thStyle, width: '18%' }}>Title</th>
                  <th style={{ ...thStyle, width: '20%' }}>Company</th>
                  <th style={{ ...thStyle, width: '22%' }}>Email</th>
                  <th style={{ ...thStyle, width: '18%' }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(contact => (
                  <tr key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    onMouseEnter={() => setHoveredRow(contact.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === contact.id ? '#eff6ff' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{contact.name}</td>
                    <td style={tdStyle}>{contact.title || '—'}</td>
                    <td style={tdStyle}>{contact.accounts?.name || '—'}</td>
                    <td style={tdStyle}>{contact.email || '—'}</td>
                    <td style={tdStyle}>{contact.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: '6px 12px', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #e2e8f0' }}>
          {filtered.length} record{filtered.length !== 1 ? 's' : ''} ({contacts.length} total)
        </div>
      </main>
    </div>
  )
}
