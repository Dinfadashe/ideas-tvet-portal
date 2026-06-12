import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function ChangePasswordPage() {
  const { updatePassword } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      // Step 1: update auth password
      await updatePassword(newPassword)

      // Step 2: get current user directly from supabase (never rely on context here)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Step 3: mark password_changed in DB
      await supabase
        .from('profiles')
        .update({ password_changed: true })
        .eq('id', currentUser.id)

      // Step 4: fetch role to know where to redirect
      const { data: fresh } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      toast.success('Password updated! Redirecting...')

      // Step 5: hard redirect — bypasses React Router and all context race conditions
      setTimeout(() => {
        window.location.replace(fresh?.role === 'admin' ? '/admin' : '/dashboard')
      }, 800)
    } catch (err) {
      toast.error(err.message || 'Failed to update password.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ width: 56, height: 56, background: '#f0fdf4', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #bbf7d0' }}>
            <ShieldCheck size={24} color="#2db84b" />
          </div>
          <h1>Set New Password</h1>
          <p>For security, please set a new password before continuing. This is a one-time setup.</p>
        </div>

        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <span>⚠️</span>
          <span>You are using a temporary password. Please create a secure personal password to continue.</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>New Password <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={show1 ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShow1(!show1)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                {show1 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Confirm New Password <span className="required">*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={show2 ? 'text' : 'password'}
                placeholder="Repeat your new password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShow2(!show2)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                {show2 ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading
              ? <><div className="spinner" /> Saving...</>
              : 'Set Password & Continue'
            }
          </button>
        </form>
      </div>
    </div>
  )
}