import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const DEMO = {
  student: { email: 'student1@test.com', password: '123456' },
  teacher: { email: 'teacher@test.com', password: '123456' },
}

export default function LoginPage() {
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState(DEMO.student.email)
  const [password, setPassword] = useState(DEMO.student.password)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function switchRole(r) {
    setRole(r)
    setEmail(DEMO[r].email)
    setPassword(DEMO[r].password)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.role === 'teacher') navigate('/teacher/dashboard')
      else navigate('/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left branding */}
      <div className="hidden md:flex flex-col justify-center px-16 w-1/2 bg-gray-900 border-r border-gray-800">
        <div className="max-w-sm">
          <div className="text-3xl font-bold text-cyan-400 mb-4">ThinkFuel</div>
          <p className="text-xl text-white font-medium leading-snug mb-6">
            AI rewards thinking, not laziness
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            Your AI tutor adapts to how much you think. The more you engage, the more help you get. Brain Fuel is earned — not given.
          </p>
          <div className="mt-8 space-y-3">
            {[
              { mode: 'Full Help', color: '#06B6D4', desc: 'Active thinker — full AI assistance' },
              { mode: 'Guided', color: '#F59E0B', desc: 'Hints and direction only' },
              { mode: 'Socratic', color: '#EA580C', desc: 'Questions to guide your thinking' },
              { mode: 'Locked', color: '#E11D48', desc: 'Fuel depleted — earn more via quiz' },
            ].map(({ mode, color, desc }) => (
              <div key={mode} className="flex items-center gap-3">
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded border flex-shrink-0"
                  style={{ color, borderColor: color, backgroundColor: `${color}18` }}
                >
                  {mode}
                </span>
                <span className="text-xs text-gray-400">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="flex flex-col justify-center px-8 w-full md:w-1/2">
        <div className="w-full max-w-sm mx-auto">
          <div className="md:hidden text-2xl font-bold text-cyan-400 mb-6">ThinkFuel</div>
          <h1 className="text-xl font-semibold text-white mb-6">Sign in</h1>

          {/* Role tabs */}
          <div className="flex mb-6 bg-gray-800 rounded-md p-1">
            {['student', 'teacher'].map(r => (
              <button
                key={r}
                onClick={() => switchRole(r)}
                className={`flex-1 py-1.5 text-sm rounded transition-colors capitalize ${
                  role === r ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-500 text-center">
            Demo: {DEMO[role].email} / {DEMO[role].password}
          </p>
        </div>
      </div>
    </div>
  )
}
