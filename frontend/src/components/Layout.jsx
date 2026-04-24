import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { getFuelMode } from './FuelBar'
import Icon from './Icon'
import {
  faBrain, faChevronDown, faChevronRight,
  faLock, faSkull, faGamepad,
} from '@fortawesome/free-solid-svg-icons'

// ── Subject dropdown (Chat / Quiz) ────────────────────────────────────

function SubjectDropdown({ label, subjects, basePath, isActive, activeSubjectId, open, onToggle, dropRef }) {
  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={onToggle}
        className={`nav-link flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
        style={{
          border: 'none',
          background: isActive ? '#F0FDF9' : undefined,
          color: isActive ? '#0D9488' : undefined,
        }}
      >
        {label}
        <span style={{
          transition: 'transform 0.18s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-flex',
        }}>
          <Icon icon={faChevronDown} size="xs" />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 py-1.5 bg-white rounded-2xl z-50 min-w-44"
          style={{
            border: '1px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            animation: 'dropdown-in 0.15s ease',
          }}>
          {subjects.length === 0 && (
            <div className="px-4 py-2 text-xs text-gray-400">Loading...</div>
          )}
          {subjects.map(s => {
            const itemActive = activeSubjectId === s._id
            return (
              <NavLink
                key={s._id}
                to={`${basePath}/${s._id}`}
                className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors"
                style={{
                  color: itemActive ? '#0D9488' : '#374151',
                  background: itemActive ? '#F0FDF9' : 'transparent',
                  fontWeight: itemActive ? 600 : 400,
                }}
                onMouseOver={e => { if (!itemActive) e.currentTarget.style.background = '#F8FAFC' }}
                onMouseOut={e => { if (!itemActive) e.currentTarget.style.background = 'transparent' }}
              >
                {s.icon && <span>{s.icon}</span>}
                <span>{s.name}</span>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Games dropdown (Escape Room + Dungeon) ────────────────────────────

function GamesDropdown({ subjects, isActive, activeEscapeSubjectId, isOnDungeon, open, onToggle, dropRef }) {
  const navigate = useNavigate()

  function go(path) {
    navigate(path)
    if (open) onToggle()
  }

  return (
    <div className="relative" ref={dropRef}>
      {/* Trigger button */}
      <button
        onClick={onToggle}
        className={`nav-link flex items-center gap-1.5 ${isActive ? 'active' : ''}`}
        style={{
          border: 'none',
          background: isActive ? '#F0FDF9' : undefined,
          color: isActive ? '#0D9488' : undefined,
        }}
      >
        <Icon icon={faGamepad} size="sm" />
        Games
        <span style={{
          transition: 'transform 0.18s ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-flex',
        }}>
          <Icon icon={faChevronDown} size="xs" />
        </span>
      </button>

      {/* Panel */}
      {open && (
          <div
            className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl w-72"
            style={{
              border: '1px solid #E2E8F0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              animation: 'dropdown-in 0.18s ease',
            }}
          >
            {/* Panel header */}
            <div className="px-4 pt-3 pb-2 sm:pt-3.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Minigames
              </p>
            </div>

            <div className="px-3 pb-3 space-y-2">

              {/* ── Brain Escape Room ── */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${activeEscapeSubjectId ? '#C4B5FD' : '#E2E8F0'}` }}
              >
                {/* Card header */}
                <div className="flex items-start gap-2.5 px-3 pt-3 pb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: '#EDE9FE' }}>
                    <Icon icon={faLock} style={{ color: '#7C3AED', fontSize: '0.8rem' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">Brain Escape Room</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                      5 subject challenges to escape the room. Earn Brain Fuel.
                    </p>
                  </div>
                </div>

                {/* Subject list */}
                <div className="px-2.5 pb-2.5 space-y-1">
                  {subjects.length === 0 ? (
                    <div className="text-xs text-gray-400 px-1 py-1">Loading subjects…</div>
                  ) : subjects.map(s => {
                    const active = activeEscapeSubjectId === s._id
                    return (
                      <button
                        key={s._id}
                        onClick={() => go(`/student/escape/${s._id}`)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left"
                        style={{
                          background: active ? '#EDE9FE' : '#FAFAFA',
                          color: active ? '#7C3AED' : '#374151',
                          border: `1px solid ${active ? '#C4B5FD' : '#F1F5F9'}`,
                        }}
                        onMouseOver={e => { if (!active) { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.borderColor = '#DDD6FE' } }}
                        onMouseOut={e => { if (!active) { e.currentTarget.style.background = '#FAFAFA'; e.currentTarget.style.borderColor = '#F1F5F9' } }}
                      >
                        {s.icon && <span>{s.icon}</span>}
                        <span>{s.name}</span>
                        <Icon icon={faChevronRight} size="xs" className="ml-auto" style={{ opacity: 0.35 }} />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Dungeon Mode ── */}
              <button
                onClick={() => go('/student/dungeon')}
                className="w-full flex items-start gap-2.5 p-3 rounded-xl text-left transition-all"
                style={{
                  background: isOnDungeon ? '#FFF1F2' : '#FAFAFA',
                  border: `1px solid ${isOnDungeon ? '#FECDD3' : '#E2E8F0'}`,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = '#FFF1F2'
                  e.currentTarget.style.borderColor = '#FECDD3'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = isOnDungeon ? '#FFF1F2' : '#FAFAFA'
                  e.currentTarget.style.borderColor = isOnDungeon ? '#FECDD3' : '#E2E8F0'
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: '#FEE2E2' }}>
                  <Icon icon={faSkull} style={{ color: '#DC2626', fontSize: '0.8rem' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">Dungeon Mode</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                    2D dungeon crawler — mixed subjects, HP system, boss fights.
                  </p>
                </div>
                <Icon icon={faChevronRight} size="xs" className="flex-shrink-0 mt-1" style={{ opacity: 0.35 }} />
              </button>

            </div>
          </div>
      )}
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [fuel, setFuel] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [chatOpen, setChatOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [gameOpen, setGameOpen] = useState(false)
  const chatDropRef = useRef(null)
  const quizDropRef = useRef(null)
  const gameDropRef = useRef(null)

  const isOnChatPage   = location.pathname.startsWith('/student/chat/')
  const isOnQuizPage   = location.pathname.startsWith('/student/quiz/')
  const isOnEscapePage = location.pathname.startsWith('/student/escape/')
  const isOnDungeon    = location.pathname === '/student/dungeon'
  const isOnGamePage   = isOnEscapePage || isOnDungeon

  const activeChatSubjectId  = isOnChatPage  ? location.pathname.split('/')[3] : null
  const activeQuizSubjectId  = isOnQuizPage  ? location.pathname.split('/')[3] : null
  const activeEscapeSubjectId = isOnEscapePage ? location.pathname.split('/')[3] : null

  // Close all dropdowns on outside click
  useEffect(() => {
    function handle(e) {
      if (chatDropRef.current && !chatDropRef.current.contains(e.target)) setChatOpen(false)
      if (quizDropRef.current && !quizDropRef.current.contains(e.target)) setQuizOpen(false)
      if (gameDropRef.current && !gameDropRef.current.contains(e.target)) setGameOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Close dropdowns on route change
  useEffect(() => {
    setChatOpen(false)
    setQuizOpen(false)
    setGameOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (user?.role === 'student') {
      Promise.all([
        api.get(`/students/${user.id}/dashboard`),
        api.get('/subjects'),
      ])
        .then(([dashRes, subRes]) => {
          const d = dashRes.data.data
          setFuel({ fuel: d.brainFuel, max: d.maxFuel })
          setSubjects(subRes.data.data || [])
        })
        .catch(() => {})
    }
  }, [user])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const fuelMode = fuel ? getFuelMode(fuel.fuel) : null

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      {/* Top nav */}
      <header className="flex-shrink-0 h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 z-20"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer mr-2 flex-shrink-0"
          onClick={() => navigate(user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard')}
        >
          <Icon icon={faBrain} style={{ color: '#14B8A6', fontSize: '1.25rem' }} />
          <span className="text-base font-bold" style={{ color: '#14B8A6' }}>ThinkFuel</span>
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-1 flex-1">
          {user?.role === 'teacher' ? (
            <NavLink to="/teacher/dashboard"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink to="/student/dashboard"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Dashboard
              </NavLink>

              <SubjectDropdown
                label="Chat"
                subjects={subjects}
                basePath="/student/chat"
                isActive={isOnChatPage}
                activeSubjectId={activeChatSubjectId}
                open={chatOpen}
                onToggle={() => { setChatOpen(o => !o); setQuizOpen(false); setGameOpen(false) }}
                dropRef={chatDropRef}
              />

              <SubjectDropdown
                label="Quiz"
                subjects={subjects}
                basePath="/student/quiz"
                isActive={isOnQuizPage}
                activeSubjectId={activeQuizSubjectId}
                open={quizOpen}
                onToggle={() => { setQuizOpen(o => !o); setChatOpen(false); setGameOpen(false) }}
                dropRef={quizDropRef}
              />

              <GamesDropdown
                subjects={subjects}
                isActive={isOnGamePage}
                activeEscapeSubjectId={activeEscapeSubjectId}
                isOnDungeon={isOnDungeon}
                open={gameOpen}
                onToggle={() => { setGameOpen(o => !o); setChatOpen(false); setQuizOpen(false) }}
                dropRef={gameDropRef}
              />

              <NavLink to="/student/roadmap"
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Roadmap
              </NavLink>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {user?.role === 'student' && fuelMode && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: `${fuelMode.color}15`, color: fuelMode.color, border: `1px solid ${fuelMode.color}40` }}
            >
              <span className="font-mono">{fuel.fuel}</span>
              <span style={{ opacity: 0.7 }}>fuel</span>
            </div>
          )}
          <span className="text-sm text-gray-500 hidden md:block">{user?.name}</span>
          <button onClick={handleLogout} className="btn-outline text-xs"
            style={{ padding: '0.375rem 0.875rem' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
