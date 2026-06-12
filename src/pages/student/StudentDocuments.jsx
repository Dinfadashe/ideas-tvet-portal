import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Download, Upload, FileText, CheckCircle, Loader, Lock } from 'lucide-react'
import AdmissionLetterDownload from '../../components/AdmissionLetterDownload.jsx'

export default function StudentDocuments() {
  const { profile } = useAuth()
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const fileRef = useRef()

  const isIntern = profile?.status === 'intern' || profile?.status === 'graduated'
  const hasUploadedAcceptance = documents.some(d => d.document_type === 'acceptance_letter')

  useEffect(() => {
    if (profile?.id) fetchDocuments()
  }, [profile?.id])

  async function fetchDocuments() {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('student_id', profile.id)
      .order('uploaded_at', { ascending: false })
    setDocuments(data || [])
  }

  async function generateInternshipLetter() {
    setGenerating(true)
    try {
      // Dynamically import jsPDF only when needed
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210
      const margin = 25
      const contentW = pageW - margin * 2

      // Header background
      doc.setFillColor(10, 22, 40) // navy
      doc.rect(0, 0, pageW, 42, 'F')

      // Header text
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('WEB3.0 ALLIANCE LIMITED', margin, 16)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('131 Angwan Dabba Bukuru, Jos, Plateau State', margin, 23)
      doc.text('Email: official@theweb3alliance.org | Website: www.theweb3alliance.org', margin, 29)

      // Green accent bar
      doc.setFillColor(45, 184, 75)
      doc.rect(0, 42, pageW, 4, 'F')

      // Partner logos text (right side)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7)
      doc.setTextColor(255, 255, 255)
      doc.text('IDEAS-TVET INITIATIVE', pageW - margin, 16, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.text('Federal Ministry of Education', pageW - margin, 22, { align: 'right' })
      doc.text('World Bank Funded', pageW - margin, 27, { align: 'right' })

      // Reset text color
      doc.setTextColor(30, 41, 59)

      let y = 58

      // Reference & Date
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Ref: WA/IDEAS-TVET/INT/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 9000) + 1000)}`, margin, y)
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageW - margin, y, { align: 'right' })
      y += 14

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(10, 22, 40)
      doc.text('LETTER OF INTERNSHIP PLACEMENT', pageW / 2, y, { align: 'center' })
      y += 4

      // Underline
      doc.setDrawColor(45, 184, 75)
      doc.setLineWidth(0.8)
      doc.line(margin + 20, y, pageW - margin - 20, y)
      y += 10

      // Salutation
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(51, 65, 85)
      doc.text('TO WHOM IT MAY CONCERN', margin, y)
      y += 10

      // Body
      const startDate = profile?.internship_started_at
        ? new Date(profile.internship_started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      const endDate = profile?.internship_started_at
        ? new Date(new Date(profile.internship_started_at).setMonth(new Date(profile.internship_started_at).getMonth() + 3)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      const lines = [
        `This is to certify that ${profile?.full_name?.toUpperCase()}, with NIN: ${profile?.nin || 'N/A'},`,
        `is a registered trainee of the IDEAS-TVET Computer Hardware & Cellphone Repairs Training`,
        `Program being implemented by Web3.0 Alliance Limited in partnership with the Federal`,
        `Ministry of Education, with support from the World Bank under the IDEAS-TVET Initiative.`,
        '',
        `The above-named trainee has been duly placed for a 3-month practical internship program`,
        `commencing ${startDate} and expected to conclude on ${endDate}.`,
        '',
        'This internship is a mandatory component of the NYESAF Skills Training Program and is',
        'designed to provide the trainee with hands-on industry experience in their trade.',
        '',
        'We respectfully request that the host establishment provides the trainee with the necessary',
        'guidance, supervision, and a conducive learning environment throughout the internship period.',
        '',
        'All interns are covered under the program welfare framework. For enquiries or verification,',
        'please contact: official@theweb3alliance.org or call our office.',
      ]

      lines.forEach(line => {
        if (line === '') { y += 5; return }
        const split = doc.splitTextToSize(line, contentW)
        doc.text(split, margin, y)
        y += split.length * 5.5
      })

      y += 8

      // Trainee details box
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin, y, contentW, 32, 2, 2, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(10, 22, 40)
      doc.text('TRAINEE DETAILS', margin + 6, y + 8)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(51, 65, 85)

      const details = [
        [`Name:`, profile?.full_name || ''],
        [`NIN:`, profile?.nin || 'N/A'],
        [`Phone:`, profile?.phone || 'N/A'],
        [`Period:`, `${startDate} to ${endDate}`],
      ]

      details.forEach((row, i) => {
        const col = i < 2 ? 0 : 1
        const rowY = y + 14 + (i % 2) * 8
        const xOff = col * (contentW / 2)
        doc.setFont('helvetica', 'bold')
        doc.text(row[0], margin + 6 + xOff, rowY)
        doc.setFont('helvetica', 'normal')
        doc.text(row[1], margin + 28 + xOff, rowY)
      })

      y += 42

      // Signature
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(10, 22, 40)
      doc.text('Authorised Signatory', margin, y)
      y += 5
      doc.setDrawColor(10, 22, 40)
      doc.setLineWidth(0.5)
      doc.line(margin, y, margin + 60, y)
      y += 8
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(51, 65, 85)
      doc.text('Web3.0 Alliance Limited', margin, y)
      y += 5
      doc.text('IDEAS-TVET Program Coordinator', margin, y)

      // Footer
      doc.setFillColor(10, 22, 40)
      doc.rect(0, 282, pageW, 15, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.text(
        'Web3.0 Alliance Ltd | IDEAS-TVET Initiative | Plateau State Polytechnic, Jos | Contract: IDEAS-TVET2/NPCU/PLATEAU/05.26/304',
        pageW / 2, 290, { align: 'center' }
      )

      doc.save(`Internship_Letter_${profile?.full_name?.replace(/\s+/g, '_')}.pdf`)
      toast.success('Internship letter downloaded!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate letter. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.')
      return
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${profile.id}/acceptance_letter_${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('acceptance-letters')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('acceptance-letters')
        .getPublicUrl(fileName)

      await supabase.from('documents').insert({
        student_id: profile.id,
        document_type: 'acceptance_letter',
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
      })

      await fetchDocuments()
      toast.success('Acceptance letter uploaded successfully!')
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>Documents</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Download your internship letter and upload your acceptance letter.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Admission Letter Download */}
        {profile?.id_number && (
          <div className="card">
            <div className="card-header">
              <h2>Admission Letter</h2>
              <span className="badge badge-green">Available</span>
            </div>
            <div className="card-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ width: 64, height: 64, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <FileText size={28} color="#1d4ed8" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                  Official Admission Letter
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                  Your trainee ID: <strong style={{ color: '#0a1628', fontFamily: 'monospace' }}>{profile.id_number}</strong>
                </div>
              </div>
              <AdmissionLetterDownload profile={profile} />
            </div>
          </div>
        )}

        {/* Internship Letter */}
        <div className="card">
          <div className="card-header">
            <h2>Internship Letter</h2>
            {isIntern && <span className="badge badge-green">Available</span>}
          </div>
          <div className="card-body">
            {isIntern ? (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ width: 64, height: 64, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <FileText size={28} color="#2db84b" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                    Internship Placement Letter
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Official letter from Web3.0 Alliance Ltd confirming your internship placement.
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {[
                      ['Name', profile?.full_name],
                      ['NIN', profile?.nin || 'Not provided'],
                      ['Duration', '3 Months'],
                    ].map(([l, v]) => (
                      <div key={l} style={{ display: 'flex', gap: 8 }}>
                        <span style={{ color: '#94a3b8', minWidth: 70 }}>{l}:</span>
                        <span style={{ fontWeight: 500, color: '#334155' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={generateInternshipLetter}
                  disabled={generating}
                >
                  {generating
                    ? <><div className="spinner" />Generating...</>
                    : <><Download size={16} />Download Internship Letter</>
                  }
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                <Lock size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6, color: '#64748b' }}>Not Yet Available</div>
                <div style={{ fontSize: 13 }}>
                  Your internship letter will be available once you have been placed on internship by your administrator.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Acceptance Letter Upload */}
        <div className="card">
          <div className="card-header">
            <h2>Acceptance Letter</h2>
            {hasUploadedAcceptance && <span className="badge badge-green">✓ Submitted</span>}
          </div>
          <div className="card-body">
            {hasUploadedAcceptance ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <CheckCircle size={48} color="#2db84b" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                    Acceptance Letter Submitted
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Your letter has been received and is under review.
                  </div>
                </div>
                {documents.filter(d => d.document_type === 'acceptance_letter').map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                    <FileText size={16} color="#2db84b" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#334155' }}>{doc.file_name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(doc.uploaded_at).toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16, fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
                  Upload your signed acceptance letter to confirm your participation in the program. Accepted formats: PDF, JPG, PNG (max 5MB).
                </div>

                <div
                  className="upload-zone"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload size={28} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#475569', marginBottom: 4 }}>
                    Click to upload acceptance letter
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>PDF, JPG or PNG up to 5MB</div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUpload}
                    style={{ display: 'none' }}
                  />
                </div>

                {uploading && (
                  <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div className="spinner dark" style={{ width: 16, height: 16 }} />
                    Uploading...
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Document history */}
      {documents.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <h2>All Documents</h2>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th>Size</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 500 }}>{doc.file_name}</td>
                    <td>
                      <span className="badge badge-navy" style={{ fontSize: 10 }}>
                        {doc.document_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-GB')}
                    </td>
                    <td style={{ color: '#94a3b8', fontSize: 13 }}>
                      {doc.file_size ? `${Math.round(doc.file_size / 1024)}KB` : '—'}
                    </td>
                    <td>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}