import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Icon from '../components/Icon'
import { faRobot, faCheck } from '@fortawesome/free-solid-svg-icons'

const LEVEL_STYLE = {
  beginner:     { label: 'Beginner',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
  intermediate: { label: 'Intermediate', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  advanced:     { label: 'Advanced',     color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
}

const PHASE_COLORS = ['#14B8A6', '#8B5CF6', '#F59E0B']

const RECOMMENDATION_TEXT = {
  reduce_ai_dependency: 'Focus on independent problem-solving before using the AI tutor.',
  challenge_yourself:   'You\'re performing well — push yourself with harder problems.',
  advance_level:        'Your streak is strong — try advancing to the next difficulty level.',
  stay_consistent:      'Maintain a consistent study schedule to build momentum.',
  balanced:             'Keep a balanced approach between practice and review.',
}

function MetricPill({ label, value, color }) {
  return (
    <div className="flex flex-col items-center px-4 py-2.5 rounded-xl"
      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
      <span className="text-lg font-bold" style={{ color }}>{value}</span>
      <span className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  )
}

function StepCard({ step, index }) {
  const accentColor = PHASE_COLORS[index % PHASE_COLORS.length]
  return (
    <div className="flex gap-4">
      {/* Week badge + connector line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ background: accentColor }}>
          W{step.week}
        </div>
        {index < 2 && (
          <div className="w-px flex-1 mt-1" style={{ background: '#E2E8F0', minHeight: '1.5rem' }} />
        )}
      </div>

      {/* Step content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: accentColor }}>
            {step.phase}
          </span>
          <span className="text-xs text-gray-300">·</span>
          <span className="text-xs text-gray-400">
            Target: {step.targetAccuracy}% accuracy
          </span>
        </div>
        <h4 className="text-base font-semibold text-gray-900 mb-2.5">{step.title}</h4>
        <ul className="space-y-2">
          {step.actions.map((action, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600 leading-relaxed">
              <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: accentColor, fontSize: '9px' }}>
                {i + 1}
              </span>
              {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SubjectCard({ subject }) {
  const lvl = LEVEL_STYLE[subject.metrics.level] || LEVEL_STYLE.beginner
  const acc = subject.metrics.quizAccuracy !== null
    ? `${subject.metrics.quizAccuracy}%`
    : '—'

  return (
    <div className="card overflow-hidden">
      {/* Subject header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{subject.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{subject.subjectName}</h3>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: lvl.color, background: lvl.bg, border: `1px solid ${lvl.border}` }}>
              {lvl.label}
            </span>
          </div>
        </div>

        {/* Metric pills */}
        <div className="flex gap-2 flex-wrap">
          <MetricPill label="Quiz accuracy" value={acc} color="#14B8A6" />
          <MetricPill label="Attempts" value={subject.metrics.totalAttempts} color="#8B5CF6" />
          <MetricPill label="AI dependency" value={`${subject.metrics.aiDependencyRatio}%`}
            color={subject.metrics.aiDependencyRatio > 60 ? '#E11D48' : '#059669'} />
          <MetricPill label="Days active" value={subject.metrics.daysActive} color="#F59E0B" />
        </div>
      </div>

      {/* Weak topics */}
      {subject.metrics.weakTopics.length > 0 && (
        <div className="px-5 py-2.5 border-b border-gray-50 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Needs work:</span>
          {subject.metrics.weakTopics.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: '#FFF1F2', color: '#E11D48', border: '1px solid #FECDD3' }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Weekly steps */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-4">
          3-Week Learning Plan
        </p>
        {subject.steps.map((step, i) => (
          <StepCard key={step.week} step={step} index={i} />
        ))}
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/roadmap/${user.id}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError('Failed to load roadmap. Please try again.'))
      .finally(() => setLoading(false))
  }, [user.id])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Generating your roadmap…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-200">{error}</p>
      </div>
    )
  }

  const { roadmap, explanation } = data
  const profile = roadmap.overallProfile
  const recText = RECOMMENDATION_TEXT[profile.recommendation] ?? ''

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learning Roadmap</h1>
        <p className="text-base text-gray-500 mt-1.5">
          Personalized 3-week plan based on your quiz performance and AI usage — updated each visit.
        </p>
      </div>

      {/* Overall profile strip */}
      <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Avg accuracy',    value: `${profile.avgAccuracy}%`, color: '#14B8A6' },
            { label: 'Dependency score', value: profile.dependencyScore,   color: '#E11D48' },
            { label: 'Independence',    value: profile.independenceScore,  color: '#059669' },
            { label: 'Streak',          value: <>{profile.correctStreak}<Icon icon={faCheck} className="ml-0.5" style={{ fontSize: '0.75rem' }} /></>, color: '#F59E0B' },
            { label: 'Brain Fuel',      value: profile.brainFuel,          color: '#8B5CF6' },
          ].map(({ label, value, color }) => (
            <MetricPill key={label} label={label} value={value} color={color} />
          ))}
        </div>
        {recText && (
          <p className="text-xs text-gray-500 max-w-xs italic">{recText}</p>
        )}
      </div>

      {/* AI explanation card */}
      <div className="card p-5"
        style={{ borderLeft: '3px solid #14B8A6' }}>
        <div className="flex items-start gap-3">
          <Icon icon={faRobot} style={{ fontSize: '1.25rem', color: '#14B8A6', flexShrink: 0 }} />
          <div>
            <p className="text-xs font-semibold text-teal-600 mb-1 uppercase tracking-wide">
              AI Coach Assessment
            </p>
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{explanation}</p>
          </div>
        </div>
      </div>

      {/* Per-subject roadmaps */}
      {roadmap.subjects.map((subject) => (
        <SubjectCard key={String(subject.subjectId)} subject={subject} />
      ))}

      <p className="text-xs text-gray-400 text-center pb-2">
        Generated {new Date(roadmap.generatedAt).toLocaleString()} — based on your actual quiz attempts and chat history
      </p>
    </div>
  )
}
