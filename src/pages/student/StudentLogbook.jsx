import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronRight, Save, Calendar, Upload, X, FileImage } from 'lucide-react'

export default function StudentLogbook() {
  const { profile } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [openWeeks, setOpenWeeks] = useState({ 1: true })
  const [uploading, setUploading] = useState(null) // entry id being uploaded

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

  async function uploadDiagram(entryId, file) {
    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP or PDF files allowed.')
      return
    }
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB.')
      return
    }

    setUploading(entryId)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/${entryId}.${ext}`

      // Remove old file first if exists
      await supabase.storage.from('logbook-diagrams').remove([path])

      const { error: uploadError } = await supabase.storage
        .from('logbook-diagrams')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('logbook-diagrams')
        .getPublicUrl(path)

      // Save URL to entry
      const { error: updateError } = await supabase
        .from('logbook_entries')
        .update({ diagram_url: publicUrl })
        .eq('id', entryId)
        .eq('student_id', profile.id)

      if (updateError) throw updateError

      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, diagram_url: publicUrl } : e))
      toast.success('Diagram uploaded!')
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setUploading(null)
    }
  }

  async function removeDiagram(entryId, diagramUrl) {
    try {
      // Extract path from URL
      const path = diagramUrl.split('/logbook-diagrams/')[1]
      if (path) await supabase.storage.from('logbook-diagrams').remove([path])

      const { error } = await supabase
        .from('logbook_entries')
        .update({ diagram_url: null })
        .eq('id', entryId)
        .eq('student_id', profile.id)

      if (error) throw error
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, diagram_url: null } : e))
      toast.success('Diagram removed.')
    } catch (err) {
      toast.error('Failed to remove diagram.')
    }
  }

  function toggleWeek(w) {
    setOpenWeeks(prev => ({ ...prev, [w]: !prev[w] }))
  }

  const weeks = entries.reduce((acc, e) => {
    const w = e.week_number
    if (!acc[w]) acc[w] = []
    acc[w].push(e)
    return acc
  }, {})

  const totalFilled = entries.filter(e => e.activities_performed?.trim()).length
  const totalEntries = entries.length

  return (
    <div>
      {/* Header */}
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
                const isPDF = entry.diagram_url?.toLowerCase().includes('.pdf')
                const isUploadingThis = uploading === entry.id

                return (
                  <div key={entry.id} style={{
                    padding: '14px 16px',
                    borderTop: '1px solid #f1f5f9',
                    background: isToday ? '#f0fdf4' : 'white',
                  }}>
                    {/* Entry header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? 16 : 0, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: isFilled ? '#2db84b' : isFuture ? '#e2e8f0' : '#fde68a',
                          flexShrink: 0,
                        }} />
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 14, color: '#334155' }}>{entry.day_of_week}</span>
                          <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 8 }}>
                            {new Date(entry.entry_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {isToday && <span className="badge badge-green" style={{ fontSize: 10, marginLeft: 8 }}>Today</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {isFilled && !isEditing && (
                          <span className="badge badge-green" style={{ fontSize: 10 }}>✓ Saved</span>
                        )}
                        {entry.diagram_url && !isEditing && (
                          <span style={{ fontSize: 10, background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                            📎 Diagram
                          </span>
                        )}
                        {!isFuture && !isEditing && (
                          <button className="btn btn-outline btn-sm" onClick={() => startEditing(entry)}>
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
                        {entry.challenges && (
                          <div style={{ fontSize: 13, color: '#475569' }}>
                            <strong>Challenges:</strong> {entry.challenges}
                          </div>
                        )}
                        {entry.arrival_time && (
                          <div style={{ fontSize: 12, color: '#94a3b8' }}>
                            Time: {entry.arrival_time} – {entry.departure_time}
                          </div>
                        )}

                        {/* Diagram preview */}
                        {entry.diagram_url && (
                          <div style={{ marginTop: 10 }}>
                            {isPDF ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <a
                                  href={entry.diagram_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}
                                >
                                  <FileImage size={14} /> View Diagram PDF
                                </a>
                                <button
                                  onClick={() => removeDiagram(entry.id, entry.diagram_url)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                  title="Remove diagram"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                  src={entry.diagram_url}
                                  alt="Diagram"
                                  style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                  onClick={() => window.open(entry.diagram_url, '_blank')}
                                />
                                <button
                                  onClick={() => removeDiagram(entry.id, entry.diagram_url)}
                                  style={{
                                    position: 'absolute', top: 6, right: 6,
                                    background: 'rgba(0,0,0,0.6)', border: 'none',
                                    borderRadius: '50%', width: 22, height: 22,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: '#fff'
                                  }}
                                  title="Remove diagram"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Upload diagram button (when entry filled, no diagram yet) */}
                        {!entry.diagram_url && (
                          <div style={{ marginTop: 8 }}>
                            <label style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              fontSize: 12, color: '#64748b', cursor: 'pointer',
                              border: '1px dashed #cbd5e1', borderRadius: 6,
                              padding: '5px 10px',
                            }}>
                              {isUploadingThis ? (
                                <><div className="spinner dark" style={{ width: 12, height: 12 }} /> Uploading...</>
                              ) : (
                                <><Upload size={12} /> Attach Diagram (image or PDF)</>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: 'none' }}
                                disabled={isUploadingThis}
                                onChange={e => {
                                  const file = e.target.files[0]
                                  if (file) uploadDiagram(entry.id, file)
                                  e.target.value = ''
                                }}
                              />
                            </label>
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

                        {/* Diagram upload inside edit form */}
                        <div className="form-group">
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FileImage size={14} /> Diagram / Sketch <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                          </label>
                          {entry.diagram_url ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                              <span style={{ fontSize: 12, color: '#3b82f6' }}>✓ Diagram attached</span>
                              <a href={entry.diagram_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#3b82f6' }}>View</a>
                              <button onClick={() => removeDiagram(entry.id, entry.diagram_url)} style={{ fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                            </div>
                          ) : (
                            <label style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              border: '1px dashed #cbd5e1', borderRadius: 8,
                              padding: '10px 14px', cursor: 'pointer', marginTop: 4,
                              fontSize: 13, color: '#64748b',
                            }}>
                              {isUploadingThis ? (
                                <><div className="spinner dark" style={{ width: 14, height: 14 }} /> Uploading...</>
                              ) : (
                                <><Upload size={14} /> Snap/scan your diagram and upload here (JPG, PNG, PDF · max 5MB)</>
                              )}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,application/pdf"
                                style={{ display: 'none' }}
                                disabled={isUploadingThis}
                                onChange={e => {
                                  const file = e.target.files[0]
                                  if (file) uploadDiagram(entry.id, file)
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          )}
                        </div>

                        <div>
                          <button
                            className="btn btn-primary"
                            onClick={() => saveEntry(entry.id)}
                            disabled={saving}
                          >
                            {saving ? <div className="spinner" /> : <><Save size={14} /> Save Entry</>}
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
