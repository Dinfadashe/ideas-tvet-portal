import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Search, Filter, Eye, Mail, ChevronDown, RefreshCw } from 'lucide-react'

const STATUS_OPTIONS = ['all', 'pending', 'admitted', 'active', 'intern', 'graduated', 'inactive']

const statusBadge = {
  pending: <span className="badge badge-gray">Pending</span>,
  admitted: <span className="badge badge-navy">Admitted</span>,
  active: <span className="badge badge-green">Active</span>,
  intern: <span className="badge badge-gold">Intern</span>,
  graduated: <span className="badge badge-green">Graduated</span>,
  inactive: <span className="badge badge-red">Inactive</span>,
}

export default function AdminStudents() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [resendingId, setResendingId] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [statusFilter])

  async function fetchStudents() {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error
      setStudents(data || [])
    } catch (err) {
      toast.error('Failed to load students.')
    } finally {
      setLoading(false)
    }
  }

  async function resendAdmissionEmail(student) {
    setResendingId(student.id)
    try {
      // Generate new token if needed
      let token = student.admission_token
      if (!token) {
        token = crypto.randomUUID()
        await supabase.from('profiles').update({ admission_token: token }).eq('id', student.id)
      }
      const admissionLink = `${import.meta.env.VITE_APP_URL}/admit/${token}`
      // Log the email (actual sending happens via Supabase Edge Function or external service)
      await supabase.from('email_logs').insert({
        student_id: student.id,
        email_to: student.email,
        subject: 'IDEAS-TVET: Your Admission Offer',
        status: 'pending',
      })
      toast.success(`Admission link ready. In production, this triggers an email to ${student.email}`)
      console.info('Admission Link:', admissionLink)
    } catch (err) {
      toast.error('Failed to process.')
    } finally {
      setResendingId(null)
    }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Trainees</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>{students.length} total trainees enrolled</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/import')}>
          + Import Students
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, or phone..."
              style={{ paddingLeft: 36 }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ flex: '0 0 160px' }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button className="btn btn-outline btn-sm" onClick={fetchStudents} title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Admission</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div className="spinner dark" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No trainees found matching your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, background: '#0a1628', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{s.full_name}</div>
                          {s.profile_updated && <div style={{ fontSize: 11, color: '#2db84b' }}>✓ Profile complete</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{s.email}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{s.phone || '—'}</td>
                    <td>{statusBadge[s.status] || <span className="badge badge-gray">{s.status}</span>}</td>
                    <td>
                      {s.admission_accepted
                        ? <span style={{ fontSize: 12, color: '#2db84b' }}>✓ Accepted</span>
                        : <span style={{ fontSize: 12, color: '#94a3b8' }}>Pending</span>
                      }
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate(`/admin/students/${s.id}`)}
                          title="View details"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => resendAdmissionEmail(s)}
                          disabled={resendingId === s.id}
                          title="Resend admission email"
                        >
                          {resendingId === s.id ? <div className="spinner dark" style={{ width: 12, height: 12 }} /> : <Mail size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
