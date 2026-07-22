// src/pages/tsp/TSPRenew.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function TSPRenew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [receiptFile, setReceiptFile] = useState(null)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentRef, setPaymentRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleRenewal() {
    if (!receiptFile) { toast.error('Please upload your payment receipt'); return }
    if (!paymentDate) { toast.error('Please enter payment date'); return }
    setLoading(true)
    try {
      const { data: tspData } = await supabase
        .from('tsp_accounts')
        .select('id, org_name, email')
        .eq('user_id', user.id)
        .single()

      if (!tspData) throw new Error('TSP account not found')

      // Upload receipt
      const ext = receiptFile.name.split('.').pop()
      const path = `${user.id}/renewals/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('tsp-assets').upload(path, receiptFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('tsp-assets').getPublicUrl(path)

      // Update TSP record
      const { error } = await supabase
        .from('tsp_accounts')
        .update({
          renewal_receipt_url: publicUrl,
          renewal_submitted_at: new Date().toISOString(),
          renewal_status: 'pending',
          payment_ref: paymentRef,
          payment_date: paymentDate,
        })
        .eq('id', tspData.id)
      if (error) throw error

      // Notify admin
      await fetch('/.netlify/functions/send-tsp-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'renewal_submitted', org_name: tspData.org_name, email: tspData.email }),
      })

      setSubmitted(true)
      toast.success('Renewal submitted! We will review and approve within 24 hours.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0a2e14', marginBottom: 12 }}>Renewal Submitted!</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7 }}>Your renewal receipt has been received. Our admin will review and approve within 24 hours. Your subscription will be extended by 365 days upon approval.</p>
        <button onClick={() => navigate('/tsp/dashboard')} style={{ marginTop: 24, padding: '10px 24px', background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0a2e14', marginBottom: 8 }}>Renew Subscription</h1>
      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>Make payment and upload your receipt to renew for another 365 days.</p>

      {/* Payment details */}
      <div style={{ background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', borderRadius: 12, padding: 24, marginBottom: 24, color: '#fff' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Pay to</div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Web3.0 Alliance Ltd</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#c8a82a', letterSpacing: 2, margin: '4px 0' }}>1027821555</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>UBA · Annual Subscription Renewal</div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Amount</div><div style={{ fontSize: 22, fontWeight: 900, color: '#c8a82a' }}>₦50,000</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Extension</div><div style={{ fontSize: 16, fontWeight: 700 }}>+365 Days</div></div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
        <div className="form-group">
          <label>Payment Date *</label>
          <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Payment Reference</label>
          <input type="text" placeholder="Teller/transaction reference" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
        </div>
      </div>

      {/* Receipt upload */}
      <label style={{ cursor: 'pointer', display: 'block', marginBottom: 20 }}>
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: 10, padding: 28, textAlign: 'center', background: receiptFile ? '#f0fdf4' : '#f8fafc', borderColor: receiptFile ? '#1a7a3c' : '#cbd5e1' }}>
          {receiptFile ? (
            <div><div style={{ fontSize: 28, marginBottom: 8 }}>✅</div><div style={{ fontSize: 14, fontWeight: 600, color: '#1a7a3c' }}>{receiptFile.name}</div><div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Click to change</div></div>
          ) : (
            <div><div style={{ fontSize: 32, marginBottom: 8 }}>📄</div><div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Click to upload payment receipt</div><div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PDF, JPG or PNG · Max 10MB</div></div>
          )}
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setReceiptFile(e.target.files[0])} style={{ display: 'none' }} />
        </div>
      </label>

      <button onClick={handleRenewal} disabled={loading}
        style={{ width: '100%', padding: '14px', borderRadius: 10, background: loading ? '#ccc' : 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15 }}>
        {loading ? '⏳ Submitting...' : '🔄 Submit Renewal Receipt'}
      </button>
    </div>
  )
}
