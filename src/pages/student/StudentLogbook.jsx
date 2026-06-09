import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { BookOpen, ChevronDown, ChevronRight, Save, Lock, Calendar } from 'lucide-react'

export default function StudentLogbook() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [openWeeks, setOpenWeeks] = useState({ 1: true })

  const isIntern = profile?.status === 'intern'

  useEffect(() => {
    if (profile?.id) fetchEntries()
  }, [profile?.id])

  async function fetchEntries() {
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('student_id', profile.id)
        .order('entry_date')
      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      toast.error('Failed to load logbook.')
    } finally {
      setLoading(false)
    }
  }

  function startEditing(entry) {
    setEditing(entry.id)
    setForm({
      arrival_time: entry.arrival_time || '',
      departure_time: entry.departure_time || '',
      activities_performed: entry.activities_performed || '',
      skills_acquired: entry.skills_acquired || '',
      challenges: entry.challenges || '',
    })
  }

  async function saveEntry(entryId) {
    if (!form.activities_performed?.trim()) {
      toast.error('Activities performed is required.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('logbook_entries')
        .update({ ...form, is_submitted: true })
        .eq('id', entryId)
        .eq('student_id', profile.id)
      if (error) throw error
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, ...form, is_submitted: true } : e))
      setEditing(null)
      toast.success('Entry saved!')
    } catch (err) {
      toast.error('Failed to save entry.')
    } finally {
      setSaving(false)
    }
  }

  function toggleWeek(w) {
    setOpenWeeks(prev => ({ ...prev, [w]: !prev[w] }))
  }

  // Group by week
  const weeks = entries.reduce((acc, e) => {
    const w = e.week_number
    if (!acc[w]) acc[w] = []
    acc[w].push(e)
    return acc
  }, {})

  const totalFilled = entries.filter(e => e.activities_performed?.trim()).length
  const totalEntries = entries.length

  if (!isIntern) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Logbook</h1>
        </div>
        <div className="empty-state" style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: '64px 32px' }}>
          <BookOpen size={48} style={{ margin: '0 auto 16px', display: 'block', color: '#cbd5e1' }} />
          <h3 style={{ fontFamily: 'Syne', fontSize: 18, color: '#94a3b8', marginBottom: 8 }}>Logbook Not Yet Available</h3>
          <p style={{ fontSize: 14, color: '#94a3b8', maxWidth: 360, margin: '0 auto' }}>
            Your logbook will be activated once your administrator marks you as an intern. Check back after your internship placement.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>My Logbook</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>3-month internship logbook (weekdays only)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: '#0a1628' }}>
              {totalFilled}/{totalEntries}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>entries filled</div>
          </div>
          <div style={{ width: 56, height: 56, position: 'relative' }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke="#2db84b" strokeWidth="3"
                strokeDasharray={`${totalEntries ? (totalFilled / totalEntries) * 100 : 0} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#0a1628' }}>
              {totalEntries ? Math.round((totalFilled / totalEntries) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner dark" style={{ margin: '0 auto' }} />
        </div>
      ) : entries.length === 0 ? (
        <div className="empty-state" style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 64 }}>
          <Calendar size={40} style={{ margin: '0 auto 16px', display: 'block', color: '#cbd5e1' }} />
          <h3>Logbook entries are being prepared.</h3>
        </div>
      ) : (
        Object.entries(weeks).map(([week, weekEntries]) => {
          const weekFilled = weekEntries.filter(e => e.activities_performed?.trim()).length
          const isOpen = openWeeks[week]
          return (
            <div key={week} className="logbook-week">
              <div className="logbook-week-header" onClick={() => toggleWeek(week)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <span>Week {week}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
                    {weekEntries[0]?.entry_date && new Date(weekEntries[0].entry_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                    {' — '}
                    {weekEntries[weekEntries.length - 1]?.entry_date && new Date(weekEntries[weekEntries.length - 1].entry_date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 80, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#2db84b', width: `${(weekFilled / weekEntries.length) * 100}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{weekFilled}/{weekEntries.length}</span>
                </div>
              </div>

              {isOpen && weekEntries.map(entry => {
                const isToday = entry.entry_date === new Date().toISOString().split('T')[0]
                const isFuture = new Date(entry.entry_date) > new Date()
                const isFilled = entry.activities_performed?.trim()
                const isEditing = editing === entry.id

                return (
                  <div key={entry.id} style={{
                    padding: '14px 16px',
                    borderTop: '1px solid #f1f5f9',
                    background: isToday ? '#f0fdf4' : 'white',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? 16 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: isFilled ? '#2db84b' : isFuture ? '#e2e8f0' : '#fde68a',
                          flexShrink: 0,
                        }} />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>
                            {entry.day_of_week}
                          </span>
                          <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
                            {new Date(entry.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {isToday && <span className="badge badge-green" style={{ fontSize: 10, marginLeft: 8 }}>Today</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {isFilled && !isEditing && (
                          <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Saved</span>
                        )}
                        {!isFuture && !isEditing && (
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => startEditing(entry)}
                          >
                            {isFilled ? 'Edit' : 'Fill Entry'}
                          </button>
                        )}
                        {isEditing && (
                          <button className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                        )}
                      </div>
                    </div>

                    {/* View filled entry */}
                    {isFilled && !isEditing && (
                      <div style={{ marginTop: 8, paddingLeft: 18, display: 'grid', gap: 4 }}>
                        <div style={{ fontSize: 13, color: '#475569' }}>
                          <strong>Activities:</strong> {entry.activities_performed}
                        </div>
                        {entry.skills_acquired && (
                          <div style={{ fontSize: 13, color: '#475569' }}>
                            <strong>Skills:</strong> {entry.skills_acquired}
                          </div>
                        )}
                        {entry.arrival_time && (
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            Time: {entry.arrival_time} – {entry.departure_time}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditing && (
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div className="form-group">
                            <label>Arrival Time</label>
                            <input type="time" value={form.arrival_time} onChange={e => setForm(p => ({ ...p, arrival_time: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label>Departure Time</label>
                            <input type="time" value={form.departure_time} onChange={e => setForm(p => ({ ...p, departure_time: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Activities Performed <span className="required">*</span></label>
                          <textarea
                            placeholder="Describe the activities you carried out today..."
                            value={form.activities_performed}
                            onChange={e => setForm(p => ({ ...p, activities_performed: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="form-group">
                          <label>Skills Acquired</label>
                          <input
                            type="text"
                            placeholder="What skills did you learn today?"
                            value={form.skills_acquired}
                            onChange={e => setForm(p => ({ ...p, skills_acquired: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Challenges Faced</label>
                          <input
                            type="text"
                            placeholder="Any challenges or observations?"
                            value={form.challenges}
                            onChange={e => setForm(p => ({ ...p, challenges: e.target.value }))}
                          />
                        </div>
                        <div>
                          <button
                            className="btn btn-primary"
                            onClick={() => saveEntry(entry.id)}
                            disabled={saving}
                          >
                            {saving ? <div className="spinner" /> : <><Save size={14} />Save Entry</>}
                          </button>
                        </div>
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
  )
}
