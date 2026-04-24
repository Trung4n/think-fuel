import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, subRes] = await Promise.all([
          api.get(`/students/${user.id}/dashboard`),
          api.get('/subjects'),
        ])
        setData(dashRes.data.data)
        setSubjects(subRes.data.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-gray-400 text-sm">Loading...</span>
      </div>
    )
  }

  const stats = data ? [
    { label: 'Dependency Score', value: data.dependencyScore ?? '—', note: 'lower is better' },
    { label: 'Independence Score', value: data.independenceScore ?? '—', note: 'higher is better' },
    { label: "Today's Tokens", value: data.todayTokenUsed ?? 0, note: 'used today' },
    { label: 'Chats Today', value: data.chatCountToday ?? 0, note: 'messages' },
    { label: 'Quizzes Done', value: data.quizCompleted ?? 0, note: 'completed' },
    { label: 'Correct Streak', value: data.correctStreak ?? 0, note: 'in a row' },
  ] : []

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">
          Welcome back, {data?.name || user.name}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Here's your learning overview</p>
      </div>

      {/* Fuel bar — prominent */}
      {data && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-white">Brain Fuel</span>
            <button
              onClick={() => navigate('/student/quiz')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Earn more via quiz
            </button>
          </div>
          <FuelBar fuel={data.brainFuel} maxFuel={data.maxFuel} showLabel={true} />
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {stats.map(({ label, value, note }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
            <div className="text-xs text-gray-600">{note}</div>
          </div>
        ))}
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Start Studying</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map(s => (
              <button
                key={s._id}
                onClick={() => navigate('/student/chat')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-md text-sm text-gray-200 transition-colors"
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/student/chat')}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-md transition-colors"
        >
          Open Chat
        </button>
        <button
          onClick={() => navigate('/student/quiz')}
          className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded-md transition-colors"
        >
          Take Quiz
        </button>
      </div>
    </div>
  )
}
