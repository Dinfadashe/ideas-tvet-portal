// src/pages/student/StudentPerformance.jsx
// Student can see their assigned instructor and monthly performance reviews

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

const MONTHS = ['September 2026', 'October 2026', 'November 2026']

export default function StudentPerformance() {
  const { profile } = useAuth()
  const [instructor, setInstructor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchData()
  }, [profile])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch assigned instructor
      if (profile.instructor_id) {
        const { data: inst } = await supabase
          .from('profiles')
          .select('full_name, email, phone, photo_url')
          .eq('id', profile.instructor_id)
          .single()
        setInstructor(inst)
      }

      // Fetch reviews
      const { data: rev } = await supabase
        .from('logbook_reviews')
        .select('*')
        .eq('trainee_id', profile.id)
        .order('month_number')
      setReviews(rev || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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

  function scoreBg(s) {
    if (s >= 8) return '#f0fdf4'
    if (s >= 5) return '#fffbea'
    return '#fef2f2'
  }

  function scoreBorder(s) {
    if (s >= 8) return '#bbf7d0'
    if (s >= 5) return '#fde68a'
    return '#fecaca'
  }

  const avgScore = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1)
    : null

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>My Performance</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>View your assigned instructor and monthly internship performance reviews.</p>
      </div>

      {/* Instructor card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2>👨‍🏫 My Assigned Instructor</h2>
        </div>
        <div className="card-body">
          {!profile.instructor_id ? (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <div style={{ fontWeight: 600, color: '#64748b', fontSize: 14 }}>No instructor assigned yet</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>Your programme administrator will assign an instructor to you shortly.</div>
            </div>
          ) : instructor ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: '#f0fdf4', border: '3px solid #bbf7d0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {instructor.photo_url
                  ? <img src={instructor.photo_url} alt={instructor.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 32 }}>👨‍🏫</span>
                }
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 4 }}>{instructor.full_name}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>📧 {instructor.email}</div>
                {instructor.phone && <div style={{ fontSize: 13, color: '#64748b' }}>📱 {instructor.phone}</div>}
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    IDEAS-TVET Instructor
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading instructor details...</div>
          )}
        </div>
      </div>

      {/* Overall score */}
      {avgScore && (
        <div style={{ background: `linear-gradient(135deg, #0a2e14, #1a7a3c)`, borderRadius: 14, padding: '24px 28px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, fontWeight: 900, color: '#c8a82a', lineHeight: 1 }}>{avgScore}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Average Score</div>
          </div>
          <div style={{ width: 1, height: 60, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Overall Performance</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              Based on {reviews.length} of 3 monthly review{reviews.length !== 1 ? 's' : ''} completed.
              {reviews.length < 3 && ` ${3 - reviews.length} more review${3 - reviews.length !== 1 ? 's' : ''} pending.`}
            </div>
          </div>
        </div>
      )}

      {/* Monthly reviews */}
      <div className="card">
        <div className="card-header">
          <h2>⭐ Monthly Performance Reviews</h2>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {MONTHS.map((month, idx) => {
              const review = reviews.find(r => r.month_number === idx + 1)
              return (
                <div key={month} style={{
                  border: `1px solid ${review ? scoreBorder(review.score) : '#e2e8f0'}`,
                  background: review ? scoreBg(review.score) : '#f8fafc',
                  borderRadius: 12, padding: 20, position: 'relative', overflow: 'hidden',
                }}>
                  {review && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: scoreColor(review.score) }} />
                  )}

                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Month {idx + 1} · {month}
                  </div>

                  {review ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 44, fontWeight: 900, color: scoreColor(review.score), lineHeight: 1 }}>{review.score}</span>
                        <span style={{ fontSize: 18, color: '#94a3b8' }}>/10</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor(review.score), textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                        {scoreLabel(review.score)}
                      </div>

                      {/* Score bar */}
                      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${review.score * 10}%`, background: scoreColor(review.score), borderRadius: 3, transition: 'width 0.6s ease' }} />
                      </div>

                      {review.comments ? (
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontStyle: 'italic', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                          💬 "{review.comments}"
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No additional comments</div>
                      )}

                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>
                        Reviewed {new Date(review.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Not Yet Reviewed</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>Your instructor will submit a review for {month} at the end of the month.</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Info note */}
      <div style={{ background: '#fffbea', border: '1px solid #fde68a', borderRadius: 10, padding: '14px 18px', marginTop: 20, fontSize: 13, color: '#92400e', lineHeight: 1.7 }}>
        ℹ️ Performance reviews are submitted monthly by your assigned instructor based on your logbook entries, punctuality, attitude, and practical skills demonstrated during your internship. Scores range from <strong>1 (Poor)</strong> to <strong>10 (Excellent)</strong>.
      </div>
    </div>
  )
}
