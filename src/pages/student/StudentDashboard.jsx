import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import { CheckCircle, Clock, BookOpen, FileText, ArrowRight, AlertCircle, Bell } from 'lucide-react'

export default function StudentDashboard() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [logbookProgress, setLogbookProgress] = useState({ total: 0, filled: 0 })
  const [notifications, setNotifications] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchData()
    }
  }, [profile?.id])

  async function fetchData() {
    try {
      const [logbookRes, notifRes, docRes] = await Promise.all([
        supabase
          .from('logbook_entries')
          .select('id, activities_performed')
          .eq('student_id', profile.id),
        supabase
          .from('notifications')
          .select('*')
          .eq('student_id', profile.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('documents')
          .select('id, document_type, file_name, uploaded_at')
          .eq('student_id', profile.id),
      ])

      if (logbookRes.data) {
        const filled = logbookRes.data.filter(e => e.activities_performed?.trim()).length
        setLogbookProgress({ total: logbookRes.data.length, filled })
      }
      setNotifications(notifRes.data || [])
      setDocuments(docRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function markNotificationRead(id) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const statusConfig = {
    pending: { label: 'Application Pending', color: '#64748b', bg: '#f1f5f9', icon: Clock },
    admitted: { label: 'Admitted', color: '#1d4ed8', bg: '#eff6ff', icon: CheckCircle },
    active: { label: 'Active Trainee', color: '#15803d', bg: '#f0fdf4', icon: CheckCircle },
    intern: { label: 'On Internship', color: '#b45309', bg: '#fffbeb', icon: BookOpen },
    graduated: { label: 'Graduated', color: '#15803d', bg: '#f0fdf4', icon: CheckCircle },
    inactive: { label: 'Inactive', color: '#dc2626', bg: '#fef2f2', icon: AlertCircle },
  }

  const sc = statusConfig[profile?.status] || statusConfig.pending
  const StatusIcon = sc.icon

  const steps = [
    { label: 'Admission Accepted', done: profile?.admission_accepted },
    { label: 'Password Changed', done: profile?.password_changed },
    { label: 'Profile Complete', done: profile?.profile_updated },
    { label: 'Training Active', done: ['active', 'intern', 'graduated'].includes(profile?.status) },
    { label: 'Internship', done: ['intern', 'graduated'].includes(profile?.status) },
  ]

  const completedSteps = steps.filter(s => s.done).length

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner" style={{ marginBottom: 24 }}>
        <div className="welcome-badge">
          <StatusIcon size={12} />
          {sc.label}
        </div>
        <h2>Welcome back, {profile?.full_name?.split(' ')[0]}!</h2>
        <p>IDEAS-TVET Computer Hardware &amp; Cellphone Repairs Program</p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {notifications.map(n => (
            <div key={n.id} className="alert alert-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Bell size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 13 }}>{n.message}</div>
                </div>
              </div>
              <button
                onClick={() => markNotificationRead(n.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1, padding: '0 0 0 8px', flexShrink: 0 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Profile completion warning */}
      {!profile?.profile_updated && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertCircle size={16} />
          <div>
            <strong>Complete your profile</strong> — Please fill in your personal details to complete your registration.{' '}
            <button
              onClick={() => navigate('/dashboard/profile')}
              style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'DM Sans', fontSize: 'inherit', padding: 0 }}
            >
              Update now →
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={20} /></div>
          <div className="stat-info">
            <h3>{completedSteps}/{steps.length}</h3>
            <p>Onboarding Steps</p>
          </div>
        </div>
        {profile?.status === 'intern' && (
          <>
            <div className="stat-card">
              <div className="stat-icon gold"><BookOpen size={20} /></div>
              <div className="stat-info">
                <h3>{logbookProgress.filled}</h3>
                <p>Logbook Entries</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon navy"><Clock size={20} /></div>
              <div className="stat-info">
                <h3>{logbookProgress.total - logbookProgress.filled}</h3>
                <p>Pending Entries</p>
              </div>
            </div>
          </>
        )}
        <div className="stat-card">
          <div className="stat-icon navy"><FileText size={20} /></div>
          <div className="stat-info">
            <h3>{documents.length}</h3>
            <p>Documents Uploaded</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Progress Tracker */}
        <div className="card">
          <div className="card-header">
            <h2>Your Progress</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: step.done ? '#2db84b' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.2s'
                  }}>
                    {step.done && <CheckCircle size={14} color="white" />}
                    {!step.done && <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: 14, color: step.done ? '#1e293b' : '#94a3b8', fontWeight: step.done ? 500 : 400 }}>
                    {step.label}
                  </span>
                  {step.done && <CheckCircle size={13} color="#2db84b" style={{ marginLeft: 'auto' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                label: 'Update Profile',
                desc: profile?.profile_updated ? 'Your profile is complete' : 'Fill in your details',
                to: '/dashboard/profile',
                show: true,
                done: profile?.profile_updated,
              },
              {
                label: 'My Logbook',
                desc: profile?.status === 'intern'
                  ? `${logbookProgress.filled}/${logbookProgress.total} entries filled`
                  : 'Available when internship starts',
                to: '/dashboard/logbook',
                show: true,
                disabled: profile?.status !== 'intern',
              },
              {
                label: 'Documents',
                desc: 'Download internship letter & upload acceptance',
                to: '/dashboard/documents',
                show: true,
              },
            ].filter(a => a.show).map(action => (
              <button
                key={action.label}
                onClick={() => !action.disabled && navigate(action.to)}
                disabled={action.disabled}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                  background: action.disabled ? '#f8fafc' : 'white',
                  cursor: action.disabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left', transition: 'border-color 0.15s, background 0.15s',
                  opacity: action.disabled ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!action.disabled) e.currentTarget.style.borderColor = '#2db84b' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {action.label}
                    {action.done && <CheckCircle size={12} color="#2db84b" />}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{action.desc}</div>
                </div>
                <ArrowRight size={16} color="#cbd5e1" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Program Info */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h2>Program Information</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              ['Program', 'Computer Hardware & Cellphone Repairs'],
              ['Venue', 'Plateau State Polytechnic, Jos'],
              ['Duration', 'Minimum 6 months'],
              ['Funded By', 'World Bank / Federal Ministry of Education'],
              ['Implementing Partner', 'Web3.0 Alliance Ltd'],
              ['Support Email', 'official@theweb3alliance.org'],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
