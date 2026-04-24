import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import api from '../services/api'
import FuelBar from './FuelBar'

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard' },
  { to: '/student/chat', label: 'Chat' },
  { to: '/student/quiz', label: 'Quiz' },
]

const teacherLinks = [
  { to: '/teacher/dashboard', label: 'Dashboard' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [fuel, setFuel] = useState(null)

  useEffect(() => {
    if (user?.role === 'student') {
      api.get(`/students/${user.id}/dashboard`)
        .then(r => setFuel({ fuel: r.data.data.brainFuel, max: r.data.data.maxFuel }))
        .catch(() => {})
    }
  }, [user])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const links = user?.role === 'teacher' ? teacherLinks : studentLinks

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-800">
          <span className="text-lg font-bold text-cyan-400">ThinkFuel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {user?.role === 'student' && fuel && (
          <div className="px-4 py-3 border-t border-gray-800">
            <FuelBar fuel={fuel.fuel} maxFuel={fuel.max} showLabel={true} />
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-800">
          <div className="text-xs text-gray-500 mb-2 truncate">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
