// src/pages/admin/AdminAssignInstructors.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminAssignInstructors() {
  const [instructors, setInstructors] = useState([])
  const [trainees, setTrainees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInstructor, setSelectedInstructor] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all') // all | assigned | unassigned

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: inst }, { data: train }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, photo_url').eq('role', 'instructor').order('full_name'),
      supabase.from('profiles').select('id, full_name, email, id_number, photo_url, status, instructor_id').eq('role', 'student').neq('email', 'dashedinfa@gmail.com').order('id_number'),
    ])
    setInstructors(inst || [])
    setTrainees(train || [])
    setLoading(false)
  }

  async function assignTrainee(traineeId, instructorId) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ instructor_id: instructorId })
        .eq('id', traineeId)
      if (error) throw error
      setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, instructor_id: instructorId } : t))
      toast.success('Assigned successfully')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function assignAll(instructorId) {
    const unassigned = trainees.filter(t => !t.instructor_id)
    if (unassigned.length === 0) { toast('No unassigned trainees remaining'); return }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ instructor_id: instructorId })
        .in('id', unassigned.map(t => t.id))
      if (error) throw error
      setTrainees(prev => prev.map(t => !t.instructor_id ? { ...t, instructor_id: instructorId } : t))
      toast.success(`Assigned ${unassigned.length} trainees to instructor`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function unassignTrainee(traineeId) {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ instructor_id: null })
        .eq('id', traineeId)
      if (error) throw error
      setTrainees(prev => prev.map(t => t.id === traineeId ? { ...t, instructor_id: null } : t))
      toast.success('Unassigned')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function getInstructor(id) {
    return instructors.find(i => i.id === id)
  }

  const filtered = trainees.filter(t => {
    if (filter === 'assigned') return !!t.instructor_id
    if (filter === 'unassigned') return !t.instructor_id
    if (selectedInstructor) return t.instructor_id === selectedInstructor
    return true
  })

  const stats = {
    total: trainees.length,
    assigned: trainees.filter(t => t.instructor_id).length,
    unassigned: trainees.filter(t => !t.instructor_id).length,
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Assign Trainees to Instructors</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Each instructor will only see the trainees assigned to them on their dashboard.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Trainees', value: stats.total, color: '#0a2e14' },
          { label: 'Assigned', value: stats.assigned, color: '#16a34a' },
          { label: 'Unassigned', value: stats.unassigned, color: stats.unassigned > 0 ? '#dc2626' : '#16a34a' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>

        {/* Instructor list */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Instructors</div>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

            {/* All trainees option */}
            <div
              onClick={() => { setSelectedInstructor(null); setFilter('all') }}
              style={{
                padding: '14px 16px', cursor: 'pointer',
                background: !selectedInstructor && filter === 'all' ? '#f0fdf4' : '#fff',
                borderLeft: !selectedInstructor && filter === 'all' ? '3px solid #1a7a3c' : '3px solid transparent',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#0a2e14' }}>All Trainees</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{stats.total}</div>
            </div>

            {/* Unassigned */}
            <div
              onClick={() => { setSelectedInstructor(null); setFilter('unassigned') }}
              style={{
                padding: '14px 16px', cursor: 'pointer',
                background: !selectedInstructor && filter === 'unassigned' ? '#fef2f2' : '#fff',
                borderLeft: !selectedInstructor && filter === 'unassigned' ? '3px solid #dc2626' : '3px solid transparent',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: '#dc2626' }}>⚠️ Unassigned</div>
              <div style={{ fontSize: 11, background: stats.unassigned > 0 ? '#fecaca' : '#f1f5f9', color: stats.unassigned > 0 ? '#dc2626' : '#94a3b8', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>{stats.unassigned}</div>
            </div>

            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading...</div>
            ) : instructors.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No instructors found. Make sure instructors have role = "instructor" in profiles.</div>
            ) : instructors.map(inst => {
              const count = trainees.filter(t => t.instructor_id === inst.id).length
              const isSelected = selectedInstructor === inst.id
              return (
                <div
                  key={inst.id}
                  onClick={() => { setSelectedInstructor(inst.id); setFilter('all') }}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    background: isSelected ? '#f0fdf4' : '#fff',
                    borderLeft: isSelected ? '3px solid #1a7a3c' : '3px solid transparent',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {inst.photo_url ? <img src={inst.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 16 }}>👨‍🏫</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0a2e14', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inst.full_name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{count} trainee{count !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Assign all unassigned to selected instructor */}
          {selectedInstructor && stats.unassigned > 0 && (
            <button
              onClick={() => assignAll(selectedInstructor)}
              disabled={saving}
              style={{ width: '100%', marginTop: 12, padding: '10px', background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Assign All {stats.unassigned} Unassigned →
            </button>
          )}
        </div>

        {/* Trainee table */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0a2e14' }}>
              {selectedInstructor
                ? `${getInstructor(selectedInstructor)?.full_name}'s Trainees`
                : filter === 'unassigned' ? 'Unassigned Trainees' : 'All Trainees'}
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, marginLeft: 8 }}>({filtered.length})</span>
            </div>
            {selectedInstructor && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #e2e8f0', background: filter === 'all' ? '#0a2e14' : '#fff', color: filter === 'all' ? '#fff' : '#475569', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>All</button>
                <button onClick={() => setFilter('assigned')} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #e2e8f0', background: filter === 'assigned' ? '#0a2e14' : '#fff', color: filter === 'assigned' ? '#fff' : '#475569', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Assigned</button>
                <button onClick={() => setFilter('unassigned')} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid #e2e8f0', background: filter === 'unassigned' ? '#0a2e14' : '#fff', color: filter === 'unassigned' ? '#fff' : '#475569', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Unassigned</button>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Trainee', 'ID Number', 'Phone', 'Status', 'Assigned To', 'Action'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const assignedInst = getInstructor(t.instructor_id)
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#f0fdf4', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {t.photo_url ? <img src={t.photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 14 }}>👤</span>}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#0a1628' }}>{t.full_name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.id_number}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{t.phone || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: t.status === 'intern' ? '#f0fdf4' : '#f8fafc', color: t.status === 'intern' ? '#16a34a' : '#94a3b8', textTransform: 'uppercase' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: assignedInst ? '#16a34a' : '#94a3b8', fontWeight: assignedInst ? 600 : 400 }}>
                        {assignedInst ? assignedInst.full_name : '— Unassigned —'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {instructors.map(inst => (
                            <button
                              key={inst.id}
                              onClick={() => assignTrainee(t.id, inst.id)}
                              disabled={saving || t.instructor_id === inst.id}
                              style={{
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                                background: t.instructor_id === inst.id ? '#1a7a3c' : '#f1f5f9',
                                color: t.instructor_id === inst.id ? '#fff' : '#475569',
                              }}
                              title={`Assign to ${inst.full_name}`}
                            >
                              {inst.full_name?.split(' ')[0]}
                            </button>
                          ))}
                          {t.instructor_id && (
                            <button
                              onClick={() => unassignTrainee(t.id)}
                              disabled={saving}
                              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none', background: '#fef2f2', color: '#dc2626' }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
