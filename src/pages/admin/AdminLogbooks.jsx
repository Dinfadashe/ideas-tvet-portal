import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Search, BookOpen, ExternalLink } from 'lucide-react'

export default function AdminLogbooks() {
  const navigate = useNavigate()
  const [interns, setInterns] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [entries, setEntries] = useState([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  useEffect(() => {
    fetchInterns()
  }, [])

  async function fetchInterns() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, internship_started_at, status')
        .eq('role', 'student')
        .eq('status', 'intern')
        .order('full_name')

      if (error) throw error

      // Fetch progress for each
      const withProgress = await Promise.all((data || []).map(async intern => {
        const { data: entries } = await supabase
          .from('logbook_entries')
          .select('id, activities_performed')
          .eq('student_id', intern.id)

        const total = entries?.length || 0
        const filled = entries?.filter(e => e.activities_performed?.trim()).length || 0
        return { ...intern, total, filled }
      }))

      setInterns(withProgress)
    } catch (err) {
      toast.error('Failed to load interns.')
    } finally {
      setLoading(false)
    }
  }

  async function viewLogbook(intern) {
    setSelected(intern)
    setLoadingEntries(true)
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .eq('student_id', intern.id)
        .order('entry_date')

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      toast.error('Failed to load logbook.')
    } finally {
      setLoadingEntries(false)
    }
  }

  const filtered = interns.filter(i =>
    i.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase())
  )

  // Group entries by week
  const weeks = entries.reduce((acc, entry) => {
    const w = entry.week_number
    if (!acc[w]) acc[w] = []
    acc[w].push(entry)
    return acc
  }, {})

  if (selected) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
            ← Back
          </button>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: '#0a1628' }}>
              {selected.full_name} — Logbook
            </h1>
            <p style={{ fontSize: 13, color: '#64748b' }}>
              {selected.filled}/{selected.total} entries completed
              {selected.internship_started_at && ` · Started ${new Date(selected.internship_started_at).toLocaleDateString('en-GB')}`}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="progress-bar" style={{ height: 8, marginBottom: 6 }}>
            <div className="progress-fill" style={{ width: selected.total ? `${(selected.filled / selected.total) * 100}%` : '0%' }} />
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {selected.total ? Math.round((selected.filled / selected.total) * 100) : 0}% completed
          </div>
        </div>

        {loadingEntries ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner dark" style={{ margin: '0 auto' }} />
          </div>
        ) : (
          Object.entries(weeks).map(([week, dayEntries]) => (
            <div key={week} className="logbook-week" style={{ marginBottom: 12 }}>
              <div className="logbook-week-header" style={{ cursor: 'default' }}>
                <span>Week {week}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {dayEntries.filter(e => e.activities_performed?.trim()).length}/{dayEntries.length} entries
                </span>
              </div>
              {dayEntries.map(entry => (
                <div key={entry.id} style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: entry.activities_performed ? 8 : 0 }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: '#334155' }}>
                        {entry.day_of_week}, {new Date(entry.entry_date).toLocaleDateString('en-GB')}
                      </span>
                      {entry.arrival_time && (
                        <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
                          {entry.arrival_time} – {entry.departure_time}
                        </span>
                      )}
                    </div>
                    <span className={`badge ${entry.activities_performed?.trim() ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                      {entry.activities_performed?.trim() ? 'Filled' : 'Empty'}
                    </span>
                  </div>
                  {entry.activities_performed?.trim() && (
                    <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                      <strong>Activities:</strong> {entry.activities_performed}
                    </div>
                  )}
                  {entry.skills_acquired?.trim() && (
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                      <strong>Skills:</strong> {entry.skills_acquired}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Intern Logbooks</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Review and monitor intern logbook submissions.</p>
      </div>

      <div style={{ position: 'relative', marginBottom: 16, maxWidth: 320 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search interns..." style={{ paddingLeft: 36 }} />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner dark" style={{ margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40} />
          <h3>No Interns Found</h3>
          <p style={{ fontSize: 13 }}>Mark students as interns to see their logbooks here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map(intern => (
            <div key={intern.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, background: '#0a1628', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {intern.full_name?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{intern.full_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{intern.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="progress-bar" style={{ width: 160, height: 5 }}>
                    <div className="progress-fill" style={{ width: intern.total ? `${(intern.filled / intern.total) * 100}%` : '0%' }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{intern.filled}/{intern.total} entries</span>
                </div>
              </div>
              {intern.internship_started_at && (
                <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                  Started<br />
                  {new Date(intern.internship_started_at).toLocaleDateString('en-GB')}
                </div>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => viewLogbook(intern)}>
                View <ExternalLink size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
