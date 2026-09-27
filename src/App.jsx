import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import ResetPasswordPage from './pages/auth/ResetPasswordPage.jsx'
import AcceptAdmissionPage from './pages/auth/AcceptAdmissionPage.jsx'
import ChangePasswordPage from './pages/auth/ChangePasswordPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminStudents from './pages/admin/AdminStudents.jsx'
import AdminStudentDetail from './pages/admin/AdminStudentDetail.jsx'
import AdminImportStudents from './pages/admin/AdminImportStudents.jsx'
import AdminLogbooks from './pages/admin/AdminLogbooks.jsx'
import AdminTSPs from './pages/admin/AdminTSPs.jsx'
import AdminAssignInstructors from './pages/admin/AdminAssignInstructors.jsx'
import AdminInstructors from './pages/admin/AdminInstructors.jsx'
import AdminAcceptanceLetters from './pages/admin/AdminAcceptanceLetters.jsx'
import StudentLayout from './components/student/StudentLayout.jsx'
import StudentDashboard from './pages/student/StudentDashboard.jsx'
import StudentProfile from './pages/student/StudentProfile.jsx'
import StudentLogbook from './pages/student/StudentLogbook.jsx'
import StudentDocuments from './pages/student/StudentDocuments.jsx'
import StudentPerformance from './pages/student/StudentPerformance.jsx'
import InstructorDashboard from './pages/instructor/InstructorDashboard.jsx'
import MonitoringDashboard from './pages/monitoring/MonitoringDashboard.jsx'
import RegisterTSP from './pages/tsp/RegisterTSP.jsx'
import TSPDashboard from './pages/tsp/TSPDashboard.jsx'
import TSPRenew from './pages/tsp/TSPRenew.jsx'

function ProtectedRoute({ children, requireAdmin=false, requireTSP=false, requireInstructor=false, requireMe=false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a1628' }}>
      <div style={{ textAlign:'center', color:'white' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(255,255,255,0.2)', borderTopColor:'#2db84b', borderRadius:'50%', animation:'spin 0.7s linear infinite', margin:'0 auto 12px' }} />
        <p style={{ fontFamily:'DM Sans, sans-serif', fontSize:14, opacity:0.6 }}>Loading portal...</p>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (requireAdmin && profile?.role !== 'admin') {
    const home = profile?.role === 'instructor' ? '/instructor' : profile?.role === 'tsp' ? '/tsp/dashboard' : profile?.role === 'me' ? '/monitoring' : '/dashboard'
    return <Navigate to={home} replace />
  }
  if (requireTSP && profile?.role !== 'tsp') {
    const home = profile?.role === 'instructor' ? '/instructor' : profile?.role === 'me' ? '/monitoring' : '/dashboard'
    return <Navigate to={home} replace />
  }
  if (requireInstructor && profile?.role !== 'instructor') {
    const home = profile?.role === 'admin' ? '/admin' : profile?.role === 'tsp' ? '/tsp/dashboard' : profile?.role === 'me' ? '/monitoring' : '/dashboard'
    return <Navigate to={home} replace />
  }
  if (requireMe && profile?.role !== 'me') {
    const home = profile?.role === 'admin' ? '/admin' : profile?.role === 'instructor' ? '/instructor' : profile?.role === 'tsp' ? '/tsp/dashboard' : '/dashboard'
    return <Navigate to={home} replace />
  }
  if (profile && !profile.password_changed && window.location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  return children
}

function StudentGuard({ children }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return null
  if (profile.role === 'instructor') return <Navigate to="/instructor" replace />
  if (profile.role === 'admin') return <Navigate to="/admin" replace />
  if (profile.role === 'tsp') return <Navigate to="/tsp/dashboard" replace />
  if (profile.role === 'me') return <Navigate to="/monitoring" replace />
  return children
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  if (loading) return null
  return (
    <Routes>
      <Route path="/login" element={
        user && profile?.password_changed
          ? <Navigate to={profile?.role==='admin' ? '/admin' : profile?.role==='tsp' ? '/tsp/dashboard' : profile?.role==='instructor' ? '/instructor' : profile?.role==='me' ? '/monitoring' : '/dashboard'} replace />
          : <LoginPage />
      } />
      <Route path="/admit/:token" element={<AcceptAdmissionPage />} />
      <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register-tsp" element={<RegisterTSP />} />
      <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><StudentGuard><StudentLayout /></StudentGuard></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="logbook" element={<StudentLogbook />} />
        <Route path="documents" element={<StudentDocuments />} />
        <Route path="performance" element={<StudentPerformance />} />
      </Route>
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="students/:id" element={<AdminStudentDetail />} />
        <Route path="import" element={<AdminImportStudents />} />
        <Route path="logbooks" element={<AdminLogbooks />} />
        <Route path="tsps" element={<AdminTSPs />} />
        <Route path="instructors" element={<AdminInstructors />} />
        <Route path="assign-instructors" element={<AdminAssignInstructors />} />
        <Route path="acceptance-letters" element={<AdminAcceptanceLetters />} />
      </Route>
      <Route path="/instructor" element={<ProtectedRoute requireInstructor><InstructorDashboard /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute requireMe><MonitoringDashboard /></ProtectedRoute>} />
      <Route path="/tsp/dashboard" element={<ProtectedRoute requireTSP><TSPDashboard /></ProtectedRoute>} />
      <Route path="/tsp/renew" element={<ProtectedRoute requireTSP><TSPRenew /></ProtectedRoute>} />
      <Route path="/" element={
        !user ? <LandingPage /> : !profile ? <LandingPage /> :
        <Navigate to={profile.role==='admin' ? '/admin' : profile.role==='tsp' ? '/tsp/dashboard' : profile.role==='instructor' ? '/instructor' : profile.role==='me' ? '/monitoring' : '/dashboard'} replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>
}
