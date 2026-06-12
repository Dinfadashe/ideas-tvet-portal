import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { user } = await signIn(email, password)

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, password_changed')
        .eq('id', user.id)
        .single()

      if (!profile?.password_changed) {
        navigate('/change-password')
      } else if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(resetEmail)
      toast.success('Password reset email sent! Check your inbox.')
      setForgotMode(false)
    } catch (err) {
      toast.error(err.message || 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logo.png" alt="Web3.0 Alliance Logo" style={{ height: 56, width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1>{forgotMode ? 'Reset Password' : 'Welcome Back'}</h1>
          <p>{forgotMode
            ? 'Enter your email and we\'ll send you a reset link.'
            : 'Sign in to your IDEAS-TVET portal account.'
          }</p>
        </div>

        {!forgotMode ? (
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-navy btn-lg w-full"
              disabled={loading}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {loading ? <div className="spinner" /> : <><LogIn size={16} /> Sign In</>}
            </button>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                style={{ background: 'none', border: 'none', color: '#2db84b', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans' }}
              >
                Forgot your password?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="your-email@example.com"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', marginBottom: 16 }}
            >
              {loading ? <div className="spinner" /> : 'Send Reset Link'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans' }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 28, padding: '16px', background: '#f1f5f9', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            Access to this portal is by invitation only.<br />
            Contact <strong style={{ color: '#0a1628' }}>ideas@theweb3alliance.org</strong> for support.
          </p>
        </div>
      </div>
    </div>
  )
}