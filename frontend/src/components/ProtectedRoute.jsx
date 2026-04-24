import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (role && user?.role !== role) {
    if (user?.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />
    if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />
    return <Navigate to="/login" replace />
  }

  return children
}
