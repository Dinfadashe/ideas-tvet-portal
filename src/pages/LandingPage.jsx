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

  const tspFeatures = [
    { icon: '👥', title: 'Trainee Onboarding', desc: 'Digitally onboard trainees, assign ID numbers, and manage admission acceptance — all in one place.' },
    { icon: '📊', title: 'Live Dashboard', desc: 'Real-time stats on enrolment, attendance, profiles, and photo uploads with instant visibility.' },
    { icon: '🪪', title: 'Branded ID Cards', desc: 'Auto-generate print-ready student ID cards with your organisation\'s logo and colour scheme.' },
    { icon: '📄', title: 'Document Management', desc: 'Issue branded internship letters, track acceptance letter uploads, and manage all trainee documents.' },
    { icon: '📸', title: 'Photo Album', desc: 'Download a professional photo album of all trainees — ready for submission to funders and regulators.' },
    { icon: '📧', title: 'Automated Emails', desc: 'Send branded admission offers, profile reminders, and final warnings with one click.' },
    { icon: '📋', title: 'Logbook Tracking', desc: 'Monitor trainee internship logbooks and track progress through each phase of the programme.' },
    { icon: '🔒', title: 'Secure & Compliant', desc: 'Role-based access, RLS-protected data, and GRM/GBV compliance tools built in.' },
  ]

  const btnPrimary = {
    background: '#2db84b', color: '#fff', border: 'none',
    borderRadius: 10, padding: '13px 32px', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
    transition: 'all 0.2s',
  }

  const btnOutline = {
    background: 'transparent', color: '#fff',
    border: '2px solid rgba(255,255,255,0.4)',
    borderRadius: 10, padding: '13px 32px', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', fontFamily: 'Syne, sans-serif',
  }

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', background: '#0a1628', minHeight: '100vh', color: '#fff' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,22,40,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : 'none',
        transition: 'all 0.3s',
        padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Web3.0 Alliance" style={{ height: 36, width: 'auto' }} />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('/register-tsp')} style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            TSP Registration
          </button>
          <button onClick={() => navigate('/login')} style={btnPrimary}>
            Trainee Login
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 48px 80px',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d3d1e 50%, #0a1628 100%)',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        {/* BG circles */}
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,184,75,0.12) 0%, transparent 70%)', top: '10%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(45,184,75,0.15)', border: '1px solid rgba(45,184,75,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
            <div style={{ width: 7, height: 7, background: '#2db84b', borderRadius: '50%', boxShadow: '0 0 8px #2db84b' }} />
            <span style={{ fontSize: 12, color: '#2db84b', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>Now Accepting Trainees</span>
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900, fontFamily: 'Syne, sans-serif', lineHeight: 1.1, marginBottom: 20 }}>
            IDEAS-TVET<br />
            <span style={{ color: '#2db84b' }}>Training Portal</span>
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 36, maxWidth: 600, margin: '0 auto 36px' }}>
            A World Bank–funded skills programme delivering free, industry-certified training in Computer Hardware & Cellphone Repairs across Plateau State, Nigeria.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={btnPrimary}>Access Trainee Portal →</button>
            <button onClick={() => {
              document.getElementById('tsp-section')?.scrollIntoView({ behavior: 'smooth' })
            }} style={btnOutline}>Are You a TSP? ↓</button>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: '#0d1f35', padding: '48px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 40, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: '#2db84b' }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CURRICULUM ── */}
      <section style={{ padding: '80px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#2db84b', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>What You Will Learn</div>
          <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Syne, sans-serif' }}>Programme Curriculum</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {modules.map(m => (
            <div key={m.title} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{m.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, fontFamily: 'Syne, sans-serif' }}>{m.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: '#0d1f35', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, color: '#2db84b', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Your Journey</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Syne, sans-serif' }}>How It Works</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {steps.map(s => (
              <div key={s.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, background: 'rgba(45,184,75,0.15)', border: '1px solid rgba(45,184,75,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#2db84b' }}>{s.n}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TSP SECTION ── */}
      <section id="tsp-section" style={{
        padding: '100px 48px',
        background: 'linear-gradient(135deg, #071a0c 0%, #0a2e14 50%, #071a0c 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG decoration */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,168,42,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,184,75,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,168,42,0.15)', border: '1px solid rgba(200,168,42,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: '#c8a82a', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>For Training Service Providers</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, fontFamily: 'Syne, sans-serif', marginBottom: 16, lineHeight: 1.2 }}>
              Manage Your IDEAS-TVET<br />
              <span style={{ color: '#c8a82a' }}>Programme With Our Tool</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, maxWidth: 620, margin: '0 auto 12px' }}>
              Are you a Training Service Provider (TSP) implementing the IDEAS-TVET initiative? Use our platform to digitally manage trainee onboarding, documents, attendance, and reporting — fully branded with your organisation's identity.
            </p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, maxWidth: 540, margin: '0 auto' }}>
              Annual subscription: <strong style={{ color: '#c8a82a' }}>₦50,000</strong> · Approved by Web3.0 Alliance Ltd · Activate in 24–48 hours
            </p>
          </div>

          {/* Features grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 64 }}>
            {tspFeatures.map(f => (
              <div key={f.title} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(200,168,42,0.2)',
                borderRadius: 14, padding: '22px 24px',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, fontFamily: 'Syne, sans-serif', color: '#fff' }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* Pricing + CTA card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(200,168,42,0.35)',
            borderRadius: 20, padding: '48px',
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 12, color: '#c8a82a', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Simple, Transparent Pricing</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 48, fontWeight: 900, fontFamily: 'Syne, sans-serif', color: '#c8a82a' }}>₦50,000</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>/ year</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 24 }}>
                {[
                  'Unlimited trainees',
                  'Your logo on all documents',
                  'Branded ID cards',
                  'Branded admission emails',
                  'Branded internship letters',
                  'Admin dashboard',
                  'Photo album downloads',
                  '365-day subscription',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: '#2db84b', fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(200,168,42,0.1)', border: '1px solid rgba(200,168,42,0.25)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                💳 Pay <strong style={{ color: '#c8a82a' }}>₦50,000</strong> to <strong style={{ color: '#fff' }}>Web3.0 Alliance Ltd · UBA · 1027821555</strong>, upload receipt and get approved within 24–48 hours.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', minWidth: 220 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Ready to get started?</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Takes less than 10 minutes</div>
              </div>
              <button
                onClick={() => navigate('/register-tsp')}
                style={{
                  background: 'linear-gradient(135deg, #c8a82a, #e8c84a)',
                  color: '#0a2e14', border: 'none',
                  borderRadius: 12, padding: '16px 36px',
                  fontSize: 16, fontWeight: 900,
                  cursor: 'pointer', fontFamily: 'Syne, sans-serif',
                  width: '100%', letterSpacing: 0.3,
                }}
              >
                Register as TSP →
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 12, padding: '12px 36px',
                  fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', width: '100%',
                }}
              >
                Already registered? Log in
              </button>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.6 }}>
                Need help? Email<br />
                <a href="mailto:official@theweb3alliance.org" style={{ color: '#c8a82a' }}>official@theweb3alliance.org</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNERS ── */}
      <section style={{ padding: '60px 48px', background: '#0a1628', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 28 }}>Programme Partners</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {partners.map(p => (
              <div key={p.name} style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{p.short}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', maxWidth: 100 }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#060f1a', padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <img src="/logo.png" alt="Web3.0 Alliance" style={{ height: 28, width: 'auto', marginBottom: 6, display: 'block' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>© 2026 Web3.0 Alliance Limited · All rights reserved</div>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}>Trainee Login</button>
          <button onClick={() => navigate('/register-tsp')} style={{ background: 'none', border: 'none', color: '#c8a82a', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>TSP Registration</button>
          <a href="mailto:official@theweb3alliance.org" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none' }}>Contact Us</a>
        </div>
      </footer>

    </div>
  )
}
