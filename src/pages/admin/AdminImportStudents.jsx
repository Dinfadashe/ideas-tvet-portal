import { useState, useRef } from 'react'
import { sendAdmissionEmail, sendAdmissionLetter } from '../../lib/email.js'
import toast from 'react-hot-toast'
import { Upload, Download, AlertCircle, Mail } from 'lucide-react'

// Email and full_name are required — everything else students fill in themselves
const REQUIRED_HEADERS = ['email', 'full_name']

// Required: email + full_name. Everything else is optional — students fill in on first login.

export default function AdminImportStudents() {
  const [file, setFile] = useState(null)
  const [parsed, setParsed] = useState([])
  const [errors, setErrors] = useState([])
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  function parseCSV(text) {
    // Normalize line endings (Windows \r\n → \n)
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const lines = normalized.trim().split('\n').filter(l => l.trim())

    // Robust field parser — handles quoted fields with commas inside
    function parseLine(line) {
      const fields = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"' || ch === "'") {
          inQuotes = !inQuotes
        } else if (ch === ',' && !inQuotes) {
          fields.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
      fields.push(current.trim())
      return fields
    }

    const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\r/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h))
    if (missing.length) {
      setErrors([`Missing required columns: ${missing.join(', ')}. Found columns: ${headers.join(', ')}`])
      return []
    }
    return lines.slice(1).filter(l => l.trim()).map((line, i) => {
      const vals = parseLine(line).map(v => v.replace(/\r/g, '').trim())
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

    const allOk = []
    const allFail = []

    try {
      // Split into chunks of 20 to avoid Netlify's 26-second timeout
      const CHUNK_SIZE = 20
      for (let i = 0; i < parsed.length; i += CHUNK_SIZE) {
        const chunk = parsed.slice(i, i + CHUNK_SIZE)

        console.log('Sending chunk to server:', JSON.stringify(chunk.slice(0, 2)))
        const res = await fetch('/.netlify/functions/import-students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: chunk }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || `Import failed (${res.status})`)
        }

        const result = await res.json()
        console.log('Server version:', result.version)
        const { ok, fail } = result
        allOk.push(...ok)
        allFail.push(...fail)
      }

      setResults({ ok: allOk, fail: allFail })
      if (allOk.length) toast.success(`${allOk.length} student(s) imported successfully!`)
      if (allFail.length) toast.error(`${allFail.length} student(s) failed.`)

      // Send admission emails non-blocking
      allOk.forEach(s => {
        sendAdmissionEmail({
          full_name: s.name,
          email: s.email,
          admission_link: s.admissionLink,
          temp_password: s.password,
          student_id: s.student_id,
        }).catch(err => console.warn('Email failed for', s.email, err.message))
      })

    } catch (err) {
      toast.error('Import failed: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const csv = 'email,full_name,phone,gender,state_of_origin,lga\njohn@example.com,John Doe,08012345678,Male,Plateau,Jos North\njane@example.com,Jane Smith,,,,'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ideas_tvet_students_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const [sendingLetters, setSendingLetters] = useState({})

  async function handleSendLetter(student) {
    if (!student.id_number) { toast.error('No ID number for ' + student.email); return }
    setSendingLetters(prev => ({ ...prev, [student.email]: true }))
    try {
      await sendAdmissionLetter({
        full_name: student.name,
        email: student.email,
        id_number: student.id_number,
        student_id: student.student_id,
      })
      toast.success(`Admission letter sent to ${student.email}`)
    } catch (err) {
      toast.error('Failed: ' + err.message)
    } finally {
      setSendingLetters(prev => ({ ...prev, [student.email]: false }))
    }
  }

  async function handleSendAllLetters() {
    const students = results?.ok?.filter(s => s.id_number) || []
    if (!students.length) { toast.error('No students with ID numbers to send to'); return }
    toast.success(`Sending ${students.length} admission letters...`)
    for (const s of students) {
      await handleSendLetter(s).catch(() => {})
    }
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
          Upload a CSV file to bulk-create student accounts. Email and full name are required — students fill in other details themselves.
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
              { step: '1', title: 'Download Template', desc: 'Get the CSV template. Email and full name are required.' },
              { step: '2', title: 'Fill Student Details', desc: 'Add emails and full names. Phone etc. are optional.' },
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
          <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
            <span>ℹ️</span>
            <span style={{ fontSize: 13 }}>
              <strong>Required:</strong> email, full_name. <strong>Optional:</strong> phone, gender, state_of_origin, lga.
              Students complete their remaining profile details on first login.
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
            <button className="btn btn-primary" onClick={handleImport} disabled={importing}>
                          {importing ? <><div className="spinner" />Importing {parsed.length} students...</> : `Import ${parsed.length} Students`}
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Email *</th>
                  <th>Full Name *</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 10).map(row => (
                  <tr key={row._row}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{row._row}</td>
                    <td style={{ fontWeight: 500 }}>{row.email}</td>
                    <td style={{ fontSize: 13, fontWeight: row.full_name ? 600 : 400, color: row.full_name ? '#1e293b' : '#ef4444' }}>
                      {row.full_name || <span>⚠ Missing</span>}
                    </td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{row.phone || '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{row.gender || '—'}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{row.state_of_origin || '—'}</td>
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={handleSendAllLetters}>
                <Mail size={13} /> Send All Letters
              </button>
              <button className="btn btn-outline btn-sm" onClick={downloadResults}>
                <Download size={13} /> Download CSV
              </button>
            </div>
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

            {results.ok.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#15803d', marginBottom: 8 }}>Successfully imported:</div>
                {results.ok.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 500, color: '#1e293b' }}>{s.name}</span>
                      <span style={{ color: '#94a3b8', marginLeft: 8 }}>{s.email}</span>
                      {s.id_number && <span style={{ background: '#0a1628', color: '#f5a623', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginLeft: 8 }}>{s.id_number}</span>}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, padding: '4px 12px' }}
                      onClick={() => handleSendLetter(s)}
                      disabled={sendingLetters[s.email] || !s.id_number}
                    >
                      {sendingLetters[s.email] ? <div className="spinner" style={{ width: 10, height: 10 }} /> : <><Mail size={11} /> Send Letter</>}
                    </button>
                  </div>
                ))}
              </div>
            )}

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
