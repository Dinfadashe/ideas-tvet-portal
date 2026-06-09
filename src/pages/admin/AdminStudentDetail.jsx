import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { ArrowLeft, Mail, Save, Briefcase, GraduationCap, UserX, RefreshCw, Copy, ExternalLink } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'admitted', 'active', 'intern', 'graduated', 'inactive']

export default function AdminStudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [documents, setDocuments] = useState([])
  const [logbookProgress, setLogbookProgress] = useState({ total: 0, filled: 0 })

  useEffect(() => {
    fetchStudent()
  }, [id])

  async function fetchStudent() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setStudent(data)
      setStatus(data.status)

      // Fetch documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('student_id', id)
      setDocuments(docs || [])

      // Fetch logbook progress
      const { data: entries } = await supabase
        .from('logbook_entries')
        .select('id, activities_performed')
        .eq('student_id', id)

      if (entries) {
        const filled = entries.filter(e => e.activities_performed?.trim()).length
        setLogbookProgress({ total: entries.length, filled })
      }
    } catch (err) {
      toast.error('Failed to load student.')
      navigate('/admin/students')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(newStatus) {
    setSaving(true)
    try {
      const updates = { status: newStatus }

      // If marking as intern, trigger logbook creation
      if (newStatus === 'intern' && student.status !== 'intern') {
        updates.internship_started_at = new Date().toISOString()
        // Create logbook entries via DB function
        await supabase.rpc('generate_logbook_schedule', {
          p_student_id: id,
          p_start_date: new Date().toISOString().split('T')[0],
        })
        // Create notification for student
        await supabase.from('notifications').insert({
          student_id: id,
          title: 'Internship Started!',
          message: 'You have been marked as an intern. Your logbook is now available. Download your internship letter from the Documents section.',
        })
        toast.success('Student marked as intern. Logbook created.')
      }

      await supabase.from('profiles').update(updates).eq('id', id)
      setStatus(newStatus)
      setStudent(prev => ({ ...prev, ...updates }))
      toast.success('Status updated successfully.')
    } catch (err) {
      toast.error('Failed to update status: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function resendAdmissionLink() {
    try {
      let token = student.admission_token
      if (!token) {
        token = crypto.randomUUID()
        await supabase.from('profiles').update({ admission_token: token }).eq('id', id)
        setStudent(prev => ({ ...prev, admission_token: token }))
      }
      const link = `${import.meta.env.VITE_APP_URL}/admit/${token}`
      await navigator.clipboard.writeText(link)
      toast.success('Admission link copied to clipboard!')
    } catch (err) {
      toast.error('Failed to generate link.')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div className="spinner dark" style={{ width: 32, height: 32 }} />
    </div>
  )

  if (!student) return null

  const fields = [
    ['Email', student.email],
    ['Phone', student.phone],
    ['Gender', student.gender],
    ['Date of Birth', student.date_of_birth],
    ['State of Origin', student.state_of_origin],
    ['LGA', student.lga],
    ['NIN', student.nin],
    ['BVN', student.bvn],
    ['Bank Name', student.bank_name],
    ['Account Number', student.account_number],
    ['Next of Kin', student.next_of_kin_name],
    ['NOK Phone', student.next_of_kin_phone],
    ['NOK Relationship', student.next_of_kin_relationship],
    ['Address', student.address],
  ]

  const admissionLink = student.admission_token
    ? `${import.meta.env.VITE_APP_URL}/admit/${student.admission_token}`
    : null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/students')}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>
            {student.full_name}
          </h1>
          <p style={{ fontSize: 13, color: '#64748b' }}>{student.email}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Profile Info */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <h2>Profile Information</h2>
              <span className={`badge ${student.profile_updated ? 'badge-green' : 'badge-gray'}`}>
                {student.profile_updated ? 'Complete' : 'Incomplete'}
              </span>
            </div>
            <div className="card-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {fields.map(([label, value]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 14, color: value ? '#1e293b' : '#cbd5e1', fontWeight: value ? 500 : 400 }}>
                      {value || 'Not provided'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          {documents.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h2>Submitted Documents</h2>
              </div>
              <div className="card-body">
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{doc.file_name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(doc.uploaded_at).toLocaleDateString('en-GB')}</div>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                      View <ExternalLink size={12} />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status */}
          <div className="card">
            <div className="card-header">
              <h2>Status Management</h2>
            </div>
            <div className="card-body">
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label>Current Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={saving || status === student.status}
                onClick={() => handleStatusChange(status)}
              >
                {saving ? <div className="spinner" /> : <><Save size={14} /> Save Status</>}
              </button>

              {status === 'intern' && student.status !== 'intern' && (
                <div className="alert alert-info" style={{ marginTop: 12, fontSize: 12 }}>
                  Setting to <strong>Intern</strong> will auto-generate a 3-month weekday logbook and notify the student.
                </div>
              )}
            </div>
          </div>

          {/* Admission */}
          <div className="card">
            <div className="card-header">
              <h2>Admission</h2>
            </div>
            <div className="card-body">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Acceptance Status</div>
                <div style={{ fontWeight: 500, color: student.admission_accepted ? '#2db84b' : '#94a3b8' }}>
                  {student.admission_accepted
                    ? `✓ Accepted on ${new Date(student.admission_accepted_at).toLocaleDateString('en-GB')}`
                    : 'Not yet accepted'
                  }
                </div>
              </div>

              {admissionLink && (
                <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, wordBreak: 'break-all', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  {admissionLink}
                </div>
              )}

              <button
                className="btn btn-outline"
                style={{ width: '100%', fontSize: 13 }}
                onClick={resendAdmissionLink}
              >
                <Copy size={13} /> Copy Admission Link
              </button>
            </div>
          </div>

          {/* Logbook */}
          {student.status === 'intern' && (
            <div className="card">
              <div className="card-header">
                <h2>Logbook Progress</h2>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Entries filled</span>
                  <span style={{ fontWeight: 600 }}>{logbookProgress.filled}/{logbookProgress.total}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: logbookProgress.total ? `${(logbookProgress.filled / logbookProgress.total) * 100}%` : '0%' }}
                  />
                </div>
                {student.internship_started_at && (
                  <div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
                    Started: {new Date(student.internship_started_at).toLocaleDateString('en-GB')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
