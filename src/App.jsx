import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { supabase } from './lib/supabase.js'

// Auth pages
import LoginPage from './pages/auth/LoginPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import AcceptAdmissionPage from './pages/auth/AcceptAdmissionPage.jsx'
import ChangePasswordPage from './pages/auth/ChangePasswordPage.jsx'
import LandingPage from './pages/LandingPage.jsx'

// Admin pages
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminStudents from './pages/admin/AdminStudents.jsx'
import AdminStudentDetail from './pages/admin/AdminStudentDetail.jsx'
import AdminImportStudents from './pages/admin/AdminImportStudents.jsx'
import AdminLogbooks from './pages/admin/AdminLogbooks.jsx'
import AdminTSPs from './pages/admin/AdminTSPs.jsx'

// Student pages
import StudentLayout from './components/student/StudentLayout.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import StudentProfile from './pages/student/StudentProfile.jsx'
import StudentLogbook from './pages/student/StudentLogbook.jsx'
import StudentDocuments from './pages/student/StudentDocuments.jsx'

// TSP pages
import RegisterTSP from './pages/tsp/RegisterTSP.jsx'
import TSPDashboard from './pages/tsp/TSPDashboard.jsx'
import TSPRenew from './pages/tsp/TSPRenew.jsx'

// Checks if student has uploaded an internship acceptance letter
function LogbookGuard({ children }) {
  const { profile } = useAuth()
  const [hasAcceptance, setHasAcceptance] = useState(null)

  useEffect(() => {
    async function check() {
      if (!profile?.id) return
      const { data } = await supabase
        .from('documents')
        .select('id')
        .eq('student_id', profile.id)
        .eq('document_type', 'acceptance_letter')
        .limit(1)
      setHasAcceptance(data && data.length > 0)
    }
    check()
  }, [profile?.id])

  if (hasAcceptance === null) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Checking access...</div>
  )

  if (!hasAcceptance) return (
    <div style={{ padding: 40, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0a2e14', marginBottom: 12 }}>
        Logbook Not Yet Available
      </h2>
      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
        Your internship logbook will be unlocked once you have uploaded your signed
        <strong> Internship Acceptance Letter</strong> from your host organisation.
      </p>
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 20px', fontSize: 13, color: '#166534', lineHeight: 1.7, marginBottom: 24 }}>
        <strong>How to unlock:</strong><br/>
        1. Secure an internship host organisation<br/>
        2. Collect a signed Acceptance Letter on their letterhead<br/>
        3. Go to <strong>Documents</strong> and upload it<br/>
        4. Your logbook will be unlocked automatically
      </div>
      <a href="/dashboard/documents" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #0a2e14, #1a7a3c)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 8 }}>
        Go to Documents →
      </a>
    </div>
  )

  return children
}

function ProtectedRoute({ children, requireAdmin = false, requireTSP = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628' }}>
      <div style={{ textAlign: 'center', color: 'white' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#2db84b', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, opacity: 0.6 }}>Loading portal...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (requireTSP && profile?.role !== 'tsp') {
    return <Navigate to="/dashboard" replace />
  }

  // Force password change on first login
  if (profile && !profile.password_changed && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        user && profile?.password_changed
          ? <Navigate to={
              profile?.role === 'admin' ? '/admin' :
              profile?.role === 'tsp' ? '/tsp/dashboard' :
              '/dashboard'
            } replace />
          : <LoginPage />
      } />
      <Route path="/admit/:token" element={<AcceptAdmissionPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register-tsp" element={<RegisterTSP />} />
      <Route path="/change-password" element={
        <ProtectedRoute>
          <ChangePasswordPage />
        </ProtectedRoute>
      } />

      {/* Student routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <StudentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="logbook" element={<LogbookGuard><StudentLogbook /></LogbookGuard>} />
        <Route path="documents" element={<StudentDocuments />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="students/:id" element={<AdminStudentDetail />} />
        <Route path="import" element={<AdminImportStudents />} />
        <Route path="logbooks" element={<AdminLogbooks />} />
        <Route path="tsps" element={<AdminTSPs />} />
      </Route>

      {/* TSP routes */}
      <Route path="/tsp/dashboard" element={
        <ProtectedRoute requireTSP>
          <TSPDashboard />
        </ProtectedRoute>
      } />
      <Route path="/tsp/renew" element={
        <ProtectedRoute requireTSP>
          <TSPRenew />
        </ProtectedRoute>
      } />

      {/* Root — landing page for visitors, redirect for logged in */}
      <Route path="/" element={
        !user
          ? <LandingPage />
          : !profile
          ? <LandingPage />
          : <Navigate to={
              profile.role === 'admin' ? '/admin' :
              profile.role === 'tsp' ? '/tsp/dashboard' :
              '/dashboard'
            } replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
