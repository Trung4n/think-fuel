import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'
import MarkdownContent from '../components/MarkdownContent'
import Icon from '../components/Icon'
import { faRobot } from '@fortawesome/free-solid-svg-icons'

const ASSISTANCE_COLORS = {
  socratic_probe: { color: '#F59E0B', label: 'Thinking prompt' },
  socratic_abuse: { color: '#E11D48', label: 'Reflection required' },
  hint: { color: '#14B8A6', label: 'Hint' },
  guided_steps: { color: '#8B5CF6', label: 'Guided steps' },
  full_explain: { color: '#10B981', label: 'Full explanation' },
  locked: { color: '#9CA3AF', label: 'Locked' },
}

function AssistanceTag({ level, cost }) {
  const { color, label } = ASSISTANCE_COLORS[level] || { color: '#9CA3AF', label: level }
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs font-medium px-2.5 py-0.5 rounded-full"
        style={{ color, background: `${color}15`, border: `1px solid ${color}40` }}
      >
        {label}
      </span>
      {cost != null && cost > 0 && (
        <span className="text-xs text-gray-400 font-mono">-{cost} fuel</span>
      )}
    </div>
  )
}

export default function ChatPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [subject, setSubject] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [fuel, setFuel] = useState(null)
  const [maxFuel, setMaxFuel] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!subjectId) navigate('/student/dashboard')
  }, [subjectId, navigate])

  useEffect(() => {
    if (!subjectId) return
    async function load() {
      try {
        const [histRes, dashRes, subRes] = await Promise.all([
          api.get(`/chat/history/${user.id}/${subjectId}`),
          api.get(`/students/${user.id}/dashboard`),
          api.get('/subjects'),
        ])
        setMessages(histRes.data.data || [])
        setFuel(dashRes.data.data.brainFuel)
        setMaxFuel(dashRes.data.data.maxFuel)
        const found = (subRes.data.data || []).find(s => s._id === subjectId)
        setSubject(found || null)
      } catch (e) {
        console.error(e)
      } finally {
        setHistoryLoading(false)
      }
    }
    load()
  }, [subjectId, user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading || !subjectId) return

    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chat/message', {
        userId: user.id,
        message: text,
        subjectId,
      })
      const { reply, assistanceLevel, assistanceLabel, brainFuelRemaining, fuelCost } = res.data.data
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        assistanceLevel,
        assistanceLabel,
        fuelCost,
      }])
      if (brainFuelRemaining !== undefined) setFuel(brainFuelRemaining)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message || 'Error — could not get a response.',
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const isLocked = fuel === 0

  return (
    <div className="flex flex-col h-full chat-bg">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-200"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            {subject?.icon && <span className="text-xl">{subject.icon}</span>}
            <span className="text-sm font-semibold text-gray-900">
              {subject?.name || 'Loading...'}
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">AI Tutor</span>
          </div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="text-xs text-gray-400 hover:text-teal-500 transition-colors"
          >
            Switch subject
          </button>
        </div>
        {fuel !== null ? (
          <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
        ) : (
          <div className="h-2 bg-gray-100 rounded-full animate-pulse" />
        )}
      </div>

      {/* Fuel cost legend */}
      <div className="flex-shrink-0 px-4 py-1.5 bg-white/70 border-b border-gray-100 flex gap-4 overflow-x-auto">
        {[
          { level: 'socratic_probe', text: '-5' },
          { level: 'hint', text: '-15' },
          { level: 'guided_steps', text: '-30' },
          { level: 'full_explain', text: '-50' },
        ].map(({ level, text }) => {
          const { color, label } = ASSISTANCE_COLORS[level]
          return (
            <span key={level} className="text-xs whitespace-nowrap font-medium" style={{ color }}>
              {label}: {text}
            </span>
          )
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {historyLoading && (
          <div className="text-center text-gray-400 text-sm py-8">Loading history...</div>
        )}
        {!historyLoading && messages.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-3">
              <Icon icon={faRobot} style={{ fontSize: '2.5rem', color: '#14B8A6' }} />
            </div>
            <p className="text-gray-500 text-sm font-medium mb-1">No messages yet</p>
            <p className="text-gray-400 text-xs">
              Show your work for better help. Direct answers cost more fuel.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div
                className="max-w-lg rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #14B8A6, #0D9488)' }}
              >
                {msg.content}
              </div>
            ) : (
              <div className="max-w-2xl w-full">
                {!msg.isError && (msg.assistanceLevel || msg.mode) && (
                  <div className="mb-1.5 ml-1">
                    <AssistanceTag
                      level={msg.assistanceLevel || msg.mode}
                      cost={msg.fuelCost}
                    />
                  </div>
                )}
                <div
                  className={`rounded-2xl rounded-tl-sm px-4 py-3 ${
                    msg.isError ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-200'
                  }`}
                  style={!msg.isError ? { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' } : {}}
                >
                  {msg.isError ? (
                    <span className="text-sm text-red-500 font-mono">{msg.content}</span>
                  ) : (
                    <MarkdownContent content={msg.content} />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-200"
        style={{ boxShadow: '0 -1px 3px rgba(0,0,0,0.04)' }}>
        {isLocked ? (
          <div className="text-center py-2">
            <p className="text-xs text-red-500 mb-3">Brain Fuel depleted. Complete a quiz to earn more.</p>
            <button onClick={() => navigate(`/student/quiz/${subjectId}`)} className="btn-primary text-xs"
              style={{ padding: '0.5rem 1.25rem' }}>
              Go to Quiz
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask a question or share your attempt..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm text-gray-900 bg-gray-50 rounded-xl transition-all focus:outline-none disabled:opacity-50 placeholder-gray-400"
                style={{ border: '1.5px solid #E2E8F0' }}
                onFocus={e => { e.target.style.borderColor = '#14B8A6'; e.target.style.background = '#fff'; e.target.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="btn-primary px-5"
              >
                Send
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-1.5">
              Tip: Show your work ("I tried...") for better assistance and lower fuel cost.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
