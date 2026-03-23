import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const roleColors = {
  admin: '#6366f1',
  leadership: '#8b5cf6',
  project_manager: '#3b82f6',
  consultant: '#10b981',
  sales: '#f59e0b',
  support: '#ef4444',
  product_specialist: '#06b6d4'
}

const roleLabels = {
  admin: 'Administrator',
  leadership: 'Leadership',
  project_manager: 'Project Manager',
  consultant: 'Implementation Consultant',
  sales: 'Sales',
  support: 'Support',
  product_specialist: 'Product Specialist'
}

const widgets = {
  admin: [
    { title: 'Pending Approvals', value: '0', icon: '✅', color: '#6366f1', link: '/approvals' },
    { title: 'Active Projects', value: '0', icon: '📁', color: '#3b82f6', link: '/projects' },
    { title: 'Open Opportunities', value: '0', icon: '💼', color: '#f59e0b', link: '/opportunities' },
    { title: 'Pending Handoffs', value: '0', icon: '🤝', color: '#ef4444', link: '/handoffs' },
    { title: 'Projects At Risk', value: '0', icon: '⚠️', color: '#dc2626', link: '/projects' },
    { title: 'Team Capacity', value: '0%', icon: '👥', color: '#10b981', link: '/capacity' },
  ],
  leadership: [
    { title: 'Portfolio Health', value: 'Good', icon: '📊', color: '#8b5cf6', link: '/portfolio' },
    { title: 'Active Projects', value: '0', icon: '📁', color: '#3b82f6', link: '/projects' },
    { title: 'Projects At Risk', value: '0', icon: '⚠️', color: '#dc2626', link: '/projects' },
    { title: 'Pending Approvals', value: '0', icon: '✅', color: '#6366f1', link: '/approvals' },
    { title: 'Estimate Accuracy', value: '0%', icon: '🎯', color: '#10b981', link: '/analytics' },
    { title: 'Upcoming Go-Lives', value: '0', icon: '🚀', color: '#f59e0b', link: '/golive' },
  ],
  project_manager: [
    { title: 'My Active Projects', value: '0', icon: '📁', color: '#3b82f6', link: '/projects' },
    { title: 'Projects At Risk', value: '0', icon: '⚠️', color: '#dc2626', link: '/projects' },
    { title: 'Overdue Milestones', value: '0', icon: '📅', color: '#ef4444', link: '/milestones' },
    { title: 'Open Blockers', value: '0', icon: '🚧', color: '#f59e0b', link: '/blockers' },
    { title: 'Upcoming Go-Lives', value: '0', icon: '🚀', color: '#10b981', link: '/golive' },
    { title: 'Pending Handoffs', value: '0', icon: '🤝', color: '#6366f1', link: '/handoffs' },
  ],
  consultant: [
    { title: 'My Assignments', value: '0', icon: '📋', color: '#10b981', link: '/projects' },
    { title: 'Discovery Tasks Due', value: '0', icon: '🔍', color: '#3b82f6', link: '/discovery' },
    { title: 'Data Gaps', value: '0', icon: '⚠️', color: '#f59e0b', link: '/discovery' },
    { title: 'Testing Items Due', value: '0', icon: '🧪', color: '#6366f1', link: '/testing' },
    { title: 'Open Questions', value: '0', icon: '❓', color: '#ef4444', link: '/discovery' },
    { title: 'Configurations Pending', value: '0', icon: '⚙️', color: '#06b6d4', link: '/projects' },
  ],
  sales: [
    { title: 'Open Opportunities', value: '0', icon: '💼', color: '#f59e0b', link: '/opportunities' },
    { title: 'Needs Discovery', value: '0', icon: '🔍', color: '#3b82f6', link: '/opportunities' },
    { title: 'Scopes Pending Approval', value: '0', icon: '✅', color: '#6366f1', link: '/approvals' },
    { title: 'High Risk Deals', value: '0', icon: '⚠️', color: '#dc2626', link: '/opportunities' },
    { title: 'Ready to Convert', value: '0', icon: '🚀', color: '#10b981', link: '/opportunities' },
    { title: 'Closed This Month', value: '0', icon: '🏆', color: '#8b5cf6', link: '/opportunities' },
  ],
  support: [
    { title: 'Pending Handoffs', value: '0', icon: '🤝', color: '#ef4444', link: '/handoffs' },
    { title: 'Customers in Hypercare', value: '0', icon: '💊', color: '#f59e0b', link: '/hypercare' },
    { title: 'Recently Live', value: '0', icon: '🚀', color: '#10b981', link: '/projects' },
    { title: 'Watchlist Accounts', value: '0', icon: '👁️', color: '#6366f1', link: '/accounts' },
    { title: 'Known Issues', value: '0', icon: '🐛', color: '#dc2626', link: '/issues' },
    { title: 'Support Sensitive', value: '0', icon: '⚡', color: '#8b5cf6', link: '/accounts' },
  ],
  product_specialist: [
    { title: 'Technical Reviews Due', value: '0', icon: '🔬', color: '#06b6d4', link: '/approvals' },
    { title: 'Advanced Requests', value: '0', icon: '⚙️', color: '#6366f1', link: '/opportunities' },
    { title: 'Integration Reviews', value: '0', icon: '🔗', color: '#3b82f6', link: '/projects' },
    { title: 'Custom Logic Pending', value: '0', icon: '💡', color: '#f59e0b', link: '/approvals' },
    { title: 'Open Technical Risks', value: '0', icon: '⚠️', color: '#dc2626', link: '/projects' },
    { title: 'Pending Sign-offs', value: '0', icon: '✅', color: '#10b981', link: '/testing' },
  ]
}

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const role = profile?.role || 'consultant'
  const roleColor = roleColors[role] || '#6366f1'
  const roleLabel = roleLabels[role] || 'User'
  const userWidgets = widgets[role] || widgets.consultant

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* Top Navigation Bar */}
      <div style={{
        backgroundColor: '#1a1a2e',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <span style={{ color: 'white', fontWeight: '700', fontSize: '18px' }}>
            Ecalc Delivery OS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            backgroundColor: roleColor,
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {roleLabel}
          </div>
          <span style={{ color: '#94a3b8', fontSize: '14px' }}>
            {profile?.full_name || profile?.email}
          </span>
          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #475569',
              color: '#94a3b8',
              padding: '6px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '32px' }}>

        {/* Welcome Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' }}>
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '16px' }}>
            Here's your {roleLabel} overview for today
          </p>
        </div>

        {/* Widgets Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {userWidgets.map((widget, index) => (
            <div
              key={index}
              onClick={() => navigate(widget.link)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderLeft: `4px solid ${widget.color}`
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 8px 0', fontWeight: '500' }}>
                    {widget.title}
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: '700', color: '#1e293b', margin: 0 }}>
                    {widget.value}
                  </p>
                </div>
                <span style={{ fontSize: '32px' }}>{widget.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b', margin: '0 0 16px 0' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {role === 'sales' || role === 'admin' ? (
              <button
                onClick={() => navigate('/opportunities/new')}
                style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                + New Opportunity
              </button>
            ) : null}
            {role === 'project_manager' || role === 'admin' ? (
              <button
                onClick={() => navigate('/projects/new')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                + New Project
              </button>
            ) : null}
            {role === 'admin' ? (
              <button
                onClick={() => navigate('/admin/users')}
                style={{
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                👥 Manage Users
              </button>
            ) : null}
            {role === 'consultant' || role === 'admin' ? (
              <button
                onClick={() => navigate('/discovery/new')}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                + New Discovery
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
