import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'
import Icon from '../components/Icon'
import { faInbox, faCircleCheck, faLightbulb, faRobot, faArrowRight, faUsers } from '@fortawesome/free-solid-svg-icons'
import PeerChatModal from '../components/PeerChatModal'

const DIFF = {
  easy:   { label: 'Easy',   color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  medium: { label: 'Medium', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  hard:   { label: 'Hard',   color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' },
}

export default function QuizPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [subject, setSubject] = useState(null)
  const [question, setQuestion] = useState(null)
  const [fuel, setFuel] = useState(null)
  const [maxFuel, setMaxFuel] = useState(1000)
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [askingAI, setAskingAI] = useState(false)
  const [askSent, setAskSent] = useState(false)
  const [showPeerButton, setShowPeerButton] = useState(false)
  const [peerModal, setPeerModal] = useState(null)
  const [loadingPeers, setLoadingPeers] = useState(false)
  const [noPeers, setNoPeers] = useState(false)

  // Redirect if no subject selected
  useEffect(() => {
    if (!subjectId) navigate('/student/dashboard')
  }, [subjectId, navigate])

  // Load subject info once
  useEffect(() => {
    if (!subjectId) return
    api.get('/subjects')
      .then(res => {
        const found = (res.data.data || []).find(s => s._id === subjectId)
        setSubject(found || null)
      })
      .catch(() => {})
  }, [subjectId])

  async function loadQuestion() {
    if (!subjectId) return
    setLoading(true)
    setSelected(null)
    setResult(null)
    setAskingAI(false)
    setAskSent(false)
    setShowPeerButton(false)
    setPeerModal(null)
    setNoPeers(false)
    try {
      const [qRes, dRes] = await Promise.all([
        api.get(`/quiz/next/${user.id}/${subjectId}`),
        api.get(`/students/${user.id}/dashboard`),
      ])
      setQuestion(qRes.data.data)
      setFuel(dRes.data.data.brainFuel)
      setMaxFuel(dRes.data.data.maxFuel)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadQuestion() }, [subjectId, user.id])

  // Show peer button after 20 s of staring at the same question
  useEffect(() => {
    if (!question || showPeerButton) return
    const t = setTimeout(() => setShowPeerButton(true), 20000)
    return () => clearTimeout(t)
  }, [question, showPeerButton])

  async function handleAnswer(choice) {
    if (selected || submitting) return
    setSelected(choice)
    setSubmitting(true)
    try {
      const res = await api.post('/quiz/submit', {
        userId: user.id,
        questionId: question.questionId,
        answer: choice,
      })
      const d = res.data.data
      setResult(d)
      if (d.newFuel !== undefined) setFuel(d.newFuel)
      if (!d.correct) setShowPeerButton(true)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAskAI() {
    if (askingAI || askSent || !question) return
    setAskingAI(true)

    const choiceLines = question.choices
      ?.map((c, i) => `  ${String.fromCharCode(65 + i)}. ${c}`)
      .join('\n') || ''

    // Phrased as a genuine learning question — avoids answer_seeking detection,
    // so the AI responds with Socratic/guided help rather than "what did you try?"
    const message = [
      `I'm working on a ${subject?.name || 'subject'} quiz question and I'm not sure how to approach it.`,
      `Topic: ${question.topic || 'General'} | Difficulty: ${question.difficulty}`,
      '',
      `"${question.question}"`,
      choiceLines ? `\nChoices:\n${choiceLines}` : '',
      '',
      'Can you help me understand the key concept behind this question without giving me the answer directly?',
    ].filter(Boolean).join('\n').trim()

    try {
      await api.post('/chat/message', { userId: user.id, message, subjectId })
      setAskSent(true)
      setTimeout(() => navigate(`/student/chat/${subjectId}`), 900)
    } catch (e) {
      console.error(e)
      setAskingAI(false)
    }
  }

  async function handleAskPeer() {
    if (loadingPeers) return
    setLoadingPeers(true)
    setNoPeers(false)
    try {
      const res = await api.get(`/students/${user.id}/peers`)
      const peers = res.data.data || []
      const match = peers.find(p => p.available) || null
      if (!match) {
        setNoPeers(true)
      } else {
        setPeerModal(match)
      }
    } catch {
      setNoPeers(true)
    } finally {
      setLoadingPeers(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-gray-400">Loading question...</span>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Icon icon={faInbox} style={{ fontSize: '1.5rem', color: '#9CA3AF' }} />
        <span className="text-sm text-gray-500 font-medium">
          No questions available for {subject?.name || 'this subject'}.
        </span>
        <button onClick={() => navigate('/student/dashboard')} className="btn-outline text-xs">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const diff = DIFF[question.difficulty]

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {subject?.icon && <span className="text-3xl">{subject.icon}</span>}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {subject?.name || 'Quiz'} Challenge
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Test your knowledge and earn Brain Fuel</p>
          </div>
        </div>
        {fuel !== null && (
          <div className="hidden sm:block w-52">
            <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
          </div>
        )}
      </div>

      {/* Mobile fuel bar */}
      {fuel !== null && (
        <div className="sm:hidden mb-5">
          <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
        </div>
      )}

      {/* Question card */}
      <div className="card p-7 mb-5">
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          {question.topic && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {question.topic}
            </span>
          )}
          {diff && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
              style={{ color: diff.color, background: diff.bg, border: `1px solid ${diff.border}` }}>
              {question.difficulty}
            </span>
          )}
        </div>
        <p className="text-lg text-gray-900 leading-relaxed font-medium">{question.question}</p>
      </div>

      {/* Choices */}
      <div className="space-y-3 mb-6">
        {question.choices?.map((choice, i) => {
          let style = {
            background: 'white', border: '1.5px solid #E2E8F0',
            color: '#374151', cursor: 'pointer', transition: 'all 0.15s ease',
          }
          if (selected) {
            if (choice === selected) {
              style = result?.correct
                ? { background: '#ECFDF5', border: '1.5px solid #34D399', color: '#065F46',
                    cursor: 'default', boxShadow: '0 0 0 3px rgba(52,211,153,0.15)', transition: 'all 0.15s ease' }
                : { background: '#FFF1F2', border: '1.5px solid #FDA4AF', color: '#9F1239',
                    cursor: 'default', transition: 'all 0.15s ease' }
            } else {
              style = { background: '#F9FAFB', border: '1.5px solid #F3F4F6', color: '#9CA3AF',
                cursor: 'default', opacity: 0.65, transition: 'all 0.15s ease' }
            }
          }
          return (
            <button key={i} onClick={() => handleAnswer(choice)}
              disabled={!!selected || submitting}
              className="w-full text-left px-5 py-4 rounded-2xl text-base font-medium disabled:cursor-default"
              style={style}
              onMouseOver={e => {
                if (!selected) {
                  e.currentTarget.style.borderColor = '#14B8A6'
                  e.currentTarget.style.background = '#F0FDF9'
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)'
                }
              }}
              onMouseOut={e => {
                if (!selected) {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.background = 'white'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mr-3"
                style={{
                  background: selected && choice === selected
                    ? (result?.correct ? '#34D399' : '#FDA4AF') : '#F1F5F9',
                  color: selected && choice === selected ? 'white' : '#64748B',
                }}>
                {String.fromCharCode(65 + i)}
              </span>
              {choice}
            </button>
          )
        })}
      </div>

      {/* Ask AI — visible before answering or after a wrong answer */}
      {!result?.correct && (
        <div className="mb-5">
          <button
            onClick={handleAskAI}
            disabled={askingAI || askSent}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: askSent ? '#F0FDF9' : '#F5F3FF',
              color: askSent ? '#059669' : '#7C3AED',
              border: `1.5px solid ${askSent ? '#6EE7B7' : '#C4B5FD'}`,
              opacity: askingAI ? 0.7 : 1,
            }}
          >
            <Icon
              icon={askSent ? faCircleCheck : faRobot}
              style={{ fontSize: '0.875rem' }}
            />
            {askSent
              ? `Question sent — opening ${subject?.name ?? ''} Chat…`
              : askingAI
                ? 'Sending to AI…'
                : result && !result.correct
                  ? `Still confused? Ask AI to explain`
                  : 'Ask AI About This Question'}
            {!askSent && !askingAI && (
              <Icon icon={faArrowRight} size="xs" className="ml-auto opacity-50" />
            )}
          </button>
        </div>
      )}

      {/* Peer mentor button */}
      {showPeerButton && !result?.correct && (
        <div className="mb-5">
          <button
            onClick={handleAskPeer}
            disabled={loadingPeers}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all"
            style={{
              background: '#F0F9FF',
              color: '#0369A1',
              border: '1.5px solid #BAE6FD',
              opacity: loadingPeers ? 0.7 : 1,
            }}
          >
            <Icon icon={faUsers} style={{ fontSize: '0.875rem' }} />
            {loadingPeers ? 'Finding a peer...' : 'Ask a Peer Mentor'}
            {!loadingPeers && <Icon icon={faArrowRight} size="xs" className="ml-auto opacity-50" />}
          </button>
          {noPeers && (
            <p className="text-xs text-center mt-1.5" style={{ color: '#94A3B8' }}>
              No peers available right now — try again later.
            </p>
          )}
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <div className="rounded-2xl p-4 mb-5"
          style={result.correct
            ? { background: '#ECFDF5', border: '1.5px solid #34D399' }
            : { background: '#FFF1F2', border: '1.5px solid #FDA4AF' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Icon
              icon={result.correct ? faCircleCheck : faLightbulb}
              style={{ color: result.correct ? '#34D399' : '#F59E0B', fontSize: '1rem' }}
            />
            <span className="font-bold text-sm" style={{ color: result.correct ? '#065F46' : '#9F1239' }}>
              {result.correct ? 'Correct!' : 'Incorrect'}
            </span>
            {result.correct && result.rewardFuel > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: '#F0FDF9', color: '#14B8A6', border: '1px solid #5EEAD4' }}>
                +{result.rewardFuel} fuel
              </span>
            )}
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
        <button onClick={loadQuestion} className="btn-primary">
          Next Question →
        </button>
      )}

      {peerModal && <PeerChatModal peer={peerModal} onClose={() => setPeerModal(null)} />}
    </div>
  )
}
