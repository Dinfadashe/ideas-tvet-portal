// src/pages/tsp/TSPDashboard.jsx
// Branded dashboard for each TSP — replaces the master dashboard
// useTSP() hook fetches the logged-in TSP's account details

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function TSPDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tsp, setTsp] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchTSPData()
  }, [user])

  async function fetchTSPData() {
    setLoading(true)
    try {
      // Get TSP account
      const { data: tspData } = await supabase
        .from('tsp_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!tspData) { navigate('/tsp/setup'); return }
      setTsp(tspData)

      // Get student stats for this TSP
      const { data: students } = await supabase
        .from('profiles')
        .select('status, photo_url, profile_updated, admission_accepted, gender')
        .eq('role', 'student')
        .eq('tsp_id', tspData.id)

      if (students) {
        setStats({
          total: students.length,
          active: students.filter(s => s.status === 'active').length,
          admitted: students.filter(s => s.status === 'admitted').length,
          pending: students.filter(s => s.status === 'pending').length,
          photos: students.filter(s => s.photo_url).length,
          profiles: students.filter(s => s.profile_updated).length,
          male: students.filter(s => s.gender?.toLowerCase() === 'male').length,
          female: students.filter(s => s.gender?.toLowerCase() === 'female').length,
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading dashboard...</div>
  if (!tsp) return null

  const daysLeft = tsp.subscription_end
    ? Math.ceil((new Date(tsp.subscription_end) - new Date()) / (1000 * 60 * 60 * 24))
    : 0

  const isExpired = tsp.status === 'expired' || daysLeft <= 0
  const isExpiringSoon = !isExpired && daysLeft <= 30

  const primaryColor = tsp.primary_color || '#0a2e14'
  const secondaryColor = tsp.secondary_color || '#c8a82a'

  if (tsp.status === 'pending') return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0a2e14', marginBottom: 12 }}>Account Pending Approval</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7 }}>
          Your registration for <strong>{tsp.org_name}</strong> is under review. Our admin team will verify your payment receipt and activate your account within 24–48 hours.
        </p>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 16 }}>You will receive an email at <strong>{tsp.email}</strong> once approved.</p>
      </div>
    </div>
  )

  if (tsp.status === 'rejected') return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginBottom: 12 }}>Registration Rejected</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>
          Unfortunately your registration was not approved.
          {tsp.rejection_reason && <><br/><strong>Reason:</strong> {tsp.rejection_reason}</>}
        </p>
        <p style={{ color: '#64748b', fontSize: 13 }}>Contact <a href="mailto:official@theweb3alliance.org" style={{ color: '#1a7a3c' }}>official@theweb3alliance.org</a> to resolve this.</p>
      </div>
    </div>
  )

  return (
    <div>
      {/* Expiry banners */}
      {isExpired && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>🚨 Your subscription has expired</div>
            <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Pay ₦50,000 to UBA · Web3.0 Alliance Ltd · 1027821555 and upload your renewal receipt.</div>
          </div>
          <button onClick={() => navigate('/tsp/renew')} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
            Renew Now
          </button>
        </div>
      )}
      {isExpiringSoon && !isExpired && (
        <div style={{ background: '#fffbea', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14 }}>⚠️ Subscription expires in {daysLeft} days</div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 2 }}>Renew early to avoid interruption. Pay ₦50,000 to UBA · Web3.0 Alliance Ltd · 1027821555.</div>
          </div>
          <button onClick={() => navigate('/tsp/renew')} style={{ padding: '8px 16px', background: '#c8a82a', color: '#0a2e14', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, flexShrink: 0 }}>
            Renew
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, borderRadius: 14, padding: '28px 32px', marginBottom: 24, color: '#fff', display: 'flex', alignItems: 'center', gap: 20 }}>
        {tsp.logo_url ? (
          <img src={tsp.logo_url} alt={tsp.org_name} style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 10, background: 'rgba(255,255,255,0.1)', padding: 4 }} />
        ) : (
          <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏢</div>
        )}
        <div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{tsp.org_name}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>{tsp.project_name} · {tsp.trade}</div>
          <div style={{ color: secondaryColor, fontSize: 12, marginTop: 4, fontWeight: 600 }}>
            {isExpired ? 'Expired' : `Active · ${daysLeft} days remaining`}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Trainees', value: stats.total, icon: '👥', color: primaryColor },
            { label: 'Active', value: stats.active, icon: '✅', color: '#16a34a' },
            { label: 'Admitted', value: stats.admitted, icon: '📋', color: '#1d4ed8' },
            { label: 'Photos Uploaded', value: stats.photos, icon: '📸', color: '#7c3aed' },
            { label: 'Profiles Complete', value: stats.profiles, icon: '📝', color: '#b45309' },
            { label: 'Male', value: stats.male, icon: '👨', color: '#0369a1' },
            { label: 'Female', value: stats.female, icon: '👩', color: '#be185d' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          { label: 'Manage Students', icon: '👥', path: '/tsp/students', color: primaryColor },
          { label: 'Add New Student', icon: '➕', path: '/tsp/students/add', color: '#1d4ed8' },
          { label: 'Photo Album', icon: '📸', path: '/tsp/album', color: '#7c3aed' },
          { label: 'Account Settings', icon: '⚙️', path: '/tsp/settings', color: '#475569' },
        ].map(q => (
          <button key={q.label} onClick={() => navigate(q.path)}
            style={{ padding: '20px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, cursor: 'pointer', textAlign: 'left', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{q.icon}</div>
            <div style={{ fontWeight: 700, color: '#0a1628', fontSize: 14 }}>{q.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
