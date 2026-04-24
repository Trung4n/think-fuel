import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import FuelBar from '../components/FuelBar'
import ModeTag from '../components/ModeTag'

export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [fuel, setFuel] = useState(null)
  const [maxFuel, setMaxFuel] = useState(1000)
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const [histRes, dashRes] = await Promise.all([
          api.get(`/chat/history/${user.id}`),
          api.get(`/students/${user.id}/dashboard`),
        ])
        setMessages(histRes.data.data || [])
        setFuel(dashRes.data.data.brainFuel)
        setMaxFuel(dashRes.data.data.maxFuel)
      } catch (e) {
        console.error(e)
      } finally {
        setHistoryLoading(false)
      }
    }
    load()
  }, [user.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/chat/message', { userId: user.id, message: text })
      const { reply, mode, brainFuelRemaining, fuelCost } = res.data.data
      setMessages(prev => [...prev, { role: 'assistant', content: reply, mode, fuelCost }])
      if (brainFuelRemaining !== undefined) setFuel(brainFuelRemaining)
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message || 'Error — could not get response.',
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top fuel bar */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-900">
        {fuel !== null ? (
          <FuelBar fuel={fuel} maxFuel={maxFuel} showLabel={true} />
        ) : (
          <div className="h-2 bg-gray-700 rounded-full" />
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {historyLoading && (
          <div className="text-center text-gray-500 text-sm py-8">Loading history...</div>
        )}
        {!historyLoading && messages.length === 0 && (
          <div className="text-center text-gray-600 text-sm py-12">
            No messages yet. Ask anything.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="max-w-lg bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-2xl">
                <div className={`flex items-center gap-2 mb-1.5 ${msg.isError ? '' : ''}`}>
                  {msg.mode && <ModeTag fuel={fuel} />}
                  {msg.fuelCost != null && (
                    <span className="text-xs text-gray-600 font-mono">
                      -{msg.fuelCost} fuel
                    </span>
                  )}
                </div>
                <div
                  className={`bg-gray-900 border rounded-lg px-4 py-3 font-mono text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.isError
                      ? 'border-rose-800 text-rose-400'
                      : 'border-gray-800 text-gray-200'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 font-mono text-sm text-gray-500">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-800 bg-gray-900">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={loading || fuel === 0}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || fuel === 0}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-medium rounded-md transition-colors"
          >
            Send
          </button>
        </form>
        {fuel === 0 && (
          <p className="text-xs text-rose-400 mt-1.5">Brain Fuel depleted. Complete a quiz to earn more.</p>
        )}
      </div>
    </div>
  )
}
