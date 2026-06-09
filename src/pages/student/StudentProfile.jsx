import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Save, Lock, CheckCircle, AlertTriangle } from 'lucide-react'

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara'
]

export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const isLocked = profile?.profile_updated

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    gender: profile?.gender || '',
    date_of_birth: profile?.date_of_birth || '',
    state_of_origin: profile?.state_of_origin || '',
    lga: profile?.lga || '',
    address: profile?.address || '',
    nin: profile?.nin || '',
    bvn: profile?.bvn || '',
    bank_name: profile?.bank_name || '',
    account_number: profile?.account_number || '',
    next_of_kin_name: profile?.next_of_kin_name || '',
    next_of_kin_phone: profile?.next_of_kin_phone || '',
    next_of_kin_relationship: profile?.next_of_kin_relationship || '',
  })

  function handleChange(e) {
    if (isLocked) return
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isLocked) return
    if (!confirmed) {
      toast.error('Please check the confirmation box before saving.')
      return
    }

    const required = ['full_name', 'phone', 'gender', 'date_of_birth', 'state_of_origin', 'nin', 'bank_name', 'account_number', 'next_of_kin_name', 'next_of_kin_phone']
    const missing = required.filter(f => !form[f]?.trim())
    if (missing.length) {
      toast.error(`Please fill in: ${missing.join(', ').replace(/_/g, ' ')}`)
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...form, profile_updated: true })
        .eq('id', profile.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Profile saved successfully! Your information is now locked.')
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const inputProps = (name) => ({
    name,
    value: form[name],
    onChange: handleChange,
    disabled: isLocked,
    style: isLocked ? { background: '#f8fafc', cursor: 'not-allowed', color: '#64748b' } : {},
  })

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#0a1628' }}>My Profile</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>Your personal information for the IDEAS-TVET program.</p>
      </div>

      {isLocked && (
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          <Lock size={16} />
          <div>
            <strong>Profile Locked</strong> — Your information has been saved and cannot be changed. Contact your program coordinator if you need to make corrections.
          </div>
        </div>
      )}

      {!isLocked && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Important:</strong> You can only update your profile <strong>once</strong>. Please review all information carefully before saving.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2>Personal Information</h2>
            {isLocked && <Lock size={15} color="#94a3b8" />}
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="As on government ID" {...inputProps('full_name')} />
              </div>
              <div className="form-group">
                <label>Phone Number {!isLocked && <span className="required">*</span>}</label>
                <input type="tel" placeholder="08012345678" {...inputProps('phone')} />
              </div>
              <div className="form-group">
                <label>Gender {!isLocked && <span className="required">*</span>}</label>
                <select {...inputProps('gender')}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth {!isLocked && <span className="required">*</span>}</label>
                <input type="date" {...inputProps('date_of_birth')} />
              </div>
              <div className="form-group">
                <label>State of Origin {!isLocked && <span className="required">*</span>}</label>
                <select {...inputProps('state_of_origin')}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>LGA</label>
                <input type="text" placeholder="Local Government Area" {...inputProps('lga')} />
              </div>
              <div className="form-group full">
                <label>Residential Address</label>
                <input type="text" placeholder="Full address" {...inputProps('address')} />
              </div>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <h2>Identity & Banking</h2>
            {isLocked && <Lock size={15} color="#94a3b8" />}
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>NIN (National ID Number) {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="11-digit NIN" maxLength={11} {...inputProps('nin')} />
              </div>
              <div className="form-group">
                <label>BVN (Bank Verification Number)</label>
                <input type="text" placeholder="11-digit BVN" maxLength={11} {...inputProps('bvn')} />
              </div>
              <div className="form-group">
                <label>Bank Name {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="e.g. First Bank" {...inputProps('bank_name')} />
              </div>
              <div className="form-group">
                <label>Account Number {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="10-digit account number" maxLength={10} {...inputProps('account_number')} />
              </div>
            </div>
          </div>
        </div>

        {/* Next of Kin */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <h2>Next of Kin</h2>
            {isLocked && <Lock size={15} color="#94a3b8" />}
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="Next of kin name" {...inputProps('next_of_kin_name')} />
              </div>
              <div className="form-group">
                <label>Phone Number {!isLocked && <span className="required">*</span>}</label>
                <input type="tel" placeholder="08012345678" {...inputProps('next_of_kin_phone')} />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <select {...inputProps('next_of_kin_relationship')}>
                  <option value="">Select relationship</option>
                  <option>Parent</option>
                  <option>Spouse</option>
                  <option>Sibling</option>
                  <option>Guardian</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {!isLocked && (
          <>
            <div style={{
              background: '#fef9ec', border: '1px solid #fde68a', borderRadius: 10,
              padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start'
            }}>
              <input
                type="checkbox"
                id="confirm"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                style={{ marginTop: 2, width: 'auto', flexShrink: 0 }}
              />
              <label htmlFor="confirm" style={{ fontSize: 13, color: '#92400e', cursor: 'pointer', lineHeight: 1.6 }}>
                I confirm that all information provided is accurate and complete. I understand that this profile can only be submitted <strong>once</strong> and cannot be edited afterwards.
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving || !confirmed}
              style={{ minWidth: 200 }}
            >
              {saving ? <><div className="spinner" />Saving...</> : <><Save size={16} />Save Profile</>}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
