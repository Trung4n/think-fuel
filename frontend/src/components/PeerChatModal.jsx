import { useState, useEffect, useRef } from 'react'
import Icon from './Icon'
import { faXmark, faPaperPlane, faUsers } from '@fortawesome/free-solid-svg-icons'

const AVATAR_COLORS = ['#14B8A6', '#8B5CF6', '#3B82F6', '#F59E0B', '#E11D48', '#10B981']

export default function PeerChatModal({ peer, onClose }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [peerTyping, setPeerTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const avatarColor = AVATAR_COLORS[peer.name.charCodeAt(0) % AVATAR_COLORS.length]

  useEffect(() => {
    const t = setTimeout(() => {
      setMessages([{
        id: 1,
        from: peer.name,
        text: `Hey! I'm ${peer.name}. Happy to help — what part of the question is confusing you?`,
        isMe: false,
      }])
      inputRef.current?.focus()
    }, 800)
    return () => clearTimeout(t)
  }, [peer.name])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, peerTyping])

  function send() {
    const text = input.trim()
    if (!text) return
    const myMsg = { id: Date.now(), from: 'You', text, isMe: true }
    setMessages(prev => [...prev, myMsg])
    setInput('')

    // Simulate peer typing then a canned reply for demo
    if (messages.length <= 2) {
      setPeerTyping(true)
      setTimeout(() => {
        setPeerTyping(false)
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          from: peer.name,
          text: "Got it! Try breaking the question into smaller parts — what does it ask you to find first?",
          isMe: false,
        }])
      }, 2200)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(2px)' }}
    >
      <div
        className="w-full sm:max-w-md bg-white flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ maxHeight: '80vh', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #E2E8F0' }}>
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: avatarColor }}>
              {peer.name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400"
              style={{ border: '2px solid white' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">{peer.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Icon icon={faUsers} style={{ fontSize: '0.65rem', color: '#14B8A6' }} />
              <span className="text-xs font-medium" style={{ color: '#14B8A6' }}>Peer Support Session</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors flex-shrink-0"
            style={{ color: '#94A3B8' }}
            onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <Icon icon={faXmark} />
          </button>
        </div>

        {/* Ephemeral notice */}
        <div className="px-4 py-1.5 flex-shrink-0"
          style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
          <p className="text-xs text-center" style={{ color: '#92400E' }}>
            This chat is ephemeral — messages are not saved and will disappear when you navigate away.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ minHeight: 0 }}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-16">
              <span className="text-xs text-gray-400">Connecting to {peer.name}...</span>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
              {!msg.isMe && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                  style={{ background: avatarColor }}>
                  {peer.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="max-w-xs px-3 py-2 rounded-2xl text-sm leading-relaxed"
                style={msg.isMe
                  ? { background: '#14B8A6', color: 'white', borderBottomRightRadius: '4px' }
                  : { background: '#F1F5F9', color: '#1E293B', borderBottomLeftRadius: '4px' }
                }
              >
                {msg.text}
              </div>
            </div>
          ))}
          {peerTyping && (
            <div className="flex gap-2 items-center">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: avatarColor }}>
                {peer.name.charAt(0).toUpperCase()}
              </div>
              <div className="px-3 py-2 rounded-2xl" style={{ background: '#F1F5F9', borderBottomLeftRadius: '4px' }}>
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid #E2E8F0' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your peer..."
            className="flex-1 text-sm px-3 py-2 rounded-xl outline-none"
            style={{ border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#14B8A6' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0' }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() ? '#14B8A6' : '#E2E8F0',
              color: input.trim() ? 'white' : '#94A3B8',
            }}
          >
            <Icon icon={faPaperPlane} style={{ fontSize: '0.8rem' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
