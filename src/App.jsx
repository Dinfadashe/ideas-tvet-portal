import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'

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
        <Route path="logbook" element={<StudentLogbook />} />
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
