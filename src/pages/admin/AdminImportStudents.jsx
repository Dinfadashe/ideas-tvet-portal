import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Upload, Download, CheckCircle, AlertCircle, Loader } from 'lucide-react'

const REQUIRED_HEADERS = ['full_name', 'email', 'phone']

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return 'IDEA$' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function AdminImportStudents() {
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  function parseCSV(text) {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'))
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h))
    if (missing.length) {
      setErrors([`Missing required columns: ${missing.join(', ')}`])
      return []
    }
    return lines.slice(1).filter(l => l.trim()).map((line, i) => {
      const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
      return headers.reduce((obj, h, j) => { obj[h] = vals[j] || ''; return obj }, { _row: i + 2 })
    })
  }

  function handleFileChange(f) {
    if (!f) return
    setFile(f)
    setErrors([])
    setParsed([])
    setResults(null)
    const reader = new FileReader()
    reader.onload = e => {
      const rows = parseCSV(e.target.result)
      if (rows.length) setParsed(rows)
    }
    reader.readAsText(f)
  }

  async function handleImport() {
    if (!parsed.length) return
    setImporting(true)
    const ok = [], fail = []

    for (const row of parsed) {
      try {
        if (!row.email || !row.full_name) {
          fail.push({ email: row.email || '(no email)', reason: 'Missing required fields' })
          continue
        }

        const password = generatePassword()
        const token = crypto.randomUUID()

        // Create Supabase auth user
        const { data: authData, error: authError } = await supabase.auth.admin
          ? // Admin API (if using service role key in edge functions)
          { data: null, error: { message: 'Use service role in Edge Function' } }
          : await supabase.auth.signUp({
            email: row.email.toLowerCase().trim(),
            password,
            options: { emailRedirectTo: null },
          })

        // Create profile directly (works with RLS bypass for admin)
        const profilePayload = {
          email: row.email.toLowerCase().trim(),
          full_name: row.full_name.trim(),
          phone: row.phone || null,
          gender: row.gender || null,
          state_of_origin: row.state_of_origin || null,
          lga: row.lga || null,
          role: 'student',
          status: 'pending',
          admission_token: token,
          profile_updated: false,
          password_changed: false,
        }

        // If auth succeeded, link profile to auth user
        if (authData?.user) {
          profilePayload.id = authData.user.id
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert(profilePayload)

          if (profileError) throw profileError
        } else {
          // Fallback: check if profile already exists
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', row.email.toLowerCase().trim())
            .single()

          if (existing) {
            fail.push({ email: row.email, reason: 'Email already exists' })
            continue
          }
          // If no auth service key, create profile with generated UUID
          profilePayload.id = crypto.randomUUID()
          const { error: profileError } = await supabase
            .from('profiles')
            .insert(profilePayload)
          if (profileError) throw profileError
        }

        const admissionLink = `${import.meta.env.VITE_APP_URL}/admit/${token}`
        ok.push({ name: row.full_name, email: row.email, password, admissionLink })

        // Log email for dispatch
        await supabase.from('email_logs').insert({
          student_id: null,
          email_to: row.email,
          subject: 'Your IDEAS-TVET Admission Offer',
          status: 'pending',
        })

      } catch (err) {
        fail.push({ email: row.email || '(unknown)', reason: err.message })
      }
    }

    setResults({ ok, fail })
    setImporting(false)

    if (ok.length) {
      toast.success(`${ok.length} student(s) imported successfully!`)
    }
    if (fail.length) {
      toast.error(`${fail.length} student(s) failed to import.`)
    }
  }

  function downloadTemplate() {
    const csv = 'full_name,email,phone,gender,state_of_origin,lga\nJohn Doe,john@example.com,08012345678,Male,Plateau,Jos North\nJane Smith,jane@example.com,08098765432,Female,Lagos,Ikeja'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ideas_tvet_students_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadResults() {
    if (!results) return
    const rows = [
      ['Name', 'Email', 'Temporary Password', 'Admission Link', 'Status'],
      ...results.ok.map(r => [r.name, r.email, r.password, r.admissionLink, 'Imported']),
      ...results.fail.map(r => ['', r.email, '', '', `FAILED: ${r.reason}`]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import_results.csv'
    a.click()
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Import Trainees</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          Upload a CSV file to bulk-create student accounts. Accounts will be created with temporary passwords.
        </p>
      </div>

      {/* Instructions */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h2>Instructions</h2>
          <button className="btn btn-outline btn-sm" onClick={downloadTemplate}>
            <Download size={13} /> Download Template
          </button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { step: '1', title: 'Download Template', desc: 'Get the CSV template with required columns.' },
              { step: '2', title: 'Fill Student Data', desc: 'Add student names, emails, and phones.' },
              { step: '3', title: 'Upload & Import', desc: 'Upload the filled CSV and click Import.' },
              { step: '4', title: 'Download Results', desc: 'Save passwords and admission links for dispatch.' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 28, height: 28, background: '#0a1628', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="alert alert-warning" style={{ marginTop: 16, marginBottom: 0 }}>
            <span>⚠️</span>
            <span style={{ fontSize: 13 }}>
              <strong>Required columns:</strong> full_name, email, phone. Optional: gender, state_of_origin, lga.
              After import, download the results CSV containing passwords and admission links to send to students.
            </span>
          </div>
        </div>
      </div>

      {/* Upload */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><h2>Upload CSV File</h2></div>
        <div className="card-body">
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault()
              setDragOver(false)
              handleFileChange(e.dataTransfer.files[0])
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={e => handleFileChange(e.target.files[0])}
            />
            <Upload size={32} color="#94a3b8" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>
              {file ? file.name : 'Drop CSV file here or click to browse'}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>Supports .csv files only</p>
          </div>

          {errors.length > 0 && (
            <div className="alert alert-error" style={{ marginTop: 16 }}>
              <AlertCircle size={16} />
              <div>
                {errors.map((e, i) => <div key={i}>{e}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview */}
      {parsed.length > 0 && !results && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2>Preview — {parsed.length} rows</h2>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? <><div className="spinner" />Importing...</> : `Import ${parsed.length} Students`}
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 10).map(row => (
                  <tr key={row._row}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{row._row}</td>
                    <td style={{ fontWeight: 500 }}>{row.full_name}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{row.email}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{row.phone}</td>
                    <td>{row.gender}</td>
                    <td>{row.state_of_origin}</td>
                  </tr>
                ))}
                {parsed.length > 10 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px' }}>
                      ...and {parsed.length - 10} more rows
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card">
          <div className="card-header">
            <h2>Import Results</h2>
            <button className="btn btn-primary btn-sm" onClick={downloadResults}>
              <Download size={13} /> Download Results CSV
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, color: '#15803d' }}>{results.ok.length}</div>
                <div style={{ fontSize: 13, color: '#166534' }}>Successfully Imported</div>
              </div>
              <div style={{ background: results.fail.length ? '#fef2f2' : '#f8fafc', border: `1px solid ${results.fail.length ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, color: results.fail.length ? '#dc2626' : '#94a3b8' }}>{results.fail.length}</div>
                <div style={{ fontSize: 13, color: results.fail.length ? '#b91c1c' : '#94a3b8' }}>Failed</div>
              </div>
            </div>

            {results.fail.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#dc2626', marginBottom: 8 }}>Failed imports:</div>
                {results.fail.map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: '#64748b' }}>{f.email}</span>
                    <span style={{ color: '#ef4444' }}>— {f.reason}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="alert alert-info" style={{ marginTop: 16 }}>
              <span>ℹ️</span>
              <span style={{ fontSize: 13 }}>
                Download the results CSV to get all temporary passwords and admission links.
                Send each student their admission link and temporary password via email.
              </span>
            </div>

            <button
              className="btn btn-outline"
              style={{ marginTop: 16 }}
              onClick={() => { setFile(null); setParsed([]); setResults(null) }}
            >
              Import More Students
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
