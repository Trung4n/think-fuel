import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import ChatPage from './pages/ChatPage'
import QuizPage from './pages/QuizPage'
import TeacherDashboard from './pages/TeacherDashboard'
import RoadmapPage from './pages/RoadmapPage'
import EscapeRoomPage from './pages/EscapeRoomPage'
import DungeonPage from './pages/DungeonPage'

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
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/student/dashboard"
        element={<StudentLayout><StudentDashboard /></StudentLayout>}
      />
      <Route
        path="/student/chat/:subjectId"
        element={<StudentLayout><ChatPage /></StudentLayout>}
      />
      <Route
        path="/student/quiz/:subjectId"
        element={<StudentLayout><QuizPage /></StudentLayout>}
      />
      <Route
        path="/student/roadmap"
        element={<StudentLayout><RoadmapPage /></StudentLayout>}
      />
      <Route
        path="/student/escape/:subjectId"
        element={<StudentLayout><EscapeRoomPage /></StudentLayout>}
      />
      <Route
        path="/student/dungeon"
        element={<StudentLayout><DungeonPage /></StudentLayout>}
      />

      <Route
        path="/teacher/dashboard"
        element={<TeacherLayout><TeacherDashboard /></TeacherLayout>}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
