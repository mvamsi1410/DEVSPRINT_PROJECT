import React, { useState } from 'react'

const SUGGESTIONS = ['Summarize this lesson', 'Explain React useEffect hook', 'Generate 3 practice questions']

export default function AITutorWidget({ lessonTitle, courseTitle }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: `Hello! I'm your DevSprint AI Tutor. How can I help you with "${lessonTitle}" or "${courseTitle}" today?` },
  ])
  const [input, setInput] = useState('')

  const send = (text) => {
    if (!text.trim()) return
    setMessages((m) => [...m, { from: 'user', text }])
    setInput('')
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          from: 'bot',
          text:
            text.toLowerCase().includes('summar')
              ? 'Lesson Summary:\n• State Management: useState holds component state.\n• Side Effects: useEffect syncs with external systems or APIs.\n• Cleanup: return a cleanup function inside useEffect to handle unmounting.'
              : 'Good question — let me break that down for you step by step in the next lesson notes panel.',
        },
      ])
    }, 500)
  }

  return (
    <div className="card ai-chat">
      <div className="head">🤖 DevSprint AI Tutor <span style={{ opacity: 0.6, fontWeight: 500 }}>v2.0</span></div>
      <div className="body">
        {messages.map((m, i) => (
          <div key={i} className={'bubble ' + (m.from === 'bot' ? 'bot' : 'user')} style={{ whiteSpace: 'pre-line' }}>
            {m.text}
          </div>
        ))}
      </div>
      <div className="ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <button className="chip-btn" key={s} onClick={() => send(s)}>{s}</button>
        ))}
      </div>
      <div className="ai-input">
        <input
          placeholder="Ask anything about this course..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button className="ai-send" onClick={() => send(input)}>➤</button>
      </div>
    </div>
  )
}
