import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Icon from '../components/Icon'
import {
  faFlag, faBook, faBolt, faQuestion, faSkull, faHeart,
  faStar, faTrophy, faBrain, faChevronRight, faDoorOpen,
  faXmark, faCheck, faArrowLeft, faShield,
} from '@fortawesome/free-solid-svg-icons'

// ── Node visual config ────────────────────────────────────────────────
const NODE = {
  wall:   { bg: '#1E293B', border: '#1E293B', icon: null,       color: '#334155', label: '' },
  start:  { bg: '#ECFDF5', border: '#34D399', icon: faFlag,     color: '#059669', label: 'Start' },
  normal: { bg: '#EFF6FF', border: '#93C5FD', icon: faBook,     color: '#3B82F6', label: 'Study' },
  enemy:  { bg: '#FFF1F2', border: '#FDA4AF', icon: faBolt,     color: '#E11D48', label: 'Enemy' },
  puzzle: { bg: '#F5F3FF', border: '#C4B5FD', icon: faQuestion, color: '#7C3AED', label: 'Puzzle' },
  boss:   { bg: '#0C0A09', border: '#DC2626', icon: faSkull,    color: '#EF4444', label: 'BOSS' },
}

const ENC_DAMAGE_COLOR = { enemy: '#E11D48', puzzle: '#7C3AED', normal: '#3B82F6' }

// ── Sub-components ────────────────────────────────────────────────────

function HpBar({ hp, maxHp }) {
  const pct = maxHp > 0 ? Math.max(0, (hp / maxHp) * 100) : 0
  const color = pct > 60 ? '#22C55E' : pct > 30 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <Icon icon={faHeart} style={{ color, fontSize: '0.875rem' }} />
      <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold" style={{ color }}>{hp}/{maxHp}</span>
    </div>
  )
}

function MapCell({ node, isPlayer, isAdjacent, onMove }) {
  const cfg = NODE[node.type] || NODE.wall
  if (node.type === 'wall') {
    return (
      <div className="w-12 h-12 rounded-xl" style={{ background: '#0F172A' }} />
    )
  }

  const canClick = isAdjacent && !isPlayer
  const cleared = node.cleared && node.type !== 'start'

  return (
    <button
      onClick={canClick ? onMove : undefined}
      disabled={!canClick}
      className="w-12 h-12 rounded-xl flex flex-col items-center justify-center relative transition-all select-none"
      style={{
        background: cleared ? '#F8FAFC' : cfg.bg,
        border: `2px solid ${isPlayer ? '#F59E0B' : isAdjacent && !cleared ? cfg.border : '#334155'}`,
        cursor: canClick ? 'pointer' : 'default',
        opacity: cleared && !isPlayer ? 0.45 : 1,
        boxShadow: isPlayer ? '0 0 0 3px rgba(245,158,11,0.35)' :
                   (isAdjacent && !cleared) ? `0 0 0 2px ${cfg.border}55` : 'none',
        transform: isAdjacent && !cleared ? 'scale(1.05)' : 'scale(1)',
      }}
      title={cfg.label}
    >
      {isPlayer ? (
        <Icon icon={faBrain} style={{ color: '#F59E0B', fontSize: '1.1rem' }} />
      ) : cfg.icon ? (
        <Icon icon={cfg.icon} style={{ color: cleared ? '#CBD5E1' : cfg.color, fontSize: '1rem' }} />
      ) : null}
      {cleared && !isPlayer && (
        <span className="absolute bottom-0.5 right-1 text-gray-300" style={{ fontSize: '0.6rem' }}>✓</span>
      )}
    </button>
  )
}

function MapGrid({ session, onMove, disabled }) {
  const { map, playerPos } = session
  const currentNode = map.find(n => n.x === playerPos.x && n.y === playerPos.y)
  const adjSet = new Set((currentNode?.connections || []).map(c => `${c.x},${c.y}`))

  const cells = []
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      const node = map.find(n => n.x === x && n.y === y) || { x, y, type: 'wall', cleared: false, connections: [] }
      const isPlayer = playerPos.x === x && playerPos.y === y
      const isAdjacent = adjSet.has(`${x},${y}`)
      cells.push(
        <MapCell
          key={`${x},${y}`}
          node={node}
          isPlayer={isPlayer}
          isAdjacent={isAdjacent && !disabled}
          onMove={() => onMove(x, y)}
        />
      )
    }
  }

  return (
    <div className="grid grid-cols-5 gap-1.5 p-4 rounded-2xl" style={{ background: '#020617' }}>
      {cells}
    </div>
  )
}

function MapLegend() {
  return (
    <div className="flex flex-wrap gap-3 mt-2 px-1">
      {['enemy','puzzle','normal','boss'].map(t => (
        <div key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded flex items-center justify-center"
            style={{ background: NODE[t].bg, border: `1.5px solid ${NODE[t].border}` }}>
            {NODE[t].icon && <Icon icon={NODE[t].icon} style={{ color: NODE[t].color, fontSize: '0.5rem' }} />}
          </div>
          <span>{NODE[t].label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <div className="w-4 h-4 rounded flex items-center justify-center"
          style={{ background: '#FFFBEB', border: '1.5px solid #F59E0B' }}>
          <Icon icon={faBrain} style={{ color: '#F59E0B', fontSize: '0.5rem' }} />
        </div>
        <span>You</span>
      </div>
    </div>
  )
}

function ChoiceButton({ letter, text, state, onClick }) {
  const styles = {
    idle:    { background: 'white',    border: '1.5px solid #E2E8F0', color: '#374151', cursor: 'pointer' },
    correct: { background: '#ECFDF5', border: '1.5px solid #34D399', color: '#065F46', cursor: 'default', boxShadow: '0 0 0 3px rgba(52,211,153,0.15)' },
    wrong:   { background: '#FFF1F2', border: '1.5px solid #FDA4AF', color: '#9F1239', cursor: 'default' },
    dimmed:  { background: '#F9FAFB', border: '1.5px solid #F3F4F6', color: '#9CA3AF', cursor: 'default', opacity: 0.6 },
  }
  return (
    <button
      onClick={state === 'idle' ? onClick : undefined}
      disabled={state !== 'idle'}
      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all"
      style={styles[state]}
    >
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-2.5"
        style={{
          background: state === 'correct' ? '#34D399' : state === 'wrong' ? '#FDA4AF' : '#F1F5F9',
          color: ['correct', 'wrong'].includes(state) ? 'white' : '#64748B',
        }}>
        {letter}
      </span>
      {text}
    </button>
  )
}

function EncounterModal({ encounter, result, onAnswer, onDismiss, submitting }) {
  const { nodeType, question } = encounter
  const cfg = NODE[nodeType] || NODE.normal
  const [selected, setSelected] = useState(null)

  function getState(choice) {
    if (!selected) return 'idle'
    if (choice === selected) return result?.correct ? 'correct' : 'wrong'
    return 'dimmed'
  }

  function handleChoice(c) {
    if (selected || submitting) return
    setSelected(c)
    onAnswer(c)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 flex items-center gap-2.5"
          style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}>
          <Icon icon={cfg.icon} style={{ color: cfg.color }} />
          <span className="text-sm font-bold" style={{ color: cfg.color }}>
            {nodeType === 'enemy' ? 'Enemy Encounter' : nodeType === 'puzzle' ? 'Puzzle Challenge' : 'Study Node'}
          </span>
          {nodeType === 'enemy' && (
            <span className="ml-auto text-xs text-red-400">Wrong = -{20} HP</span>
          )}
          {nodeType === 'puzzle' && (
            <span className="ml-auto text-xs text-purple-400">Wrong = -{12} HP</span>
          )}
        </div>

        <div className="p-5">
          {question.topic && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full mb-3 inline-block">
              {question.topic}
            </span>
          )}
          <p className="text-sm font-medium text-gray-900 leading-relaxed mb-4">{question.question}</p>

          <div className="space-y-2 mb-4">
            {question.choices?.map((c, i) => (
              <ChoiceButton
                key={i}
                letter={String.fromCharCode(65 + i)}
                text={c}
                state={getState(c)}
                onClick={() => handleChoice(c)}
              />
            ))}
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-xl p-3.5 mb-4"
              style={result.correct
                ? { background: '#ECFDF5', border: '1.5px solid #34D399' }
                : { background: '#FFF1F2', border: '1.5px solid #FDA4AF' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon icon={result.correct ? faCheck : faXmark}
                  style={{ color: result.correct ? '#22C55E' : '#EF4444' }} />
                <span className="font-bold text-sm"
                  style={{ color: result.correct ? '#065F46' : '#9F1239' }}>
                  {result.correct ? 'Correct!' : `Wrong! −${result.damage} HP`}
                </span>
              </div>
              {result.explanation && (
                <p className="text-xs leading-relaxed"
                  style={{ color: result.correct ? '#047857' : '#9F1239', opacity: 0.85 }}>
                  {result.explanation}
                </p>
              )}
            </div>
          )}

          {result && (
            <button onClick={onDismiss} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: cfg.color }}>
              Continue <Icon icon={faChevronRight} className="ml-1.5" size="xs" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function BossModal({ bossData, result, onAnswer, submitting, session }) {
  const { step, totalSteps, question } = bossData
  const [selected, setSelected] = useState(null)

  function getState(choice) {
    if (!selected) return 'idle'
    if (choice === selected) return result?.correct ? 'correct' : 'wrong'
    return 'dimmed'
  }

  function handleChoice(c) {
    if (selected || submitting) return
    setSelected(c)
    onAnswer(c)
  }

  // Reset selected when question changes
  useEffect(() => { setSelected(null) }, [question.questionId])

  const stepDots = Array.from({ length: totalSteps }, (_, i) => i)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Boss header */}
        <div className="px-5 py-3 flex items-center gap-2.5"
          style={{ background: '#0C0A09', borderBottom: '1px solid #DC2626' }}>
          <Icon icon={faSkull} style={{ color: '#EF4444', fontSize: '1.1rem' }} />
          <span className="text-sm font-bold text-red-400">BOSS FIGHT</span>
          <div className="ml-auto flex items-center gap-1.5">
            {stepDots.map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full transition-all"
                style={{ background: i < step ? '#DC2626' : i === step ? '#EF4444' : '#374151',
                         boxShadow: i === step ? '0 0 6px #EF4444' : 'none' }} />
            ))}
            <span className="text-xs text-gray-400 ml-1">{step + 1}/{totalSteps}</span>
          </div>
        </div>

        {/* HP */}
        <div className="px-5 pt-4 pb-2">
          <HpBar hp={session.hp} maxHp={session.maxHp} />
        </div>

        <div className="px-5 pb-5">
          {question.topic && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full mb-3 inline-block">
              {question.topic}
            </span>
          )}
          <p className="text-sm font-medium text-gray-900 leading-relaxed mb-4">{question.question}</p>

          <div className="space-y-2 mb-4">
            {question.choices?.map((c, i) => (
              <ChoiceButton
                key={i}
                letter={String.fromCharCode(65 + i)}
                text={c}
                state={getState(c)}
                onClick={() => handleChoice(c)}
              />
            ))}
          </div>

          {/* Boss attack result */}
          {result && (
            <div className="rounded-xl p-3.5"
              style={{ background: result.correct ? '#FEF2F2' : '#FFF1F2',
                       border: `1.5px solid ${result.correct ? '#FECACA' : '#FDA4AF'}` }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon icon={faSkull} style={{ color: '#EF4444', fontSize: '0.875rem' }} />
                <span className="font-bold text-sm text-red-700">
                  Boss attacks! −{result.damage} HP
                </span>
                {result.correct && (
                  <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full ml-auto">
                    Reduced damage
                  </span>
                )}
              </div>
              {result.explanation && (
                <p className="text-xs text-red-600 leading-relaxed opacity-85">{result.explanation}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Phase screens ─────────────────────────────────────────────────────

function StartScreen({ onStart, loading }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mb-5">
          <Icon icon={faSkull} style={{ fontSize: '4rem', color: '#7C3AED' }} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Brain Dungeon</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Navigate a 2D dungeon map. Defeat enemies, solve puzzles, and conquer the boss to level up — questions are randomly mixed from all subjects.
        </p>
        <div className="flex flex-col gap-2 text-xs text-gray-400 mb-8 text-left">
          {[
            { icon: faBolt,     color: '#E11D48', text: 'Enemy: wrong answer = HP damage, always advance' },
            { icon: faQuestion, color: '#7C3AED', text: 'Puzzle: wrong answer = moderate HP damage' },
            { icon: faSkull,    color: '#EF4444', text: 'Boss: 3-question fight, boss always attacks' },
            { icon: faShield,   color: '#14B8A6', text: 'Correct answers reduce incoming damage' },
          ].map(({ icon, color, text }) => (
            <div key={text} className="flex items-center gap-2.5">
              <Icon icon={icon} fixedWidth style={{ color, flexShrink: 0 }} />
              <span>{text}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => onStart(1)}
          disabled={loading}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all"
          style={{ background: '#7C3AED', boxShadow: '0 4px 16px rgba(124,58,237,0.35)', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Generating map…' : <><Icon icon={faDoorOpen} className="mr-2" />Enter Dungeon</>}
        </button>
      </div>
    </div>
  )
}

function VictoryScreen({ session, onNextLevel, onDashboard, loading }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mb-4 animate-bounce">
          <Icon icon={faTrophy} style={{ fontSize: '4rem', color: '#F59E0B' }} />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#7C3AED' }}>Boss Defeated!</h1>
        <p className="text-gray-600 text-sm mb-6">
          You cleared <strong>Level {session?.level}</strong> with <strong>{session?.hp} HP</strong> remaining.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Enemies', value: session?.stats?.enemiesDefeated ?? 0, color: '#E11D48' },
            { label: 'Puzzles',  value: session?.stats?.puzzlesSolved ?? 0,   color: '#7C3AED' },
            { label: 'Damage',   value: session?.stats?.totalDamageReceived ?? 0, color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <div className="text-xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onNextLevel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all"
            style={{ background: '#7C3AED', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Loading…' : `Level ${(session?.level ?? 0) + 1} →`}
          </button>
          <button
            onClick={onDashboard}
            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
            style={{ background: '#F5F3FF', color: '#7C3AED', border: '1.5px solid #C4B5FD' }}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

function GameOverScreen({ session, onRetry, loading }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mb-4">
          <Icon icon={faSkull} style={{ fontSize: '4rem', color: '#EF4444' }} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">You Fell!</h1>
        <p className="text-gray-600 text-sm mb-6">
          Your HP reached 0 on <strong>Level {session?.level}</strong>. The dungeon is brutal — try again!
        </p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: 'Questions answered', value: session?.stats?.questionsAnswered ?? 0, color: '#7C3AED' },
            { label: 'Damage received',    value: session?.stats?.totalDamageReceived ?? 0, color: '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-3 text-center">
              <div className="text-xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onRetry(session?.level || 1)}
          disabled={loading}
          className="w-full py-2.5 rounded-2xl text-sm font-semibold text-white transition-all"
          style={{ background: '#EF4444', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Loading…' : 'Try Again'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────

export default function DungeonPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('loading')       // loading | start | map | victory | gameover
  const [session, setSession] = useState(null)
  const [encounter, setEncounter] = useState(null)    // { nodeType, question }
  const [encounterResult, setEncounterResult] = useState(null)
  const [bossData, setBossData] = useState(null)      // { step, totalSteps, question }
  const [bossResult, setBossResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // ── Load ───────────────────────────────────────────────────────────

  useEffect(() => {
    api.get(`/dungeon/session/${user.id}`)
      .then(res => {
        const s = res.data.data
        if (s) { setSession(s); setPhase('map') }
        else setPhase('start')
      })
      .catch(() => setPhase('start'))
  }, [user.id])

  // ── Actions ────────────────────────────────────────────────────────

  async function handleStartDungeon(level = 1) {
    setActionLoading(true)
    try {
      const res = await api.post('/dungeon/start', { userId: user.id, level })
      setSession(res.data.data)
      setEncounter(null); setEncounterResult(null)
      setBossData(null);  setBossResult(null)
      setPhase('map')
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  async function handleMove(x, y) {
    if (encounter || bossData) return
    try {
      const res = await api.post('/dungeon/move', { sessionId: session.sessionId, targetX: x, targetY: y })
      const d = res.data.data
      setSession(d)
      if (d.boss) {
        setBossData({ step: d.boss.step, totalSteps: d.boss.totalSteps, question: d.boss.question })
      } else if (d.encounter) {
        setEncounter(d.encounter)
        setEncounterResult(null)
      }
    } catch (e) { console.error(e) }
  }

  async function handleEncounterAnswer(answer) {
    setSubmitting(true)
    try {
      const res = await api.post('/dungeon/encounter/submit', { sessionId: session.sessionId, answer })
      const d = res.data.data
      setSession(d.session)
      setEncounterResult({ correct: d.correct, damage: d.damage, explanation: d.explanation })
      if (d.gameOver) setTimeout(() => { setEncounter(null); setPhase('gameover') }, 1800)
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  function dismissEncounter() {
    setEncounter(null)
    setEncounterResult(null)
  }

  async function handleBossAnswer(answer) {
    setSubmitting(true)
    try {
      const res = await api.post('/dungeon/boss/submit', { sessionId: session.sessionId, answer })
      const d = res.data.data
      setSession(d.session)
      setBossResult({ correct: d.correct, damage: d.damage, explanation: d.explanation })

      if (d.gameOver) {
        setTimeout(() => { setBossData(null); setPhase('gameover') }, 2000)
      } else if (d.bossDefeated) {
        setTimeout(() => { setBossData(null); setBossResult(null); setPhase('victory') }, 2000)
      } else if (d.nextQuestion) {
        setTimeout(() => {
          setBossData(prev => ({ ...prev, step: prev.step + 1, question: d.nextQuestion }))
          setBossResult(null)
        }, 2200)
      }
    } catch (e) { console.error(e) }
    finally { setSubmitting(false) }
  }

  async function handleNextLevel() {
    setActionLoading(true)
    try {
      const res = await api.post('/dungeon/next-level', { userId: user.id, completedSessionId: session.sessionId })
      setSession(res.data.data)
      setEncounter(null); setEncounterResult(null)
      setBossData(null);  setBossResult(null)
      setPhase('map')
    } catch (e) { console.error(e) }
    finally { setActionLoading(false) }
  }

  // ── Render ─────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
        <span className="text-sm text-gray-400">Loading dungeon…</span>
      </div>
    )
  }

  if (phase === 'start') {
    return <StartScreen onStart={handleStartDungeon} loading={actionLoading} />
  }

  if (phase === 'victory') {
    return <VictoryScreen session={session} onNextLevel={handleNextLevel} onDashboard={() => navigate('/student/dashboard')} loading={actionLoading} />
  }

  if (phase === 'gameover') {
    return <GameOverScreen session={session} onRetry={handleStartDungeon} loading={actionLoading} />
  }

  // Map phase
  const modalOpen = !!(encounter || bossData)

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* HUD */}
      <div className="card p-3 mb-3 flex items-center gap-4">
        <div className="flex-shrink-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Level</span>
          <div className="text-2xl font-bold" style={{ color: '#7C3AED' }}>{session?.level ?? 1}</div>
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 block">HP</span>
          <HpBar hp={session?.hp ?? 100} maxHp={session?.maxHp ?? 100} />
        </div>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon icon={faArrowLeft} className="mr-1" size="xs" />Exit
        </button>
      </div>

      {/* Map */}
      {session && (
        <>
          <MapGrid session={session} onMove={handleMove} disabled={modalOpen} />
          <MapLegend />
        </>
      )}

      {/* Stats strip */}
      {session?.stats && (
        <div className="flex gap-3 mt-3 text-xs text-gray-400">
          <span><Icon icon={faBolt} className="mr-1" style={{ color: '#E11D48' }} />{session.stats.enemiesDefeated} defeated</span>
          <span><Icon icon={faQuestion} className="mr-1" style={{ color: '#7C3AED' }} />{session.stats.puzzlesSolved} solved</span>
          <span><Icon icon={faHeart} className="mr-1" style={{ color: '#EF4444' }} />{session.stats.totalDamageReceived} dmg taken</span>
        </div>
      )}

      {/* Encounter overlay */}
      {encounter && (
        <EncounterModal
          encounter={encounter}
          result={encounterResult}
          onAnswer={handleEncounterAnswer}
          onDismiss={dismissEncounter}
          submitting={submitting}
        />
      )}

      {/* Boss overlay */}
      {bossData && (
        <BossModal
          bossData={bossData}
          result={bossResult}
          onAnswer={handleBossAnswer}
          submitting={submitting}
          session={session}
        />
      )}
    </div>
  )
}
