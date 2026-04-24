import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from '../components/Icon'
import { faBrain, faSeedling, faBullseye, faBatteryFull, faChartBar, faTrophy } from '@fortawesome/free-solid-svg-icons'

export default function RegisterPage() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const user = await register(form.fullName, form.email, form.password, form.role)
      navigate(user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    border: '1.5px solid #E2E8F0',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  function onFocus(e) {
    e.target.style.borderColor = '#14B8A6'
    e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)'
  }
  function onBlur(e) {
    e.target.style.borderColor = '#E2E8F0'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top nav */}
      <header className="flex-shrink-0 h-14 border-b border-gray-100 flex items-center px-8 gap-6">
        <Link to="/login" className="flex items-center gap-2">
          <Icon icon={faBrain} style={{ color: '#14B8A6', fontSize: '1.125rem' }} />
          <span className="text-base font-bold" style={{ color: '#14B8A6' }}>ThinkFuel</span>
        </Link>
      </header>

      {/* Main split */}
      <div className="flex flex-1 items-center">
        {/* Left — mascot */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 px-12 py-8 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { top: '15%', left: '10%', size: 80, opacity: 0.12 },
              { top: '65%', left: '5%', size: 55, opacity: 0.09 },
              { top: '20%', right: '8%', size: 50, opacity: 0.1 },
              { top: '72%', right: '12%', size: 65, opacity: 0.09 },
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
          <div className="relative z-10 text-center">
            <div className="mb-6 select-none flex items-center justify-center"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(20,184,166,0.25))' }}>
              <Icon icon={faSeedling} style={{ fontSize: '7rem', color: '#14B8A6' }} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Start your learning<br />journey today
            </h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Create your free account and get 1000 Brain Fuel to begin. The more you think, the more help you earn.
            </p>
            <div className="mt-8 flex flex-col gap-2 text-sm text-gray-500 max-w-xs mx-auto text-left">
              {[
                { icon: faBullseye,    text: 'Personalized AI tutor per subject' },
                { icon: faBatteryFull, text: 'Brain Fuel rewards active thinking' },
                { icon: faChartBar,    text: 'Track your learning independence' },
                { icon: faTrophy,      text: 'Quiz challenges to refill fuel' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon icon={icon} fixedWidth style={{ color: '#14B8A6', fontSize: '0.875rem', flexShrink: 0 }} />
                  <span>{text}</span>
                </div>
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

            <div className="card p-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1">Create account</h1>
              <p className="text-xs text-gray-400 mb-6">Join ThinkFuel and start learning smarter</p>

              {/* Role tabs */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                {['student', 'teacher'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r }))}
                    className="flex-1 py-1.5 text-sm rounded-lg capitalize font-medium transition-all"
                    style={form.role === r ? {
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
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder="Your full name"
                    required
                    className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white rounded-xl focus:outline-none"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="you@example.com"
                    required
                    className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white rounded-xl focus:outline-none"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white rounded-xl focus:outline-none"
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1">
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="mt-5 text-xs text-center text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-medium" style={{ color: '#14B8A6' }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
