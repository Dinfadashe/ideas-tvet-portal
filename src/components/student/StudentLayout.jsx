import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, User, BookOpen, FileText,
  LogOut, Menu, Bell
} from 'lucide-react'

export default function StudentLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login')
    } catch {
      toast.error('Failed to sign out.')
    }
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/profile', label: 'My Profile', icon: User },
    { to: '/dashboard/logbook', label: 'Logbook', icon: BookOpen },
    { to: '/dashboard/documents', label: 'Documents', icon: FileText },
  ]

  const statusColors = {
    pending: 'badge-gray',
    admitted: 'badge-navy',
    active: 'badge-green',
    intern: 'badge-gold',
    graduated: 'badge-green',
    inactive: 'badge-red',
  }

  return (
    <div className="app-layout">
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-badge">
            <div className="logo-icon">WA</div>
            <div className="logo-text">
              <span>IDEAS-TVET</span>
              <span>Student Portal</span>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar-footer">
          <div style={{ padding: '8px 12px', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Trainee</div>
            <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{profile?.full_name}</div>
            <div style={{ marginTop: 4 }}>
              <span className={`badge ${statusColors[profile?.status] || 'badge-gray'}`} style={{ fontSize: 10 }}>
                {profile?.status?.toUpperCase()}
              </span>
            </div>
          </div>
          <button className="nav-link" onClick={handleSignOut} style={{ color: '#f87171', width: '100%' }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', padding: 4, color: '#334155' }}
              className="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
            <div>
              <div style={{ fontSize: 13, fontFamily: 'Syne', fontWeight: 700, color: '#0a1628' }}>
                IDEAS-TVET Portal
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Computer Hardware & Cellphone Repairs</div>
            </div>
          </div>
          <div className="topbar-right">
            <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
              <div style={{ fontWeight: 500, color: '#334155' }}>{profile?.full_name}</div>
              <div>{profile?.email}</div>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
