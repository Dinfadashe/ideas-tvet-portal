import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [valid, setValid] = useState(false)

  useEffect(() => {
    // Supabase puts the hash tokens in the URL automatically
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setValid(true)
    })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Password updated! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  if (!valid) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invalid Reset Link</h2>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>This password reset link is invalid or has expired.</p>
          <button className="btn btn-navy" onClick={() => navigate('/login')}>Back to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Your Password</h1>
          <p>Enter your new password below.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={show1 ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShow1(!show1)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {show1 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input type={show2 ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat your password" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShow2(!show2)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? <div className="spinner" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
