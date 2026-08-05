// src/pages/instructor/InstructorDashboard.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

const MONTHS = ['September 2026', 'October 2026', 'November 2026']

export default function InstructorDashboard() {
  const { user, profile } = useAuth()
  const [trainees, setTrainees] = useState([])
  const [selected, setSelected] = useState(null)
  const [logbook, setLogbook] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(null) // { trainee, month, monthNumber }
  const [score, setScore] = useState(5)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

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
      .order('created_at', { ascending: false })
    setLogbook(data || [])
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

  const filtered = trainees.filter(t =>
    t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.id_number?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: trainees.length,
    withAcceptance: trainees.filter(t => t.status === 'intern').length,
    reviewed: new Set(reviews.map(r => r.trainee_id)).size,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Arial, sans-serif' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>IDEAS-TVET Portal</div>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginTop: 2 }}>Instructor Dashboard</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 }}>
            Welcome, {profile?.full_name || user?.email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ color: '#c8a82a', fontSize: 22, fontWeight: 900 }}>{stats.total}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Assigned</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ color: '#4ade80', fontSize: 22, fontWeight: 900 }}>{stats.withAcceptance}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>On Internship</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: 'calc(100vh - 90px)' }}>

        {/* ── TRAINEE LIST ── */}
        <div style={{ background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <input
              type="text"
              placeholder="Search trainees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading trainees...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                {trainees.length === 0 ? 'No trainees assigned to you yet.' : 'No results found.'}
              </div>
            ) : filtered.map(t => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f8fafc',
                  cursor: 'pointer',
                  background: selected?.id === t.id ? '#f0fdf4' : '#fff',
                  borderLeft: selected?.id === t.id ? '3px solid #1a7a3c' : '3px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 12,
                  transition: 'all 0.1s',
                }}
              >
                {/* Photo */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#f0fdf4', border: '2px solid #bbf7d0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.photo_url
                    ? <img src={t.photo_url} alt={t.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18 }}>👤</span>
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0a2e14', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.full_name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.id_number}</div>
                </div>

                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: t.status === 'intern' ? '#16a34a' : '#94a3b8',
                  flexShrink: 0,
                }} title={t.status} />
              </div>
            ))}
          </div>
        </div>

        {/* ── TRAINEE DETAIL ── */}
        <div style={{ overflowY: 'auto', padding: 24 }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 48 }}>👈</div>
              <div style={{ fontSize: 15, color: '#94a3b8' }}>Select a trainee to view their details</div>
            </div>
          ) : (
            <div>

              {/* Profile card */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden', background: '#f0fdf4', border: '3px solid #bbf7d0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selected.photo_url
                    ? <img src={selected.photo_url} alt={selected.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 36 }}>👤</span>
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0a2e14', marginBottom: 4 }}>{selected.full_name}</div>
                  <div style={{ display: 'inline-block', background: '#1a7a3c', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, marginBottom: 12 }}>{selected.id_number}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px 16px' }}>
                    {[
                      ['📱 Phone', selected.phone || 'N/A'],
                      ['🧑 Gender', selected.gender || 'N/A'],
                      ['📍 State', selected.state_of_origin || 'N/A'],
                      ['🎂 DOB', selected.date_of_birth || 'N/A'],
                      ['📊 Status', selected.status?.toUpperCase() || 'N/A'],
                      ['📧 Email', selected.email || 'N/A'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, marginTop: 1 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Internship details */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e14', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🏢 Internship Details
                </div>
                {selected.internship_company || selected.internship_address ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                    {[
                      ['Company / Organisation', selected.internship_company || 'Not provided'],
                      ['Company Address', selected.internship_address || 'Not provided'],
                      ['Supervisor Name', selected.internship_supervisor || 'Not provided'],
                      ['Supervisor Phone', selected.internship_supervisor_phone || 'Not provided'],
                      ['Start Date', '15th September 2026'],
                      ['End Date', '15th December 2026'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                    This trainee has not yet provided internship company details. Details will appear here once their logbook is filled.
                  </div>
                )}
              </div>

              {/* Monthly Reviews */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e14', marginBottom: 14 }}>⭐ Monthly Reviews</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {MONTHS.map((month, idx) => {
                    const review = getReview(idx + 1)
                    return (
                      <div key={month} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, position: 'relative', overflow: 'hidden' }}>
                        {review && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${scoreColor(review.score)}, ${scoreColor(review.score)}88)` }} />
                        )}

                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{month}</div>

                        {review ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                              <span style={{ fontSize: 36, fontWeight: 900, color: scoreColor(review.score) }}>{review.score}</span>
                              <span style={{ fontSize: 16, color: '#94a3b8' }}>/10</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor(review.score), marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{scoreLabel(review.score)}</div>
                            {review.comments && (
                              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 10, fontStyle: 'italic' }}>"{review.comments}"</div>
                            )}
                            <button
                              onClick={() => { setReviewModal({ month, monthNumber: idx + 1 }); setScore(review.score); setComments(review.comments || '') }}
                              style={{ fontSize: 11, color: '#1a7a3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                            >
                              Edit Review ✏️
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12, fontStyle: 'italic' }}>No review yet</div>
                            <button
                              onClick={() => { setReviewModal({ month, monthNumber: idx + 1 }); setScore(5); setComments('') }}
                              style={{ background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}
                            >
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
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e14', marginBottom: 14 }}>📋 Logbook Entries</div>

                {logbook.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                    This trainee has not submitted any logbook entries yet.
                  </div>
                ) : logbook.map(entry => (
                  <div key={entry.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#0a2e14' }}>{entry.week_title || `Week ${entry.week_number}`}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(entry.created_at).toLocaleDateString('en-GB')}</div>
                    </div>
                    {entry.activities && (
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, marginBottom: 6 }}>{entry.activities}</div>
                    )}
                    {entry.skills_learned && (
                      <div style={{ fontSize: 12, color: '#64748b' }}><strong>Skills:</strong> {entry.skills_learned}</div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── REVIEW MODAL ── */}
      {reviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => e.target === e.currentTarget && setReviewModal(null)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 4 }}>Monthly Review</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>{selected?.full_name} · {reviewModal.month}</div>

            {/* Score selector */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 12 }}>Performance Score (1–10)</div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    style={{
                      width: 44, height: 44,
                      borderRadius: 8,
                      border: score === n ? `2px solid ${scoreColor(n)}` : '2px solid #e2e8f0',
                      background: score === n ? scoreColor(n) : '#fff',
                      color: score === n ? '#fff' : '#475569',
                      fontWeight: 800, fontSize: 16,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(score) }}>{score}/10</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor(score) }}>{scoreLabel(score)}</div>
              </div>
            </div>

            {/* Comments */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Comments / Feedback</div>
              <textarea
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Describe the trainee's performance, areas of improvement, strengths observed..."
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, resize: 'vertical', minHeight: 100, outline: 'none', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setReviewModal(null)}
                style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                Cancel
              </button>
              <button
                onClick={submitReview}
                disabled={submitting}
                style={{ flex: 2, padding: '12px', borderRadius: 8, background: submitting ? '#ccc' : 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', border: 'none', fontSize: 14 }}
              >
                {submitting ? 'Submitting...' : '✅ Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
