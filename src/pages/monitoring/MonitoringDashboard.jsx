// src/pages/monitoring/MonitoringDashboard.jsx
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const MONTHS = ['September 2026', 'October 2026', 'November 2026']
const TABS = ['Overview', 'Trainees', 'Instructors', 'Logbooks']

export default function MonitoringDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('Overview')
  const [trainees, setTrainees] = useState([])
  const [instructors, setInstructors] = useState([])
  const [logbooks, setLogbooks] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [notifyModal, setNotifyModal] = useState(null)
  const [notifyMsg, setNotifyMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [downloadingZip, setDownloadingZip] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: t }, { data: i }, { data: l }, { data: r }] = await Promise.all([
      supabase.from('profiles').select('*').eq('role', 'student').neq('email', 'dashedinfa@gmail.com').order('id_number'),
      supabase.from('profiles').select('*').eq('role', 'instructor').neq('email', 'tunez9jaceo@gmail.com'),
      supabase.from('logbook_entries').select('*').order('entry_date'),
      supabase.from('logbook_reviews').select('*'),
    ])
    setTrainees(t || [])
    setInstructors(i || [])
    setLogbooks(l || [])
    setReviews(r || [])
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // ── STATS ──
  const totalTrainees = trainees.length
  const totalEntries = logbooks.length
  const filledEntries = logbooks.filter(e => e.activities_performed?.trim()).length
  const fillPct = totalEntries ? Math.round((filledEntries / totalEntries) * 100) : 0
  const zeroFilled = trainees.filter(t => {
    const tEntries = logbooks.filter(e => e.student_id === t.id)
    return tEntries.length > 0 && !tEntries.some(e => e.activities_performed?.trim())
  }).length
  const allReviewsNeeded = instructors.length * trainees.filter(t =>
    instructors.some(i => i.id === t.instructor_id)
  ).length * MONTHS.length
  const reviewsDone = reviews.length

  // ── PER TRAINEE STATS ──
  function traineeStats(t) {
    const entries = logbooks.filter(e => e.student_id === t.id)
    const filled = entries.filter(e => e.activities_performed?.trim()).length
    const pct = entries.length ? Math.round((filled / entries.length) * 100) : 0
    const myReviews = reviews.filter(r => r.trainee_id === t.id)
    const avgScore = myReviews.length
      ? Math.round(myReviews.reduce((s, r) => s + r.score, 0) / myReviews.length * 10) / 10
      : null
    return { filled, total: entries.length, pct, avgScore, reviews: myReviews }
  }

  // ── PER INSTRUCTOR STATS ──
  function instructorStats(inst) {
    const assigned = trainees.filter(t => t.instructor_id === inst.id)
    const pendingReviews = MONTHS.flatMap((month, idx) =>
      assigned.filter(t => !reviews.some(r => r.trainee_id === t.id && r.month_number === idx + 1))
        .map(t => ({ trainee: t, month }))
    )
    const zeroStudents = assigned.filter(t => {
      const entries = logbooks.filter(e => e.student_id === t.id)
      return entries.length > 0 && !entries.some(e => e.activities_performed?.trim())
    })
    return { assigned, pendingReviews, zeroStudents }
  }

  // ── SEND NOTIFICATION ──
  async function sendNotification() {
    if (!notifyMsg.trim()) { toast.error('Please enter a message'); return }
    setSending(true)
    try {
      const res = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'me_notification',
          to_email: notifyModal.email,
          to_name: notifyModal.full_name,
          message: notifyMsg,
          from_name: profile?.full_name || 'M&E Officer',
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      toast.success(`Notification sent to ${notifyModal.full_name}`)
      setNotifyModal(null)
      setNotifyMsg('')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  // ── DOWNLOAD LOGBOOK ZIP ──
  async function downloadLogbookZip() {
    setDownloadingZip(true)
    toast('Generating logbook ZIP — this may take a moment...')
    try {
      const res = await fetch('/.netlify/functions/generate-logbook-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_by: user.id }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'IDEAS_TVET_All_Logbooks.zip'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('ZIP downloaded!')
    } catch (err) {
      toast.error('Download failed: ' + err.message)
    } finally {
      setDownloadingZip(false)
    }
  }

  function scoreColor(s) {
    if (!s) return '#94a3b8'
    if (s >= 8) return '#16a34a'
    if (s >= 5) return '#b45309'
    return '#dc2626'
  }

  const filteredTrainees = trainees.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .me-root { min-height: 100vh; background: #f0f4f8; font-family: Arial, sans-serif; }
        .me-header { background: linear-gradient(135deg, #1e1b4b, #3730a3); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .me-header-title { color: #fff; font-size: 18px; font-weight: 800; }
        .me-header-sub { color: rgba(255,255,255,0.6); font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        .me-header-welcome { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 2px; }
        .me-signout { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; padding: 8px 14px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
        .me-signout:hover { background: rgba(255,255,255,0.2); }
        .me-tabs { display: flex; gap: 0; background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 24px; overflow-x: auto; }
        .me-tab { padding: 14px 20px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; }
        .me-tab.active { color: #3730a3; border-bottom-color: #3730a3; }
        .me-tab:hover:not(.active) { color: #334155; }
        .me-body { padding: 24px; }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .stat-num { font-size: 32px; font-weight: 900; margin-bottom: 4px; }
        .stat-lbl { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }
        .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 20px; }
        .card-title { font-size: 14px; font-weight: 700; color: #1e1b4b; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
        .trainee-table { width: 100%; border-collapse: collapse; }
        .trainee-table th { text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
        .trainee-table td { padding: 10px 12px; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #334155; vertical-align: middle; }
        .trainee-table tr:hover td { background: #f8fafc; }
        .avatar { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; }
        .avatar-placeholder { width: 34px; height: 34px; border-radius: 50%; background: #f0fdf4; border: 2px solid #bbf7d0; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .pbar-wrap { width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; display: inline-block; }
        .pbar-fill { height: 100%; border-radius: 3px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
        .badge-green { background: #f0fdf4; color: #16a34a; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-red { background: #fef2f2; color: #dc2626; }
        .badge-blue { background: #eff6ff; color: #2563eb; }
        .notify-btn { background: #3730a3; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; font-size: 11px; font-weight: 700; cursor: pointer; }
        .notify-btn:hover { background: #312e81; }
        .inst-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
        .inst-name { font-size: 14px; font-weight: 700; color: #1e1b4b; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; }
        .pending-item { background: #fef9c3; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #854d0e; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .zero-item { background: #fef2f2; border-radius: 6px; padding: 6px 10px; font-size: 12px; color: #dc2626; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
        .download-btn { background: linear-gradient(135deg, #1e1b4b, #3730a3); color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .download-btn:disabled { background: #ccc; cursor: not-allowed; }
        .search-input { width: 100%; padding: 9px 14px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; margin-bottom: 16px; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-box { background: #fff; border-radius: 16px; padding: 28px; max-width: 460px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .progress-ring { position: relative; width: 52px; height: 52px; }
        @media (max-width: 768px) {
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .me-body { padding: 14px; }
          .trainee-table th:nth-child(5), .trainee-table td:nth-child(5) { display: none; }
        }
        @media (max-width: 480px) {
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="me-root">

        {/* HEADER */}
        <div className="me-header">
          <div>
            <div className="me-header-sub">IDEAS-TVET Portal</div>
            <div className="me-header-title">Monitoring & Evaluation</div>
            <div className="me-header-welcome">Welcome, {profile?.full_name || user?.email}</div>
          </div>
          <button className="me-signout" onClick={handleSignOut}>🚪 Sign Out</button>
        </div>

        {/* TABS */}
        <div className="me-tabs">
          {TABS.map(t => (
            <div key={t} className={`me-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</div>
          ))}
        </div>

        <div className="me-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading data...</div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {tab === 'Overview' && (
                <>
                  <div className="stat-grid">
                    <div className="stat-card">
                      <div className="stat-num" style={{ color: '#3730a3' }}>{totalTrainees}</div>
                      <div className="stat-lbl">Total Trainees</div>
                      <div className="stat-sub">{trainees.filter(t => t.status === 'intern').length} active interns</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num" style={{ color: fillPct >= 50 ? '#16a34a' : '#dc2626' }}>{fillPct}%</div>
                      <div className="stat-lbl">Logbook Completion</div>
                      <div className="stat-sub">{filledEntries} of {totalEntries} entries filled</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num" style={{ color: '#b45309' }}>{zeroFilled}</div>
                      <div className="stat-lbl">Inactive Trainees</div>
                      <div className="stat-sub">Zero logbook entries</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-num" style={{ color: '#3730a3' }}>{reviewsDone}</div>
                      <div className="stat-lbl">Reviews Submitted</div>
                      <div className="stat-sub">By {instructors.length} instructors</div>
                    </div>
                  </div>

                  {/* Logbook completion per instructor */}
                  <div className="card">
                    <div className="card-title">📊 Logbook Completion by Instructor</div>
                    {instructors.map(inst => {
                      const { assigned } = instructorStats(inst)
                      const instEntries = logbooks.filter(e => assigned.some(t => t.id === e.student_id))
                      const instFilled = instEntries.filter(e => e.activities_performed?.trim()).length
                      const instPct = instEntries.length ? Math.round((instFilled / instEntries.length) * 100) : 0
                      return (
                        <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <div style={{ width: 140, fontSize: 13, fontWeight: 600, color: '#334155', flexShrink: 0 }}>{inst.full_name}</div>
                          <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${instPct}%`, background: instPct >= 50 ? '#16a34a' : '#f59e0b', borderRadius: 4, transition: 'width 0.3s' }} />
                          </div>
                          <div style={{ width: 44, fontSize: 12, fontWeight: 700, color: instPct >= 50 ? '#16a34a' : '#b45309', textAlign: 'right' }}>{instPct}%</div>
                          <div style={{ width: 60, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{assigned.length} trainees</div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Quick alerts */}
                  <div className="card">
                    <div className="card-title">🚨 Alerts</div>
                    {zeroFilled > 0 && (
                      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 10, fontSize: 13, color: '#dc2626' }}>
                        ⚠️ <strong>{zeroFilled} trainees</strong> have not filled a single logbook entry. Go to <strong>Trainees</strong> tab to see who.
                      </div>
                    )}
                    {instructors.map(inst => {
                      const { pendingReviews } = instructorStats(inst)
                      if (!pendingReviews.length) return null
                      return (
                        <div key={inst.id} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginBottom: 10, fontSize: 13, color: '#92400e' }}>
                          ⏳ <strong>{inst.full_name}</strong> has <strong>{pendingReviews.length} pending reviews</strong> to submit.
                        </div>
                      )
                    })}
                    {zeroFilled === 0 && instructors.every(i => instructorStats(i).pendingReviews.length === 0) && (
                      <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ No alerts — everything is on track!</div>
                    )}
                  </div>
                </>
              )}

              {/* ── TRAINEES ── */}
              {tab === 'Trainees' && (
                <div className="card">
                  <div className="card-title">
                    👥 All Trainees ({totalTrainees})
                    <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>Logbook progress + scores</span>
                  </div>
                  <input
                    className="search-input"
                    placeholder="Search by name or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <div style={{ overflowX: 'auto' }}>
                    <table className="trainee-table">
                      <thead>
                        <tr>
                          <th>Photo</th>
                          <th>Name</th>
                          <th>ID</th>
                          <th>Logbook Progress</th>
                          <th>Avg Score</th>
                          <th>Sept</th>
                          <th>Oct</th>
                          <th>Nov</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrainees.map(t => {
                          const { filled, total, pct, avgScore, reviews: tReviews } = traineeStats(t)
                          const getMonthScore = (n) => tReviews.find(r => r.month_number === n)?.score
                          return (
                            <tr key={t.id}>
                              <td>
                                {t.photo_url
                                  ? <img src={t.photo_url} alt={t.full_name} className="avatar" />
                                  : <div className="avatar-placeholder">👤</div>
                                }
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: '#0a1628' }}>{t.full_name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.phone}</div>
                              </td>
                              <td style={{ fontWeight: 700, fontSize: 12 }}>{t.id_number}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="pbar-wrap">
                                    <div className="pbar-fill" style={{ width: `${pct}%`, background: pct >= 50 ? '#16a34a' : pct > 0 ? '#f59e0b' : '#e2e8f0' }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 50 ? '#16a34a' : '#b45309' }}>{pct}%</span>
                                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{filled}/{total}</span>
                                </div>
                              </td>
                              <td>
                                {avgScore !== null
                                  ? <span style={{ fontWeight: 800, fontSize: 14, color: scoreColor(avgScore) }}>{avgScore}</span>
                                  : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                                }
                              </td>
                              {[1, 2, 3].map(n => {
                                const s = getMonthScore(n)
                                return (
                                  <td key={n}>
                                    {s !== undefined
                                      ? <span style={{ fontWeight: 700, color: scoreColor(s), fontSize: 13 }}>{s}</span>
                                      : <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>
                                    }
                                  </td>
                                )
                              })}
                              <td>
                                <span className={`badge ${filled === 0 ? 'badge-red' : pct >= 50 ? 'badge-green' : 'badge-yellow'}`}>
                                  {filled === 0 ? 'Inactive' : pct >= 50 ? 'Active' : 'Low'}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── INSTRUCTORS ── */}
              {tab === 'Instructors' && (
                <div>
                  {instructors.map(inst => {
                    const { assigned, pendingReviews, zeroStudents } = instructorStats(inst)
                    const allGood = pendingReviews.length === 0 && zeroStudents.length === 0
                    return (
                      <div key={inst.id} className="inst-card">
                        <div className="inst-name">
                          <div>
                            <div>{inst.full_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{inst.email} · {assigned.length} trainees assigned</div>
                          </div>
                          <button className="notify-btn" onClick={() => { setNotifyModal(inst); setNotifyMsg('') }}>
                            📢 Notify
                          </button>
                        </div>

                        {allGood ? (
                          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✅ All reviews submitted, all trainees active</div>
                        ) : (
                          <>
                            {pendingReviews.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  ⏳ Pending Reviews ({pendingReviews.length})
                                </div>
                                {pendingReviews.slice(0, 5).map((p, i) => (
                                  <div key={i} className="pending-item">
                                    {p.trainee.full_name} — {p.month}
                                  </div>
                                ))}
                                {pendingReviews.length > 5 && (
                                  <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 10 }}>+{pendingReviews.length - 5} more pending...</div>
                                )}
                              </div>
                            )}
                            {zeroStudents.length > 0 && (
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                  ⚠️ Inactive Trainees ({zeroStudents.length})
                                </div>
                                {zeroStudents.map(t => (
                                  <div key={t.id} className="zero-item">
                                    {t.full_name} ({t.id_number}) — no logbook entries
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── LOGBOOKS ── */}
              {tab === 'Logbooks' && (
                <div className="card">
                  <div className="card-title">📥 Download All Logbooks</div>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
                    Download a ZIP file containing individual PDF logbooks for all {totalTrainees} trainees.
                    Each PDF contains the trainee's profile and all their filled logbook entries for the
                    internship period (22 Sept – 18 Dec 2026).
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                      {[
                        ['Total Trainees', totalTrainees],
                        ['Entries Filled', filledEntries],
                        ['Completion', `${fillPct}%`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 900, color: '#3730a3' }}>{v}</div>
                          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    className="download-btn"
                    onClick={downloadLogbookZip}
                    disabled={downloadingZip}
                  >
                    {downloadingZip ? '⏳ Generating ZIP...' : '📦 Download All Logbooks (ZIP)'}
                  </button>

                  <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
                    Note: Generation may take 1–2 minutes depending on the number of entries.
                  </p>

                  {/* Per-trainee logbook summary */}
                  <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 12 }}>Logbook Summary per Trainee</div>
                    <input
                      className="search-input"
                      placeholder="Search trainee..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <table className="trainee-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Filled</th>
                          <th>Total</th>
                          <th>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrainees.map(t => {
                          const { filled, total, pct } = traineeStats(t)
                          return (
                            <tr key={t.id}>
                              <td style={{ fontWeight: 700, fontSize: 12 }}>{t.id_number}</td>
                              <td>{t.full_name}</td>
                              <td style={{ fontWeight: 700, color: '#16a34a' }}>{filled}</td>
                              <td style={{ color: '#94a3b8' }}>{total}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div className="pbar-wrap">
                                    <div className="pbar-fill" style={{ width: `${pct}%`, background: pct >= 50 ? '#16a34a' : pct > 0 ? '#f59e0b' : '#e2e8f0' }} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: pct >= 50 ? '#16a34a' : '#b45309' }}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* NOTIFY MODAL */}
      {notifyModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setNotifyModal(null)}>
          <div className="modal-box">
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>Send Notification</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>To: {notifyModal.full_name} ({notifyModal.email})</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Message</div>
              <textarea
                value={notifyMsg}
                onChange={e => setNotifyMsg(e.target.value)}
                placeholder="Type your message to this instructor..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 100, outline: 'none', lineHeight: 1.6 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setNotifyModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={sendNotification} disabled={sending} style={{ flex: 2, padding: '11px', borderRadius: 8, background: sending ? '#ccc' : 'linear-gradient(135deg, #1e1b4b, #3730a3)', color: '#fff', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', border: 'none', fontSize: 13 }}>
                {sending ? 'Sending...' : '📢 Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
