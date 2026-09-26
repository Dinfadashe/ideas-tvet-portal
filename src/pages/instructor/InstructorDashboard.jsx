// src/pages/instructor/InstructorDashboard.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const MONTHS = ['September 2026', 'October 2026', 'November 2026']

export default function InstructorDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [trainees, setTrainees] = useState([])
  const [selected, setSelected] = useState(null)
  const [logbook, setLogbook] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null)
  const [score, setScore] = useState(5)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [showDetail, setShowDetail] = useState(false)
  const [openWeeks, setOpenWeeks] = useState({})

  useEffect(() => { if (user) fetchTrainees() }, [user])
  useEffect(() => { if (selected) { fetchLogbook(); fetchReviews() } }, [selected])

  async function fetchTrainees() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('instructor_id', user.id)
      .order('id_number')
    setTrainees(data || [])
    setLoading(false)
  }

  async function fetchLogbook() {
    if (!selected) return
    const { data } = await supabase
      .from('logbook_entries')
      .select('*')
      .eq('student_id', selected.id)
      .order('entry_date', { ascending: true })
    setLogbook(data || [])
    // Auto-open week 1
    setOpenWeeks({ 1: true })
  }

  async function fetchReviews() {
    if (!selected) return
    const { data } = await supabase
      .from('logbook_reviews')
      .select('*')
      .eq('trainee_id', selected.id)
      .eq('instructor_id', user.id)
      .order('month_number')
    setReviews(data || [])
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  function selectTrainee(t) {
    setSelected(t)
    setShowDetail(true)
  }

  function toggleWeek(w) {
    setOpenWeeks(prev => ({ ...prev, [w]: !prev[w] }))
  }

  async function submitReview() {
    if (!reviewModal) return
    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('logbook_reviews')
        .upsert({
          trainee_id: selected.id,
          instructor_id: user.id,
          month: reviewModal.month,
          month_number: reviewModal.monthNumber,
          score,
          comments,
        }, { onConflict: 'trainee_id,month_number' })
      if (error) throw error
      toast.success(`Review submitted for ${reviewModal.month}`)
      setReviewModal(null)
      setScore(5)
      setComments('')
      fetchReviews()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function getReview(monthNumber) {
    return reviews.find(r => r.month_number === monthNumber)
  }

  function scoreColor(s) {
    if (s >= 8) return '#16a34a'
    if (s >= 5) return '#b45309'
    return '#dc2626'
  }

  function scoreLabel(s) {
    if (s >= 9) return 'Excellent'
    if (s >= 7) return 'Good'
    if (s >= 5) return 'Average'
    if (s >= 3) return 'Below Average'
    return 'Poor'
  }

  // Group logbook by week
  const weeks = logbook.reduce((acc, e) => {
    const w = e.week_number
    if (!acc[w]) acc[w] = []
    acc[w].push(e)
    return acc
  }, {})

  const totalFilled = logbook.filter(e => e.activities_performed?.trim()).length
  const totalEntries = logbook.length

  const filtered = trainees.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: trainees.length,
    withAcceptance: trainees.filter(t => t.status === 'intern').length,
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .instructor-root { min-height: 100vh; background: #f0f4f8; font-family: Arial, sans-serif; }
        .inst-header { background: linear-gradient(135deg, #0a2e14, #1a7a3c); padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .inst-header-left .label { color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
        .inst-header-left .title { color: #fff; font-size: 18px; font-weight: 800; margin-top: 2px; }
        .inst-header-left .welcome { color: rgba(255,255,255,0.6); font-size: 12px; margin-top: 2px; }
        .inst-header-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .stat-pill { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 8px 14px; text-align: center; }
        .stat-pill .num { font-size: 20px; font-weight: 900; }
        .stat-pill .lbl { color: rgba(255,255,255,0.6); font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        .signout-btn { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); border-radius: 8px; padding: 9px 14px; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .signout-btn:hover { background: rgba(255,255,255,0.22); }
        .inst-body { display: grid; grid-template-columns: 300px 1fr; height: calc(100vh - 80px); }
        .trainee-list { background: #fff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; overflow: hidden; }
        .trainee-search { padding: 12px; border-bottom: 1px solid #f1f5f9; }
        .trainee-search input { width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 13px; outline: none; }
        .trainee-items { flex: 1; overflow-y: auto; }
        .trainee-item { padding: 12px 14px; border-bottom: 1px solid #f8fafc; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.1s; }
        .trainee-item.active { background: #f0fdf4; border-left: 3px solid #1a7a3c; }
        .trainee-item:not(.active) { border-left: 3px solid transparent; }
        .trainee-avatar { width: 38px; height: 38px; border-radius: 50%; overflow: hidden; background: #f0fdf4; border: 2px solid #bbf7d0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 17px; }
        .trainee-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .trainee-name { font-weight: 700; font-size: 13px; color: #0a2e14; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .trainee-id { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .detail-panel { overflow-y: auto; padding: 20px; }
        .empty-state { display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column; gap: 10px; }
        .card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .card-title { font-size: 13px; font-weight: 700; color: #0a2e14; margin-bottom: 14px; }
        .profile-card { display: flex; gap: 16px; align-items: flex-start; }
        .profile-photo { width: 70px; height: 70px; border-radius: 10px; overflow: hidden; background: #f0fdf4; border: 3px solid #bbf7d0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 32px; }
        .profile-photo img { width: 100%; height: 100%; object-fit: cover; }
        .profile-name { font-size: 18px; font-weight: 800; color: #0a2e14; margin-bottom: 4px; }
        .profile-badge { display: inline-block; background: #1a7a3c; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 20px; margin-bottom: 10px; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; }
        .profile-field-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        .profile-field-value { font-size: 12px; color: #334155; font-weight: 500; margin-top: 1px; }
        .reviews-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .review-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; position: relative; overflow: hidden; }
        .review-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
        .review-month { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .review-score-big { font-size: 32px; font-weight: 900; }
        .review-score-denom { font-size: 14px; color: #94a3b8; }
        .review-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .review-comment { font-size: 11px; color: #64748b; line-height: 1.5; margin-bottom: 8px; font-style: italic; }
        .edit-btn { font-size: 11px; color: #1a7a3c; background: none; border: none; cursor: pointer; font-weight: 600; padding: 0; }
        .add-review-btn { background: linear-gradient(135deg, #0a2e14, #1a7a3c); color: #fff; border: none; border-radius: 6px; padding: 7px 10px; font-size: 11px; font-weight: 700; cursor: pointer; width: 100%; }
        .back-btn { display: none; align-items: center; gap: 6px; background: none; border: none; color: #1a7a3c; font-size: 14px; font-weight: 700; cursor: pointer; padding: 0 0 14px 0; }
        .week-header { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; margin-bottom: 4px; }
        .week-header:hover { background: #f0fdf4; }
        .week-title { font-weight: 700; font-size: 13px; color: #0a2e14; display: flex; align-items: center; gap: 8px; }
        .week-progress { display: flex; align-items: center; gap: 8px; }
        .progress-bar { width: 60px; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
        .progress-fill { height: 100%; background: #2db84b; border-radius: 2px; }
        .entry-row { padding: 12px 14px; border-left: 3px solid #e2e8f0; margin: 2px 0 2px 8px; background: #fff; border-radius: 0 6px 6px 0; }
        .entry-row.filled { border-left-color: #2db84b; }
        .entry-row.empty { border-left-color: #fde68a; }
        .entry-date-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; flex-wrap: wrap; gap: 4px; }
        .entry-day { font-weight: 600; font-size: 13px; color: #334155; }
        .entry-date { font-size: 11px; color: #94a3b8; }
        .entry-badge-filled { font-size: 10px; background: #f0fdf4; color: #16a34a; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
        .entry-badge-empty { font-size: 10px; background: #fef9c3; color: #854d0e; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
        .entry-content { margin-top: 6px; display: grid; gap: 4px; }
        .entry-field-label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; }
        .entry-field-value { font-size: 12px; color: #334155; line-height: 1.5; }
        .diagram-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #3b82f6; font-weight: 600; text-decoration: none; margin-top: 4px; }
        .logbook-progress-bar { display: flex; align-items: center; gap: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; }
        @media (max-width: 768px) {
          .inst-header { padding: 14px 16px; }
          .inst-header-left .title { font-size: 16px; }
          .stat-pill { padding: 6px 10px; }
          .stat-pill .num { font-size: 17px; }
          .inst-body { grid-template-columns: 1fr; height: auto; min-height: calc(100vh - 70px); }
          .trainee-list { display: flex; height: calc(100vh - 70px); }
          .trainee-list.hidden-mobile { display: none; }
          .detail-panel { padding: 14px; }
          .detail-panel.hidden-mobile { display: none; }
          .back-btn { display: flex; }
          .profile-card { flex-direction: column; align-items: center; text-align: center; }
          .profile-grid { grid-template-columns: 1fr 1fr; }
          .reviews-grid { grid-template-columns: 1fr; }
          .inst-header-right { width: 100%; justify-content: space-between; }
        }
        @media (max-width: 480px) {
          .inst-header-right { flex-wrap: wrap; gap: 8px; }
          .profile-grid { grid-template-columns: 1fr; }
          .signout-btn { font-size: 12px; padding: 8px 10px; }
        }
      `}</style>

      <div className="instructor-root">

        {/* HEADER */}
        <div className="inst-header">
          <div className="inst-header-left">
            <div className="label">IDEAS-TVET Portal</div>
            <div className="title">Instructor Dashboard</div>
            <div className="welcome">Welcome, {profile?.full_name || user?.email}</div>
          </div>
          <div className="inst-header-right">
            <div className="stat-pill">
              <div className="num" style={{ color: '#c8a82a' }}>{stats.total}</div>
              <div className="lbl">Assigned</div>
            </div>
            <div className="stat-pill">
              <div className="num" style={{ color: '#4ade80' }}>{stats.withAcceptance}</div>
              <div className="lbl">On Internship</div>
            </div>
            <button className="signout-btn" onClick={handleSignOut}>
              🚪 Sign Out
            </button>
          </div>
        </div>

        <div className="inst-body">

          {/* TRAINEE LIST */}
          <div className={`trainee-list${showDetail ? ' hidden-mobile' : ''}`}>
            <div className="trainee-search">
              <input
                type="text"
                placeholder="Search trainees..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="trainee-items">
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading trainees...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  {trainees.length === 0 ? 'No trainees assigned to you yet.' : 'No results found.'}
                </div>
              ) : filtered.map(t => (
                <div
                  key={t.id}
                  className={`trainee-item${selected?.id === t.id ? ' active' : ''}`}
                  onClick={() => selectTrainee(t)}
                >
                  <div className="trainee-avatar">
                    {t.photo_url ? <img src={t.photo_url} alt={t.full_name} /> : '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="trainee-name">{t.full_name}</div>
                    <div className="trainee-id">{t.id_number}</div>
                  </div>
                  <div className="status-dot" style={{ background: t.status === 'intern' ? '#16a34a' : '#94a3b8' }} title={t.status} />
                </div>
              ))}
            </div>
          </div>

          {/* DETAIL PANEL */}
          <div className={`detail-panel${!showDetail ? ' hidden-mobile' : ''}`}>
            {showDetail && (
              <button className="back-btn" onClick={() => setShowDetail(false)}>
                ← Back to Trainees
              </button>
            )}

            {!selected ? (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>👈</div>
                <div style={{ fontSize: 14, color: '#94a3b8' }}>Select a trainee to view their details</div>
              </div>
            ) : (
              <div>

                {/* Profile card */}
                <div className="card">
                  <div className="profile-card">
                    <div className="profile-photo">
                      {selected.photo_url ? <img src={selected.photo_url} alt={selected.full_name} /> : '👤'}
                    </div>
                    <div style={{ flex: 1, width: '100%' }}>
                      <div className="profile-name">{selected.full_name}</div>
                      <div className="profile-badge">{selected.id_number}</div>
                      <div className="profile-grid">
                        {[
                          ['📱 Phone', selected.phone || 'N/A'],
                          ['🧑 Gender', selected.gender || 'N/A'],
                          ['📍 State', selected.state_of_origin || 'N/A'],
                          ['🎂 DOB', selected.date_of_birth || 'N/A'],
                          ['📊 Status', selected.status?.toUpperCase() || 'N/A'],
                          ['📧 Email', selected.email || 'N/A'],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <div className="profile-field-label">{label}</div>
                            <div className="profile-field-value">{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Reviews */}
                <div className="card">
                  <div className="card-title">⭐ Monthly Reviews</div>
                  <div className="reviews-grid">
                    {MONTHS.map((month, idx) => {
                      const review = getReview(idx + 1)
                      return (
                        <div key={month} className="review-card">
                          {review && (
                            <div className="review-bar" style={{ background: `linear-gradient(90deg, ${scoreColor(review.score)}, ${scoreColor(review.score)}88)` }} />
                          )}
                          <div className="review-month">{month}</div>
                          {review ? (
                            <div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                                <span className="review-score-big" style={{ color: scoreColor(review.score) }}>{review.score}</span>
                                <span className="review-score-denom">/10</span>
                              </div>
                              <div className="review-label" style={{ color: scoreColor(review.score) }}>{scoreLabel(review.score)}</div>
                              {review.comments && <div className="review-comment">"{review.comments}"</div>}
                              <button className="edit-btn" onClick={() => { setReviewModal({ month, monthNumber: idx + 1 }); setScore(review.score); setComments(review.comments || '') }}>
                                Edit Review ✏️
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10, fontStyle: 'italic' }}>No review yet</div>
                              <button className="add-review-btn" onClick={() => { setReviewModal({ month, monthNumber: idx + 1 }); setScore(5); setComments('') }}>
                                + Add Review
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Logbook Entries */}
                <div className="card">
                  <div className="card-title">📋 Logbook Entries</div>

                  {/* Progress bar */}
                  {totalEntries > 0 && (
                    <div className="logbook-progress-bar">
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0a2e14' }}>{totalFilled} of {totalEntries} entries filled</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>{Math.round((totalFilled / totalEntries) * 100)}%</span>
                        </div>
                        <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(totalFilled / totalEntries) * 100}%`, background: '#2db84b', borderRadius: 3 }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {logbook.length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
                      No logbook entries found for this trainee.
                    </div>
                  ) : (
                    Object.entries(weeks).map(([week, weekEntries]) => {
                      const weekFilled = weekEntries.filter(e => e.activities_performed?.trim()).length
                      const isOpen = openWeeks[week]
                      const firstDate = weekEntries[0]?.entry_date
                      const lastDate = weekEntries[weekEntries.length - 1]?.entry_date
                      return (
                        <div key={week} style={{ marginBottom: 8 }}>
                          {/* Week header */}
                          <div className="week-header" onClick={() => toggleWeek(week)}>
                            <div className="week-title">
                              <span>{isOpen ? '▾' : '▸'}</span>
                              <span>Week {week}</span>
                              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                                {firstDate && new Date(firstDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                {' – '}
                                {lastDate && new Date(lastDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <div className="week-progress">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${(weekFilled / weekEntries.length) * 100}%` }} />
                              </div>
                              <span style={{ fontSize: 11, color: '#64748b' }}>{weekFilled}/{weekEntries.length}</span>
                            </div>
                          </div>

                          {/* Week entries */}
                          {isOpen && weekEntries.map(entry => {
                            const filled = entry.activities_performed?.trim()
                            const isPDF = entry.diagram_url?.toLowerCase().includes('.pdf')
                            return (
                              <div key={entry.id} className={`entry-row ${filled ? 'filled' : 'empty'}`}>
                                <div className="entry-date-row">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span className="entry-day">{entry.day_of_week}</span>
                                    <span className="entry-date">
                                      {new Date(entry.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>
                                  {filled
                                    ? <span className="entry-badge-filled">✓ Filled</span>
                                    : <span className="entry-badge-empty">Not filled</span>
                                  }
                                </div>

                                {filled && (
                                  <div className="entry-content">
                                    {entry.arrival_time && (
                                      <div>
                                        <span className="entry-field-label">Time: </span>
                                        <span className="entry-field-value">{entry.arrival_time} – {entry.departure_time}</span>
                                      </div>
                                    )}
                                    <div>
                                      <div className="entry-field-label">Activities Performed</div>
                                      <div className="entry-field-value">{entry.activities_performed}</div>
                                    </div>
                                    {entry.skills_acquired && (
                                      <div>
                                        <div className="entry-field-label">Skills Acquired</div>
                                        <div className="entry-field-value">{entry.skills_acquired}</div>
                                      </div>
                                    )}
                                    {entry.challenges && (
                                      <div>
                                        <div className="entry-field-label">Challenges</div>
                                        <div className="entry-field-value">{entry.challenges}</div>
                                      </div>
                                    )}
                                    {entry.diagram_url && (
                                      <div>
                                        <a href={entry.diagram_url} target="_blank" rel="noreferrer" className="diagram-link">
                                          📎 {isPDF ? 'View Diagram PDF' : 'View Diagram'}
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* REVIEW MODAL */}
        {reviewModal && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => e.target === e.currentTarget && setReviewModal(null)}
          >
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, maxWidth: 460, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0a2e14', marginBottom: 4 }}>Monthly Review</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>{selected?.full_name} · {reviewModal.month}</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Performance Score (1–10)</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setScore(n)} style={{ width: 40, height: 40, borderRadius: 8, border: score === n ? `2px solid ${scoreColor(n)}` : '2px solid #e2e8f0', background: score === n ? scoreColor(n) : '#fff', color: score === n ? '#fff' : '#475569', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{n}</button>
                  ))}
                </div>
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: scoreColor(score) }}>{score}/10</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor(score) }}>{scoreLabel(score)}</div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Comments / Feedback</div>
                <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Describe the trainee's performance, areas of improvement, strengths observed..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 90, outline: 'none', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setReviewModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button onClick={submitReview} disabled={submitting} style={{ flex: 2, padding: '11px', borderRadius: 8, background: submitting ? '#ccc' : 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', border: 'none', fontSize: 13 }}>{submitting ? 'Submitting...' : '✅ Submit Review'}</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
