import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth.jsx'
import { supabase } from '../../lib/supabase.js'
import toast from 'react-hot-toast'
import { Save, Lock, AlertTriangle, Camera, User, RefreshCw, X } from 'lucide-react'

const STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara'
]

const EMPTY = {
  full_name:'', phone:'', gender:'', date_of_birth:'', state_of_origin:'',
  lga:'', address:'', nin:'', bvn:'', bank_name:'', account_number:'',
  next_of_kin_name:'', next_of_kin_phone:'', next_of_kin_relationship:'',
}

export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formReady, setFormReady] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [showCamera, setShowCamera] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [cameraError, setCameraError] = useState(null)

  const fileRef   = useRef()
  const videoRef  = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    if (profile && !formReady) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        state_of_origin: profile.state_of_origin || '',
        lga: profile.lga || '',
        address: profile.address || '',
        nin: profile.nin || '',
        bvn: profile.bvn || '',
        bank_name: profile.bank_name || '',
        account_number: profile.account_number || '',
        next_of_kin_name: profile.next_of_kin_name || '',
        next_of_kin_phone: profile.next_of_kin_phone || '',
        next_of_kin_relationship: profile.next_of_kin_relationship || '',
      })
      setPhotoUrl(profile.photo_url || null)
      setFormReady(true)
    }
  }, [profile, formReady])

  useEffect(() => { return () => stopCamera() }, [])

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream, showCamera])

  if (!profile) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 0' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, border:'3px solid #e2e8f0', borderTopColor:'#2db84b', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ color:'#64748b', fontSize:14 }}>Loading your profile...</p>
      </div>
    </div>
  )

  const isLocked = profile.profile_updated

  function handleChange(e) {
    if (isLocked) return
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB.'); return }
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file.'); return }
    await uploadPhoto(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function openCamera() {
    setCameraError(null)
    setCapturedImage(null)
    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      setCameraStream(stream)
    } catch (err) {
      setCameraError('Camera access denied or not available. Please upload a photo instead.')
      setCameraStream(null)
    }
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop())
      setCameraStream(null)
    }
  }

  function closeCamera() {
    stopCamera()
    setShowCamera(false)
    setCapturedImage(null)
    setCameraError(null)
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.9))
    stopCamera()
  }

  function retakePhoto() {
    setCapturedImage(null)
    openCamera()
  }

  async function uploadCapturedPhoto() {
    if (!capturedImage) return
    const res  = await fetch(capturedImage)
    const blob = await res.blob()
    const file = new File([blob], 'passport.jpg', { type: 'image/jpeg' })
    closeCamera()
    await uploadPhoto(file)
  }

  async function uploadPhoto(file) {
    setUploadingPhoto(true)
    try {
      const ext  = file.name.split('.').pop() || 'jpg'
      const path = `${profile.id}/passport.${ext}`
      const { error: upErr } = await supabase.storage
        .from('profile-photos')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(path)

      await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', profile.id)
      setPhotoUrl(`${publicUrl}?t=${Date.now()}`)
      await refreshProfile()
      toast.success('Passport photo saved!')
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isLocked) return
    if (!confirmed) { toast.error('Please check the confirmation box before saving.'); return }
    const required = ['full_name','phone','gender','date_of_birth','state_of_origin','nin','bank_name','account_number','next_of_kin_name','next_of_kin_phone']
    const missing  = required.filter(f => !form[f]?.trim())
    if (missing.length) { toast.error(`Please fill in: ${missing.join(', ').replace(/_/g,' ')}`); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({ ...form, profile_updated: true }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profile saved and locked!')
    } catch (err) {
      toast.error(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const inp = (name) => ({
    name, value: form[name], onChange: handleChange, disabled: isLocked,
    style: isLocked ? { background:'#f8fafc', cursor:'not-allowed', color:'#64748b' } : {},
  })

  return (
    <div>
      {/* ── Camera Modal ── */}
      {showCamera && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:500, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#0a1628', borderRadius:20, width:'100%', maxWidth:500, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:15, color:'white' }}>
                {capturedImage ? 'Preview Photo' : 'Take Passport Photo'}
              </span>
              <button onClick={closeCamera} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:'50%', width:30, height:30, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'white' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding:20 }}>
              {cameraError ? (
                <div style={{ textAlign:'center', padding:'24px 0', color:'#f87171', fontSize:14, lineHeight:1.7 }}>
                  {cameraError}
                  <br />
                  <button className="btn btn-outline btn-sm" style={{ marginTop:14, color:'white', borderColor:'rgba(255,255,255,0.3)' }} onClick={closeCamera}>
                    Close
                  </button>
                </div>
              ) : capturedImage ? (
                <div style={{ textAlign:'center' }}>
                  <img src={capturedImage} alt="Captured" style={{ width:'100%', maxWidth:360, borderRadius:12, border:'2px solid #2db84b', display:'block', margin:'0 auto' }} />
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:'10px 0 16px' }}>
                    Make sure your face is clearly visible and centered
                  </p>
                  <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                    <button className="btn btn-outline" onClick={retakePhoto} style={{ color:'white', borderColor:'rgba(255,255,255,0.3)' }}>
                      <RefreshCw size={14} /> Retake
                    </button>
                    <button className="btn btn-primary" onClick={uploadCapturedPhoto} disabled={uploadingPhoto}>
                      {uploadingPhoto ? <><div className="spinner" /> Uploading...</> : <><Camera size={14} /> Use This Photo</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center' }}>
                  <div style={{ position:'relative', borderRadius:12, overflow:'hidden', background:'#000', maxWidth:400, margin:'0 auto' }}>
                    <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', display:'block' }} />
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                      <div style={{ width:150, height:190, border:'2px dashed rgba(45,184,75,0.8)', borderRadius:6 }} />
                    </div>
                  </div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', margin:'10px 0 16px' }}>
                    Position your face inside the frame and look straight at the camera
                  </p>
                  <button className="btn btn-primary btn-lg" onClick={capturePhoto} disabled={!cameraStream}>
                    <Camera size={18} /> Capture Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display:'none' }} />

      {/* ── Page header ── */}
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Syne', fontSize:22, fontWeight:800, color:'#0a1628' }}>My Profile</h1>
        <p style={{ color:'#64748b', fontSize:13 }}>Your personal information for the IDEAS-TVET program.</p>
      </div>

      {isLocked && (
        <div className="alert alert-success" style={{ marginBottom:20 }}>
          <Lock size={16} />
          <div><strong>Profile Locked</strong> — Your information has been saved. Contact your coordinator to make corrections.</div>
        </div>
      )}
      {!isLocked && (
        <div className="alert alert-warning" style={{ marginBottom:20 }}>
          <AlertTriangle size={16} />
          <div><strong>Important:</strong> You can only update your profile <strong>once</strong>. Review carefully before saving.</div>
        </div>
      )}

      {/* ── Passport Photo ── */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header"><h2>Passport Photo</h2></div>
        <div className="card-body">
          <div style={{ display:'flex', alignItems:'center', gap:24, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{ width:110, height:130, borderRadius:10, background:'#f1f5f9', border:'3px solid #e2e8f0', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {uploadingPhoto ? (
                  <div style={{ textAlign:'center' }}>
                    <div style={{ width:24, height:24, border:'3px solid #e2e8f0', borderTopColor:'#2db84b', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 6px' }} />
                    <div style={{ fontSize:10, color:'#64748b' }}>Uploading...</div>
                  </div>
                ) : photoUrl ? (
                  <img src={photoUrl} alt="Passport" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <User size={44} color="#cbd5e1" />
                )}
              </div>
              {photoUrl && !uploadingPhoto && (
                <div style={{ position:'absolute', bottom:-4, right:-4, background:'#2db84b', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white', fontSize:11, color:'white' }}>✓</div>
              )}
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ fontWeight:600, fontSize:14, color:'#1e293b', marginBottom:6 }}>
                {photoUrl ? 'Passport photo uploaded ✓' : 'Upload your passport photo'}
              </div>
              <div style={{ fontSize:12, color:'#94a3b8', lineHeight:1.7, marginBottom:14 }}>
                Clear front-facing photo on plain background.<br />
                JPG or PNG, max 5MB. Appears in the program photo album.
              </div>
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={uploadingPhoto}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload from Gallery
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={openCamera} disabled={uploadingPhoto}>
                  <Camera size={14} /> Take Photo with Camera
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display:'none' }} />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header">
            <h2>Personal Information</h2>
            {isLocked && <Lock size={15} color="#94a3b8" />}
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="As on government ID" {...inp('full_name')} />
              </div>
              <div className="form-group">
                <label>Phone Number {!isLocked && <span className="required">*</span>}</label>
                <input type="tel" placeholder="08012345678" {...inp('phone')} />
              </div>
              <div className="form-group">
                <label>Gender {!isLocked && <span className="required">*</span>}</label>
                <select {...inp('gender')}>
                  <option value="">Select gender</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date of Birth {!isLocked && <span className="required">*</span>}</label>
                <input type="date" {...inp('date_of_birth')} />
              </div>
              <div className="form-group">
                <label>State of Origin {!isLocked && <span className="required">*</span>}</label>
                <select {...inp('state_of_origin')}>
                  <option value="">Select state</option>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>LGA</label>
                <input type="text" placeholder="Local Government Area" {...inp('lga')} />
              </div>
              <div className="form-group full">
                <label>Residential Address</label>
                <input type="text" placeholder="Full address" {...inp('address')} />
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Banking */}
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-header">
            <h2>Identity & Banking</h2>
            {isLocked && <Lock size={15} color="#94a3b8" />}
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>NIN {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="11-digit NIN" maxLength={11} {...inp('nin')} />
              </div>
              <div className="form-group">
                <label>BVN</label>
                <input type="text" placeholder="11-digit BVN" maxLength={11} {...inp('bvn')} />
              </div>
              <div className="form-group">
                <label>Bank Name {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="e.g. First Bank" {...inp('bank_name')} />
              </div>
              <div className="form-group">
                <label>Account Number {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="10-digit account number" maxLength={10} {...inp('account_number')} />
              </div>
            </div>
          </div>
        </div>

        {/* Next of Kin */}
        <div className="card" style={{ marginBottom:20 }}>
          <div className="card-header">
            <h2>Next of Kin</h2>
            {isLocked && <Lock size={15} color="#94a3b8" />}
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name {!isLocked && <span className="required">*</span>}</label>
                <input type="text" placeholder="Next of kin name" {...inp('next_of_kin_name')} />
              </div>
              <div className="form-group">
                <label>Phone Number {!isLocked && <span className="required">*</span>}</label>
                <input type="tel" placeholder="08012345678" {...inp('next_of_kin_phone')} />
              </div>
              <div className="form-group">
                <label>Relationship</label>
                <select {...inp('next_of_kin_relationship')}>
                  <option value="">Select relationship</option>
                  <option>Parent</option><option>Spouse</option>
                  <option>Sibling</option><option>Guardian</option><option>Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {!isLocked && (
          <>
            <div style={{ background:'#fef9ec', border:'1px solid #fde68a', borderRadius:10, padding:'14px 18px', marginBottom:20, display:'flex', gap:12, alignItems:'flex-start' }}>
              <input type="checkbox" id="confirm" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop:2, width:'auto', flexShrink:0 }} />
              <label htmlFor="confirm" style={{ fontSize:13, color:'#92400e', cursor:'pointer', lineHeight:1.6 }}>
                I confirm all information is accurate and complete. I understand this profile can only be submitted <strong>once</strong> and cannot be edited afterwards.
              </label>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !confirmed} style={{ minWidth:200 }}>
              {saving ? <><div className="spinner" /> Saving...</> : <><Save size={16} /> Save Profile</>}
            </button>
          </>
        )}
      </form>
    </div>
  )
}