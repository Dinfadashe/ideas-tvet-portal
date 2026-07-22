// src/pages/tsp/RegisterTSP.jsx
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

const STEPS = ['Account', 'Organisation', 'Project', 'Payment']

export default function RegisterTSP() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [receiptFile, setReceiptFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [form, setForm] = useState({
    // Account
    email: '', password: '', confirm_password: '',
    // Organisation
    org_name: '', org_acronym: '', cac_number: '', cac_date: '',
    nbte_number: '', nbte_date: '',
    head_office_address: '', state: '', lga: '', phone: '', org_email: '', website: '',
    // MD/CEO
    md_name: '', md_phone: '', md_email: '', md_address: '',
    // Programme Manager
    pm_name: '', pm_phone: '', pm_email: '',
    // Project
    project_name: 'IDEAS-TVET Initiative', trade: '', training_venue: '',
    state_of_operation: '', lga_of_operation: '',
    bank_name: '', account_number: '', account_name: '',
    // Payment
    payment_ref: '', payment_date: '', payment_amount: '50000',
  })

  const inp = (field) => ({
    value: form[field],
    onChange: (e) => setForm(p => ({ ...p, [field]: e.target.value })),
  })

  function handleLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleReceipt(e) {
    const file = e.target.files[0]
    if (!file) return
    setReceiptFile(file)
    toast.success('Receipt selected: ' + file.name)
  }

  async function uploadFile(file, folder) {
    const ext = file.name.split('.').pop()
    const path = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('tsp-assets').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('tsp-assets').getPublicUrl(path)
    return publicUrl
  }

  async function handleSubmit() {
    if (!receiptFile) { toast.error('Please upload payment receipt'); return }
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return }

    setLoading(true)
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { role: 'tsp', org_name: form.org_name } }
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error('Failed to create account')

      // 2. Upload logo if provided
      let logoUrl = null
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, `${userId}/logo`)
      }

      // 3. Upload receipt
      const receiptUrl = await uploadFile(receiptFile, `${userId}/receipts`)

      // 4. Create TSP account record
      const { error: tspError } = await supabase.from('tsp_accounts').insert({
        user_id: userId,
        email: form.email,
        org_name: form.org_name,
        org_acronym: form.org_acronym,
        logo_url: logoUrl,
        cac_number: form.cac_number,
        cac_date: form.cac_date,
        nbte_number: form.nbte_number,
        nbte_date: form.nbte_date,
        head_office_address: form.head_office_address,
        state: form.state,
        lga: form.lga,
        phone: form.phone,
        org_email: form.org_email,
        website: form.website,
        md_name: form.md_name,
        md_phone: form.md_phone,
        md_email: form.md_email,
        md_address: form.md_address,
        pm_name: form.pm_name,
        pm_phone: form.pm_phone,
        pm_email: form.pm_email,
        project_name: form.project_name,
        trade: form.trade,
        training_venue: form.training_venue,
        state_of_operation: form.state_of_operation,
        lga_of_operation: form.lga_of_operation,
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_name: form.account_name,
        payment_receipt_url: receiptUrl,
        payment_ref: form.payment_ref,
        payment_date: form.payment_date,
        payment_amount: 50000,
        status: 'pending',
      })
      if (tspError) throw tspError

      // 5. Notify admin via email
      await fetch('/.netlify/functions/send-tsp-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'new_registration', org_name: form.org_name, email: form.email }),
      })

      toast.success('Registration submitted! Our team will review and approve within 24-48 hours.')
      setStep(4) // Success screen
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 4) return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 48, maxWidth: 520, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0a2e14', marginBottom: 12 }}>Registration Submitted!</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>
          Your TSP registration for <strong>{form.org_name}</strong> has been received. Our admin team will review your payment receipt and approve your account within <strong>24–48 hours</strong>.
        </p>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>What happens next?</div>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.8 }}>
            ✅ Registration submitted<br/>
            ⏳ Payment receipt reviewed by admin<br/>
            📧 Approval email sent to {form.email}<br/>
            🚀 Your 365-day subscription begins
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Questions? Email us at <a href="mailto:official@theweb3alliance.org" style={{ color: '#1a7a3c' }}>official@theweb3alliance.org</a></p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', padding: '32px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 13, color: '#1a7a3c', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>IDEAS-TVET Portal</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0a2e14', marginBottom: 8 }}>Register as a Training Service Provider</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Annual subscription: <strong>₦50,000</strong> to Web3.0 Alliance Ltd · UBA · 1027821555</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: i <= step ? '#1a7a3c' : '#e2e8f0',
                color: i <= step ? '#fff' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: i === step ? '#0a2e14' : '#94a3b8', fontWeight: i === step ? 700 : 400 }}>{s}</span>
              {i < STEPS.length - 1 && <div style={{ width: 24, height: 1, background: '#e2e8f0' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>

          {/* ── STEP 0: ACCOUNT ── */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 24 }}>Create Your Account</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" placeholder="admin@yourorg.org" {...inp('email')} />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" placeholder="Minimum 8 characters" {...inp('password')} />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input type="password" placeholder="Repeat password" {...inp('confirm_password')} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: ORGANISATION ── */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 24 }}>Organisation Details</h2>

              {/* Logo upload */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Organisation Logo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  ) : (
                    <div style={{ width: 72, height: 72, background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏢</div>
                  )}
                  <label style={{ cursor: 'pointer', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 16px', fontSize: 13, color: '#1a7a3c', fontWeight: 600 }}>
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Organisation Name *</label>
                  <input type="text" placeholder="Full legal name" {...inp('org_name')} />
                </div>
                <div className="form-group">
                  <label>Acronym</label>
                  <input type="text" placeholder="e.g. W3A" {...inp('org_acronym')} />
                </div>
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" placeholder="08012345678" {...inp('phone')} />
                </div>
                <div className="form-group">
                  <label>Organisation Email *</label>
                  <input type="email" placeholder="info@yourorg.org" {...inp('org_email')} />
                </div>
                <div className="form-group">
                  <label>Website</label>
                  <input type="url" placeholder="https://yourorg.org" {...inp('website')} />
                </div>
                <div className="form-group">
                  <label>CAC Number</label>
                  <input type="text" placeholder="RC: 0000000" {...inp('cac_number')} />
                </div>
                <div className="form-group">
                  <label>CAC Registration Date</label>
                  <input type="text" placeholder="e.g. 1st Jan 2024" {...inp('cac_date')} />
                </div>
                <div className="form-group">
                  <label>NBTE Accreditation</label>
                  <input type="text" placeholder="Accreditation number" {...inp('nbte_number')} />
                </div>
                <div className="form-group">
                  <label>NBTE Accreditation Date</label>
                  <input type="text" placeholder="e.g. 1st July 2026" {...inp('nbte_date')} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Head Office Address *</label>
                  <input type="text" placeholder="Full address" {...inp('head_office_address')} />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input type="text" placeholder="e.g. Plateau State" {...inp('state')} />
                </div>
                <div className="form-group">
                  <label>LGA</label>
                  <input type="text" placeholder="Local Government Area" {...inp('lga')} />
                </div>

                {/* MD/CEO */}
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e14', marginBottom: 16 }}>MD / CEO Details</div>
                </div>
                <div className="form-group">
                  <label>MD/CEO Full Name *</label>
                  <input type="text" {...inp('md_name')} />
                </div>
                <div className="form-group">
                  <label>MD/CEO Phone</label>
                  <input type="tel" {...inp('md_phone')} />
                </div>
                <div className="form-group">
                  <label>MD/CEO Email</label>
                  <input type="email" {...inp('md_email')} />
                </div>
                <div className="form-group">
                  <label>MD/CEO Address</label>
                  <input type="text" {...inp('md_address')} />
                </div>

                {/* Programme Manager */}
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e14', marginBottom: 16 }}>Training Programme Manager (TPM)</div>
                </div>
                <div className="form-group">
                  <label>TPM Full Name *</label>
                  <input type="text" {...inp('pm_name')} />
                </div>
                <div className="form-group">
                  <label>TPM Phone *</label>
                  <input type="tel" {...inp('pm_phone')} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>TPM Email</label>
                  <input type="email" {...inp('pm_email')} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: PROJECT ── */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 24 }}>Project & Programme Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Project Name</label>
                  <input type="text" {...inp('project_name')} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Trade / Skill Area *</label>
                  <input type="text" placeholder="e.g. Computer Hardware & Cellphone Repairs" {...inp('trade')} />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label>Training Venue *</label>
                  <input type="text" placeholder="Full address of training centre" {...inp('training_venue')} />
                </div>
                <div className="form-group">
                  <label>State of Operation *</label>
                  <input type="text" placeholder="e.g. Lagos State" {...inp('state_of_operation')} />
                </div>
                <div className="form-group">
                  <label>LGA of Operation</label>
                  <input type="text" {...inp('lga_of_operation')} />
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0a2e14', marginBottom: 16 }}>Project Bank Account Details</div>
                </div>
                <div className="form-group">
                  <label>Account Name *</label>
                  <input type="text" {...inp('account_name')} />
                </div>
                <div className="form-group">
                  <label>Account Number *</label>
                  <input type="text" maxLength={10} {...inp('account_number')} />
                </div>
                <div className="form-group">
                  <label>Bank Name *</label>
                  <input type="text" {...inp('bank_name')} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: PAYMENT ── */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0a2e14', marginBottom: 8 }}>Payment</h2>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>Make payment and upload your receipt below. Your account will be activated once payment is confirmed.</p>

              {/* Payment details box */}
              <div style={{ background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', borderRadius: 12, padding: 24, marginBottom: 24, color: '#fff' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Pay to</div>
                <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>Web3.0 Alliance Ltd</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#c8a82a', letterSpacing: 2, marginBottom: 4 }}>1027821555</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>UBA · Annual Subscription Fee</div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Amount</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#c8a82a' }}>₦50,000</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Validity</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>365 Days</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Payment Reference / Narration</label>
                  <input type="text" placeholder="e.g. TSP subscription - OrgName" {...inp('payment_ref')} />
                </div>
                <div className="form-group">
                  <label>Date of Payment *</label>
                  <input type="date" {...inp('payment_date')} />
                </div>
              </div>

              {/* Receipt upload */}
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Upload Payment Receipt *</label>
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <div style={{ border: '2px dashed #cbd5e1', borderRadius: 10, padding: 28, textAlign: 'center', background: receiptFile ? '#f0fdf4' : '#f8fafc', borderColor: receiptFile ? '#1a7a3c' : '#cbd5e1' }}>
                    {receiptFile ? (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a7a3c' }}>{receiptFile.name}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Click to change</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Click to upload receipt</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PDF, JPG or PNG · Max 10MB</div>
                      </div>
                    )}
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleReceipt} style={{ display: 'none' }} />
                  </div>
                </label>
              </div>

              <div style={{ background: '#fffbea', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', marginTop: 20, fontSize: 13, color: '#92400e', lineHeight: 1.6 }}>
                ⚠️ Your registration will be reviewed within <strong>24–48 hours</strong> of receipt submission. You will receive an email at <strong>{form.email}</strong> once approved.
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, gap: 12 }}>
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} style={{ padding: '10px 24px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
                ← Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 0 && (!form.email || !form.password)) { toast.error('Please fill email and password'); return }
                  if (step === 1 && (!form.org_name || !form.md_name || !form.pm_name)) { toast.error('Please fill required fields'); return }
                  if (step === 2 && (!form.trade || !form.training_venue)) { toast.error('Please fill required fields'); return }
                  setStep(s => s + 1)
                }}
                style={{ padding: '10px 28px', borderRadius: 8, background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', fontWeight: 700, cursor: 'pointer', border: 'none', fontSize: 14 }}
              >
                Continue →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ padding: '10px 28px', borderRadius: 8, background: loading ? '#ccc' : 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', border: 'none', fontSize: 14 }}
              >
                {loading ? '⏳ Submitting...' : '✅ Submit Registration'}
              </button>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
          Already registered? <a href="/tsp/login" style={{ color: '#1a7a3c', fontWeight: 600 }}>Log in here</a>
        </p>
      </div>
    </div>
  )
}
