import React from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * ChatMessage — renders a single chat bubble.
 * Supports markdown-style bold (**text**) and newlines.
 * Bot messages can include action buttons.
 */
export default function ChatMessage({ message }) {
  const navigate = useNavigate()
  const isBot = message.role === 'bot'

  /** Convert **bold** and \n to JSX */
  function renderText(text) {
    if (!text) return null
    return text.split('\n').map((line, li) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/)
      return (
        <span key={li}>
          {parts.map((part, pi) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={pi} className="font-semibold text-white">{part.slice(2, -2)}</strong>
              : <span key={pi}>{part}</span>
          )}
          {li < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[85%] ${isBot ? 'order-2' : ''}`}>
        {/* Avatar */}
        {isBot && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-emerald-400 font-medium">🛡 SentinelAI</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isBot
              ? 'bg-gray-800 text-gray-200 rounded-bl-sm'
              : 'bg-emerald-700 text-white rounded-br-sm'
            }`}
          role={isBot ? 'article' : undefined}
          aria-label={isBot ? 'Assistant message' : 'Your message'}
        >
          {renderText(message.text)}
        </div>

        {/* Action buttons */}
        {isBot && message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.actions.map((action, i) => (
              <button
                key={i}
                onClick={() => action.type === 'navigate' && navigate(action.path)}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-emerald-300 border border-gray-600
                           px-3 py-1.5 rounded-full transition-colors min-h-[36px]"
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-gray-600 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  )
}
