import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'
import Icon from '../components/Icon'
import { faHand, faBook, faSkull } from '@fortawesome/free-solid-svg-icons'

const AVATAR_COLORS = ['#14B8A6', '#8B5CF6', '#3B82F6', '#F59E0B', '#E11D48', '#10B981']

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, subRes, lbRes] = await Promise.all([
          api.get(`/students/${user.id}/dashboard`),
          api.get('/subjects'),
          api.get('/leaderboard'),
        ])
        setData(dashRes.data.data)
        setSubjects(subRes.data.data || [])
        setLeaderboard(lbRes.data.data || [])
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
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    )
  }

  const top10 = leaderboard.slice(0, 10)
  const myEntry = leaderboard.find(e => e.userId === user.id)

  const stats = data ? [
    { label: 'Dependency Score', value: data.dependencyScore ?? '—', note: 'lower is better', color: '#E11D48' },
    { label: 'Independence Score', value: data.independenceScore ?? '—', note: 'higher is better', color: '#14B8A6' },
    { label: "Today's Tokens", value: data.todayTokenUsed ?? 0, note: 'used today', color: '#8B5CF6' },
    { label: 'Chats Today', value: data.chatCountToday ?? 0, note: 'messages', color: '#3B82F6' },
    { label: 'Quizzes Done', value: data.quizCompleted ?? 0, note: 'completed', color: '#F59E0B' },
    { label: 'Correct Streak', value: data.correctStreak ?? 0, note: 'in a row', color: '#10B981' },
  ] : []

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Welcome back, {data?.name || user.name}
          <Icon icon={faHand} style={{ color: '#F59E0B', fontSize: '1.5rem' }} />
        </h1>
        <p className="text-base text-gray-500 mt-1.5">Here's your learning overview for today</p>
      </div>

      {/* Fuel card */}
      {data && (
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-sm font-semibold text-gray-900">Brain Fuel</span>
              <span className="ml-2 text-xs text-gray-400">Earn more by completing quizzes</span>
            </div>
            {subjects.length > 0 && (
              <button
                onClick={() => navigate(`/student/quiz/${subjects[0]._id}`)}
                className="btn-outline text-xs"
                style={{ padding: '0.25rem 0.875rem' }}
              >
                Take Quiz
              </button>
            )}
          </div>
          <FuelBar fuel={data.brainFuel} maxFuel={data.maxFuel} showLabel={true} />
        </div>
      )}

      {/* Dungeon banner */}
      <div className="card p-4 mb-6 flex items-center justify-between gap-4"
        style={{ borderLeft: '3px solid #7C3AED' }}>
        <div className="flex items-center gap-3">
          <Icon icon={faSkull} style={{ color: '#7C3AED', fontSize: '1.5rem', flexShrink: 0 }} />
          <div>
            <div className="text-sm font-bold text-gray-900">Brain Dungeon</div>
            <div className="text-xs text-gray-400">2D dungeon crawler — mixed subjects, HP system, boss fights</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/student/dungeon')}
          className="flex-shrink-0 text-xs py-2 px-4 rounded-xl font-semibold text-white transition-all"
          style={{ background: '#7C3AED', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
          onMouseOver={e => { e.currentTarget.style.background = '#6D28D9' }}
          onMouseOut={e => { e.currentTarget.style.background = '#7C3AED' }}
        >
          Enter Dungeon
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {stats.map(({ label, value, note, color }) => (
          <div key={label} className="card p-5">
            <div className="text-3xl font-bold mb-1.5" style={{ color }}>{value}</div>
            <div className="text-sm font-medium text-gray-700">{label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{note}</div>
          </div>
        ))}
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Leaderboard</h2>
              <p className="text-sm text-gray-400 mt-0.5">Learning Mastery Score — quiz accuracy, independence &amp; streak</p>
            </div>
            {myEntry && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: '#F0FDF9', color: '#14B8A6', border: '1px solid #5EEAD4' }}>
                Your rank: #{myEntry.rank}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {top10.map(entry => {
              const isMe = entry.userId === user.id
              const medalColor = entry.rank === 1 ? '#F59E0B' : entry.rank === 2 ? '#94A3B8' : entry.rank === 3 ? '#C2925B' : '#E2E8F0'
              const medalText = entry.rank <= 3 ? medalColor : '#9CA3AF'
              const avatarColor = AVATAR_COLORS[entry.name.charCodeAt(0) % AVATAR_COLORS.length]
              return (
                <div key={entry.userId}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
                  style={{
                    background: isMe ? '#F0FDF9' : 'transparent',
                    border: `1px solid ${isMe ? '#5EEAD4' : 'transparent'}`,
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ border: `2px solid ${medalColor}`, color: medalText, fontSize: '0.65rem' }}>
                    {entry.rank}
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                    style={{ background: avatarColor }}>
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">
                    {entry.name}
                    {isMe && <span className="ml-1.5 text-xs font-normal" style={{ color: '#14B8A6' }}>(you)</span>}
                  </span>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: '#ECFDF5', color: '#059669' }}>
                      {entry.quizAccuracy}% acc
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                      {entry.independenceScore} ind
                    </span>
                  </div>
                  <span className="text-sm font-bold flex-shrink-0 ml-1" style={{ color: '#14B8A6', minWidth: '3.25rem', textAlign: 'right' }}>
                    {entry.score} <span className="text-xs font-normal text-gray-400">pts</span>
                  </span>
                </div>
              )
            })}

            {myEntry && myEntry.rank > 10 && (
              <>
                <div style={{ borderTop: '1px dashed #E2E8F0', margin: '0.25rem 0' }} />
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: '#F0FDF9', border: '1px solid #5EEAD4' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ border: '2px solid #E2E8F0', color: '#9CA3AF', fontSize: '0.65rem' }}>
                    {myEntry.rank}
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                    style={{ background: '#14B8A6' }}>
                    {myEntry.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">
                    {myEntry.name}
                    <span className="ml-1.5 text-xs font-normal" style={{ color: '#14B8A6' }}>(you)</span>
                  </span>
                  <span className="text-sm font-bold flex-shrink-0 ml-1" style={{ color: '#14B8A6', minWidth: '3.25rem', textAlign: 'right' }}>
                    {myEntry.score} <span className="text-xs font-normal text-gray-400">pts</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Subject cards */}
      {subjects.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-4">Study a Subject</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {subjects.map(s => (
              <div key={s._id} className="card p-6" style={{ border: '1px solid #E2E8F0' }}>
                <div className="text-3xl mb-3">
                  {s.icon || <Icon icon={faBook} style={{ color: '#14B8A6' }} />}
                </div>
                <div className="text-base font-semibold text-gray-900 mb-4">{s.name}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/student/chat/${s._id}`)}
                    className="flex-1 text-xs py-1.5 rounded-xl font-medium transition-all"
                    style={{ background: '#F0FDF9', color: '#14B8A6', border: '1px solid #5EEAD4' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#CCFBF1' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#F0FDF9' }}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => navigate(`/student/quiz/${s._id}`)}
                    className="flex-1 text-xs py-1.5 rounded-xl font-medium transition-all"
                    style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #C4B5FD' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#EDE9FE' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#F5F3FF' }}
                  >
                    Quiz
                  </button>
                  <button
                    onClick={() => navigate(`/student/escape/${s._id}`)}
                    className="flex-1 text-xs py-1.5 rounded-xl font-medium transition-all"
                    style={{ background: '#FDF4FF', color: '#A21CAF', border: '1px solid #E879F9' }}
                    onMouseOver={e => { e.currentTarget.style.background = '#FAE8FF' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#FDF4FF' }}
                  >
                    Escape
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
