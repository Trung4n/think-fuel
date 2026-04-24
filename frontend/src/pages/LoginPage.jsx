import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import { faBrain, faRobot } from '@fortawesome/free-solid-svg-icons'

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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top nav bar */}
      <header className="flex-shrink-0 h-14 border-b border-gray-100 flex items-center px-8 gap-6">
        <div className="flex items-center gap-2">
          <Icon icon={faBrain} style={{ color: '#14B8A6', fontSize: '1.125rem' }} />
          <span className="text-base font-bold" style={{ color: '#14B8A6' }}>ThinkFuel</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
          <span className="hover:text-gray-700 cursor-pointer">Dashboard</span>
          <span className="hover:text-gray-700 cursor-pointer">Courses</span>
          <span className="hover:text-gray-700 cursor-pointer">Quiz</span>
          <span className="hover:text-gray-700 cursor-pointer">Community</span>
        </nav>
      </header>

      {/* Main split */}
      <div className="flex flex-1 items-center">
        {/* Left — mascot */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 px-12 py-8 relative">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { top: '15%', left: '10%', size: 80, opacity: 0.15 },
              { top: '60%', left: '5%', size: 60, opacity: 0.1 },
              { top: '25%', right: '8%', size: 50, opacity: 0.12 },
              { top: '70%', right: '12%', size: 70, opacity: 0.1 },
            ].map((c, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  top: c.top, left: c.left, right: c.right,
                  width: c.size, height: c.size,
                  background: `rgba(20,184,166,${c.opacity})`,
                  filter: 'blur(20px)',
                }}
              />
            ))}
          </div>

          {/* Mascot */}
          <div className="relative z-10 text-center">
            <div className="mb-6 select-none flex items-center justify-center"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(20,184,166,0.25))' }}>
              <Icon icon={faRobot} style={{ fontSize: '7rem', color: '#14B8A6' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              AI rewards thinking,<br />not laziness
            </h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Your AI tutor adapts to how much you engage. Brain Fuel is earned through effort — not shortcuts.
            </p>

            {/* Mode pills */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                { label: 'Full Help', color: '#14B8A6' },
                { label: 'Guided', color: '#F59E0B' },
                { label: 'Socratic', color: '#EA580C' },
                { label: 'Locked', color: '#E11D48' },
              ].map(({ label, color }) => (
                <span key={label} className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}40` }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="flex flex-col justify-center w-full md:w-auto px-8 md:px-16 py-12 md:min-w-[440px]">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="md:hidden flex items-center gap-2 mb-8">
              <Icon icon={faBrain} style={{ color: '#14B8A6', fontSize: '1.25rem' }} />
              <span className="font-bold text-lg" style={{ color: '#14B8A6' }}>ThinkFuel</span>
            </div>

            {/* Form card */}
            <div className="card p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-6">Sign in</h1>

              {/* Role tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                {['student', 'teacher'].map(r => (
                  <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className="flex-1 py-1.5 text-sm rounded-lg capitalize font-medium transition-all"
                    style={role === r ? {
                      background: 'white',
                      color: '#14B8A6',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    } : { color: '#9CA3AF' }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white rounded-xl transition-all focus:outline-none"
                    style={{ border: '1.5px solid #E2E8F0' }}
                    onFocus={e => { e.target.style.borderColor = '#14B8A6'; e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white rounded-xl transition-all focus:outline-none"
                    style={{ border: '1.5px solid #E2E8F0' }}
                    onFocus={e => { e.target.style.borderColor = '#14B8A6'; e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </form>

              <p className="mt-5 text-xs text-center text-gray-400">
                Demo: {DEMO[role].email} / {DEMO[role].password}
              </p>

              <p className="mt-3 text-xs text-center text-gray-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium" style={{ color: '#14B8A6' }}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
