import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import ChatPage from './pages/ChatPage'
import QuizPage from './pages/QuizPage'
import TeacherDashboard from './pages/TeacherDashboard'

function StudentLayout({ children }) {
  return (
    <ProtectedRoute role="student">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function TeacherLayout({ children }) {
  return (
    <ProtectedRoute role="teacher">
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/student/dashboard"
        element={<StudentLayout><StudentDashboard /></StudentLayout>}
      />
      <Route
        path="/student/chat"
        element={<StudentLayout><ChatPage /></StudentLayout>}
      />
      <Route
        path="/student/quiz"
        element={<StudentLayout><QuizPage /></StudentLayout>}
      />

      <Route
        path="/teacher/dashboard"
        element={<TeacherLayout><TeacherDashboard /></TeacherLayout>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
