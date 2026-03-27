import { useState, useEffect } from 'react'
import usePageTitle from "../hooks/usePageTitle"
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NavBar from '../components/layout/NavBar'
import SearchInput from "../components/SearchInput"
import LoadingSkeleton from "../components/LoadingSkeleton"

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
  usePageTitle("Contacts")
  const [search, setSearch] = useState('')
  const [hoveredRow, setHoveredRow] = useState(null)
  const [page, setPage] = useState(1)
  const [sortField, setSortField] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const PER_PAGE = 25

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
  }).sort((a, b) => {
    const va = (a[sortField] || '').toString().toLowerCase()
    const vb = (b[sortField] || '').toString().toLowerCase()
    if (va < vb) return sortDir === 'asc' ? -1 : 1
    if (va > vb) return sortDir === 'asc' ? 1 : -1
    return 0
  })
  const toggleSort = (field) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') } }
  const SortHeader = ({ field, children, ...rest }) => (
    <th onClick={() => toggleSort(field)} style={{ ...thStyle, ...rest, cursor: 'pointer', userSelect: 'none' }}>
      {children} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => {
              const headers = ['Name', 'Title', 'Email', 'Phone', 'Company', 'Role']
              const rows = filtered.map(c => [c.name, c.title, c.email, c.phone, c.accounts?.name, c.role].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))
              const csv = [headers.join(','), ...rows].join('\n')
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click()
              URL.revokeObjectURL(url)
            }}
              style={{ padding: '7px 16px', backgroundColor: '#f1f5f9', color: '#475569',
                border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '500' }}>
              Export CSV
            </button>
            <button onClick={() => navigate('/contacts/new')}
              style={{ padding: '7px 16px', backgroundColor: '#8b5cf6', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600' }}>
              + New Contact
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {contacts.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Total Contacts', value: contacts.length, color: '#1e293b' },
              { label: 'Companies', value: [...new Set(contacts.map(c => c.account_id).filter(Boolean))].length, color: '#3b82f6' },
              { label: 'With Email', value: contacts.filter(c => c.email).length, color: '#10b981' },
              { label: 'With Title', value: contacts.filter(c => c.title).length, color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: '0 0 2px' }}>{s.value}</p>
                <p style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, title, or company..."
            style={{ padding: '5px 10px', border: '1px solid #d1d5db', borderRadius: '8px',
              fontSize: '13px', width: '320px' }} />
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>👤</div>
            <p style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px' }}>No contacts found</p>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>Add contacts to track stakeholders across your accounts.</p>
            <button onClick={() => navigate('/contacts/new')}
              style={{ padding: '10px 24px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              + Add Contact
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <SortHeader field="name" width="24%">Contact</SortHeader>
                  <th style={{ ...thStyle, width: '18%' }}>Company</th>
                  <SortHeader field="email" width="22%">Email</SortHeader>
                  <th style={{ ...thStyle, width: '16%' }}>Phone</th>
                  <th style={{ ...thStyle, width: '12%' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((contact, i) => (
                  <tr key={contact.id}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                    onMouseEnter={() => setHoveredRow(contact.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: hoveredRow === contact.id ? '#eff6ff' : i % 2 === 1 ? '#fafbfc' : 'white'
                    }}>
                    <td style={{ ...tdStyle, fontWeight: '600', color: '#1e293b' }}>
                      {contact.name}
                      {contact.title && <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', color: '#8b5cf6' }}>{contact.title}</span>}
                    </td>
                    <td style={tdStyle}>{contact.accounts?.name || '—'}</td>
                    <td style={tdStyle}>{contact.email || '—'}</td>
                    <td style={tdStyle}>{contact.phone || '—'}</td>
                    <td style={{ ...tdStyle, fontSize: '12px', color: '#94a3b8' }}>{contact.created_at ? new Date(contact.created_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', fontSize: '12px', color: '#94a3b8' }}>
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''} ({contacts.length} total)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: safePage <= 1 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: safePage <= 1 ? 0.5 : 1 }}>Prev</button>
            <span>Page {safePage} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
              style={{ padding: '4px 10px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: 'white', cursor: safePage >= totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: safePage >= totalPages ? 0.5 : 1 }}>Next</button>
          </div>
        </div>
      </main>
    </div>
  )
}
