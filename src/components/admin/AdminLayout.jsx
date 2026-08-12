import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, Upload, BookOpen,
  LogOut, Menu, GraduationCap, UserCheck, Building2, FileCheck
} from 'lucide-react'
import NotificationBell from './NotificationBell.jsx'

export default function AdminLayout() {
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
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/import', label: 'Import Students', icon: Upload },
    { to: '/admin/logbooks', label: 'Logbooks', icon: BookOpen },
    { to: '/admin/acceptance-letters', label: 'Acceptance Letters', icon: FileCheck },
  ]

  const instructorItems = [
    { to: '/admin/instructors', label: 'Instructors', icon: GraduationCap },
    { to: '/admin/assign-instructors', label: 'Assign Trainees', icon: UserCheck },
  ]

  const systemItems = [
    { to: '/admin/tsps', label: 'TSP Management', icon: Building2 },
  ]

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
            <img src="/logo.png" alt="Web3.0 Alliance Logo" style={{ height: 38, width: 'auto', objectFit: 'contain', background: 'white', borderRadius: 6, padding: '3px 6px', flexShrink: 0 }} />
            <div className="logo-text">
              <span>IDEAS-TVET</span>
              <span>Admin Portal</span>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">

          {/* Management */}
          <div className="nav-section-label">Management</div>
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

          {/* Instructors */}
          <div className="nav-section-label" style={{ marginTop: 16 }}>Instructors</div>
          {instructorItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

          {/* System */}
          <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>
          {systemItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
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
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>Signed in as</div>
            <div style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>{profile?.full_name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Administrator</div>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>IDEAS-TVET</span>
              <span style={{ fontSize: 12, color: '#cbd5e1' }}>›</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 500 }}>Admin</span>
            </div>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}>
              <div style={{ width: 28, height: 28, background: '#0a1628', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                {profile?.full_name?.charAt(0) || 'A'}
              </div>
              <span style={{ fontWeight: 500, color: '#334155' }}>{profile?.full_name?.split(' ')[0]}</span>
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
