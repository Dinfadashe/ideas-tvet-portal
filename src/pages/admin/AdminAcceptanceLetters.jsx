// src/pages/admin/AdminAcceptanceLetters.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const STATUS_STYLE = {
  pending:  { bg: '#fffbea', color: '#b45309', border: '#fde68a', label: '⏳ Pending' },
  approved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', label: '✅ Approved' },
  rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', label: '❌ Rejected' },
}

export default function AdminAcceptanceLetters() {
  const [letters, setLetters] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actioning, setActioning] = useState(false)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { fetchLetters() }, [])

  async function fetchLetters() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        profile:profiles!documents_student_id_fkey (
          full_name, id_number, email, phone, photo_url, status
        )
      `)
      .eq('document_type', 'acceptance_letter')
      .order('uploaded_at', { ascending: false })

    if (error) console.error(error)
    setLetters(data || [])
    setLoading(false)
  }

  async function approve(doc) {
    setActioning(true)
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'approved',
          reviewed_by: 'dinfadashe@gmail.com',
          reviewed_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq('id', doc.id)
      if (error) throw error

      // Mark notification as read
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('document_id', doc.id)

      // Send approval email to student
      await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: doc.profile?.email,
          subject: '✅ Your Internship Acceptance Letter Has Been Approved',
          type: 'acceptance_approved',
          full_name: doc.profile?.full_name,
        }),
      })

      toast.success(`Approved — ${doc.profile?.full_name} can now access their logbook`)
      setSelected(null)
      fetchLetters()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActioning(false)
    }
  }

  async function reject(doc) {
    if (!rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return }
    setActioning(true)
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: 'rejected',
          reviewed_by: 'dinfadashe@gmail.com',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', doc.id)
      if (error) throw error

      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('document_id', doc.id)

      // Send rejection email to student with reason
      await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: doc.profile?.email,
          subject: '❌ Your Internship Acceptance Letter Was Not Approved',
          type: 'acceptance_rejected',
          full_name: doc.profile?.full_name,
          reason: rejectionReason,
        }),
      })

      toast.success(`Rejected — ${doc.profile?.full_name} has been notified by email`)
      setSelected(null)
      setRejectionReason('')
      fetchLetters()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActioning(false)
    }
  }

  const filtered = letters.filter(l =>
    filter === 'all' ? true : l.status === filter || (!l.status && filter === 'pending')
  )

  const stats = {
    total: letters.length,
    pending: letters.filter(l => !l.status || l.status === 'pending').length,
    approved: letters.filter(l => l.status === 'approved').length,
    rejected: letters.filter(l => l.status === 'rejected').length,
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Internship Acceptance Letters</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Review and approve trainee internship acceptance letters. Trainees can only access their logbook after approval.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Uploaded', value: stats.total, color: '#0a2e14' },
          { label: 'Pending Review', value: stats.pending, color: '#b45309' },
          { label: 'Approved', value: stats.approved, color: '#16a34a' },
          { label: 'Rejected', value: stats.rejected, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 18px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', border: 'none', textTransform: 'capitalize',
            background: filter === f ? '#0a2e14' : '#f1f5f9',
            color: filter === f ? '#fff' : '#475569',
          }}>
            {f} {f !== 'all' && `(${stats[f] ?? 0})`}
          </button>
        ))}
      </div>

      {/* Letters list */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 700, color: '#0a2e14', fontSize: 16, marginBottom: 6 }}>No letters found</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>No {filter} acceptance letters at this time.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Trainee', 'ID Number', 'File', 'Uploaded', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => {
                const st = STATUS_STYLE[doc.status || 'pending']
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#f0fdf4', border: '2px solid #bbf7d0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {doc.profile?.photo_url
                            ? <img src={doc.profile.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 14 }}>👤</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0a1628' }}>{doc.profile?.full_name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{doc.profile?.phone || doc.profile?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#475569' }}>{doc.profile?.id_number}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ color: '#1a7a3c', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        📄 {doc.file_name?.length > 20 ? doc.file_name.substring(0, 20) + '...' : doc.file_name}
                      </a>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#94a3b8' }}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                      {doc.rejection_reason && (
                        <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4 }}>"{doc.rejection_reason}"</div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => { setSelected(doc); setRejectionReason('') }}
                        style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: doc.status === 'approved' ? '#f1f5f9' : 'linear-gradient(135deg,#0a2e14,#1a7a3c)', color: doc.status === 'approved' ? '#475569' : '#fff' }}
                      >
                        {doc.status === 'approved' ? 'View' : 'Review'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 540, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14' }}>Review Acceptance Letter</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{selected.profile?.full_name} · {selected.profile?.id_number}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Trainee info */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {[
                  ['Phone', selected.profile?.phone || 'N/A'],
                  ['Email', selected.profile?.email],
                  ['Status', selected.profile?.status?.toUpperCase()],
                  ['Uploaded', new Date(selected.uploaded_at).toLocaleDateString('en-GB')],
                ].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
                    <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* View document */}
            <a href={selected.file_url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px', marginBottom: 20, color: '#1a7a3c', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              📄 View Internship Acceptance Letter
            </a>

            {selected.status === 'approved' ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
                <div style={{ fontWeight: 700, color: '#16a34a' }}>Already Approved</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Approved on {new Date(selected.reviewed_at).toLocaleDateString('en-GB')}</div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Rejection Reason (required only if rejecting)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="e.g. Letter is not on company letterhead, missing signature..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => reject(selected)}
                    disabled={actioning}
                    style={{ flex: 1, padding: '12px', borderRadius: 8, background: '#fef2f2', color: '#dc2626', fontWeight: 700, border: '1px solid #fecaca', cursor: 'pointer', fontSize: 14 }}
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => approve(selected)}
                    disabled={actioning}
                    style={{ flex: 2, padding: '12px', borderRadius: 8, background: actioning ? '#ccc' : 'linear-gradient(135deg,#0a2e14,#1a7a3c)', color: '#fff', fontWeight: 700, border: 'none', cursor: actioning ? 'not-allowed' : 'pointer', fontSize: 14 }}
                  >
                    {actioning ? '⏳ Processing...' : '✅ Approve & Unlock Logbook'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
