import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const modules = [
    { icon: '🖥️', title: 'Computer Hardware Diagnostics', desc: 'Identify, troubleshoot, and resolve hardware faults in desktops and laptops.' },
    { icon: '💻', title: 'Laptop & Desktop Repairs', desc: 'Full disassembly, component replacement, and system restoration techniques.' },
    { icon: '📱', title: 'Smartphone Repairs', desc: 'Screen replacement, battery swaps, and board-level diagnostics for mobile devices.' },
    { icon: '⚙️', title: 'Software Installation & Troubleshooting', desc: 'OS installation, driver management, and software configuration for end users.' },
    { icon: '🔧', title: 'Device Maintenance & Servicing', desc: 'Preventive maintenance, cleaning, and performance optimization of ICT equipment.' },
    { icon: '🤝', title: 'Entrepreneurship & Employability', desc: 'Business skills, customer service, and career readiness for the digital economy.' },
  ]

  const partners = [
    { name: 'Federal Ministry of Education', short: 'FME' },
    { name: 'IDEAS-TVET Initiative', short: 'IDEAS' },
    { name: 'Web3.0 Alliance Ltd', short: 'WA3.0' },
    { name: 'The World Bank', short: 'WB' },
    { name: 'Plateau State Polytechnic', short: 'PSP' },
  ]

  const stats = [
    { value: '100%', label: 'World Bank Funded' },
    { value: '3+', label: 'Months Training' },
    { value: '5', label: 'Partner Institutions' },
    { value: '0₦', label: 'Cost to Trainees' },
  ]

  const steps = [
    { n: '01', title: 'Receive Invitation', desc: 'Admitted trainees receive a unique admission link via email from Web3.0 Alliance Ltd.' },
    { n: '02', title: 'Accept Admission', desc: 'Click your personal admission link to officially confirm your place in the program.' },
    { n: '03', title: 'Access Your Portal', desc: 'Log in with the credentials sent to you, change your password and complete your profile.' },
    { n: '04', title: 'Begin Training', desc: 'Attend hands-on sessions at the IDEAS-TVET Training Centre, Plateau State Polytechnic, Jos.' },
    { n: '05', title: 'Complete Internship', desc: 'Your 3-month internship logbook is managed entirely through this portal.' },
    { n: '06', title: 'Graduate & Thrive', desc: 'Receive your certificate and launch your ICT repair business or career.' },
  ]

  const btnPrimary = {
    background: '#2db84b', color: '#fff', border: 'none',
    borderRadius: 10, padding: '13px 32px', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
    transition: 'all 0.2s',
  }

  const btnGhost = {
    background: 'rgba(255,255,255,0.07)', color: '#fff',
    border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '13px 28px', fontSize: 15,
    fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
    transition: 'all 0.2s',
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#fff', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(10,22,40,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.3s ease', padding: '0 5%',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="Web3.0 Alliance" style={{ height: 36, width: 'auto', objectFit: 'contain', background: 'white', borderRadius: 6, padding: '2px 5px' }} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.2 }}>IDEAS-TVET</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>PORTAL</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={btnPrimary}
            onMouseEnter={e => { e.currentTarget.style.background = '#1f9c3a'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2db84b'; e.currentTarget.style.transform = '' }}
          >
            Trainee Login →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #040d1a 0%, #0a1628 45%, #0d2044 70%, #0f2a55 100%)',
        position: 'relative', display: 'flex', alignItems: 'center',
        overflow: 'hidden', padding: '100px 5% 60px',
      }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '8%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(45,184,75,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '10%', left: '0%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(45,184,75,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          {/* Partner badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', marginRight: 4 }}>In Partnership With</span>
            {partners.map(p => (
              <div key={p.name} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                {p.short}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(45,184,75,0.15)', border: '1px solid rgba(45,184,75,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
                <div style={{ width: 7, height: 7, background: '#2db84b', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 12, color: '#3dd860', fontWeight: 600, letterSpacing: '0.5px' }}>WORLD BANK FUNDED · NOW ENROLLING</span>
              </div>

              <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 'clamp(36px, 5vw, 58px)', color: '#ffffff', lineHeight: 1.1, marginBottom: 8 }}>
                IDEAS-TVET
              </h1>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 26px)', color: '#2db84b', marginBottom: 20, lineHeight: 1.3 }}>
                Computer Hardware &<br />Cellphone Repairs Training
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>
                A fully funded skills training program empowering Nigerian youth with practical digital repair skills — implemented by <strong style={{ color: 'rgba(255,255,255,0.85)' }}>Web3.0 Alliance Ltd</strong> in partnership with the Federal Ministry of Education and the World Bank.
              </p>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{ ...btnPrimary, padding: '14px 32px', fontSize: 15 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1f9c3a'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,184,75,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#2db84b'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  Access Trainee Portal →
                </button>
                <a href="mailto:official@theweb3alliance.org" style={btnGhost}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                >
                  Contact Us
                </a>
              </div>

              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                {stats.map(s => (
                  <div key={s.label}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#2db84b', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right card */}
            <div style={{ position: 'relative' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 28, backdropFilter: 'blur(10px)' }}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#2db84b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Training Venue</div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(45,184,75,0.08)', border: '1px solid rgba(45,184,75,0.2)', borderRadius: 12, padding: '16px' }}>
                    <div style={{ fontSize: 28 }}>📍</div>
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>IDEAS-TVET Training Centre</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Plateau State Polytechnic, Jos<br />Plateau State, Nigeria</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#2db84b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Training Includes</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {['Computer Hardware Diagnostics', 'Laptop & Desktop Repairs', 'Smartphone Repairs', 'Software Installation', 'Device Maintenance & Servicing', 'Entrepreneurship Skills'].map(item => (
                      <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>
                        <div style={{ width: 18, height: 18, background: 'rgba(45,184,75,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 10, color: '#2db84b' }}>✓</span>
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(135deg, rgba(45,184,75,0.2), rgba(45,184,75,0.08))', border: '1px solid rgba(45,184,75,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🌍</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3dd860' }}>Fully Funded by the World Bank</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>through the Federal Ministry of Education</div>
                  </div>
                </div>
              </div>

              <div style={{ position: 'absolute', top: -16, right: -16, background: '#2db84b', borderRadius: 12, padding: '10px 16px', boxShadow: '0 8px 24px rgba(45,184,75,0.4)' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1 }}>FREE</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>PROGRAM</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>SCROLL</span>
          <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, rgba(45,184,75,0.6), transparent)' }} />
        </div>
      </section>

      {/* ── PARTNERS STRIP ── */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '20px 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4%', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase' }}>Training Partners</span>
          {partners.map(p => (
            <div key={p.name} style={{ fontSize: 13, fontWeight: 600, color: '#475569', padding: '4px 0' }}>{p.name}</div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section style={{ padding: '88px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2db84b', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>About the Program</div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 40px)', color: '#0a1628', lineHeight: 1.2, marginBottom: 20 }}>
                Empowering Nigerian Youth with Practical Digital Skills
              </h2>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 16 }}>
                The IDEAS-TVET Initiative is a Federal Government program supported by the World Bank under the Investing in Digital and Education Access for Skills project. The Computer Hardware & Cellphone Repairs Training provides unemployed Nigerian youth with market-relevant technical skills to start businesses or gain employment in the rapidly growing ICT repair sector.
              </p>
              <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.8, marginBottom: 28 }}>
                <strong style={{ color: '#0a1628' }}>Web3.0 Alliance Ltd</strong> is the implementing partner responsible for delivering the program at the IDEAS-TVET Training Centre at Plateau State Polytechnic, Jos, under Contract No. IDEAS-TVET2/NPCU/PLATEAU/05.26/304.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Hands-on Workshops', 'Industry Trainers', 'Certified Program', 'Internship Placement'].map(tag => (
                  <div key={tag} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>{tag}</div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { icon: '🎯', title: 'Mission', body: 'Equip 300+ Nigerian youth with ICT repair skills to reduce unemployment in Plateau State.' },
                { icon: '🏆', title: 'Certification', body: 'Trainees receive government-recognised certificates upon successful program completion.' },
                { icon: '💼', title: 'Job Readiness', body: 'Entrepreneurship and employability modules prepare trainees to launch or join businesses.' },
                { icon: '🔬', title: 'Practical Focus', body: 'Over 70% of the curriculum is hands-on bench work on real devices.' },
              ].map(card => (
                <div key={card.title}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: '#0a1628', marginBottom: 6 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{card.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CURRICULUM ── */}
      <section style={{ padding: '88px 5%', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2db84b', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>Curriculum</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 38px)', color: '#0a1628', marginBottom: 14 }}>What You Will Learn</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              A comprehensive, hands-on curriculum designed with industry input and aligned with national TVET standards.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {modules.map((mod, i) => (
              <div key={mod.title}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '24px', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#2db84b'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,184,75,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: '#2db84b', borderRadius: '3px 0 0 3px', opacity: 0.7 }} />
                <div style={{ fontSize: 32, marginBottom: 14 }}>{mod.icon}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#0a1628', marginBottom: 8 }}>{mod.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{mod.desc}</div>
                <div style={{ marginTop: 14, fontSize: 11, color: '#2db84b', fontWeight: 700, letterSpacing: '0.5px' }}>MODULE {String(i + 1).padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '88px 5%', background: '#0a1628' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#2db84b', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>Your Journey</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 38px)', color: '#fff', marginBottom: 14 }}>How the Program Works</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
              From invitation to graduation — here's exactly what to expect as a selected trainee.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {steps.map(step => (
              <div key={step.n}
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,184,75,0.08)'; e.currentTarget.style.borderColor = 'rgba(45,184,75,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 900, fontSize: 36, color: 'rgba(45,184,75,0.25)', lineHeight: 1, marginBottom: 14 }}>{step.n}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '88px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2db84b', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 14 }}>Trainee Portal</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 42px)', color: '#0a1628', marginBottom: 18, lineHeight: 1.2 }}>
            Already Admitted? Access Your Portal
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.75 }}>
            If you received an admission email from Web3.0 Alliance Ltd, your trainee portal is ready. Log in to complete your profile, access your logbook, and download your internship letter.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{ background: '#0a1628', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 44px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif', transition: 'all 0.2s', marginBottom: 40 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2db84b'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(45,184,75,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0a1628'; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
          >
            Login to Portal →
          </button>
          <br />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['✓ Accept Admission', '✓ Complete Profile', '✓ 3-Month Logbook', '✓ Download Internship Letter', '✓ Upload Documents'].map(f => (
              <div key={f} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 500 }}>{f}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#040d1a', padding: '48px 5% 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 48, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <img src="/logo.png" alt="Web3.0 Alliance" style={{ height: 36, objectFit: 'contain', background: 'white', borderRadius: 6, padding: '2px 5px' }} />
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 13, color: '#fff' }}>WEB3.0 ALLIANCE LTD</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>IDEAS-TVET INITIATIVE</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 320 }}>
                Implementing partner for the IDEAS-TVET Computer Hardware & Cellphone Repairs Training Program under the Federal Ministry of Education / World Bank NYESAF project.
              </p>
              <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Contract: IDEAS-TVET2/NPCU/PLATEAU/05.26/304</div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2db84b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Portal</div>
              {[['Login', '/login'], ['Student Dashboard', '/dashboard'], ['Admin Portal', '/admin']].map(([label, path]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <button onClick={() => navigate(path)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', padding: 0, transition: 'color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                  >{label}</button>
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2db84b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 16 }}>Contact</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 2 }}>
                <div>📧 <a href="mailto:official@theweb3alliance.org" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>official@theweb3alliance.org</a></div>
                <div>📍 131 Angwan Dabba Bukuru, Jos</div>
                <div>🌐 <a href="https://www.theweb3alliance.org" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>theweb3alliance.org</a></div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© {new Date().getFullYear()} Web3.0 Alliance Ltd. All rights reserved.</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['Federal Ministry of Education', 'World Bank', 'Plateau State Polytechnic'].map(p => (
                <span key={p} style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          section > div > div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 40px !important; }
          footer > div > div[style*="grid-template-columns: 2fr"] { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  )
}