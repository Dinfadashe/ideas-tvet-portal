import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function AcceptAdmissionPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [student, setStudent] = useState(null)

  useEffect(() => {
    verifyToken()
  }, [token])

  async function verifyToken() {
    try {
      const res = await fetch('/.netlify/functions/accept-admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'verify' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { setStatus('invalid'); return }
      if (data.already_accepted) { setStatus('accepted'); setStudent(data.student); return }
      setStudent(data.student)
      setStatus('valid')
    } catch (err) {
      setStatus('invalid')
    }
  }

  async function acceptAdmission() {
    setStatus('loading')
    try {
      const res = await fetch('/.netlify/functions/accept-admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'accept' }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed')
      setStudent(data.student)
      setStatus('accepted')
      toast.success('Admission accepted! You can now log in to your portal.')
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
      setStatus('valid')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo.png" alt="Web3.0 Alliance Logo" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Loader size={32} color="#2db84b" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontSize: 14 }}>Verifying your admission link...</p>
          </div>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Invalid Link</h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
              This admission link is invalid or has expired. Please contact your program coordinator.
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Email: <a href="mailto:ideas@theweb3alliance.org" style={{ color: '#2db84b' }}>ideas@theweb3alliance.org</a>
            </p>
          </div>
        )}

        {status === 'accepted' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle size={48} color="#2db84b" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
              {student ? `Congratulations, ${student.full_name?.split(' ')[0]}!` : 'Admission Accepted!'}
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              Your admission to the IDEAS-TVET Computer Hardware &amp; Cellphone Repairs Training has been confirmed.
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6 }}>
                <strong>Next Steps:</strong><br />
                1. Log in to your student portal using the credentials sent to your email.<br />
                2. Change your password on first login.<br />
                3. Complete your profile information.
              </p>
            </div>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => navigate('/login')}>
              Go to Student Portal
            </button>
          </div>
        )}

        {status === 'valid' && student && (
          <div>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                <strong>Admission Offer</strong><br />
                You have been admitted to the <strong>IDEAS-TVET Computer Hardware &amp; Cellphone Repairs Training Program</strong>, funded by the World Bank through the Federal Ministry of Education.
              </p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 800, color: '#0a1628', marginBottom: 4 }}>
                Hello, {student.full_name?.split(' ')[0]}!
              </h2>
              <p style={{ fontSize: 14, color: '#64748b' }}>
                Click the button below to officially accept your admission offer. This will activate your student account.
              </p>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px', marginBottom: 24 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                {[
                  ['Program', 'Computer Hardware & Cellphone Repairs'],
                  ['Venue', 'Plateau State Polytechnic, Jos'],
                  ['Duration', 'Minimum 6 months'],
                  ['Funded By', 'World Bank / Federal Ministry of Education'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                    <span style={{ color: '#64748b', minWidth: 80 }}>{label}:</span>
                    <span style={{ color: '#1e293b', fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#92400e' }}>
              ⚠️ By accepting, you confirm your commitment to attend and complete the program.
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={acceptAdmission}>
              ✓ Accept Admission Offer
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
              Your login credentials have been sent to your registered email.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}