import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { generatePhotoAlbum } from '../../utils/generatePhotoAlbum.js'
import toast from 'react-hot-toast'
import { Users, UserCheck, BookOpen, GraduationCap, ArrowRight, Clock, Download, ImageIcon } from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, admitted: 0, active: 0, interns: 0, graduated: 0 })
  const [recentStudents, setRecentStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingAlbum, setGeneratingAlbum] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchRecentStudents()
  }, [])

  async function fetchStats() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status')
        .eq('role', 'student')
      if (error) throw error
      const counts = data.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1
        return acc
      }, {})
      setStats({
        total: data.length,
        admitted: counts.admitted || 0,
        active: counts.active || 0,
        interns: counts.intern || 0,
        graduated: counts.graduated || 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecentStudents() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, status, created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(6)
      setRecentStudents(data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDownloadAlbum() {
    setGeneratingAlbum(true)
    toast('Fetching student data and photos...', { icon: '📋' })
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, gender, date_of_birth, state_of_origin, lga, nin, photo_url')
        .eq('role', 'student')
        .eq('profile_updated', true)
        .order('full_name')
      if (error) throw error
      if (!data?.length) {
        toast.error('No students with completed profiles found.')
        return
      }
      toast('Building photo album document...', { icon: '📄' })
      const blob = await generatePhotoAlbum(data)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `IDEAS-TVET_Photo_Album_${new Date().toISOString().split('T')[0]}.docx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Photo album downloaded — ${data.length} students included.`)
    } catch (err) {
      toast.error('Failed to generate album: ' + (err.message || 'Unknown error'))
      console.error(err)
    } finally {
      setGeneratingAlbum(false)
    }
  }

  const statusBadge = {
    pending:   <span className="badge badge-gray">Pending</span>,
    admitted:  <span className="badge badge-navy">Admitted</span>,
    active:    <span className="badge badge-green">Active</span>,
    intern:    <span className="badge badge-gold">Intern</span>,
    graduated: <span className="badge badge-green">Graduated</span>,
    inactive:  <span className="badge badge-red">Inactive</span>,
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:'Syne', fontSize:24, fontWeight:800, color:'#0a1628', marginBottom:4 }}>
          Admin Dashboard
        </h1>
        <p style={{ color:'#64748b', fontSize:14 }}>
          IDEAS-TVET Initiative — Computer Hardware &amp; Cellphone Repairs Program
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Total Trainees',  value: stats.total,     icon: Users,        variant:'navy'  },
          { label:'Admitted',        value: stats.admitted,  icon: UserCheck,    variant:'green' },
          { label:'Active Trainees', value: stats.active,    icon: BookOpen,     variant:'gold'  },
          { label:'On Internship',   value: stats.interns,   icon: Clock,        variant:'gold'  },
          { label:'Graduated',       value: stats.graduated, icon: GraduationCap,variant:'green' },
        ].map(item => (
          <div className="stat-card" key={item.label}>
            <div className={`stat-icon ${item.variant}`}><item.icon size={20} /></div>
            <div className="stat-info">
              <h3>{loading ? '—' : item.value}</h3>
              <p>{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12, marginBottom:28 }}>
        {[
          { label:'View All Students',   desc:'Manage enrolled trainees',     to:'/admin/students', color:'#0a1628' },
          { label:'Import Students',     desc:'Bulk upload new trainees',     to:'/admin/import',   color:'#2db84b' },
          { label:'View Logbooks',       desc:'Review intern logbooks',       to:'/admin/logbooks', color:'#f5a623' },
        ].map(action => (
          <button key={action.label} onClick={() => navigate(action.to)}
            style={{ background: action.color, color:'white', border:'none', borderRadius:12, padding:'16px 20px', cursor:'pointer', textAlign:'left', transition:'transform 0.15s, box-shadow 0.15s', display:'flex', justifyContent:'space-between', alignItems:'center' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
          >
            <div>
              <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:2 }}>{action.label}</div>
              <div style={{ fontSize:12, opacity:0.75 }}>{action.desc}</div>
            </div>
            <ArrowRight size={16} style={{ opacity:0.7 }} />
          </button>
        ))}

        {/* Photo Album Download button */}
        <button
          onClick={handleDownloadAlbum}
          disabled={generatingAlbum}
          style={{ background: generatingAlbum ? '#64748b' : '#7c3aed', color:'white', border:'none', borderRadius:12, padding:'16px 20px', cursor: generatingAlbum ? 'not-allowed' : 'pointer', textAlign:'left', transition:'transform 0.15s, box-shadow 0.15s', display:'flex', justifyContent:'space-between', alignItems:'center', opacity: generatingAlbum ? 0.8 : 1 }}
          onMouseEnter={e => { if (!generatingAlbum) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,0.15)' }}}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
        >
          <div>
            <div style={{ fontFamily:'Syne', fontWeight:700, fontSize:14, marginBottom:2 }}>
              {generatingAlbum ? 'Generating...' : 'Download Photo Album'}
            </div>
            <div style={{ fontSize:12, opacity:0.75 }}>Export trainees as .docx</div>
          </div>
          {generatingAlbum
            ? <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
            : <Download size={16} style={{ opacity:0.7 }} />
          }
        </button>
      </div>

      {/* Recent Students */}
      <div className="card">
        <div className="card-header">
          <h2>Recent Trainees</h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/students')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign:'center', padding:'32px', color:'#94a3b8' }}>
                    No trainees yet. Import students to get started.
                  </td>
                </tr>
              ) : (
                recentStudents.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color:'#94a3b8', fontSize:12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, background:'#0a1628', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:11, fontWeight:700, flexShrink:0 }}>
                          {s.full_name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight:500 }}>{s.full_name}</span>
                      </div>
                    </td>
                    <td style={{ color:'#64748b' }}>{s.email}</td>
                    <td>{statusBadge[s.status] || <span className="badge badge-gray">{s.status}</span>}</td>
                    <td style={{ color:'#94a3b8', fontSize:13 }}>{new Date(s.created_at).toLocaleDateString('en-GB')}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/admin/students/${s.id}`)}>
                        View
                      </button>
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