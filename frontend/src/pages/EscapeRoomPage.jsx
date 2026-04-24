import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'
import Icon from '../components/Icon'
import {
  faCheck, faArrowRight, faLock, faTrophy, faRocket, faDoorOpen,
  faXmark, faCircleCheck, faLightbulb,
} from '@fortawesome/free-solid-svg-icons'

// ── Design tokens (violet, distinct from teal quiz/chat) ─────────────
const V = {
  color:  '#7C3AED',
  light:  '#F5F3FF',
  border: '#C4B5FD',
  dark:   '#5B21B6',
}

// ── Stage door component ─────────────────────────────────────────────
function StageDoor({ n, status }) {
  // status: 'done' | 'active' | 'locked'
  const configs = {
    done:   { bg: '#ECFDF5', border: '#6EE7B7', icon: faCheck,      iconColor: '#059669', label: '#6B7280' },
    active: { bg: V.light,   border: V.color,   icon: faArrowRight, iconColor: V.color,   label: V.color, shadow: `0 0 0 3px ${V.color}25` },
    locked: { bg: '#F9FAFB', border: '#E2E8F0', icon: faLock,       iconColor: '#9CA3AF', label: '#CBD5E1' },
  }
  const c = configs[status]
  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
        style={{
          background: c.bg,
          border: `2px solid ${c.border}`,
          color: c.iconColor,
          boxShadow: c.shadow,
        }}
      >
        <Icon icon={c.icon} size="sm" />
      </div>
      <span className="text-xs font-medium" style={{ color: c.label }}>R{n}</span>
    </div>
  )
}

// ── Choice button ────────────────────────────────────────────────────
function ChoiceButton({ letter, text, state, onClick }) {
  // state: 'idle' | 'correct' | 'wrong' | 'dimmed'
  const base = { transition: 'all 0.15s ease', cursor: state === 'idle' ? 'pointer' : 'default' }
  const styles = {
    idle:    { ...base, background: 'white',    border: '1.5px solid #E2E8F0', color: '#374151' },
    correct: { ...base, background: '#ECFDF5', border: '1.5px solid #34D399', color: '#065F46',
               boxShadow: '0 0 0 3px rgba(52,211,153,0.15)' },
    wrong:   { ...base, background: '#FFF1F2', border: '1.5px solid #FDA4AF', color: '#9F1239' },
    dimmed:  { ...base, background: '#F9FAFB', border: '1.5px solid #F3F4F6', color: '#9CA3AF', opacity: 0.6 },
  }

  return (
    <button
      onClick={onClick}
      disabled={state !== 'idle'}
      className="w-full text-left px-4 py-3.5 rounded-2xl text-sm font-medium disabled:cursor-default"
      style={styles[state]}
      onMouseOver={e => {
        if (state === 'idle') {
          e.currentTarget.style.borderColor = V.color
          e.currentTarget.style.background = V.light
          e.currentTarget.style.boxShadow = `0 0 0 3px ${V.color}18`
        }
      }}
      onMouseOut={e => {
        if (state === 'idle') {
          e.currentTarget.style.borderColor = '#E2E8F0'
          e.currentTarget.style.background = 'white'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3"
        style={{
          background: state === 'correct' ? '#34D399' : state === 'wrong' ? '#FDA4AF' : '#F1F5F9',
          color: ['correct', 'wrong'].includes(state) ? 'white' : '#64748B',
        }}
      >
        {letter}
      </span>
      {text}
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────
export default function EscapeRoomPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // UI phase: 'loading' | 'start' | 'playing' | 'escaped'
  const [phase, setPhase]         = useState('loading')
  const [subject, setSubject]     = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [session, setSession]     = useState(null)   // { currentStage, totalStages, completedStages, hintsUsed, fuelEarned }
  const [challenge, setChallenge] = useState(null)   // question data
  const [fuel, setFuel]           = useState(null)
  const [maxFuel, setMaxFuel]     = useState(1000)

  // In-round state
  const [selected, setSelected]     = useState(null)  // chosen answer string
  const [answerState, setAnswerState] = useState(null) // 'correct' | 'wrong'
  const [result, setResult]         = useState(null)   // server result object
  const [hint, setHint]             = useState(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [starting, setStarting]     = useState(false)
  const [wrongCount, setWrongCount] = useState(0)     // retries on current stage

  // ── Data fetchers ──────────────────────────────────────────────────

  const loadFuel = useCallback(async () => {
    try {
      const res = await api.get(`/students/${user.id}/dashboard`)
      setFuel(res.data.data.brainFuel)
      setMaxFuel(res.data.data.maxFuel)
    } catch { /* silent */ }
  }, [user.id])

  const loadChallenge = useCallback(async (sid) => {
    try {
      const res = await api.get(`/escape/challenge/${sid}`)
      const { session: s, challenge: c, status } = res.data.data
      if (status === 'completed') { setPhase('escaped'); setSession(s); return }
      setSession(s)
      setChallenge(c)
      setSelected(null)
      setAnswerState(null)
      setResult(null)
      setHint(null)
      setWrongCount(0)
      setPhase('playing')
    } catch { /* silent */ }
  }, [])

  // Initial load
  useEffect(() => {
    if (!subjectId) { navigate('/student/dashboard'); return }

    async function init() {
      const [subRes, fuelRes] = await Promise.all([
        api.get('/subjects').catch(() => ({ data: { data: [] } })),
        api.get(`/students/${user.id}/dashboard`).catch(() => ({ data: { data: {} } })),
      ])
      const found = (subRes.data.data || []).find(s => s._id === subjectId)
      setSubject(found || null)
      setFuel(fuelRes.data.data?.brainFuel ?? null)
      setMaxFuel(fuelRes.data.data?.maxFuel ?? 1000)

      // Check for active session
      const sessRes = await api.get(`/escape/session/${user.id}/${subjectId}`).catch(() => null)
      const existing = sessRes?.data?.data
      if (existing) {
        setSessionId(existing.sessionId)
        await loadChallenge(existing.sessionId)
      } else {
        setPhase('start')
      }
    }
    init()
  }, [subjectId, user.id, navigate, loadChallenge])

  // ── Actions ────────────────────────────────────────────────────────

  async function handleStart() {
    setStarting(true)
    try {
      const res = await api.post('/escape/start', { userId: user.id, subjectId })
      const { sessionId: sid } = res.data.data
      setSessionId(sid)
      await loadChallenge(sid)
    } catch (e) {
      console.error(e)
    } finally {
      setStarting(false)
    }
  }

  async function handleAnswer(choice) {
    if (selected || submitting) return
    setSelected(choice)
    setSubmitting(true)
    try {
      const res = await api.post('/escape/submit', { sessionId, answer: choice })
      const d = res.data.data
      setResult(d)
      if (d.correct) {
        setAnswerState('correct')
        if (d.newFuel !== undefined) setFuel(d.newFuel)
        if (d.escaped) setTimeout(() => setPhase('escaped'), 1400)
      } else {
        setAnswerState('wrong')
        setWrongCount(c => c + 1)
        // Allow retry after short delay
        setTimeout(() => {
          setSelected(null)
          setAnswerState(null)
          setSubmitting(false)
        }, 1200)
        return
      }
    } catch (e) {
      console.error(e)
      setSelected(null)
      setAnswerState(null)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleHint() {
    if (hintLoading || hint) return
    setHintLoading(true)
    try {
      const res = await api.post(`/escape/hint/${sessionId}`)
      setHint(res.data.data.hint)
      setFuel(res.data.data.newFuel)
    } catch (e) {
      // Could be "not enough fuel"
      alert(e.response?.data?.message || 'Not enough fuel for a hint')
    } finally {
      setHintLoading(false)
    }
  }

  async function handleNextStage() {
    setResult(null)
    setAnswerState(null)
    await loadChallenge(sessionId)
  }

  async function handleStartNew() {
    setPhase('loading')
    setSessionId(null)
    setSession(null)
    setChallenge(null)
    setHint(null)
    try {
      const res = await api.post('/escape/start', { userId: user.id, subjectId })
      const { sessionId: sid } = res.data.data
      setSessionId(sid)
      await loadChallenge(sid)
    } catch (e) {
      setPhase('start')
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────

  function getChoiceState(choice) {
    if (!selected) return 'idle'
    if (choice === selected) return answerState === 'correct' ? 'correct' : 'wrong'
    return 'dimmed'
  }

  // ── Phase: loading ─────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: V.color, borderTopColor: 'transparent' }} />
        <span className="text-sm text-gray-400">Preparing your escape room…</span>
      </div>
    )
  }

  // ── Phase: start ───────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="max-w-sm w-full text-center">
          <div className="mb-4">
            <Icon icon={faLock} style={{ fontSize: '4rem', color: V.color }} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {subject?.icon ? <span className="mr-1">{subject.icon}</span> : null}{subject?.name || 'Subject'} Escape Room
          </h1>
          <p className="text-sm text-gray-500 mb-2 leading-relaxed">
            Solve <strong>5 challenges</strong> to escape the room. Each correct answer unlocks the next door and earns <strong>Brain Fuel</strong>.
          </p>
          <div className="flex flex-col gap-1.5 text-xs text-gray-400 mb-8">
            <div className="flex items-center gap-2">
              <Icon icon={faCircleCheck} style={{ color: '#14B8A6', width: '1rem', flexShrink: 0 }} />
              <span>Correct answer → unlock next room <span className="text-teal-500 font-medium">+50 fuel</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={faTrophy} style={{ color: V.color, width: '1rem', flexShrink: 0 }} />
              <span>Escape all rooms → completion bonus <span className="text-violet-600 font-medium">+150 fuel</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={faLightbulb} style={{ color: '#D97706', width: '1rem', flexShrink: 0 }} />
              <span>Use a hint → <span className="text-amber-500 font-medium">-15 fuel</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Icon icon={faXmark} style={{ color: '#E11D48', width: '1rem', flexShrink: 0 }} />
              <span>Wrong answer → retry (no penalty)</span>
            </div>
          </div>
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all"
            style={{
              background: V.color,
              boxShadow: `0 4px 16px ${V.color}40`,
              opacity: starting ? 0.7 : 1,
            }}
          >
            {starting ? 'Preparing Room…' : <><Icon icon={faRocket} className="mr-2" />Enter Escape Room</>}
          </button>
        </div>
      </div>
    )
  }

  // ── Phase: escaped ─────────────────────────────────────────────────
  if (phase === 'escaped') {
    const totalFuel = session?.fuelEarned ?? 0
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="max-w-sm w-full text-center">
          <div className="mb-4 animate-bounce">
            <Icon icon={faTrophy} style={{ fontSize: '4rem', color: V.color }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: V.color }}>
            You Escaped!
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            You unlocked all {session?.totalStages || 5} rooms in the{' '}
            <strong>{subject?.name}</strong> Escape Room!
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Fuel Earned', value: `+${totalFuel}`, color: '#14B8A6' },
              { label: 'Hints Used', value: session?.hintsUsed ?? 0, color: '#D97706' },
              { label: 'Rooms', value: `${session?.totalStages || 5}/5`, color: V.color },
            ].map(({ label, value, color }) => (
              <div key={label} className="card p-3 text-center">
                <div className="text-xl font-bold" style={{ color }}>{value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleStartNew}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all"
              style={{ background: V.color }}
            >
              Play Again
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: V.light, color: V.color, border: `1.5px solid ${V.border}` }}
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Phase: playing ─────────────────────────────────────────────────
  const stages = session?.totalStages ?? 5
  const completed = session?.completedStages ?? 0
  const current = session?.currentStage ?? 1

  return (
    <div className="p-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          {subject?.icon
            ? <span className="text-2xl">{subject.icon}</span>
            : <Icon icon={faLock} size="xl" style={{ color: V.color }} />}
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {subject?.name} Escape Room
            </h1>
            <p className="text-xs text-gray-400">
              Room {current} of {stages} · {session?.hintsUsed ?? 0} hints used
            </p>
          </div>
        </div>
        {fuel !== null && (
          <div className="hidden sm:block w-48">
            <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
          </div>
        )}
      </div>

      {/* Mobile fuel */}
      {fuel !== null && (
        <div className="sm:hidden mb-4">
          <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
        </div>
      )}

      {/* Stage progress doors */}
      <div className="card px-5 py-4 mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: V.color }}>
          Room Progress
        </p>
        <div className="flex items-start gap-1">
          {Array.from({ length: stages }, (_, i) => {
            const n = i + 1
            const status = n < current ? 'done' : n === current ? 'active' : 'locked'
            return <StageDoor key={n} n={n} status={status} />
          })}
        </div>
        {/* Connector line */}
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(completed / stages) * 100}%`,
              background: `linear-gradient(90deg, #10B981, ${V.color})`,
            }}
          />
        </div>
      </div>

      {/* Current challenge card */}
      <div className="card overflow-hidden mb-4">
        <div
          className="px-5 py-3 flex items-center gap-2"
          style={{ background: V.light, borderBottom: `1px solid ${V.border}` }}
        >
          <Icon icon={faDoorOpen} style={{ color: V.dark, fontSize: '1.125rem' }} />
          <span className="text-sm font-bold" style={{ color: V.dark }}>
            Room {current}: Unlock the Door
          </span>
          {challenge?.difficulty && (
            <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ background: 'white', color: V.color, border: `1px solid ${V.border}` }}>
              {challenge.difficulty}
            </span>
          )}
        </div>

        <div className="px-5 py-5">
          {challenge?.topic && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full mb-3 inline-block">
              {challenge.topic}
            </span>
          )}
          <p className="text-base text-gray-900 font-medium leading-relaxed mb-5">
            {challenge?.question}
          </p>

          {/* Choices */}
          <div className="space-y-2.5">
            {challenge?.choices?.map((choice, i) => (
              <ChoiceButton
                key={i}
                letter={String.fromCharCode(65 + i)}
                text={choice}
                state={getChoiceState(choice)}
                onClick={() => handleAnswer(choice)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Wrong answer retry feedback */}
      {answerState === 'wrong' && (
        <div className="rounded-2xl p-3.5 mb-4 flex items-center gap-2"
          style={{ background: '#FFF1F2', border: '1.5px solid #FDA4AF' }}>
          <Icon icon={faXmark} style={{ color: '#E11D48', fontSize: '1rem' }} />
          <span className="text-sm font-medium" style={{ color: '#9F1239' }}>
            Not quite — try again!
            {wrongCount > 1 && <span className="text-xs ml-2 opacity-70">(Hint available below)</span>}
          </span>
        </div>
      )}

      {/* Correct answer feedback */}
      {answerState === 'correct' && result && (
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: '#ECFDF5', border: '1.5px solid #34D399' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Icon icon={faCircleCheck} style={{ color: '#34D399', fontSize: '1rem' }} />
            <span className="font-bold text-sm" style={{ color: '#065F46' }}>
              Room Unlocked!
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#F0FDF9', color: '#14B8A6', border: '1px solid #5EEAD4' }}>
              +{result.stageReward} fuel
            </span>
            {result.completionBonus > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: V.light, color: V.color, border: `1px solid ${V.border}` }}>
                +{result.completionBonus} bonus!
              </span>
            )}
          </div>
          {result.explanation && (
            <p className="text-xs text-green-700 leading-relaxed mb-3 opacity-85">
              {result.explanation}
            </p>
          )}
          {!result.escaped && (
            <button onClick={handleNextStage}
              className="text-sm font-bold text-white px-5 py-2 rounded-xl transition-all"
              style={{ background: V.color, boxShadow: `0 2px 8px ${V.color}40` }}>
              Next Room →
            </button>
          )}
        </div>
      )}

      {/* Hint section */}
      {!answerState && (
        <div className="flex items-center gap-3">
          {!hint ? (
            <button
              onClick={handleHint}
              disabled={hintLoading}
              className="text-xs font-medium px-4 py-2 rounded-xl transition-all"
              style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }}
            >
              {hintLoading ? 'Getting hint…' : <><Icon icon={faLightbulb} className="mr-1.5" />Use Hint (−15 fuel)</>}
            </button>
          ) : (
            <div className="flex-1 rounded-xl px-4 py-2.5 text-xs leading-relaxed"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E' }}>
              <Icon icon={faLightbulb} className="mr-1.5" /><strong>Hint:</strong> {hint}
            </div>
          )}
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Exit room
          </button>
        </div>
      )}
    </div>
  )
}
