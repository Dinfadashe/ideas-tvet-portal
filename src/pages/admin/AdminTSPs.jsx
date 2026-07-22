// src/pages/admin/AdminTSPs.jsx
// Master admin view — approve/reject TSP registrations and renewals

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  pending:  { bg: '#fffbea', color: '#92400e', border: '#fde68a' },
  approved: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  rejected: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  expired:  { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' },
  suspended:{ bg: '#fff7ed', color: '#9a3412', border: '#fed7aa' },
}

export default function AdminTSPs() {
  const [tsps, setTsps] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [rejectionReason, setRejectionReason] = useState('')
  const [actioning, setActioning] = useState(false)

  useEffect(() => { fetchTSPs() }, [])

  async function fetchTSPs() {
    setLoading(true)
    const { data } = await supabase
      .from('tsp_accounts')
      .select('*')
      .order('created_at', { ascending: false })
    setTsps(data || [])
    setLoading(false)
  }

  async function approveTSP(tsp) {
    setActioning(true)
    try {
      const now = new Date()
      const expiry = new Date(now)
      expiry.setDate(expiry.getDate() + 365)

      const { error } = await supabase
        .from('tsp_accounts')
        .update({
          status: 'approved',
          subscription_start: now.toISOString(),
          subscription_end: expiry.toISOString(),
          approved_by: 'dinfadashe@gmail.com',
          approved_at: now.toISOString(),
          renewal_status: 'none',
        })
        .eq('id', tsp.id)

      if (error) throw error

      // Send approval email
      await fetch('/.netlify/functions/send-tsp-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'approved',
          org_name: tsp.org_name,
          email: tsp.email,
          expiry_date: expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        }),
      })

      toast.success(`${tsp.org_name} approved! Subscription active until ${expiry.toLocaleDateString()}`)
      setSelected(null)
      fetchTSPs()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActioning(false)
    }
  }

  async function rejectTSP(tsp) {
    if (!rejectionReason.trim()) { toast.error('Please provide a rejection reason'); return }
    setActioning(true)
    try {
      const { error } = await supabase
        .from('tsp_accounts')
        .update({ status: 'rejected', rejection_reason: rejectionReason })
        .eq('id', tsp.id)
      if (error) throw error

      await fetch('/.netlify/functions/send-tsp-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'rejected', org_name: tsp.org_name, email: tsp.email, reason: rejectionReason }),
      })

      toast.success(`${tsp.org_name} rejected.`)
      setSelected(null)
      setRejectionReason('')
      fetchTSPs()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActioning(false)
    }
  }

  async function approveRenewal(tsp) {
    setActioning(true)
    try {
      // Extend from current expiry or from now if already expired
      const base = tsp.subscription_end && new Date(tsp.subscription_end) > new Date()
        ? new Date(tsp.subscription_end)
        : new Date()
      const newExpiry = new Date(base)
      newExpiry.setDate(newExpiry.getDate() + 365)

      const { error } = await supabase
        .from('tsp_accounts')
        .update({
          status: 'approved',
          subscription_end: newExpiry.toISOString(),
          renewal_status: 'approved',
          payment_receipt_url: tsp.renewal_receipt_url,
          approved_at: new Date().toISOString(),
          approved_by: 'dinfadashe@gmail.com',
        })
        .eq('id', tsp.id)
      if (error) throw error

      await fetch('/.netlify/functions/send-tsp-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'renewal_approved',
          org_name: tsp.org_name,
          email: tsp.email,
          expiry_date: newExpiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
        }),
      })

      toast.success(`Renewal approved for ${tsp.org_name}!`)
      setSelected(null)
      fetchTSPs()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setActioning(false)
    }
  }

  const filtered = filter === 'all' ? tsps : tsps.filter(t => t.status === filter)

  const stats = {
    total: tsps.length,
    pending: tsps.filter(t => t.status === 'pending').length,
    approved: tsps.filter(t => t.status === 'approved').length,
    expired: tsps.filter(t => t.status === 'expired').length,
    renewal_pending: tsps.filter(t => t.renewal_status === 'pending').length,
  }

  function daysLeft(tsp) {
    if (!tsp.subscription_end) return null
    const diff = Math.ceil((new Date(tsp.subscription_end) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a1628' }}>TSP Management</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Review, approve and manage Training Service Provider subscriptions.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total TSPs', value: stats.total, color: '#0a2e14' },
          { label: 'Pending', value: stats.pending, color: '#92400e' },
          { label: 'Active', value: stats.approved, color: '#166534' },
          { label: 'Expired', value: stats.expired, color: '#475569' },
          { label: 'Renewal Pending', value: stats.renewal_pending, color: '#9a3412' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'expired', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filter === f ? '#0a2e14' : '#f1f5f9',
            color: filter === f ? '#fff' : '#475569', border: 'none',
            textTransform: 'capitalize',
          }}>{f} {f === 'all' ? `(${stats.total})` : ''}</button>
        ))}
      </div>

      {/* TSP List */}
      <div style={{ display: 'grid', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No TSPs found.</div>
        ) : filtered.map(tsp => {
          const sc = STATUS_COLORS[tsp.status] || STATUS_COLORS.pending
          const days = daysLeft(tsp)
          return (
            <div key={tsp.id} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
              onClick={() => setSelected(tsp)}>

              {/* Logo */}
              <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tsp.logo_url ? (
                  <img src={tsp.logo_url} alt={tsp.org_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : <span style={{ fontSize: 24 }}>🏢</span>}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0a1628', fontSize: 15 }}>{tsp.org_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{tsp.email} · {tsp.trade || 'No trade specified'}</div>
                {tsp.renewal_status === 'pending' && (
                  <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 700, marginTop: 4 }}>⚠️ Renewal receipt pending review</div>
                )}
              </div>

              {/* Days left */}
              {tsp.status === 'approved' && days !== null && (
                <div style={{ textAlign: 'center', padding: '6px 12px', borderRadius: 8, background: days < 30 ? '#fef2f2' : '#f0fdf4' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: days < 30 ? '#dc2626' : '#16a34a' }}>{days}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>days left</div>
                </div>
              )}

              {/* Status badge */}
              <div style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                {tsp.status}
              </div>
            </div>
          )
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a2e14' }}>{selected.org_name}</h2>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Registered: {new Date(selected.created_at).toLocaleDateString('en-GB')}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Details grid */}
            {[
              ['Email', selected.email],
              ['Phone', selected.phone],
              ['CAC Number', selected.cac_number],
              ['Trade', selected.trade],
              ['Training Venue', selected.training_venue],
              ['MD/CEO', selected.md_name],
              ['MD Email', selected.md_email],
              ['Programme Manager', selected.pm_name],
              ['PM Phone', selected.pm_phone],
              ['PM Email', selected.pm_email],
              ['Bank Account', selected.account_name ? `${selected.account_name} · ${selected.account_number} · ${selected.bank_name}` : null],
              ['Payment Date', selected.payment_date],
              ['Payment Ref', selected.payment_ref],
              ['Subscription End', selected.subscription_end ? new Date(selected.subscription_end).toLocaleDateString('en-GB') : null],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', width: 140, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{value}</span>
              </div>
            ))}

            {/* Receipt links */}
            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {selected.payment_receipt_url && (
                <a href={selected.payment_receipt_url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#1a7a3c', fontWeight: 600, textDecoration: 'none' }}>
                  📄 View Payment Receipt
                </a>
              )}
              {selected.renewal_receipt_url && (
                <a href={selected.renewal_receipt_url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#9a3412', fontWeight: 600, textDecoration: 'none' }}>
                  📄 View Renewal Receipt
                </a>
              )}
              {selected.logo_url && (
                <a href={selected.logo_url} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#475569', fontWeight: 600, textDecoration: 'none' }}>
                  🖼️ View Logo
                </a>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: 24, display: 'flex', gap: 12, flexDirection: 'column' }}>
              {selected.status === 'pending' && (
                <>
                  <button onClick={() => approveTSP(selected)} disabled={actioning}
                    style={{ padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                    ✅ Approve & Activate (365 days)
                  </button>
                  <div>
                    <textarea
                      placeholder="Rejection reason (required to reject)..."
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, marginBottom: 8, resize: 'vertical', minHeight: 80 }}
                    />
                    <button onClick={() => rejectTSP(selected)} disabled={actioning}
                      style={{ padding: '10px', width: '100%', borderRadius: 10, background: '#dc2626', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                      ❌ Reject Registration
                    </button>
                  </div>
                </>
              )}
              {selected.renewal_status === 'pending' && (
                <button onClick={() => approveRenewal(selected)} disabled={actioning}
                  style={{ padding: '12px', borderRadius: 10, background: 'linear-gradient(135deg, #c8a82a, #e8c84a)', color: '#0a2e14', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>
                  🔄 Approve Renewal (+365 days)
                </button>
              )}
              {(selected.status === 'approved' || selected.status === 'expired') && selected.renewal_status !== 'pending' && (
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                  {selected.status === 'approved' ? `Active — expires ${new Date(selected.subscription_end).toLocaleDateString('en-GB')}` : 'Subscription expired — waiting for renewal'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
