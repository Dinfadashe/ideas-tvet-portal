// src/pages/admin/AdminInstructors.jsx
// Admin invites instructors, views all instructors, manages them

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })

  useEffect(() => { fetchInstructors() }, [])

  async function fetchInstructors() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*, trainee_count:profiles!instructor_id(count)')
      .eq('role', 'instructor')
      .order('created_at', { ascending: false })

    // Get trainee count per instructor
    const { data: counts } = await supabase
      .from('profiles')
      .select('instructor_id')
      .eq('role', 'student')
      .not('instructor_id', 'is', null)

    const countMap = {}
    counts?.forEach(c => {
      countMap[c.instructor_id] = (countMap[c.instructor_id] || 0) + 1
    })

    setInstructors((data || []).map(i => ({ ...i, trainee_count: countMap[i.id] || 0 })))
    setLoading(false)
  }

  async function inviteInstructor() {
    if (!form.full_name.trim() || !form.email.trim()) {
      toast.error('Full name and email are required')
      return
    }
    setInviting(true)
    try {
      // 1. Create auth user via import function
      const res = await fetch('/.netlify/functions/import-students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: [{ email: form.email.toLowerCase().trim(), full_name: form.full_name.trim() }]
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to create account')

      // 2. Update profile to role=instructor and set phone
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: 'instructor',
          phone: form.phone || null,
          password_changed: false,
        })
        .eq('email', form.email.toLowerCase().trim())

      if (updateError) throw updateError

      // 3. Send invite email
      await fetch('/.netlify/functions/send-instructor-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: form.full_name.trim(), email: form.email.toLowerCase().trim() }),
      })

      toast.success(`Invitation sent to ${form.full_name}!`)
      setForm({ full_name: '', email: '', phone: '' })
      setShowInvite(false)
      fetchInstructors()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setInviting(false)
    }
  }

  async function resendInvite(instructor) {
    try {
      await fetch('/.netlify/functions/send-instructor-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: instructor.full_name, email: instructor.email }),
      })
      toast.success(`Invite resent to ${instructor.full_name}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function removeInstructor(instructor) {
    if (!window.confirm(`Remove ${instructor.full_name} as instructor? Their assigned trainees will become unassigned.`)) return
    try {
      // Unassign trainees
      await supabase.from('profiles').update({ instructor_id: null }).eq('instructor_id', instructor.id)
      // Change role back to student or delete
      await supabase.from('profiles').update({ role: 'student' }).eq('id', instructor.id)
      toast.success(`${instructor.full_name} removed as instructor`)
      fetchInstructors()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Instructors</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Invite and manage instructors. Each instructor can review assigned trainees' internship logbooks.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          style={{ background: 'linear-gradient(135deg,#0a2e14,#1a7a3c)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          + Invite Instructor
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Instructors', value: instructors.length, color: '#0a2e14' },
          { label: 'Active (Logged In)', value: instructors.filter(i => i.password_changed).length, color: '#16a34a' },
          { label: 'Pending Setup', value: instructors.filter(i => !i.password_changed).length, color: '#b45309' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Instructor list */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : instructors.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍🏫</div>
            <div style={{ fontWeight: 700, color: '#0a2e14', fontSize: 16, marginBottom: 8 }}>No instructors yet</div>
            <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>Invite your first instructor using the button above.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Instructor', 'Email', 'Phone', 'Trainees', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instructors.map(inst => (
                <tr key={inst.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#f0fdf4', border: '2px solid #bbf7d0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {inst.photo_url
                          ? <img src={inst.photo_url} alt={inst.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 18 }}>👨‍🏫</span>
                        }
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0a1628' }}>{inst.full_name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Invited {new Date(inst.created_at).toLocaleDateString('en-GB')}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{inst.email}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{inst.phone || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                      {inst.trainee_count}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: inst.password_changed ? '#f0fdf4' : '#fffbea',
                      color: inst.password_changed ? '#16a34a' : '#b45309',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      {inst.password_changed ? '✅ Active' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!inst.password_changed && (
                        <button
                          onClick={() => resendInvite(inst)}
                          style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#f0fdf4', color: '#1a7a3c' }}
                        >
                          Resend Invite
                        </button>
                      )}
                      <button
                        onClick={() => removeInstructor(inst)}
                        style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#fef2f2', color: '#dc2626' }}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 4 }}>Invite Instructor</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>They'll receive an email with login credentials and instructions.</div>

            <div style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Gowong Salama"
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Email Address *</label>
                <input
                  type="email"
                  placeholder="instructor@email.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
              ✅ An account will be created with default password <strong>pass</strong>. The instructor will be prompted to change it on first login.
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowInvite(false)} style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
              <button onClick={inviteInstructor} disabled={inviting} style={{ flex: 2, padding: '12px', borderRadius: 8, background: inviting ? '#ccc' : 'linear-gradient(135deg,#0a2e14,#1a7a3c)', color: '#fff', fontWeight: 700, cursor: inviting ? 'not-allowed' : 'pointer', border: 'none', fontSize: 14 }}>
                {inviting ? '⏳ Sending Invite...' : '📧 Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
